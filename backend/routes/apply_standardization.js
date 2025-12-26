const express = require("express");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

/**
 * @typedef {object} GlossaryTerm
 * @property {string} source_term.required - Source term in original language
 * @property {string} translated_term.required - Translated term
 */

/**
 * @typedef {object} StandardizationItem
 * @property {string} original_text.required - Original text content
 * @property {string} translated_text.required - Translated text content
 * @property {array<GlossaryTerm>} glossary.required - Array of glossary terms for this text pair
 */

/**
 * @typedef {object} StandardizationPair
 * @property {string} source_word.required - Source word that needs standardization
 * @property {string} standardized_translation.required - The standardized translation to use
 */

/**
 * @typedef {object} ApplyStandardizationRequest
 * @property {array<StandardizationItem>} items.required - Array of text pairs with glossaries for re-translation
 * @property {array<StandardizationPair>} standardization_pairs.required - Standardization rules to apply
 * @property {string} model_name.required - AI model to use for re-translation
 * @property {string} user_rules - Additional user rules for re-translation
 */

/**
 * POST /standardize/apply/stream
 * @summary Apply standardization corrections and re-translate content via streaming
 * @tags Standardization - Apply standardization corrections
 * @security BearerAuth
 * @param {ApplyStandardizationRequest} request.body.required - Standardization application request parameters
 * @return {object} 200 - Streaming response with re-translation progress and results
 * @return {object} 400 - Bad request - Invalid parameters or missing required fields
 * @return {object} 401 - Unauthorized - Authentication required
 * @return {object} 403 - Forbidden - Access denied to standardization services
 * @return {object} 500 - Server error - Standardization service unavailable or internal error
 * @example request - Example standardization application request
 * {
 *   "items": [
 *     {
 *       "original_text": "བྱང་ཆུབ་སེམས་དང་སེམས་དཔའ་རྣམས་ལ་ཕྱག་འཚལ་ལོ།",
 *       "translated_text": "Homage to the mind of enlightenment and the bodhisattvas.",
 *       "glossary": [
 *         {
 *           "source_term": "བྱང་ཆུབ་སེམས",
 *           "translated_term": "mind of enlightenment"
 *         },
 *         {
 *           "source_term": "སེམས་དཔའ",
 *           "translated_term": "bodhisattva"
 *         }
 *       ]
 *     }
 *   ],
 *   "standardization_pairs": [
 *     {
 *       "source_word": "བྱང་ཆུབ་སེམས",
 *       "standardized_translation": "bodhicitta"
 *     }
 *   ],
 *   "model_name": "claude",
 *   "user_rules": "Apply standardization consistently and maintain natural flow"
 * }
 * @example response - Example streaming response events
 * data: {"timestamp":"2025-01-10T10:30:00.000Z","type":"initialization","total_items":1,"message":"Starting standardization application..."}
 *
 * data: {"timestamp":"2025-01-10T10:30:01.000Z","type":"retranslation_start","index":0,"message":"Re-translating item 1 of 1..."}
 *
 * data: {"timestamp":"2025-01-10T10:30:05.000Z","type":"retranslation_completed","status":"item_updated","index":0,"updated_item":{"original_text":"...","translated_text":"Homage to bodhicitta and the bodhisattvas.","glossary":[...]}}
 *
 * data: {"timestamp":"2025-01-10T10:30:06.000Z","type":"completion","total_completed":1,"message":"Standardization application completed!"}
 */
// Utility validators
function validateArray(arr, name, res) {
  if (!arr || !Array.isArray(arr) || arr.length === 0)
    return res
      .status(400)
      .json({ error: `${name} array is required and cannot be empty` });
}

function validateItems(items, res) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.original_text || !item.translated_text || !item.glossary)
      return res.status(400).json({
        error: `Item at index ${i} is missing required fields: original_text, translated_text, and glossary are required`,
      });
    if (!Array.isArray(item.glossary))
      return res.status(400).json({
        error: `Item at index ${i} has invalid glossary field: must be an array`,
      });
    for (let j = 0; j < item.glossary.length; j++) {
      const term = item.glossary[j];
      if (!term.source_term || !term.translated_term)
        return res.status(400).json({
          error: `Item at index ${i}, glossary term at index ${j} is missing required fields: source_term and translated_term are required`,
        });
    }
  }
}

function validatePairs(standardization_pairs, res) {
  for (let i = 0; i < standardization_pairs.length; i++) {
    const pair = standardization_pairs[i];
    if (!pair.source_word || !pair.standardized_translation)
      return res.status(400).json({
        error: `Standardization pair at index ${i} is missing required fields: source_word and standardized_translation are required`,
      });
  }
}

