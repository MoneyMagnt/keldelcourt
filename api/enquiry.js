function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string" && request.body.length > 0) {
    try {
      return JSON.parse(request.body);
    } catch (error) {
      return {};
    }
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody);
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return {};
}

function normalizeField(value) {
  return typeof value === "string" ? value.trim() : "";
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

async function deliverToCrm(payload) {
  const response = await fetch(process.env.CRM_WEBHOOK_URL, {
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

async function deliverWithResend(payload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [process.env.KELDEL_COURT_TO_EMAIL],
      reply_to: payload.email,
      subject: `KelDel Court enquiry: ${payload.enquiryType}`,
      text: buildPlainTextEmail(payload),
      html: `
        <h1>KelDel Court enquiry</h1>
        <p><strong>Submitted:</strong> ${payload.submittedAt}</p>
        <p><strong>Name:</strong> ${payload.firstName} ${payload.lastName}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Phone:</strong> ${payload.phone}</p>
        <p><strong>Enquiry type:</strong> ${payload.enquiryType}</p>
        <p><strong>Message:</strong></p>
        <p>${payload.message.replace(/\n/g, "<br>")}</p>
      `.trim(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed with status ${response.status}`);
  }
}

async function deliverToFormspree(payload) {
  const response = await fetch(process.env.FORMSPREE_ENDPOINT, {
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

async function deliverSubmission(payload) {
  if (process.env.CRM_WEBHOOK_URL) {
    await deliverToCrm(payload);
    return "crm";
  }

  if (
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL &&
    process.env.KELDEL_COURT_TO_EMAIL
  ) {
    await deliverWithResend(payload);
    return "resend";
  }

  if (process.env.FORMSPREE_ENDPOINT) {
    await deliverToFormspree(payload);
    return "formspree";
  }

  throw new Error(
    "No delivery target is configured. Set CRM_WEBHOOK_URL, or the RESEND_* variables, or FORMSPREE_ENDPOINT."
  );
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, {
      ok: false,
      message: "Method not allowed. Use POST.",
    });
    return;
  }

  try {
    const body = await readBody(request);
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
      sendJson(response, 400, {
        ok: false,
        message: errors[0],
        errors,
      });
      return;
    }

    const channel = await deliverSubmission(payload);

    sendJson(response, 200, {
      ok: true,
      channel,
      message: "Thank you. Your enquiry has been sent to the KelDel Court team.",
    });
  } catch (error) {
    const isConfigError =
      typeof error.message === "string" &&
      error.message.includes("No delivery target is configured");

    sendJson(response, isConfigError ? 500 : 502, {
      ok: false,
      message: isConfigError
        ? "The enquiry service is not configured yet. Add one of the environment-based delivery targets before going live."
        : "The enquiry could not be delivered right now. Please try again.",
    });
  }
};
