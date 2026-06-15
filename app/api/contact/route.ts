type ContactSubmission = {
  givenName: string;
  familyName: string;
  email: string;
  message: string;
};

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function redirectToContact(request: Request, status: "sent" | "error") {
  return Response.redirect(new URL(`/?contact=${status}#contact`, request.url), 303);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailHtml(submission: ContactSubmission) {
  const name = escapeHtml(`${submission.givenName} ${submission.familyName}`);
  const email = escapeHtml(submission.email);
  const message = escapeHtml(submission.message).replaceAll("\n", "<br>");

  return `
    <h1>New Cool Molecules Media contact form submission</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  if (stringValue(formData, "company")) {
    return redirectToContact(request, "sent");
  }

  const submission: ContactSubmission = {
    givenName: stringValue(formData, "given-name"),
    familyName: stringValue(formData, "family-name"),
    email: stringValue(formData, "email"),
    message: stringValue(formData, "message"),
  };

  if (
    !submission.givenName ||
    !submission.familyName ||
    !isValidEmail(submission.email) ||
    !submission.message
  ) {
    console.warn("Invalid contact form submission", submission);
    return redirectToContact(request, "error");
  }

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL ?? "contact@coolmolecules.media";
  const fromName = process.env.BREVO_FROM_NAME ?? "Cool Molecules Media";
  const to = process.env.CONTACT_TO_EMAIL ?? "hello@coolmolecules.media";

  if (!apiKey) {
    console.info("Contact form submission", submission);
    return redirectToContact(request, "sent");
  }

  const response = await fetch(brevoEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      replyTo: {
        name: `${submission.givenName} ${submission.familyName}`,
        email: submission.email,
      },
      subject: `Cool Molecules Media contact: ${submission.givenName} ${submission.familyName}`,
      textContent: [
        "New Cool Molecules Media contact form submission",
        "",
        `Name: ${submission.givenName} ${submission.familyName}`,
        `Email: ${submission.email}`,
        "",
        submission.message,
      ].join("\n"),
      htmlContent: buildEmailHtml(submission),
    }),
  });

  if (!response.ok) {
    console.error("Brevo contact email failed", {
      status: response.status,
      body: await response.text(),
    });
    return redirectToContact(request, "error");
  }

  return redirectToContact(request, "sent");
}
