const express = require("express");
const router = express.Router();

/**
 * @typedef {object} TokenizeRequest
 * @property {string} text.required - Text to tokenize
 * @property {string} type.required - Type of tokenization - enum:word
 */

/**
 * POST /tokenize
 * @summary Tokenize text using external tokenization API
 * @tags Tokenizer - Text tokenization services
 * @param {TokenizeRequest} request.body.required - Tokenization request parameters
 * @return {object} 200 - Tokenization response from external API
 * @return {object} 400 - Bad request - Invalid parameters or missing required fields
 * @return {object} 500 - Server error - Tokenization service unavailable or internal error
 * @example request - Example tokenization request
 * {
 *   "text": "string",
 *   "type": "word"
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { text, type } = req.body;

    // Validate required fields
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    if (!type) {
      return res.status(400).json({ error: "type is required" });
    }

    // Prepare the request payload for the external API
    const requestPayload = {
      text,
      type,
    };
    const CATALOGER_URL = process.env.CATALOGER_URL;
    // Make the request to the external API
    const response = await fetch(`${CATALOGER_URL}/tokenize`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      console.error(
        "External API error:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `External tokenization API error: ${response.statusText}`,
        details: errorText,
      });
    }

    // Parse and return the response
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error in tokenization:", error);
    res.status(500).json({
      error: "Tokenization service unavailable",
      details: error.message,
    });
  }
});

module.exports = router;
