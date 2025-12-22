const { sendEmail } = require("../services/utils");
const {
  projectSharedTemplate,
  projectPermissionUpdatedTemplate,
  projectPermissionRemovedTemplate,
  documentSharedTemplate,
  documentPermissionUpdatedTemplate,
} = require("./emailTemplates");
const logger = require("./logger");

/**
 * Send project permission email notification
 * @param {string} email - Recipient email
 * @param {string} projectName - Project name
 * @param {string} accessLevel - Access level (viewer, editor, admin)
 * @param {boolean} isUpdate - Whether this is an update to existing permission
 */
async function sendProjectPermissionEmail(
  email,
  projectName,
  accessLevel,
  isUpdate = false
) {
  try {
    const emailMessage = isUpdate
      ? projectPermissionUpdatedTemplate({
          projectName,
          accessLevel,
        })
      : projectSharedTemplate({
          projectName,
          accessLevel,
        });
    await sendEmail([email], emailMessage);
  } catch (error) {
    logger.warn("Failed to send project permission email notification", {
      email,
      projectName,
      error,
    });
    // Don't throw - email failures shouldn't break the request
  }
}

/**
 * Send project permission removed email notification
 * @param {string} email - Recipient email
 * @param {string} projectName - Project name
 */
async function sendProjectPermissionRemovedEmail(email, projectName) {
  try {
    const emailMessage = projectPermissionRemovedTemplate({
      projectName,
    });
    await sendEmail([email], emailMessage);
  } catch (error) {
    logger.warn(
      "Failed to send project permission removed email notification",
      {
        email,
        projectName,
        error,
      }
    );
  }
}

/**
 * Send document permission email notification
 * @param {string} email - Recipient email
 * @param {string} documentName - Document name
 * @param {string} accessType - Access type (view, edit)
 * @param {boolean} isUpdate - Whether this is an update to existing permission
 */
async function sendDocumentPermissionEmail(
  email,
  documentName,
  accessType,
  isUpdate = false
) {
  try {
    const emailMessage = isUpdate
      ? documentPermissionUpdatedTemplate({
          documentName,
          accessType,
        })
      : documentSharedTemplate({
          documentName,
          accessType,
        });
    await sendEmail([email], emailMessage);
  } catch (error) {
    logger.warn("Failed to send document permission email notification", {
      email,
      documentName,
      error,
    });
    // Don't throw - email failures shouldn't break the request
  }
}

module.exports = {
  sendProjectPermissionEmail,
  sendProjectPermissionRemovedEmail,
  sendDocumentPermissionEmail,
};
