const { prisma } = require("../services/db");

/**
 * Get a document with permissions and related data
 * @param {string} docId - Document ID
 * @param {Object} options - Query options
 * @param {boolean} options.includeContent - Whether to include currentVersion content
 * @param {boolean} options.includeMetadata - Whether to include metadata
 * @returns {Promise<Object|null>} Document object or null
 */
async function getDocumentWithPermissions(docId, options = {}) {
  const { includeContent = false, includeMetadata = false } = options;

  return await prisma.doc.findUnique({
    where: { id: docId },
    select: {
      id: true,
      name: true,
      identifier: true,
      ownerId: true,
      language: true,
      isRoot: true,
      rootId: true,
      createdAt: true,
      updatedAt: true,
      rootProjectId: true,
      currentVersionId: true,
      permissions: true,
      ...(includeMetadata && { metadata: true }),
      ...(includeContent && {
        currentVersion: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            label: true,
            userId: true,
          },
        },
      }),
      rootProject: {
        include: {
          permissions: true,
        },
      },
    },
  });
}

/**
 * Get a document with full content and permissions
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document object or null
 */
async function getDocumentWithContent(docId) {
  return getDocumentWithPermissions(docId, {
    includeContent: true,
    includeMetadata: true,
  });
}

module.exports = {
  getDocumentWithPermissions,
  getDocumentWithContent,
};
