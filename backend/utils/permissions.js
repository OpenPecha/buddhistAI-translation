/**
 * Check if a user has permission to access a document
 * @param {Object} document - The document object with rootProject information
 * @param {string} userId - The ID of the user to check permissions for
 * @returns {boolean} - Whether the user has permission to access the document
 */
async function checkDocumentPermission(document, userId) {
  // If the document doesn't exist, no permission
  if (!document) return false;
  // If the document's project is public, everyone has read access
  if (document.rootProject && document.rootProject.isPublic) return true;

  // If no user provided (anonymous), they can only access public documents
  if (!userId) return false;

  // Check if user is the owner of the document
  if (document.ownerId === userId) return true;

  // Check if user is the owner of the project
  if (document.rootProject && document.rootProject.ownerId === userId) {
    return true;
  }

  // Check if user has explicit permission in the project
  if (document.rootProject && document.rootProject.permissions) {
    const userPermission = document.rootProject.permissions.find(
      (permission) => permission.userId === userId,
    );

    if (userPermission) {
      return true;
    }
  }

  // Check if user has explicit permission on the document
  if (document.permissions) {
    const userPermission = document.permissions.find(
      (permission) => permission.userId === userId,
    );

    if (userPermission) {
      return true;
    }
  }

  // No permission found
  return false;
}

/**
 * Check if a user has write permission to a document
 * @param {Object} document - The document object with rootProject information
 * @param {string} userId - The ID of the user to check permissions for (can be undefined for anonymous users)
 * @returns {boolean} - Whether the user has write permission to the document
 */
async function checkDocumentWritePermission(document, userId) {
  // If the document doesn't exist, no permission
  if (!document) return false;

  // If the document's project is public and allows editing, anyone with a user ID can write
  if (
    userId &&
    document.rootProject &&
    document.rootProject.isPublic &&
    document.rootProject.publicAccess === "editor"
  ) {
    return true;
  }

  // Anonymous users never have write access
  if (!userId) return false;

  // Check if user is the owner of the document
  if (document.ownerId === userId) return true;

  // Check if user is the owner of the project
  if (document.rootProject && document.rootProject.ownerId === userId) {
    return true;
  }

  // Check if user has explicit write permission in the project
  if (document.rootProject && document.rootProject.permissions) {
    const userPermission = document.rootProject.permissions.find(
      (permission) => permission.userId === userId && permission.canWrite,
    );

    if (userPermission) {
      return true;
    }
  }

  // Check if user has explicit write permission on the document
  if (document.permissions) {
    const userPermission = document.permissions.find(
      (permission) => permission.userId === userId && permission.canWrite,
    );

    if (userPermission) {
      return true;
    }
  }

  // No write permission found
  return false;
}

module.exports = {
  checkDocumentPermission,
  checkDocumentWritePermission,
};
