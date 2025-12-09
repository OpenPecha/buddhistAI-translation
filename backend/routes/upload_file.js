const express = require("express");
const multer = require("multer");
const {
  uploadFile,
  uploadPublicFile,
  makeFilePublic,
  getSignedUrl,
  getPublicUrl,
} = require("../services/s3upload");
const { v4: uuidv4 } = require("uuid");
const path = require("node:path");
const { prisma } = require("../services/db");

const router = express.Router();

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

/**
 * POST /upload-file
 * @summary Upload a file to S3
 * @tags Upload - File upload operations
 * @param {file} file.formData.required - File to upload
 * @param {string} path.formData - Optional path/folder in S3 (e.g., "documents/", "images/")
 * @param {boolean} public.formData - Whether to make the file publicly accessible (default: false)
 * @return {object} 200 - File uploaded successfully
 * @return {object} 400 - Bad request - No file provided
 * @return {object} 500 - Server error
 * @example request - Upload file request
 * FormData:
 *   file: <file>
 *   path: "documents/"
 *   public: "true"
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "message": "File uploaded successfully",
 *   "data": {
 *     "location": "https://bucket.s3.region.amazonaws.com/path/to/file.jpg",
 *     "bucket": "bucket-name",
 *     "key": "path/to/file.jpg",
 *     "etag": "\"etag-value\"",
 *     "url": "https://bucket.s3.region.amazonaws.com/path/to/file.jpg"
 *   }
 * }
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided",
        message: "Please provide a file to upload",
      });
    }

    // Get optional parameters
    const s3Path = req.body.path || "";
    const isPublic = req.body.public === "true" || req.body.public === true;

    // Generate unique filename if needed (optional: use original filename)
    const originalName = req.file.originalname;
    const fileExtension = path.extname(originalName);
    const baseName = path.basename(originalName, fileExtension);

    // Create S3 key (path + filename)
    // You can customize this logic - here we're using original filename with optional path prefix
    const timestamp = Date.now();
    const uniqueFileName = `${baseName}-${timestamp}${fileExtension}`;
    const s3Key = s3Path ? `${s3Path}${uniqueFileName}` : uniqueFileName;

    // Upload to S3
    let uploadResult;
    if (isPublic) {
      uploadResult = await uploadPublicFile(
        req.file.buffer,
        s3Key,
        null, // Use bucket from env
        req.file.mimetype,
        {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        }
      );
    } else {
      uploadResult = await uploadFile(
        req.file.buffer,
        s3Key,
        null, // Use bucket from env
        req.file.mimetype,
        {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: uploadResult,
    });
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload file",
      message: error.message,
    });
  }
});

/**
 * POST /upload-file/multiple
 * @summary Upload multiple files to S3
 * @tags Upload - File upload operations
 * @param {file[]} files.formData.required - Files to upload (array)
 * @param {string} path.formData - Optional path/folder in S3 (e.g., "documents/", "images/")
 * @param {boolean} public.formData - Whether to make the files publicly accessible (default: false)
 * @param {string} translationId.formData - Translation ID to associate files with (optional)
 * @return {object} 200 - Files uploaded successfully
 * @return {object} 400 - Bad request - No files provided
 * @return {object} 500 - Server error
 */
