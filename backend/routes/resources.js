const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const fs = require("fs");
const path = require("path");
const { prisma } = require("../services/db");
const {
  getSegmentRelated,
  getSegmentsContent,
} = require("../apis/openpecha_api");

/**
 * @typedef {object} SegmentSearchRequest
 * @property {string} segment.required - The text segment to search for in root texts
 */

/**
 * @typedef {object} MatchedEntry
 * @property {string} root_display_text - Root display text from the entry
 * @property {string} commentary_1 - First commentary content
 * @property {string} commentary_2 - Second commentary content
 * @property {string} commentary_3 - Third commentary content
 * @property {string} sanskrit_text - Sanskrit text content
 */

/**
 * @typedef {object} ResourceMatch
 * @property {string} fileName - Name of the matched file (without .json extension)
 * @property {object} metadata - Metadata for the matched file from metadata.json
 * @property {MatchedEntry} matchedEntry - The matched entry content
 */

/**
 * @typedef {object} SegmentSearchResponse
 * @property {boolean} success - Indicates if search was successful
 * @property {string} segment - The segment that was searched for
 * @property {array<ResourceMatch>} matches - List of matching files and entries
 * @property {number} totalMatches - Total number of matches found
 */

/**
 * @typedef {object} ErrorResponse
 * @property {string} error - Error message
 */

/**
 * POST /resources
 * @summary Search for a segment in linked resources
 * @tags Resources
 * @security BearerAuth
 * @param {SegmentSearchRequest} request.body.required - Segment search request
 * @return {SegmentSearchResponse} 200 - Success response
 * @return {ErrorResponse} 400 - Missing segment in body
 * @return {ErrorResponse} 500 - Internal server error
 */
router.post("/", async (req, res) => {
  try {
    const { segment } = req.body;

    if (!segment) {
      return res.status(400).json({ error: "Segment is required" });
    }

    // Path to linked resources directory
    const linkedResourcesPath = path.join(__dirname, "../linked_resources");

    // Load metadata.json
    const metadataPath = path.join(linkedResourcesPath, "metadata.json");
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

    // Get all JSON files except metadata.json
    const files = fs
      .readdirSync(linkedResourcesPath)
      .filter((file) => file.endsWith(".json") && file !== "metadata.json");

    const matchingFiles = [];

    // Search through each file
    for (const fileName of files) {
      const filePath = path.join(linkedResourcesPath, fileName);
      const fileContent = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Search for segment in root_display_text of each entry
      for (const entry of fileContent) {
        if (
          entry.root_display_text &&
          entry.root_display_text.includes(segment)
        ) {
          // Extract base name without extension for metadata lookup
          const baseName = path.basename(fileName, ".json");

          // Get metadata for this file
          const fileMetadata = metadata[baseName];

          if (fileMetadata) {
            matchingFiles.push({
              fileName: baseName,
              metadata: fileMetadata,
              matchedEntry: {
                root_display_text: entry.root_display_text,
                commentary_1: entry.commentary_1 || "",
                commentary_2: entry.commentary_2 || "",
                commentary_3: entry.commentary_3 || "",
                sanskrit_text: entry.sanskrit_text || "",
              },
            });
          }
          break; // Only need first match per file
        }
      }
    }

    res.json({
      success: true,
      segment: segment,
      matches: matchingFiles,
      totalMatches: matchingFiles.length,
    });
  } catch (error) {
    console.error("Error searching segment:", error);
    res.status(500).json({ error: error.message });
  }
});

async function getMetadataByDocumentId(documentId) {
  try {
    const metadata = await prisma.docMetadata.findUnique({
      where: { docId: documentId },
      select: { instanceId: true },
    });
    return metadata;
  } catch (error) {
    console.error("Error getting metadata by document id:", error);
    throw new Error("Metadata not found");
  }
}

router.post("/related", async (req, res) => {
  try {
    const { documentId, span_start, span_end } = req.body;
    const metadata = await getMetadataByDocumentId(documentId);

    const instanceId = metadata?.instanceId;
    const relatedInstances = await getSegmentRelated(
      instanceId,
      span_start,
      span_end
    );

    // Filter commentaries and extract required fields
    const commentaries = relatedInstances.filter(
      (item) => item.relation === "commentary"
    );

    // Fetch content for each segment in each commentary
    const commentariesWithContent = await Promise.all(
      commentaries.map(async (item) => {
        const commentaryInstanceId = item.instance_metadata.id;
        const segmentIds = item.segments.map((seg) => seg.segment_id);

        // Fetch segment content
        const segmentContents = await getSegmentsContent(
          commentaryInstanceId,
          segmentIds
        );

        // Create a map of segment_id to content for quick lookup
        const contentMap = new Map();
        segmentContents.forEach((contentItem) => {
          contentMap.set(contentItem.segment_id, contentItem);
        });

        // Map segments with their content appended
        const segmentsWithContent = item.segments.map((segment) => {
          const contentData = contentMap.get(segment.segment_id);
          return {
            ...segment,
            content: contentData?.content || "",
          };
        });

        return {
          segments: segmentsWithContent,
          text_title: item.text_metadata.title,
          instance_source: item.instance_metadata.source,
        };
      })
    );

    res.json(commentariesWithContent);
  } catch (error) {
    console.error("Error searching related instances:", error);
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
