import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
export const SendMAil = async (to: string, subject: string, html: string) => {
  await transport.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

export const buildVerificationEmailHtml = (
  username: string,
  verifyUrl?: string,
) => {
  const safeAppName = "Rabta";
  const safeUsername = username?.trim() || "there";
  const safeVerifyUrl = verifyUrl?.trim();

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeAppName} Verification</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Verify your ${safeAppName} account.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(20, 43, 92, 0.12);">
            <tr>
              <td style="padding:28px 32px;background:#1f3b73;background:linear-gradient(135deg, #1f3b73 0%, #2a6bbf 100%);color:#ffffff;">
                <div style="font-size:20px;font-weight:700;letter-spacing:0.4px;">${safeAppName}</div>
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">Account Verification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:22px;font-weight:700;color:#0f1c3f;margin-bottom:8px;">Hi ${safeUsername},</div>
                <div style="font-size:14px;line-height:1.6;color:#51607a;">
                  Thanks for creating your account at ${safeAppName}. To access your account, click the link below to verify your account.
                </div>

                ${
                  safeVerifyUrl
                    ? `<div style="margin:20px 0 10px 0;text-align:center;">
                  <a href="${safeVerifyUrl}" style="display:inline-block;background:#1f3b73;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">
                    Verify Account
                  </a>
                </div>
                <div style="font-size:12px;line-height:1.6;color:#7a889e;text-align:center;">
                  If the button doesn't work, copy and paste this link:
                  <div style="word-break:break-all;margin-top:6px;">
                    <a href="${safeVerifyUrl}" style="color:#2a6bbf;text-decoration:none;">${safeVerifyUrl}</a>
                  </div>
                </div>`
                    : ""
                }

                <div style="font-size:12px;line-height:1.6;color:#7a889e;">
                  This link is valid for a limited time. If you did not request this, you can ignore this email.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f8faff;border-top:1px solid #eef2f8;color:#8a96ab;font-size:12px;">
                Sent by ${safeAppName}. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
};

export const buildOtpEmailHtml = (
  username: string,
  otp: string,
  purpose = "Password Reset",
) => {
  const safeAppName = "Rabta";
  const safeUsername = username?.trim() || "there";
  const safeOtp = otp?.trim();
  const safePurpose = purpose?.trim() || "Verification";

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeAppName} OTP</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Your ${safeAppName} OTP code is ready.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(20, 43, 92, 0.12);">
            <tr>
              <td style="padding:28px 32px;background:#1f3b73;background:linear-gradient(135deg, #1f3b73 0%, #2a6bbf 100%);color:#ffffff;">
                <div style="font-size:20px;font-weight:700;letter-spacing:0.4px;">${safeAppName}</div>
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">${safePurpose} OTP</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:22px;font-weight:700;color:#0f1c3f;margin-bottom:8px;">Hi ${safeUsername},</div>
                <div style="font-size:14px;line-height:1.6;color:#51607a;">
                  Use the OTP below to complete your ${safePurpose.toLowerCase()}.
                </div>

                <div style="margin:24px 0;border-radius:12px;border:1px solid #d9e4ff;background:#f0f4ff;padding:16px;text-align:center;font-size:28px;font-weight:700;letter-spacing:6px;color:#1f3b73;">
                  ${safeOtp}
                </div>

                <div style="font-size:12px;line-height:1.6;color:#7a889e;">
                  This OTP is valid for a short time. If you did not request this, you can ignore this email.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f8faff;border-top:1px solid #eef2f8;color:#8a96ab;font-size:12px;">
                Sent by ${safeAppName}. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
};

