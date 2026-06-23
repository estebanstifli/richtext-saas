import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ValidationError } from "@/lib/errors";
import { messages } from "@/messages/en";

const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS_BY_MIME_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

type StoredDocumentImage = {
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
};

export async function storeDocumentImage({
  documentId,
  file,
  userId
}: {
  documentId: string;
  file: File;
  userId: string;
}): Promise<StoredDocumentImage> {
  const mimeType = file.type;
  const extension = IMAGE_EXTENSIONS_BY_MIME_TYPE.get(mimeType);

  if (!extension) {
    throw new ValidationError(messages.errors.invalidImageType);
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new ValidationError(messages.errors.invalidImageSize);
  }

  const directory = getDocumentUploadDirectory(userId, documentId);
  const safeOriginalName = sanitizeFileName(file.name || "image");
  const storedFileName = `${randomUUID()}.${extension}`;
  const diskPath = path.join(directory, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!hasValidImageSignature(buffer, mimeType)) {
    throw new ValidationError(messages.errors.invalidImageType);
  }

  await mkdir(directory, { recursive: true });
  await writeFile(diskPath, buffer);

  return {
    fileName: safeOriginalName,
    mimeType,
    size: file.size,
    url: `/uploads/${safeSegment(userId)}/${safeSegment(documentId)}/${storedFileName}`
  };
}

export async function removeDocumentUploadDirectory(userId: string, documentId: string) {
  await rm(getDocumentUploadDirectory(userId, documentId), {
    force: true,
    recursive: true
  });
}

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      "name" in value &&
      "size" in value &&
      "type" in value
  );
}

function getDocumentUploadDirectory(userId: string, documentId: string) {
  return path.join(process.cwd(), "public", "uploads", safeSegment(userId), safeSegment(documentId));
}

function safeSegment(value: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new ValidationError(messages.errors.invalidInput);
  }

  return value;
}

function sanitizeFileName(fileName: string) {
  const sanitized = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized || "image";
}

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/jpeg") {
    return (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[buffer.length - 2] === 0xff &&
      buffer[buffer.length - 1] === 0xd9
    );
  }

  if (mimeType === "image/gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }

  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }

  return false;
}
