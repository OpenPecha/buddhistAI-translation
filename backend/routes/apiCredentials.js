const express = require("express");
const router = express.Router();
const { prisma } = require("../services/db");
const { authenticate } = require("../middleware/authenticate");
const { encrypt, decrypt, maskApiKey } = require("../utils/encryption");
const logger = require("../utils/logger");
const {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
  sendBadRequest,
} = require("../utils/response");

/**
 * GET /api-credentials
 * @summary Get all API credentials for the authenticated user
 * @tags API Credentials - API credential management operations
 * @security BearerAuth
 * @return {object} 200 - List of API credentials
 * @return {object} 500 - Server error
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const credentials = await prisma.apiCredential.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, credentials);
  } catch (error) {
    logger.error("Error fetching API credentials", error);
    next(error);
  }
});

/**
 * GET /api-credentials/:id
 * @summary Get a specific API credential by ID
 * @tags API Credentials - API credential management operations
 * @security BearerAuth
 * @param {string} id.path.required - API credential ID
 * @return {object} 200 - API credential details
 * @return {object} 403 - Forbidden - Not the owner of this credential
 * @return {object} 404 - Credential not found
 * @return {object} 500 - Server error
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const credential = await prisma.apiCredential.findUnique({
      where: { id },
      select: {
        id: true,
        provider: true,
        apiKeyEnc: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!credential) {
      return sendNotFound(res, "API credential");
    }

    // Check if the user owns this credential
    if (credential.userId !== req.user.id) {
      return sendForbidden(
        res,
        "You don't have permission to view this credential"
      );
    }

    // Decrypt the API key
    const apiKey = decrypt(credential.apiKeyEnc);

    // Include both the full API key and a masked version
    // The frontend will decide which one to display based on user interaction
    const maskedApiKey = maskApiKey(apiKey);

    return sendSuccess(res, {
      id: credential.id,
      provider: credential.provider,
      apiKey: apiKey, // Send the full API key
      maskedApiKey: maskedApiKey, // Also send the masked version
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    });
  } catch (error) {
    logger.error("Error fetching API credential", error);
    next(error);
  }
});

/**
 * POST /api-credentials
 * @summary Create a new API credential
 * @tags API Credentials - API credential management operations
 * @security BearerAuth
 * @param {object} request.body.required - API credential information
 * @param {string} request.body.provider.required - API provider (e.g., "openai", "google", "deepl")
 * @param {string} request.body.apiKey.required - API key
 * @return {object} 201 - API credential created
 * @return {object} 400 - Bad request - Missing required fields
 * @return {object} 500 - Server error
 */
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { provider, apiKey } = req.body;

    // Validate required fields
    if (!provider || !apiKey) {
      return sendBadRequest(res, "Provider and API key are required");
    }

    // Check if user already has a credential for this provider
    const existingCredential = await prisma.apiCredential.findFirst({
      where: {
        userId: req.user.id,
        provider,
      },
    });

    if (existingCredential) {
      // Update existing credential
      const updatedCredential = await prisma.apiCredential.update({
        where: { id: existingCredential.id },
        data: {
          apiKeyEnc: encrypt(apiKey),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return sendSuccess(res, updatedCredential, "API credential updated");
    }

    // Create new credential
    const newCredential = await prisma.apiCredential.create({
      data: {
        userId: req.user.id,
        provider,
        apiKeyEnc: encrypt(apiKey),
      },
      select: {
        id: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, newCredential, null, 201);
  } catch (error) {
    logger.error("Error creating API credential", error);
    next(error);
  }
});

/**
 * PUT /api-credentials/:id
 * @summary Update an existing API credential
 * @tags API Credentials - API credential management operations
 * @security BearerAuth
 * @param {string} id.path.required - API credential ID
 * @param {object} request.body.required - Updated API credential information
 * @param {string} request.body.provider - Updated provider name
 * @param {string} request.body.apiKey - Updated API key
 * @return {object} 200 - API credential updated
 * @return {object} 403 - Forbidden - Not the owner of this credential
 * @return {object} 404 - Credential not found
 * @return {object} 500 - Server error
 */
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { provider, apiKey } = req.body;

    // Check if credential exists and belongs to user
    const credential = await prisma.apiCredential.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!credential) {
      return sendNotFound(res, "API credential");
    }

    if (credential.userId !== req.user.id) {
      return sendForbidden(
        res,
        "You don't have permission to update this credential"
      );
    }

    // Prepare update data
    const updateData = {};
    if (provider) updateData.provider = provider;
    if (apiKey) updateData.apiKeyEnc = encrypt(apiKey);

    // Update the credential
    const updatedCredential = await prisma.apiCredential.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, updatedCredential);
  } catch (error) {
    logger.error("Error updating API credential", error);
    next(error);
  }
});

