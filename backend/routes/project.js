const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const router = express.Router();
const archiver = require("archiver");
const path = require("path");
const crypto = require("crypto");
const {
  createSideBySideDocx,
  createLineByLineDocx,
  createSideBySideDocxTemplate,
  createDocxTemplate,
  generateDocxBuffer,
} = require("../utils/docx");
const {
  generateMarkdownWithFootnotes,
  extractFootnotesFromDelta,
  getDocumentContent,
} = require("../utils/delta_operations");
const { isPandocAvailable } = require("../utils/system_commands");
const {
  getProjects,
  getProjectsCount,
  getProjectById,
  getUserByEmail,
  updatePermission,
  createPermission,
  getProject,
  getPermission,
  deletePermission,
  getProjectWithPermissions,
  createProject,
  updateProject,
  deleteProject,
  getProjectWithDocuments,
} = require("../utils/model");
const { sendProgress, progressStreams } = require("../utils/progress");
const {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
  sendBadRequest,
} = require("../utils/response");
const logger = require("../utils/logger");
const {
  sendProjectPermissionEmail,
  sendProjectPermissionRemovedEmail,
} = require("../utils/notifications");

const { prisma } = require("../services/db");

// Configuration constants
const TEXT_CHUNK_LENGTH = 300; // Characters per chunk

// Get all projects
router.get("/", authenticate, async (req, res, next) => {
  const searchQuery = req.query.search || "";
  const status = req.query.status || "active";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const owner = req.query.owner || "both"; // "User" | "both" | "shared"

  try {
    const whereClause = {
      OR: [
        { ownerId: req.user.id },
        {
          permissions: {
            some: {
              userId: req.user.id,
            },
          },
        },
      ],
    };

    // Only add status filter if not "all"
    if (status !== "all") {
      whereClause.status = status;
    }

    if (owner) {
      if (owner === "User") {
        whereClause.ownerId = req.user.id;
      } else if (owner === "shared") {
        whereClause.permissions = {
          some: {
            userId: req.user.id,
          },
        };
      } else if (owner === "both") {
        whereClause.OR = [
          { ownerId: req.user.id },
          { permissions: { some: { userId: req.user.id } } },
        ];
      }
    }
    // Only add name filter if searchQuery is provided
    if (searchQuery) {
      whereClause.name = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }
    const [projects, totalCount] = await Promise.all([
      getProjects(whereClause, skip, limit),
      getProjectsCount(whereClause),
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    return sendSuccess(res, {
      data: projects,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    logger.error("Error fetching projects", error);
    next(error);
  }
});

//get project templates
router.get("/public", authenticate, async (req, res, next) => {
  const searchQuery = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause = {
    isPublic: true,
  };

  if (searchQuery) {
    whereClause.name = {
      contains: searchQuery,
      mode: "insensitive",
    };
  }
  try {
    const [publicProjects, totalCount] = await Promise.all([
      prisma.project.findMany({
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              picture: true,
            },
          },
          roots: {
            select: {
              id: true,
              name: true,
              updatedAt: true,
            },
          },
        },
        where: whereClause,
        skip,
        take: limit,
      }),
      prisma.project.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, totalCount);

    return sendSuccess(res, {
      data: publicProjects,
      pagination: {
        currentPage: page, // ftv - current page number
        page, // backward compatibility
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
        startItem,
        endItem,
        // Additional helper info for frontend
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
        isFirstPage: page === 1,
        isLastPage: page === totalPages,
      },
      meta: {
        total: totalCount,
        count: publicProjects.length,
        ftv: page, // Current page number as requested
      },
    });
  } catch (error) {
    logger.error("Error fetching project templates", error);
    next(error);
  }
});

// Add user to project by email
router.post("/:id/users/email", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, canWrite = false } = req.body;

    if (!email) {
      return sendBadRequest(res, "Email is required");
    }

    // Check if project exists and user has permission
    const existingProject = await getProjectById(id);

    if (!existingProject) {
      return sendNotFound(res, "Project");
    }

    // Only the owner can add users
    if (existingProject.ownerId !== req.user.id) {
      return sendForbidden(res, "Not authorized to add users to this project");
    }

    // Find the user by email
    const userToAdd = await getUserByEmail(email);

    if (!userToAdd) {
      return sendNotFound(res, "User");
    }

    // Check if user already has permission
    const existingPermission = existingProject.permissions.find(
      (permission) => permission.userId === userToAdd.id
    );

    if (existingPermission) {
      // Update existing permission
      const updatedPermission = await updatePermission(
        existingPermission,
        canWrite
      );

      // Send email notification
      const accessLevel = canWrite ? "editor" : "viewer";
      await sendProjectPermissionEmail(
        email,
        existingProject.name,
        accessLevel,
        true
      );

      return sendSuccess(res, updatedPermission, "User permission updated");
    }

    // Create new permission
    const newPermission = await createPermission(id, userToAdd, canWrite);

    // Send email notification for new permission
    const accessLevel = canWrite ? "editor" : "viewer";
    await sendProjectPermissionEmail(
      email,
      existingProject.name,
      accessLevel,
      false
    );

    return sendSuccess(res, newPermission, "User added to project", 201);
  } catch (error) {
    logger.error("Error adding user to project", error);
    next(error);
  }
});

