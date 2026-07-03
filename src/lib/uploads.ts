import "server-only";

// Utilidades de subida/borrado de imagenes en disco local.
// Aqui se valida que el fichero sea realmente imagen y no algo raro disfrazado.

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ValidationError } from "@/lib/errors";
import { messages } from "@/messages/en";

// Limite duro de 5MB por imagen.
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

// Mimes permitidos y extension final en disco.
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

// Guarda imagen en public/uploads/{userId}/{documentId} y devuelve metadata.
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

  // Solo dejamos pasar tipos de imagen permitidos.
  if (!extension) {
    throw new ValidationError(messages.errors.invalidImageType);
  }

  // Tamano minimo>0 y maximo 5MB.
  if (file.size <= 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new ValidationError(messages.errors.invalidImageSize);
  }

  const directory = getDocumentUploadDirectory(userId, documentId);
  const safeOriginalName = sanitizeFileName(file.name || "image");
  const storedFileName = `${randomUUID()}.${extension}`;
  const diskPath = path.join(directory, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  // Validacion por firma binaria para evitar confiar solo en mime/extension.
  if (!hasValidImageSignature(buffer, mimeType)) {
    throw new ValidationError(messages.errors.invalidImageType);
  }

  // Crea carpeta si no existe y escribe binario al disco.
  await mkdir(directory, { recursive: true });
  await writeFile(diskPath, buffer);

  return {
    fileName: safeOriginalName,
    mimeType,
    size: file.size,
    url: `/uploads/${safeSegment(userId)}/${safeSegment(documentId)}/${storedFileName}`
  };
}

// Borra carpeta completa de uploads de un documento.
export async function removeDocumentUploadDirectory(userId: string, documentId: string) {
  await rm(getDocumentUploadDirectory(userId, documentId), {
    force: true,
    recursive: true
  });
}

// Type guard para saber si FormDataEntryValue es File real.
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

// Carpeta fisica donde vive el upload del documento.
function getDocumentUploadDirectory(userId: string, documentId: string) {
  return path.join(process.cwd(), "public", "uploads", safeSegment(userId), safeSegment(documentId));
}

// Defiende rutas: solo segmentos seguros (sin ../ ni chars raros).
function safeSegment(value: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new ValidationError(messages.errors.invalidInput);
  }

  return value;
}

// Limpia nombre original para mostrarlo como alt/metadata sin caracteres raros.
function sanitizeFileName(fileName: string) {
  const sanitized = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized || "image";
}

// Verifica cabecera/firma segun tipo para filtrar archivos maliciosos.
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
