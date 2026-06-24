const baseUrl = normalizeBaseUrl(
  process.env.TEST_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
);
const runStripeCheckout = process.env.TEST_STRIPE_CHECKOUT === "true";
const allowLiveStripe = process.env.TEST_ALLOW_LIVE_STRIPE === "true";

const planNames = ["monthly", "annual", "lifetime"];

class CookieJar {
  cookies = new Map();

  addFromResponse(response) {
    const setCookieHeaders =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean);

    for (const header of setCookieHeaders) {
      for (const cookiePart of splitCombinedSetCookie(header)) {
        const [nameValue] = cookiePart.split(";");
        const separatorIndex = nameValue.indexOf("=");

        if (separatorIndex > 0) {
          this.cookies.set(nameValue.slice(0, separatorIndex), nameValue.slice(separatorIndex + 1));
        }
      }
    }
  }

  header() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

const jar = new CookieJar();
const createdEmail = `acceptance-${Date.now()}@example.com`;

await runStep("landing page communicates product and pricing", async () => {
  const html = await fetchText("/");

  assertIncludes(html, "Write Better Content.");
  assertIncludes(html, "Monthly");
  assertIncludes(html, "Annual");
  assertIncludes(html, "Lifetime");
  assertIncludes(html, "9.90");
  assertIncludes(html, "79");
  assertIncludes(html, "199");
});

await runStep("anonymous user is redirected away from dashboard", async () => {
  const response = await request("/app/dashboard", { redirect: "manual" }, false);
  assertRedirect(response, "/login");
});

await runStep("user can register with email and password", async () => {
  const response = await submitServerAction("/register", {
    email: createdEmail,
    password: "acceptance-password-123",
    plan: ""
  });

  assert(response.status === 303 || response.status === 302, `Expected redirect after register, got ${response.status}`);
  assertRedirect(response, "/app/dashboard");
  assert(jar.header().includes("rtext_session="), "Expected registration to set session cookie");
});

await runStep("non-paying user sees upgrade path on dashboard", async () => {
  const html = await fetchText("/app/dashboard");

  assertIncludes(html, "Documents");
  assertIncludes(html, "Plan");
  assertIncludes(html, "Status");
  assertIncludes(html, "Renews");
  assertIncludes(html, "Upgrade to create");
  assertIncludes(html, "you can read your documents but not edit them");
});

await runStep("non-paying user gets read-only access and cannot save documents", async () => {
  // Missing document returns 404 (no longer redirected to upgrade): read access is allowed, write is not.
  const documentPage = await request("/documents/not-a-real-document", { redirect: "manual" });
  assert(
    documentPage.status === 404,
    `Expected 404 for missing document in read-only mode, got ${documentPage.status}`
  );

  const saveResponse = await request("/api/documents/not-a-real-document", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Blocked" }] }]
      }
    })
  });

  assert(saveResponse.status === 403, `Expected save to be forbidden for non-paying user, got ${saveResponse.status}`);
});

await runStep("non-paying user cannot upload document images", async () => {
  const form = new FormData();
  form.set("image", new Blob(["not-an-image"], { type: "image/png" }), "blocked.png");

  const response = await request("/api/documents/not-a-real-document/assets", {
    method: "POST",
    body: form
  });

  assert(response.status === 403, `Expected image upload to be forbidden for non-paying user, got ${response.status}`);
});

await runStep("billing portal is protected and requires a Stripe customer", async () => {
  const response = await request("/api/billing/portal", {
    method: "POST",
    redirect: "manual"
  });

  assertRedirect(response, "/upgrade");
});

if (runStripeCheckout) {
  await runStep("Stripe Checkout sessions are created in test mode for every plan", async () => {
    for (const plan of planNames) {
      const form = new FormData();
      form.set("plan", plan);

      const response = await request("/api/billing/checkout", {
        method: "POST",
        body: form,
        redirect: "manual"
      });
      const location = response.headers.get("location") || "";

      assert(response.status === 303, `Expected ${plan} checkout redirect, got ${response.status}`);
      assert(
        location.startsWith("https://checkout.stripe.com/"),
        `Expected ${plan} to redirect to Stripe Checkout`
      );
      assert(location.includes("cs_test_") || allowLiveStripe, `${plan} did not create a Stripe test session`);
    }
  });
} else {
  logSkip("Stripe Checkout session creation", "set TEST_STRIPE_CHECKOUT=true to enable it");
}

await runStep("user can log out back to the current site", async () => {
  const response = await request("/api/auth/logout", {
    method: "POST",
    redirect: "manual"
  });

  assertRedirect(response, "/");
});

console.log(`\nAcceptance smoke passed against ${baseUrl}`);
console.log(`Created test user: ${createdEmail}`);

async function submitServerAction(path, fields) {
  const html = await fetchText(path);
  const hiddenFields = extractHiddenFields(html);
  const form = new FormData();

  for (const [name, value] of Object.entries(hiddenFields)) {
    form.set(name, value);
  }

  for (const [name, value] of Object.entries(fields)) {
    form.set(name, value);
  }

  return request(path, {
    method: "POST",
    body: form,
    redirect: "manual"
  });
}

async function fetchText(path) {
  const response = await request(path);
  const text = await response.text();
  assert(response.ok, `Expected ${path} to return 2xx, got ${response.status}`);
  return text;
}

async function request(path, options = {}, includeCookies = true) {
  const headers = new Headers(options.headers || {});

  if (includeCookies && jar.header()) {
    headers.set("Cookie", jar.header());
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });

  jar.addFromResponse(response);
  return response;
}

function extractHiddenFields(html) {
  const fields = {};
  const inputs = html.match(/<input[^>]+type="hidden"[^>]*>/g) || [];

  for (const input of inputs) {
    const name = getAttribute(input, "name");
    const value = getAttribute(input, "value") || "";

    if (name) {
      fields[decodeHtml(name)] = decodeHtml(value);
    }
  }

  return fields;
}

function getAttribute(html, name) {
  return html.match(new RegExp(`${name}="([^"]*)"`))?.[1] || null;
}

function splitCombinedSetCookie(header) {
  if (!header) {
    return [];
  }

  return header.split(/,(?=\s*[^;,=]+=[^;,]+)/g);
}

function assertRedirect(response, expectedPath) {
  const location = response.headers.get("location") || "";
  const redirectPath = normalizeRedirectPath(location);

  assert(
    response.status === 303 || response.status === 302 || response.status === 307 || response.status === 308,
    `Expected redirect to ${expectedPath}, got status ${response.status}`
  );
  assert(redirectPath.startsWith(expectedPath), `Expected redirect to ${expectedPath}, got ${location || "(none)"}`);
}

function normalizeRedirectPath(location) {
  if (!location) {
    return "";
  }

  try {
    const parsed = new URL(location, baseUrl);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return location;
  }
}

function assertIncludes(text, expected) {
  assert(text.includes(expected), `Expected response to include: ${expected}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runStep(name, fn) {
  process.stdout.write(`- ${name}... `);
  await fn();
  console.log("ok");
}

function logSkip(name, reason) {
  console.log(`- ${name}... skipped (${reason})`);
}

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function normalizeBaseUrl(value) {
  return value.replace(/\/$/, "");
}
