type ContactSubmission = {
  givenName: string;
  familyName: string;
  email: string;
  message: string;
};

const resendEndpoint = "https://api.resend.com/emails";

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

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ??
    "Cool Molecules Media <contact@coolmolecules.media>";
  const to = process.env.CONTACT_TO_EMAIL ?? "hello@coolmolecules.media";

  if (!apiKey) {
    console.info("Contact form submission", submission);
    return redirectToContact(request, "sent");
  }

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: submission.email,
      subject: `Cool Molecules Media contact: ${submission.givenName} ${submission.familyName}`,
      text: [
        "New Cool Molecules Media contact form submission",
        "",
        `Name: ${submission.givenName} ${submission.familyName}`,
        `Email: ${submission.email}`,
        "",
        submission.message,
      ].join("\n"),
      html: buildEmailHtml(submission),
    }),
  });

  if (!response.ok) {
    console.error("Resend contact email failed", {
      status: response.status,
      body: await response.text(),
    });
    return redirectToContact(request, "error");
  }

  return redirectToContact(request, "sent");
}
