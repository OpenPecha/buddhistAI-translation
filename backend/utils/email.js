const { sendEmail: sendEmailService } = require("../services/utils");
const logger = require("./logger");

/**
 * Send email with error handling that doesn't fail the request
 * @param {string[]} emails - Array of email addresses
 * @param {Object} emailMessage - Email message object with subject and text
 * @returns {Promise<boolean>} - Returns true if email was sent successfully, false otherwise
 */
async function sendEmailSafe(emails, emailMessage) {
  try {
    await sendEmailService(emails, emailMessage);
    return true;
  } catch (emailError) {
    logger.warn("Failed to send email notification", {
      emails,
      error: emailError.message,
    });
    // Don't throw - email failures shouldn't break the request
    return false;
  }
}

module.exports = {
  sendEmailSafe,
};