// Transform event mapping
const transformEvent = (parsedEvent, itemsLen) => {
  const info = {
    timestamp: parsedEvent.timestamp || new Date().toISOString(),
    type: parsedEvent.type,
    message: parsedEvent.message,
  };
  switch (parsedEvent.type) {
    case "initialization":
      info.total_items = parsedEvent.total_items;
      break;
    case "planning":
      info.total_batches = parsedEvent.total_batches;
      info.batch_size = parsedEvent.batch_size;
      break;
    case "retranslation_start":
      info.index = parsedEvent.index;
      info.status = "processing";
      break;
    case "retranslation_completed":
      info.status = "item_updated";
      info.index = parsedEvent.index;
      info.updated_item = parsedEvent.updated_item;
      break;
    case "completion":
      info.total_completed = parsedEvent.total_completed || itemsLen;
      info.status = "completed";
      break;
    case "error":
      info.status = "failed";
      info.error = parsedEvent.error;
      break;
  }
  return info;
};

async function handleSSEStream(externalStream, itemsLen, sendEvent) {
  const reader = externalStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        let eventData = trimmedLine.replace(/^data:\s*/, "");
        if (!eventData) continue;
        try {
          let cleaned = eventData.replace(/data:\s*/g, "");
          if (cleaned.startsWith("{")) {
            const parsed = JSON.parse(cleaned);
            sendEvent(transformEvent(parsed, itemsLen));
          }
        } catch (parseErr) {
          console.error("Error parsing SSE event:", parseErr, line, eventData);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

router.post("/apply/stream", authenticate, async (req, res) => {
  try {
    const { items, standardization_pairs, model_name, user_rules } = req.body;
    if (validateArray(items, "items", res)) return;
    if (validateArray(standardization_pairs, "standardization_pairs", res))
      return;
    if (!model_name || typeof model_name !== "string")
      return res
        .status(400)
        .json({ error: "model_name is required and must be a string" });
    if (validateItems(items, res)) return;
    if (validatePairs(standardization_pairs, res)) return;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    const sendEvent = (d) => res.write(`data: ${JSON.stringify(d)}\n\n`);
    sendEvent({
      timestamp: new Date().toISOString(),
      type: "initialization",
      total_items: items.length,
      message: `Starting standardization application for ${items.length} items...`,
    });

    const requestPayload = {
      items,
      standardization_pairs,
      model_name,
      user_rules:
        user_rules ||
        "Apply standardization consistently while maintaining natural translation flow",
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      const response = await fetch(
        process.env.TRANSLATE_API_URL + "/standardize/apply/stream",
        {
          method: "POST",
          headers: {
            accept: "text/event-stream",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          "External Standardization Apply API error:",
          response.status,
          response.statusText
        );
        sendEvent({
          timestamp: new Date().toISOString(),
          type: "error",
          message: `External standardization API error: ${response.statusText}`,
          status: "failed",
        });
        return res.end();
      }

      if (!response.body) {
        console.error("No response body received from standardization API");
        sendEvent({
          timestamp: new Date().toISOString(),
          type: "error",
          message: "No response received from standardization service",
          status: "failed",
        });
        return res.end();
      }

      await handleSSEStream(response.body, items.length, sendEvent);

      sendEvent({
        timestamp: new Date().toISOString(),
        type: "completion",
        total_completed: items.length,
        message: "Standardization application stream completed!",
        status: "completed",
      });
    } catch (fetchError) {
      console.error(
        "Error connecting to standardization apply API:",
        fetchError
      );
      let [message, details] =
        fetchError.name === "AbortError"
          ? [
              "Standardization API request timed out",
              "The external standardization service did not respond in time",
            ]
          : [
              "Standardization service unavailable",
              "Unable to connect to the external standardization API",
            ];
      sendEvent({
        timestamp: new Date().toISOString(),
        type: "error",
        message,
        details,
        status: "failed",
      });
    }
    res.end();
  } catch (error) {
    console.error("Error in standardization application:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error during standardization application",
        details: error.message,
      });
    } else {
      try {
        res.write(
          `data: ${JSON.stringify({
            timestamp: new Date().toISOString(),
            type: "error",
            message: "Internal server error during standardization application",
            details: error.message,
            status: "failed",
          })}\n\n`
        );
      } catch (writeError) {
        console.error("Error writing error event:", writeError);
      }
      res.end();
    }
  }
});

module.exports = router;