// Get project permissions
router.get("/:id/permissions", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if project exists and user has permission
    const existingProject = await getProjectWithPermissions(id);

    if (!existingProject) {
      return sendNotFound(res, "Project");
    }

    // Check if user has permission to view project
    const hasPermission =
      existingProject.ownerId === req.user.id ||
      existingProject.permissions.some((p) => p.userId === req.user.id);

    if (!hasPermission) {
      return sendForbidden(res, "Not authorized to view this project");
    }

    return sendSuccess(res, {
      owner: existingProject.owner,
      permissions: existingProject.permissions,
    });
  } catch (error) {
    logger.error("Error fetching project permissions", error);
    next(error);
  }
});

/**
 * GET /projects/{id}/accessible-users
 * @summary Get all users who have access to a project (owner and collaborators)
 * @tags Projects - Collaboration
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @return {object} 200 - List of accessible users
 * @return {object} 403 - Forbidden - Not authorized
 * @return {object} 404 - Project not found
 * @return {object} 500 - Server error
 */
router.get("/:id/accessible-users", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            picture: true,
          },
        },
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                picture: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return sendNotFound(res, "Project");
    }

    const hasPermission =
      project.ownerId === req.user.id ||
      project.permissions.some((p) => p.userId === req.user.id);

    if (!hasPermission) {
      return sendForbidden(res, "Not authorized to view this project's users");
    }

    const accessibleUsers = [];

    // Add owner
    if (project.owner) {
      accessibleUsers.push({
        ...project.owner,
        accessLevel: "owner",
      });
    }

    // Add collaborators
    project.permissions.forEach((permission) => {
      if (permission.user) {
        accessibleUsers.push({
          ...permission.user,
          accessLevel: permission.accessLevel,
        });
      }
    });

    return sendSuccess(res, accessibleUsers);
  } catch (error) {
    logger.error("Error fetching accessible users", error);
    next(error);
  }
});

// Update user permissions in project
router.patch("/:id/users/:userId", authenticate, async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { canWrite } = req.body;

    if (canWrite === undefined) {
      return sendBadRequest(res, "canWrite is required");
    }

    // Check if project exists and user has permission
    const existingProject = await getProject(id);

    if (!existingProject) {
      return sendNotFound(res, "Project");
    }

    // Only the owner can update permissions
    if (existingProject.ownerId !== req.user.id) {
      return sendForbidden(
        res,
        "Not authorized to update permissions in this project"
      );
    }

    // Find the permission
    const permission = await getPermission(id, userId);

    if (!permission) {
      return sendNotFound(res, "Permission");
    }

    // Update the permission
    const updatedPermission = await updatePermission(permission, canWrite);
    return sendSuccess(res, updatedPermission, "User permission updated");
  } catch (error) {
    logger.error("Error updating user permission", error);
    next(error);
  }
});

// Remove user from project
router.delete("/:id/users/:userId", authenticate, async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    // Check if project exists and user has permission
    const existingProject = await getProject(id);

    if (!existingProject) {
      return sendNotFound(res, "Project");
    }

    // Only the owner can remove users
    if (existingProject.ownerId !== req.user.id) {
      return sendForbidden(
        res,
        "Not authorized to remove users from this project"
      );
    }

    // Find the permission with user details
    const permission = await prisma.permission.findFirst({
      where: {
        projectId: id,
        userId,
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!permission) {
      return sendNotFound(res, "Permission");
    }

    // Delete the permission
    await deletePermission(permission);

    // Send email notification
    if (permission.user && permission.user.email) {
      await sendProjectPermissionRemovedEmail(
        permission.user.email,
        existingProject.name
      );
    }

    return sendSuccess(res, null, "User removed from project");
  } catch (error) {
    logger.error("Error removing user from project", error);
    next(error);
  }
});

