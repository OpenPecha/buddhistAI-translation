const API_ENDPOINT = process.env.OPENPECHA_ENDPOINT;
const NEW_API_ENDPOINT = process.env.PECHA_API_URL;
async function getTexts(limit, offset, language, title) {
  const url = new URL(`${NEW_API_ENDPOINT}/texts`);
  if (limit) url.searchParams.append("limit", limit);
  if (offset) url.searchParams.append("offset", offset);
  if (language) url.searchParams.append("language", language);
  if (title) url.searchParams.append("title", title);
  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch texts from openpecha: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data;
}

async function getText(text_id) {
  const id = encodeURIComponent(text_id);
  const response = await fetch(`${NEW_API_ENDPOINT}/texts/${id}`, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

async function getTextInstances(text_id, instance_type) {
  const url = new URL(`${NEW_API_ENDPOINT}/texts/${text_id}/editions`);
  if (instance_type) {
    url.searchParams.append("edition_type", instance_type);
  }
  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch text instances from openpecha: ${response.statusText}`,
    );
  }
  const data = await response.json();
  return data;
}

async function getSegmentation(instanceId) {
  const response = await fetch(
    `${NEW_API_ENDPOINT}/editions/${instanceId}/segmentations`,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch segmentation from openpecha: ${response.statusText}`,
    );
  }
  const data = await response.json();
  return data;
}
async function getEditionContent(editionId) {
  const response = await fetch(
    `${NEW_API_ENDPOINT}/editions/${editionId}/content`,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch edition content from openpecha: ${response.statusText}`,
    );
  }

  const data = await response.text();
  return data;
}

async function getSegmentRelated(
  instanceId,
  spanStart,
  spanEnd,
  transform = false,
) {
  const url = new URL(
    `${API_ENDPOINT}/instances/${instanceId}/segment-related`,
  );
  url.searchParams.append("span_start", spanStart);
  url.searchParams.append("span_end", spanEnd);
  url.searchParams.append("transform", transform);
  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch segment related from openpecha: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data;
}

async function getSegmentsContent(instanceId, seg_ids) {
  const url = `${API_ENDPOINT}/instances/${instanceId}/segment-content`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      segment_ids: seg_ids,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch segment content from openpecha: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data;
}

async function getRelatedInstances(instanceId) {
  const response = await fetch(
    `${NEW_API_ENDPOINT}/editions/${instanceId}/related`,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch related instances from openpecha: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data;
}

module.exports = {
  getTexts,
  getText,
  getTextInstances,
  getEditionContent,
  getSegmentation,
  getSegmentRelated,
  getSegmentsContent,
  getRelatedInstances,
};
