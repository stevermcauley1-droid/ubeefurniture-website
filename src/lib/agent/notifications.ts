type EnquiryNotificationInput = {
  agentEmail: string;
  agentName: string;
  agencyName: string;
  customerName: string;
  customerEmail: string;
  propertyAddress: string;
  itemsInterestedIn: string;
  message: string;
  catalogueSlug: string;
};

export async function sendEnquiryNotifications(input: EnquiryNotificationInput) {
  const adminEmail = process.env.UBEE_ADMIN_EMAIL || 'sales@ubeefurniture.com';
  const recipients = Array.from(new Set([input.agentEmail, adminEmail].filter(Boolean)));
  if (!recipients.length) return;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || adminEmail;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[enquiry-email] SMTP not configured; skipping outbound email.');
    return;
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const subject = `New catalogue enquiry - ${input.agencyName}`;
  const lines = [
    'A new enquiry has been submitted from the public catalogue.',
    '',
    `Agent: ${input.agentName} (${input.agentEmail})`,
    `Agency: ${input.agencyName}`,
    `Catalogue: /c/${input.catalogueSlug}`,
    '',
    `Customer name: ${input.customerName}`,
    `Customer email: ${input.customerEmail}`,
    `Property address: ${input.propertyAddress}`,
    `Items interested in: ${input.itemsInterestedIn}`,
    `Message: ${input.message || '-'}`,
  ];

  await transporter.sendMail({
    from: smtpFrom,
    to: recipients.join(','),
    subject,
    text: lines.join('\n'),
    replyTo: input.customerEmail,
  });
}