// SSE endpoint for export progress (no authentication needed - progressId acts as unique identifier)
router.get("/:id/export-progress/:progressId", async (req, res) => {
  const { progressId } = req.params;

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Store the response object for this progress ID
  progressStreams.set(progressId, res);

  // Send initial connection message
  const initialMessage = JSON.stringify({
    progress: 0,
    message: "Connection established...",
  });

  res.write(`data: ${initialMessage}\n\n`);

  // Send a second message to confirm connection and indicate readiness
  setTimeout(() => {
    const readyMessage = JSON.stringify({
      progress: 1,
      message: "Ready for export...",
    });
    res.write(`data: ${readyMessage}\n\n`);
  }, 200);

  // Clean up when client disconnects
  req.on("close", () => {
    progressStreams.delete(progressId);
  });

  req.on("aborted", () => {
    progressStreams.delete(progressId);
  });
});

// Get documents list for export options
router.get("/:id/documents", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await getProjectWithPermissions(id);

    if (!project) {
      return sendNotFound(res, "Project");
    }

    // Check if user has permission to view this project
    const hasPermission =
      project.ownerId === req.user.id ||
      project.permissions.some((p) => p.userId === req.user.id);

    if (!hasPermission) {
      return sendForbidden(res, "Not authorized to view this project");
    }

    // Format documents for export selection
    const documents = [];

    // Add root documents
    for (const root of project.roots) {
      documents.push({
        id: root.id,
        name: root.name || root.identifier,
        type: "root",
        language: "original",
      });

      // Add translations
      for (const translation of root.translations) {
        documents.push({
          id: translation.id,
          name: `${root.name || root.identifier} (${translation.language})`,
          type: "translation",
          language: translation.language,
          parentName: root.name || root.identifier,
        });
      }
    }

    return sendSuccess(res, {
      projectName: project.name,
      documents: documents,
    });
  } catch (error) {
    logger.error("Error fetching project documents", error);
    next(error);
  }
});

// Get project by ID
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await getProjectWithPermissions(id);

    if (!project) {
      return sendNotFound(res, "Project");
    }

    return sendSuccess(res, project);
  } catch (error) {
    logger.error("Error fetching project", error);
    next(error);
  }
});

// Create project
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { name, identifier, metadata, rootId } = req.body;

    if (!name || !identifier) {
      return sendBadRequest(res, "Name and identifier are required");
    }
    // Create project with proper permission structure
    const project = await createProject(
      name,
      identifier,
      metadata,
      rootId,
      req.user.id
    );

    return sendSuccess(res, project, null, 201);
  } catch (error) {
    logger.error("Error creating project", error);
    next(error);
  }
});

// Update project
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, identifier, metadata, status } = req.body;

    // Check if project exists and user has permission
    const existingProject = await getProject(id);

    if (!existingProject) {
      return sendNotFound(res, "Project");
    }

    if (existingProject.ownerId !== req.user.id) {
      return sendForbidden(res, "Not authorized to update this project");
    }

    const updatedProject = await updateProject(
      id,
      name,
      identifier,
      metadata,
      status
    );

    return sendSuccess(res, updatedProject);
  } catch (error) {
    logger.error("Error updating project", error);
    next(error);
  }
});

// Delete project (soft delete)
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if project exists and user has permission
    const existingProject = await getProject(id);

    if (!existingProject) {
      return sendNotFound(res, "Project");
    }

    if (existingProject.ownerId !== req.user.id) {
      return sendForbidden(res, "Not authorized to delete this project");
    }

    // Soft delete by updating status
    await deleteProject(id);

    return sendSuccess(res, null, "Project deleted successfully");
  } catch (error) {
    logger.error("Error deleting project", error);
    next(error);
  }
});