/**
 * DELETE /api-credentials/:id
 * @summary Delete an API credential
 * @tags API Credentials - API credential management operations
 * @security BearerAuth
 * @param {string} id.path.required - API credential ID
 * @return {object} 200 - API credential deleted
 * @return {object} 403 - Forbidden - Not the owner of this credential
 * @return {object} 404 - Credential not found
 * @return {object} 500 - Server error
 */
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if credential exists and belongs to user
    const credential = await prisma.apiCredential.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!credential) {
      return sendNotFound(res, "API credential");
    }

    if (credential.userId !== req.user.id) {
      return sendForbidden(
        res,
        "You don't have permission to delete this credential"
      );
    }

    // Delete the credential
    await prisma.apiCredential.delete({
      where: { id },
    });

    return sendSuccess(res, null, "API credential deleted successfully");
  } catch (error) {
    logger.error("Error deleting API credential", error);
    next(error);
  }
});

/**
 * GET /api-credentials/provider/:provider
 * @summary Get API credential for a specific provider
 * @tags API Credentials - API credential management operations
 * @security BearerAuth
 * @param {string} provider.path.required - Provider name (e.g., "openai", "google", "deepl")
 * @return {object} 200 - API credential for the provider
 * @return {object} 404 - No credential found for this provider
 * @return {object} 500 - Server error
 */
router.get("/provider/:provider", authenticate, async (req, res, next) => {
  try {
    const { provider } = req.params;

    const credential = await prisma.apiCredential.findFirst({
      where: {
        userId: req.user.id,
        provider,
      },
      select: {
        id: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!credential) {
      return sendNotFound(res, `API credential for ${provider}`);
    }

    return sendSuccess(res, credential);
  } catch (error) {
    logger.error("Error fetching API credential by provider", error);
    next(error);
  }
});

/**
 * POST /api-credentials/verify
 * @summary Verify if an API key is valid
 * @tags API Credentials - API credential management operations
 * @security BearerAuth
 * @param {object} request.body.required - API credential information
 * @param {string} request.body.provider.required - API provider
 * @param {string} request.body.apiKey.required - API key to verify
 * @return {object} 200 - Verification result
 * @return {object} 400 - Bad request - Missing required fields
 * @return {object} 500 - Server error
 */
router.post("/verify", authenticate, async (req, res, next) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return sendBadRequest(res, "Provider and API key are required");
    }

    // Here you would implement provider-specific verification logic
    // This is a placeholder - actual implementation would depend on the API providers
    let isValid = false;
    let errorMessage = null;

    try {
      switch (provider.toLowerCase()) {
        case "openai":
          // Implement OpenAI API key verification
          // Example: Make a simple API call to OpenAI
          isValid = true; // Placeholder
          break;
        case "google":
          // Implement Google API key verification
          isValid = true; // Placeholder
          break;
        case "deepl":
          // Implement DeepL API key verification
          isValid = true; // Placeholder
          break;
        default:
          errorMessage = `Verification for ${provider} is not supported`;
      }
    } catch (verificationError) {
      errorMessage = verificationError.message;
    }

    return sendSuccess(res, {
      isValid,
      provider,
      errorMessage,
    });
  } catch (error) {
    logger.error("Error verifying API key", error);
    next(error);
  }
});

module.exports = router;