router.post("/multiple", upload.array("files", 10), async (req, res) => {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files provided",
        message: "Please provide files to upload",
      });
    }

    // Get optional parameters
    const s3Path = req.body.path || "";
    const isPublic = req.body.public === "true" || req.body.public === true;
    const translationId = req.body.translationId;

    const uploadPromises = req.files.map(async (file) => {
      const originalName = file.originalname;
      const fileExtension = path.extname(originalName);
      const baseName = path.basename(originalName, fileExtension);

      const timestamp = Date.now();
      const uniqueFileName = `${baseName}-${timestamp}-${uuidv4()}${fileExtension}`;
      const s3Key = s3Path ? `${s3Path}${uniqueFileName}` : uniqueFileName;

      if (isPublic) {
        return await uploadPublicFile(file.buffer, s3Key, null, file.mimetype, {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        });
      } else {
        return await uploadFile(file.buffer, s3Key, null, file.mimetype, {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        });
      }
    });

    const results = await Promise.all(uploadPromises);

    // If translationId is provided, create TranslationContextFile records
    if (translationId) {
      try {
        // Verify that the translation document exists
        const translationDoc = await prisma.doc.findUnique({
          where: { id: translationId },
        });

        if (!translationDoc) {
          console.warn(
            `Translation document with ID ${translationId} not found. Skipping TranslationContextFile creation.`
          );
        } else {
          // Create TranslationContextFile records for each uploaded file
          const contextFilePromises = req.files.map((file, index) => {
            const uploadResult = results[index];
            return prisma.translationContextFile.create({
              data: {
                mimeType: file.mimetype,
                sizeBytes: file.size,
                storageUrl: uploadResult.location,
                documentId: translationId,
              },
            });
          });

          await Promise.all(contextFilePromises);
        }
      } catch (dbError) {
        console.error(
          "Error creating TranslationContextFile records:",
          dbError
        );
        // Don't fail the upload if database insertion fails, but log the error
        // The files are already uploaded to S3 successfully
      }
    }

    res.status(200).json({
      success: true,
      message: `${results.length} file(s) uploaded successfully`,
      data: results,
    });
  } catch (error) {
    console.error("Error uploading files to S3:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload files",
      message: error.message,
    });
  }
});

/**
 * PUT /upload-file/make-public
 * @summary Make an existing S3 file publicly accessible
 * @tags Upload - File upload operations
 * @param {string} key.query.required - S3 key/path of the file (e.g., "context/file.txt")
 * @return {object} 200 - File made public successfully
 * @return {object} 400 - Bad request - Missing key parameter
 * @return {object} 404 - File not found
 * @return {object} 500 - Server error
 */
router.put("/make-public", async (req, res) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "Missing key parameter",
        message: "Please provide the S3 key/path of the file",
      });
    }

    const result = await makeFilePublic(key);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        url: result.url,
        key: key,
      },
    });
  } catch (error) {
    console.error("Error making file public:", error);

    if (error.code === "NoSuchKey" || error.code === "NotFound") {
      return res.status(404).json({
        success: false,
        error: "File not found",
        message: `File with key "${req.query.key}" does not exist in S3`,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to make file public",
      message: error.message,
    });
  }
});

/**
 * GET /upload-file/signed-url
 * @summary Get a signed URL for temporary access to a private file
 * @tags Upload - File upload operations
 * @param {string} key.query.required - S3 key/path of the file (e.g., "context/file.txt")
 * @param {number} expiresIn.query - Expiration time in seconds (default: 3600 = 1 hour)
 * @return {object} 200 - Signed URL generated successfully
 * @return {object} 400 - Bad request - Missing key parameter
 * @return {object} 500 - Server error
 */
router.get("/signed-url", async (req, res) => {
  try {
    const { key, expiresIn } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "Missing key parameter",
        message: "Please provide the S3 key/path of the file",
      });
    }

    const expires = expiresIn ? Number.parseInt(expiresIn, 10) : 3600;
    const signedUrl = await getSignedUrl(key, expires);

    res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        key: key,
        expiresIn: expires,
      },
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate signed URL",
      message: error.message,
    });
  }
});

/**
 * GET /upload-file/public-url
 * @summary Get the public URL for a file (assumes it's public)
 * @tags Upload - File upload operations
 * @param {string} key.query.required - S3 key/path of the file (e.g., "context/file.txt")
 * @return {object} 200 - Public URL generated successfully
 * @return {object} 400 - Bad request - Missing key parameter
 */
router.get("/public-url", async (req, res) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "Missing key parameter",
        message: "Please provide the S3 key/path of the file",
      });
    }

    const publicUrl = getPublicUrl(key);

    res.status(200).json({
      success: true,
      data: {
        url: publicUrl,
        key: key,
      },
    });
  } catch (error) {
    console.error("Error generating public URL:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate public URL",
      message: error.message,
    });
  }
});

module.exports = router;