// Download all documents in a project as a zip file
router.get("/:id/export", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, translationId } = req.query;

    if (type === "side-by-side") {
      // Check if project exists and user has permission
      const project = await getProjectWithDocuments(id, req.user.id);

      if (!project) {
        if (!res.headersSent) {
          return sendNotFound(res, "Project");
        }
        return;
      }

      // Create a zip file
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      // Set response headers
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${project.name
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_side_by_side.zip`
      );

      // Pipe archive data to the response
      archive.pipe(res);

      // Process all root documents and their translations
      for (const rootDoc of project.roots) {
        const rootDocContent = await getDocumentContent(rootDoc.id);

        // Filter translations based on translationId parameter
        let translationsToProcess = rootDoc.translations;
        if (translationId && translationId !== "all") {
          translationsToProcess = rootDoc.translations.filter(
            (translation) => translation.id === translationId
          );
        }

        // Process translations
        for (const translation of translationsToProcess) {
          const translationContent = await getDocumentContent(translation.id);
          if (rootDocContent && translationContent) {
            // Create a combined document with source and translation side by side
            const combinedDocx = await createSideBySideDocx(
              rootDoc.name,
              rootDocContent,
              translation.language,
              translationContent
            );
            archive.append(combinedDocx, {
              name: `${rootDoc.name}_${translation.language}_side_by_side.docx`,
            });
          }
        }
      }

      // Finalize the archive
      await archive.finalize();
    } else if (type === "line-by-line") {
      // Check if project exists and user has permission
      const project = await getProjectWithDocuments(id, req.user.id);

      if (!project) {
        if (!res.headersSent) {
          return sendNotFound(res, "Project");
        }
        return;
      }

      // Create a zip file
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      // Set response headers
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${project.name
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_line_by_line.zip`
      );

      // Pipe archive data to the response
      archive.pipe(res);

      // Process all root documents and their translations
      for (const rootDoc of project.roots) {
        const rootDocContent = await getDocumentContent(rootDoc.id);

        // Filter translations based on translationId parameter
        let translationsToProcess = rootDoc.translations;
        if (translationId && translationId !== "all") {
          translationsToProcess = rootDoc.translations.filter(
            (translation) => translation.id === translationId
          );
        }

        // Process translations
        for (const translation of translationsToProcess) {
          const translationContent = await getDocumentContent(translation.id);
          if (rootDocContent && translationContent) {
            // Create a combined document with source and translation line by line
            const combinedDocx = await createLineByLineDocx(
              rootDoc.name,
              rootDocContent,
              translation.language,
              translationContent
            );
            archive.append(combinedDocx, {
              name: `${rootDoc.name}_${translation.language}_line_by_line.docx`,
            });
          }
        }
      }

      // Finalize the archive
      await archive.finalize();
    } else if (type === "pecha-template") {
      // Get optional progress ID (no document selection needed)
      const { progressId } = req.query;

      // Check if project exists and user has permission
      const project = await getProjectWithDocuments(id, req.user.id);
      if (!project) {
        if (!res.headersSent) {
          return sendNotFound(res, "Project");
        }
        return;
      }

      // Create a zip file
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      // Set response headers - always export all documents combined
      const zipFileName = `${project.name}_combined_docx_template.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${zipFileName
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}`
      );

      // Pipe archive data to the response
      archive.pipe(res);

      // Send initial progress update
      sendProgress(
        progressStreams,
        progressId,
        5,
        "Starting docx-template export..."
      );

      // Process all root documents with their translations combined
      let totalDocs = project.roots.length;
      let processedDocs = 0;

      for (const rootDoc of project.roots) {
        sendProgress(
          progressStreams,
          progressId,
          Math.round((processedDocs / totalDocs) * 90) + 5,
          `Processing ${rootDoc.name} with translations...`
        );

        const rootDocContent = await getDocumentContent(rootDoc.id);
        if (rootDocContent) {
          // Filter translations based on translationId parameter
          let translationsToProcess = rootDoc.translations;
          if (translationId && translationId !== "all") {
            translationsToProcess = rootDoc.translations.filter(
              (translation) => translation.id === translationId
            );
          }

          // Process each translation separately (like side-by-side export)
          for (const translation of translationsToProcess) {
            const translationContent = await getDocumentContent(translation.id);

            if (translationContent) {
              // Create side-by-side style DOCX template for this source/translation pair
              const combinedDocx = await createSideBySideDocxTemplate(
                rootDoc.name,
                rootDocContent,
                translation.language,
                translationContent,
                progressId
              );
              const fileName = `${rootDoc.name}_${translation.language}_docx_template.docx`;
              archive.append(combinedDocx, { name: fileName });
            } else {
              logger.warn(
                `No content found for translation ${translation.language} (ID: ${translation.id})`
              );
            }
          }

          // Also create a source-only document if there are no translations to process
          if (translationsToProcess.length === 0) {
            const sourceOnlyDocx = await createDocxTemplate(
              rootDoc.name,
              rootDoc.language,
              rootDocContent,
              progressId
            );

            const fileName = `${rootDoc.name}_source_only_docx_template.docx`;
            archive.append(sourceOnlyDocx, { name: fileName });
          }
        }
        processedDocs++;
      }

      // Finalize the archive
      await archive.finalize();

      // Send completion signal
      if (progressId) {
        sendProgress(progressStreams, progressId, 100, "Export completed!");
        // Clean up the progress stream after a short delay
        setTimeout(() => {
          const stream = progressStreams.get(progressId);
          if (stream) {
            try {
              stream.end();
            } catch (error) {
              logger.error("Error closing progress stream", error);
            }
            progressStreams.delete(progressId);
          }
        }, 1000);
      }
    } else if (type === "page-view") {
      // Export individual DOCX files for each document in page view format (single language mode)
      const { progressId } = req.query;

      // Check if project exists and user has permission
      const project = await getProjectWithDocuments(id, req.user.id);
      if (!project) {
        if (!res.headersSent) {
          return sendNotFound(res, "Project");
        }
        return;
      }

      // Create a zip file
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      // Set response headers
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${project.name
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_page_view.zip`
      );

      // Pipe archive data to the response
      archive.pipe(res);

      // Send initial progress update
      sendProgress(
        progressStreams,
        progressId,
        5,
        "Starting page view export..."
      );

      // Calculate total documents (roots + translations)
      let totalDocs = project.roots.length;
      for (const root of project.roots) {
        totalDocs += root.translations.length;
      }
      let processedDocs = 0;

      // Helper function to extract footnotes from delta

      // Process all root documents
      for (const rootDoc of project.roots) {
        sendProgress(
          progressStreams,
          progressId,
          Math.round((processedDocs / totalDocs) * 90) + 5,
          `Processing ${rootDoc.name}...`
        );

        const rootDocContent = await getDocumentContent(rootDoc.id);
        if (rootDocContent) {
          let docx = await generateDocxBuffer(rootDocContent);
          archive.append(docx, { name: `${rootDoc.name}.docx` });
        }
        processedDocs++;

        // Process translations for this root document
        for (const translation of rootDoc.translations) {
          sendProgress(
            progressStreams,
            progressId,
            Math.round((processedDocs / totalDocs) * 90) + 5,
            `Processing ${translation.name} - ${translation.language}...`
          );

          const translationContent = await getDocumentContent(translation.id);
          if (translationContent) {
            let translationDocx = await generateDocxBuffer(translationContent);

            archive.append(translationDocx, {
              name: `${translation.name}_${translation.language}.docx`,
            });
          }
          processedDocs++;
        }
      }

      // Finalize the archive
      await archive.finalize();

      // Send completion signal
      if (progressId) {
        sendProgress(progressStreams, progressId, 100, "Export completed!");
        setTimeout(() => {
          const stream = progressStreams.get(progressId);
          if (stream) {
            try {
              stream.end();
            } catch (error) {
              logger.error("Error closing progress stream", error);
            }
            progressStreams.delete(progressId);
          }
        }, 1000);
      }
    } else if (type === "single-pecha-templates") {
      // Export individual pecha template DOCX files for each document (single language mode)
      const { progressId } = req.query;

      // Check if project exists and user has permission
      const project = await getProjectWithDocuments(id, req.user.id);

      if (!project) {
        if (!res.headersSent) {
          return sendNotFound(res, "Project");
        }
        return;
      }

      // Create a zip file
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      // Set response headers
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${project.name
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_pecha_templates.zip`
      );

      // Pipe archive data to the response
      archive.pipe(res);

      // Send initial progress update
      sendProgress(
        progressStreams,
        progressId,
        5,
        "Starting pecha templates export..."
      );

      // Calculate total documents (roots + translations)
      let totalDocs = project.roots.length;
      for (const root of project.roots) {
        totalDocs += root.translations.length;
      }
      let processedDocs = 0;

      // Process all root documents
      for (const rootDoc of project.roots) {
        sendProgress(
          progressStreams,
          progressId,
          Math.round((processedDocs / totalDocs) * 90) + 5,
          `Processing ${rootDoc.name} as pecha template...`
        );

        const rootDocContent = await getDocumentContent(rootDoc.id);
        if (rootDocContent) {
          // Create pecha template DOCX for root document
          const pechaDocx = await createDocxTemplate(
            rootDoc.name,
            rootDoc.language,
            rootDocContent,
            progressId
          );

          const fileName = `${rootDoc.name}_pecha_template.docx`;
          archive.append(pechaDocx, { name: fileName });
        }
        processedDocs++;

        // Process translations for this root document
        for (const translation of rootDoc.translations) {
          sendProgress(
            progressStreams,
            progressId,
            Math.round((processedDocs / totalDocs) * 90) + 5,
            `Processing ${translation.name} - ${translation.language} as pecha template...`
          );

          const translationContent = await getDocumentContent(translation.id);
          if (translationContent) {
            // Create pecha template DOCX for translation
            const translationPechaDocx = await createDocxTemplate(
              `${rootDoc.name}_${translation.language}`,
              translation.language,
              translationContent,
              progressId
            );

            const fileName = `${translation.name}_${translation.language}_pecha_template.docx`;
            archive.append(translationPechaDocx, { name: fileName });
          }
          processedDocs++;
        }
      }

      // Finalize the archive
      await archive.finalize();

      // Send completion signal
      if (progressId) {
        sendProgress(progressStreams, progressId, 100, "Export completed!");
        setTimeout(() => {
          const stream = progressStreams.get(progressId);
          if (stream) {
            try {
              stream.end();
            } catch (error) {
              logger.error("Error closing progress stream", error);
            }
            progressStreams.delete(progressId);
          }
        }, 1000);
      }
    } else {
      // Check if project exists and user has permission
      const project = await getProjectWithDocuments(id, req.user.id);

      if (!project) {
        if (!res.headersSent) {
          return sendNotFound(res, "Project");
        }
        return;
      }

      // Check if user has permission to access this project
      // const hasPermission = project.ownerId === req.user.id || project.permissions.some(p => p.userId === req.user.id && p.canRead);
      // if (!hasPermission) {
      // return res.status(403).json({ error: "Not authorized to access this project" });
      // }

      // Create a zip file
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Compression level
      });

      // Set response headers
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${project.name
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_documents.zip`
      );

      // Pipe archive data to the response
      archive.pipe(res);

      // Process all root documents and their translations
      for (const rootDoc of project.roots) {
        // Get the content of the root document
        const rootDocContent = await getDocumentContent(rootDoc.id);
        if (rootDocContent) {
          // Add root document to the zip
          const rootDocx = await generateDocxBuffer(rootDocContent);
          archive.append(rootDocx, { name: `${rootDoc.name}.docx` });
        }

        // Process translations
        for (const translation of rootDoc.translations) {
          const translationContent = await getDocumentContent(translation.id);
          if (translationContent) {
            // Add translation document to the zip
            const translationDocx = await generateDocxBuffer(
              `${translation.name}_${translation.language}`,
              translationContent
            );
            archive.append(translationDocx, {
              name: `${translation.name}_${translation.language}.docx`,
            });
          }
        }
      }

      // Finalize the archive
      await archive.finalize();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Send progress update via SSE
 * @param {string} progressId - Progress tracking ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} message - Progress message
 */

// Store active progress streams

/**
 * POST /projects/{id}/share
 * @summary Update project sharing settings
 * @tags Projects - Sharing
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @param {object} request.body.required - Sharing settings
 * @param {boolean} request.body.isPublic - Whether project is public
 * @param {string} request.body.publicAccess - Public access level (none, viewer, editor)
 * @return {object} 200 - Updated sharing settings
 * @return {object} 403 - Forbidden - Not project owner
 * @return {object} 404 - Project not found
 * @return {object} 500 - Server error
 */
router.post("/:id/share", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPublic, publicAccess } = req.body;

    // Check if project exists and get root documents
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        roots: {
          where: { isRoot: true },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      return sendNotFound(res, "Project");
    }

    // Only owner can update sharing settings
    if (project.ownerId !== req.user.id) {
      return sendForbidden(res, "Not authorized to update sharing settings");
    }

    // Check if project has a root document
    if (!project.roots || project.roots.length === 0) {
      return sendBadRequest(
        res,
        "Project must have a root document to be shared"
      );
    }

    // Generate share link if making public
    let shareLink = project.shareLink;
    if (isPublic && !shareLink) {
      shareLink = crypto.randomBytes(32).toString("hex");
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        isPublic: isPublic || false,
        publicAccess: publicAccess || "none",
        shareLink: isPublic ? shareLink : null,
      },
    });

    // Generate direct link to root document instead of project link
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const rootDocument = project.roots[0]; // Get the first root document
    const shareableLink = updatedProject.isPublic
      ? `${baseUrl}/documents/public/${rootDocument.id}`
      : null;

    return sendSuccess(res, {
      ...updatedProject,
      shareableLink,
      rootDocument,
    });
  } catch (error) {
    logger.error("Error updating project sharing", error);
    next(error);
  }
});

/**
 * GET /projects/{id}/share
 * @summary Get project sharing information
 * @tags Projects - Sharing
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @return {object} 200 - Sharing information
 * @return {object} 403 - Forbidden - No access
 * @return {object} 404 - Project not found
 * @return {object} 500 - Server error
 */
router.get("/:id/share", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get project with permissions and root documents
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        roots: {
          where: { isRoot: true },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      return sendNotFound(res, "Project");
    }

    // Check if user has permission to view sharing settings
    const hasPermission =
      project.ownerId === req.user.id ||
      project.permissions.some((p) => p.userId === req.user.id);

    if (!hasPermission) {
      return sendForbidden(res, "Not authorized to view sharing settings");
    }

    // Generate direct link to root document instead of project link
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const rootDocument =
      project.roots && project.roots.length > 0 ? project.roots[0] : null;
    const shareableLink =
      project.isPublic && rootDocument
        ? `${baseUrl}/documents/public/${rootDocument.id}`
        : null;

    return sendSuccess(res, {
      id: project.id,
      name: project.name,
      isPublic: project.isPublic,
      publicAccess: project.publicAccess,
      shareableLink,
      isOwner: project.ownerId === req.user.id,
      permissions: project.permissions,
      owner: project.owner,
      rootDocument,
    });
  } catch (error) {
    logger.error("Error fetching project sharing info", error);
    next(error);
  }
});

/**
 * POST /projects/{id}/collaborators
 * @summary Add collaborator to project
 * @tags Projects - Collaboration
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @param {object} request.body.required - Collaborator data
 * @param {string} request.body.email - User email
 * @param {string} request.body.accessLevel - Access level (viewer, editor, admin)
 * @param {string} request.body.message - Optional invitation message
 * @return {object} 200 - Collaborator added
 * @return {object} 403 - Forbidden - Not authorized
 * @return {object} 404 - User or project not found
 * @return {object} 500 - Server error
 */
router.post("/:id/collaborators", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, accessLevel = "viewer", message } = req.body;

    if (!email) {
      return sendBadRequest(res, "Email is required");
    }

    // Validate access level
    if (!["viewer", "editor", "admin"].includes(accessLevel)) {
      return sendBadRequest(res, "Invalid access level");
    }

    // Check if project exists
    const project = await getProject(id);
    if (!project) {
      return sendNotFound(res, "Project");
    }

    // Check if user has permission to add collaborators
    const hasPermission = project.ownerId === req.user.id;
    if (!hasPermission) {
      return sendForbidden(res, "Not authorized to add collaborators");
    }

    // Find user by email
    const userToAdd = await getUserByEmail(email);
    if (!userToAdd) {
      return sendNotFound(res, "User");
    }

    // Check if user is already a collaborator
    const existingPermission = await prisma.permission.findFirst({
      where: {
        projectId: id,
        userId: userToAdd.id,
      },
    });

    if (existingPermission) {
      // Update existing permission
      const updatedPermission = await prisma.permission.update({
        where: { id: existingPermission.id },
        data: {
          accessLevel,
          canWrite: ["editor", "admin"].includes(accessLevel),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      await sendProjectPermissionEmail(
        userToAdd.email,
        project.name,
        accessLevel,
        true
      );

      return sendSuccess(
        res,
        updatedPermission,
        "Collaborator access level updated"
      );
    }

    // Create new permission
    const newPermission = await prisma.permission.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        accessLevel,
        canRead: true,
        canWrite: ["editor", "admin"].includes(accessLevel),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Send email notification to the new collaborator
    await sendProjectPermissionEmail(
      userToAdd.email,
      project.name,
      accessLevel,
      false
    );

    return sendSuccess(
      res,
      newPermission,
      "Collaborator added successfully",
      201
    );
  } catch (error) {
    logger.error("Error adding collaborator", error);
    next(error);
  }
});

/**
 * PATCH /projects/{id}/collaborators/{userId}
 * @summary Update collaborator access level
 * @tags Projects - Collaboration
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @param {string} userId.path.required - User ID
 * @param {object} request.body.required - Update data
 * @param {string} request.body.accessLevel - New access level (viewer, editor, admin)
 * @return {object} 200 - Access level updated
 * @return {object} 403 - Forbidden - Not authorized
 * @return {object} 404 - Permission not found
 * @return {object} 500 - Server error
 */
router.patch(
  "/:id/collaborators/:userId",
  authenticate,
  async (req, res, next) => {
    try {
      const { id, userId } = req.params;
      const { accessLevel } = req.body;

      if (!accessLevel) {
        return sendBadRequest(res, "Access level is required");
      }

      // Validate access level
      if (!["viewer", "editor", "admin"].includes(accessLevel)) {
        return sendBadRequest(res, "Invalid access level");
      }

      // Check if project exists
      const project = await getProject(id);
      if (!project) {
        return sendNotFound(res, "Project");
      }

      // Check if user has permission to update collaborators
      const hasPermission = project.ownerId === req.user.id;
      if (!hasPermission) {
        return sendForbidden(res, "Not authorized to update collaborators");
      }

      // Find the permission
      const permission = await prisma.permission.findFirst({
        where: {
          projectId: id,
          userId,
        },
      });

      if (!permission) {
        return sendNotFound(res, "Collaborator");
      }

      // Update permission
      const updatedPermission = await prisma.permission.update({
        where: { id: permission.id },
        data: {
          accessLevel,
          canWrite: ["editor", "admin"].includes(accessLevel),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Send email notification
      if (updatedPermission.user && updatedPermission.user.email) {
        await sendProjectPermissionEmail(
          updatedPermission.user.email,
          project.name,
          accessLevel,
          true
        );
      }

      return sendSuccess(res, updatedPermission, "Access level updated");
    } catch (error) {
      logger.error("Error updating collaborator", error);
      next(error);
    }
  }
);

/**
 * DELETE /projects/{id}/collaborators/{userId}
 * @summary Remove collaborator from project
 * @tags Projects - Collaboration
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @param {string} userId.path.required - User ID
 * @return {object} 200 - Collaborator removed
 * @return {object} 403 - Forbidden - Not authorized
 * @return {object} 404 - Permission not found
 * @return {object} 500 - Server error
 */
router.delete(
  "/:id/collaborators/:userId",
  authenticate,
  async (req, res, next) => {
    try {
      const { id, userId } = req.params;

      // Check if project exists
      const project = await getProject(id);
      if (!project) {
        return sendNotFound(res, "Project");
      }

      // Check if user has permission to remove collaborators
      const hasPermission = project.ownerId === req.user.id;
      if (!hasPermission) {
        return sendForbidden(res, "Not authorized to remove collaborators");
      }

      // Don't allow removing the owner
      if (userId === project.ownerId) {
        return sendBadRequest(res, "Cannot remove project owner");
      }

      // Find the permission with user details
      const permission = await prisma.permission.findFirst({
        where: {
          projectId: id,
          userId,
        },
        include: {
          user: {
            select: {
              email: true,
              username: true,
            },
          },
        },
      });

      if (!permission) {
        return sendNotFound(res, "Collaborator");
      }

      // Delete permission
      await prisma.permission.delete({
        where: { id: permission.id },
      });

      // Send email notification
      if (permission.user && permission.user.email) {
        await sendProjectPermissionRemovedEmail(
          permission.user.email,
          project.name
        );
      }

      return sendSuccess(res, null, "Collaborator removed");
    } catch (error) {
      logger.error("Error removing collaborator", error);
      next(error);
    }
  }
);

module.exports = router;
