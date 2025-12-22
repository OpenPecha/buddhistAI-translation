const { prisma } = require("../services/db");
const {
  checkDocumentPermission,
  checkDocumentWritePermission,
  checkProjectPermission,
  isProjectOwner,
  isDocumentOwner,
} = require("../utils/permissions");
const { sendNotFound, sendForbidden } = require("../utils/response");

/**
 * Middleware to check if user has permission to access a document
 * Expects documentId in req.params.id
 */
const checkDocumentAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const document = await prisma.doc.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        permissions: true,
        rootProject: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!document) {
      return sendNotFound(res, "Document");
    }

    const hasPermission = await checkDocumentPermission(document, userId);

    if (!hasPermission) {
      return sendForbidden(
        res,
        "You do not have permission to access this document"
      );
    }

    req.document = document;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has write permission to a document
 * Expects documentId in req.params.id
 */
const checkDocumentWriteAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendForbidden(res, "Authentication required to edit documents");
    }

    const document = await prisma.doc.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        permissions: true,
        rootProject: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!document) {
      return sendNotFound(res, "Document");
    }

    const hasWritePermission = await checkDocumentWritePermission(
      document,
      userId
    );

    if (!hasWritePermission) {
      return sendForbidden(
        res,
        "You do not have permission to edit this document"
      );
    }

    req.document = document;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has permission to access a project
 * Expects projectId in req.params.id
 */
const checkProjectAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendForbidden(res, "Authentication required");
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    if (!project) {
      return sendNotFound(res, "Project");
    }

    const hasPermission = checkProjectPermission(project, userId);

    if (!hasPermission) {
      return sendForbidden(
        res,
        "You do not have permission to access this project"
      );
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is the owner of a project
 * Expects projectId in req.params.id
 */
const checkProjectOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendForbidden(res, "Authentication required");
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return sendNotFound(res, "Project");
    }

    if (!isProjectOwner(project, userId)) {
      return sendForbidden(
        res,
        "Only the project owner can perform this action"
      );
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkDocumentAccess,
  checkDocumentWriteAccess,
  checkProjectAccess,
  checkProjectOwner,
};
