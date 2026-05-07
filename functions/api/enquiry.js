const successMessage = "Thank you. Your enquiry has been sent to the KelDel Court team.";
const configErrorMessage =
  "The enquiry service is not configured yet. Add one of the environment-based delivery targets before going live.";
const deliveryErrorMessage = "The enquiry could not be delivered right now. Please try again.";

function jsonResponse(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

async function readBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return body && typeof body === "object" ? body : {};
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    return Object.fromEntries(
      Array.from(formData.entries(), ([key, value]) => [key, typeof value === "string" ? value : ""])
    );
  }

  return {};
}

function normalizeField(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateSubmission(payload) {
  const errors = [];

  if (!payload.firstName) {
    errors.push("First name is required.");
  }

  if (!payload.lastName) {
    errors.push("Last name is required.");
  }

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push("A valid email address is required.");
  }

  if (!payload.phone) {
    errors.push("Phone number is required.");
  }

  if (!payload.enquiryType) {
    errors.push("Please select an enquiry type.");
  }

  if (!payload.message || payload.message.length < 10) {
    errors.push("Message must be at least 10 characters.");
  }

  return errors;
}

function buildPlainTextEmail(payload) {
  return [
    "KelDel Court enquiry",
    "",
    `Submitted: ${payload.submittedAt}`,
    `Name: ${payload.firstName} ${payload.lastName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Enquiry type: ${payload.enquiryType}`,
    "",
    "Message:",
    payload.message,
  ].join("\n");
}

function buildHtmlEmail(payload) {
  return `
    <h1>KelDel Court enquiry</h1>
    <p><strong>Submitted:</strong> ${escapeHtml(payload.submittedAt)}</p>
    <p><strong>Name:</strong> ${escapeHtml(`${payload.firstName} ${payload.lastName}`)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
    <p><strong>Enquiry type:</strong> ${escapeHtml(payload.enquiryType)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(payload.message).replace(/\n/g, "<br>")}</p>
  `.trim();
}

function getEnvValue(env, key) {
  return typeof env?.[key] === "string" ? env[key].trim() : "";
}

async function deliverToCrm(payload, env) {
  const response = await fetch(getEnvValue(env, "CRM_WEBHOOK_URL"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: "KelDel Court",
      type: "enquiry",
      submittedAt: payload.submittedAt,
      lead: payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`CRM webhook failed with status ${response.status}`);
  }
}

async function deliverWithResend(payload, env) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getEnvValue(env, "RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEnvValue(env, "RESEND_FROM_EMAIL"),
      to: [getEnvValue(env, "KELDEL_COURT_TO_EMAIL")],
      reply_to: payload.email,
      subject: `KelDel Court enquiry: ${payload.enquiryType}`,
      text: buildPlainTextEmail(payload),
      html: buildHtmlEmail(payload),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed with status ${response.status}`);
  }
}

async function deliverToFormspree(payload, env) {
  const response = await fetch(getEnvValue(env, "FORMSPREE_ENDPOINT"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: "KelDel Court",
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      enquiryType: payload.enquiryType,
      message: payload.message,
      submittedAt: payload.submittedAt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Formspree failed with status ${response.status}`);
  }
}

async function deliverSubmission(payload, env) {
  if (getEnvValue(env, "CRM_WEBHOOK_URL")) {
    await deliverToCrm(payload, env);
    return "crm";
  }

  if (
    getEnvValue(env, "RESEND_API_KEY") &&
    getEnvValue(env, "RESEND_FROM_EMAIL") &&
    getEnvValue(env, "KELDEL_COURT_TO_EMAIL")
  ) {
    await deliverWithResend(payload, env);
    return "resend";
  }

  if (getEnvValue(env, "FORMSPREE_ENDPOINT")) {
    await deliverToFormspree(payload, env);
    return "formspree";
  }

  throw new Error(
    "No delivery target is configured. Set CRM_WEBHOOK_URL, or the RESEND_* variables, or FORMSPREE_ENDPOINT."
  );
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "POST, OPTIONS",
      },
    });
  }

  if (context.request.method !== "POST") {
    return jsonResponse(
      405,
      {
        ok: false,
        message: "Method not allowed. Use POST.",
      },
      {
        Allow: "POST, OPTIONS",
      }
    );
  }

  try {
    const body = await readBody(context.request);
    const honeypot = normalizeField(body["bot-field"]);

    if (honeypot) {
      return jsonResponse(200, {
        ok: true,
        channel: "filtered",
        message: successMessage,
      });
    }

    const payload = {
      firstName: normalizeField(body.firstName),
      lastName: normalizeField(body.lastName),
      email: normalizeField(body.email),
      phone: normalizeField(body.phone),
      enquiryType: normalizeField(body.enquiryType),
      message: normalizeField(body.message),
      submittedAt: new Date().toISOString(),
    };

    const errors = validateSubmission(payload);

    if (errors.length > 0) {
      return jsonResponse(400, {
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const channel = await deliverSubmission(payload, context.env);

    return jsonResponse(200, {
      ok: true,
      channel,
      message: successMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isConfigError = message.includes("No delivery target is configured");

    return jsonResponse(isConfigError ? 500 : 502, {
      ok: false,
      message: isConfigError ? configErrorMessage : deliveryErrorMessage,
    });
  }
}
