const PERSON_ID = process.env.PERSON_ID;
const express = require("express");
const {
  getTexts,
  getTextInstances,
  getSegmentRelated,
  getText,
  getSegmentsContent,
  getRelatedInstances,
} = require("../apis/openpecha_api");
const { prisma } = require("../services/db");

const router = express.Router();

/**
 * GET /openpecha/texts
 * @summary Get list of texts from OpenPecha
 * @tags Pecha - OpenPecha integration
 * @param {number} limit.query - Limit number of texts returned
 * @param {number} offset.query - Offset for pagination
 * @param {string} language.query - Filter by language
 * @param {string} title.query - Filter by title
 * @return {array<object>} 200 - List of texts
 * @return {object} 500 - Server error
 */
router.get("/texts", async (req, res) => {
  const { limit, offset, language, title } = req.query;

  try {
    const texts = await getTexts(limit, offset, language, title);
    res.json(texts);
  } catch (error) {
    console.error("Error fetching texts:", error);
    res.status(500).json({
      error: "Failed to fetch texts",
      details: error.message,
    });
  }
});

router.get("/texts/:id", async (req, res) => {
  const id = encodeURIComponent(req.params.id);
  const text = await getText(id);
  res.json(text);
});

/**
 * GET /openpecha/instances/{instanceId}/segment-related
 * @summary Get segment-related data for a specific instance and span
 * @tags Pecha - OpenPecha integration
 * @param {string} instanceId.path.required - Instance ID
 * @param {number} span_start.query.required - Start position of the span
 * @param {number} span_end.query.required - End position of the span
 * @param {boolean} transfer.query - Transfer parameter (default: false)
 * @return {object} 200 - Segment-related data
 * @return {object} 400 - Bad request - Instance ID, span_start, and span_end are required
 * @return {object} 500 - Server error
 */
router.get("/instances/:instanceId/segment-related", async (req, res) => {
  const { instanceId } = req.params;
  const { span_start, span_end, transfer } = req.query;

  if (!instanceId) {
    return res.status(400).json({
      error: "Instance ID is required",
    });
  }

  if (span_start === undefined || span_end === undefined) {
    return res.status(400).json({
      error: "span_start and span_end query parameters are required",
    });
  }

  try {
    const spanStart = Number.parseInt(span_start);
    const spanEnd = Number.parseInt(span_end);
    const transferFlag = transfer === "true" || transfer === true;

    if (Number.isNaN(spanStart) || Number.isNaN(spanEnd)) {
      return res.status(400).json({
        error: "span_start and span_end must be valid numbers",
      });
    }

    const data = await getSegmentRelated(
      instanceId,
      spanStart,
      spanEnd,
      transferFlag,
    );
    res.json(data);
  } catch (error) {
    console.error("Error fetching segment-related data:", error);
    res.status(500).json({
      error: "Failed to fetch segment-related data",
      instanceId,
      details: error.message,
    });
  }
});

/**
 * GET /openpecha/instances/{instanceId}/segment-content
 * @summary Get segment content for specific segment IDs
 * @tags Pecha - OpenPecha integration
 * @param {string} instanceId.path.required - Instance ID
 * @param {string} segment_id.query.required - Comma-separated segment IDs
 * @return {object} 200 - Segment content data
 * @return {object} 400 - Bad request - Instance ID and segment_id are required
 * @return {object} 500 - Server error
 */
router.get("/instances/:instanceId/segment-content", async (req, res) => {
  const { instanceId } = req.params;
  const { segment_id } = req.query;

  if (!instanceId) {
    return res.status(400).json({
      error: "Instance ID is required",
    });
  }

  if (!segment_id) {
    return res.status(400).json({
      error: "segment_id query parameter is required",
    });
  }

  try {
    const data = await getSegmentsContent(instanceId, segment_id);
    res.json(data);
  } catch (error) {
    console.error("Error fetching segment content:", error);
    res.status(500).json({
      error: "Failed to fetch segment content",
      instanceId,
      details: error.message,
    });
  }
});

router.get("/texts/:text_id/linked-resources", async (req, res) => {
  const { text_id } = req.params;

  if (!text_id) {
    return res.status(400).json({ error: "text_id is required" });
  }

  try {
    const instances = await getTextInstances(text_id, "critical");

    if (!instances || instances.length === 0) {
      return res.status(404).json({
        error: "No critical editions found for this text",
        text_id,
      });
    }

    const criticalInstance = instances[0];
    const relatedInstances = await getRelatedInstances(criticalInstance.id);

    const enriched = await Promise.all(
      relatedInstances.map(async (instance) => {
        try {
          const textData = await getText(instance.text_id);
          const relationship = textData.commentary_of
            ? "commentary"
            : textData.translation_of
              ? "translation"
              : "related";

          return {
            instance_id: instance.id,
            metadata: {
              instance_type: instance.type,
              source: instance.source,
              text_id: instance.text_id,
              title: textData.title ?? {},
              alt_titles: textData.alt_titles ?? [],
              language: textData.language ?? "",
              contributions: textData.contributions ?? [],
            },
            annotation: null,
            relationship,
          };
        } catch {
          return {
            instance_id: instance.id,
            metadata: {
              instance_type: instance.type,
              source: instance.source,
              text_id: instance.text_id,
              title: {},
              alt_titles: [],
              language: "",
              contributions: [],
            },
            annotation: null,
            relationship: "related",
          };
        }
      }),
    );

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching linked resources:", error);
    res.status(500).json({
      error: "Failed to fetch linked resources",
      text_id,
      details: error.message,
    });
  }
});

/**
 * POST /openpecha/linked_resources
 * @summary Forward request to n8n webhook
 * @tags Pecha - OpenPecha integration
 * @param {object} request.body.required - Request body with text_id, span_start, and span_end
 * @param {string} request.body.text_id.required - Text ID
 * @param {number} request.body.span_start.required - Start position of the span
 * @param {number} request.body.span_end.required - End position of the span
 * @return {object} 200 - Success response from webhook
 * @return {object} 400 - Bad request - Missing required fields
 * @return {object} 500 - Server error
 */
router.post("/linked_resources", async (req, res) => {
  const { text_id, span_start, span_end } = req.body;

  if (!text_id) {
    return res.status(400).json({
      error: "text_id is required",
    });
  }

  if (span_start === undefined || span_end === undefined) {
    return res.status(400).json({
      error: "span_start and span_end are required",
    });
  }

  const spanStart = Number.parseInt(span_start);
  const spanEnd = Number.parseInt(span_end);

  if (Number.isNaN(spanStart) || Number.isNaN(spanEnd)) {
    return res.status(400).json({
      error: "span_start and span_end must be valid numbers",
    });
  }

  try {
    const webhookUrl = process.env.WORKFLOW_ENDPOINT;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        text_id,
        span_start: spanStart,
        span_end: spanEnd,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Webhook request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error calling webhook:", error);
    res.status(500).json({
      error: "Failed to call webhook",
      details: error.message,
    });
  }
});

module.exports = router;
