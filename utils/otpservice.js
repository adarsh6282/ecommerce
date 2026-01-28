const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async (email, otp) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Verify your Account";
  sendSmtpEmail.sender = {
    name: "Takrum",
    email: process.env.SENDER_EMAIL,
  };
  sendSmtpEmail.to = [{ email: email }];

  sendSmtpEmail.htmlContent = `
    <p>We received a request to verify your account. Your One-Time Password (OTP) is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #edf2f7; border: 1px dashed #cbd5e0; border-radius: 6px; padding: 15px 30px;">
        <span style="font-family: monospace; font-size: 28px; font-weight: bold; color: #3182ce; letter-spacing: 5px;">
          ${otp}
        </span>
      </div>
    </div>
    <p style="text-align: center;">This code will expire in 5 minutes.</p>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("OTP sent successfully using Brevo API.");
  } catch (error) {
    console.error("Error sending OTP via Brevo API:", error.response?.body || error);
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = { sendMail };
