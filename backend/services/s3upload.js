const AWS = require("aws-sdk");
// Configure AWS SDK with credentials from environment variables
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});
const bucket = process.env.AWS_BUCKET;

/**
 * Upload a file to S3
 * @param {Buffer|string} fileContent - File content as Buffer or string
 * @param {string} fileName - Name of the file (will be used as key in S3)
 * @param {string} bucketName - S3 bucket name (optional, uses AWS_S3_BUCKET from env if not provided)
 * @param {string} contentType - MIME type of the file (optional)
 * @param {object} metadata - Additional metadata to attach to the file (optional)
 * @returns {Promise<object>} - Promise that resolves to S3 upload result with location URL
 */
async function uploadFile(
  fileContent,
  fileName,
  bucketName = null,
  contentType = null,
  metadata = {}
) {
  try {
    if (!bucket) {
      throw new Error(
        "S3 bucket name is required. Provide it as parameter or set AWS_S3_BUCKET in .env"
      );
    }

    const params = {
      Bucket: bucket,
      Key: fileName,
      Body: fileContent,
      ...(contentType && { ContentType: contentType }),
      ...(Object.keys(metadata).length > 0 && { Metadata: metadata }),
    };

    const result = await s3.upload(params).promise();

    return {
      success: true,
      location: result.Location,
      bucket: result.Bucket,
      key: result.Key,
      etag: result.ETag,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
}

/**
 * Upload a file with public read access
 * @param {Buffer|string} fileContent - File content as Buffer or string
 * @param {string} fileName - Name of the file (will be used as key in S3)
 * @param {string} bucketName - S3 bucket name (optional, uses AWS_S3_BUCKET from env if not provided)
 * @param {string} contentType - MIME type of the file (optional)
 * @param {object} metadata - Additional metadata to attach to the file (optional)
 * @returns {Promise<object>} - Promise that resolves to S3 upload result with location URL
 */
async function uploadPublicFile(
  fileContent,
  fileName,
  bucketName = null,
  contentType = null,
  metadata = {}
) {
  try {
    if (!bucket) {
      throw new Error(
        "S3 bucket name is required. Provide it as parameter or set AWS_S3_BUCKET in .env"
      );
    }

    const params = {
      Bucket: bucket,
      Key: fileName,
      Body: fileContent,
      ACL: "public-read",
      ...(contentType && { ContentType: contentType }),
      ...(Object.keys(metadata).length > 0 && { Metadata: metadata }),
    };

    const result = await s3.upload(params).promise();

    const region = s3.config.region || "us-east-1";
    const publicUrl = `https://${result.Bucket}.s3.${region}.amazonaws.com/${result.Key}`;

    return {
      success: true,
      location: result.Location,
      bucket: result.Bucket,
      key: result.Key,
      etag: result.ETag,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading public file to S3:", error);
    throw error;
  }
}

/**
 * Delete a file from S3
 * @param {string} fileName - Name/key of the file in S3
 * @param {string} bucketName - S3 bucket name (optional, uses AWS_S3_BUCKET from env if not provided)
 * @returns {Promise<object>} - Promise that resolves to deletion result
 */
async function deleteFile(fileName, bucketName = null) {
  try {
    if (!bucket) {
      throw new Error(
        "S3 bucket name is required. Provide it as parameter or set AWS_S3_BUCKET in .env"
      );
    }

    const params = {
      Bucket: bucket,
      Key: fileName,
    };

    await s3.deleteObject(params).promise();

    return {
      success: true,
      message: `File ${fileName} deleted successfully`,
    };
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error;
  }
}

/**
 * Get a signed URL for temporary access to a file
 * @param {string} fileName - Name/key of the file in S3
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @param {string} bucketName - S3 bucket name (optional, uses AWS_S3_BUCKET from env if not provided)
 * @returns {Promise<string>} - Promise that resolves to signed URL
 */
async function getSignedUrl(fileName, expiresIn = 3600, bucketName = null) {
  try {
    if (!bucket) {
      throw new Error(
        "S3 bucket name is required. Provide it as parameter or set AWS_S3_BUCKET in .env"
      );
    }

    const params = {
      Bucket: bucket,
      Key: fileName,
      Expires: expiresIn,
    };

    const url = await s3.getSignedUrlPromise("getObject", params);
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw error;
  }
}

/**
 * Check if a file exists in S3
 * @param {string} fileName - Name/key of the file in S3
 * @param {string} bucketName - S3 bucket name (optional, uses AWS_S3_BUCKET from env if not provided)
 * @returns {Promise<boolean>} - Promise that resolves to true if file exists, false otherwise
 */
async function fileExists(fileName, bucketName = null) {
  try {
    if (!bucket) {
      throw new Error(
        "S3 bucket name is required. Provide it as parameter or set AWS_S3_BUCKET in .env"
      );
    }

    const params = {
      Bucket: bucket,
      Key: fileName,
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === "NotFound") {
      return false;
    }
    throw error;
  }
}

/**
 * Make an existing file public by updating its ACL
 * @param {string} fileName - Name/key of the file in S3
 * @param {string} bucketName - S3 bucket name (optional, uses AWS_BUCKET from env if not provided)
 * @returns {Promise<object>} - Promise that resolves to success result
 */
async function makeFilePublic(fileName, bucketName = null) {
  try {
    const targetBucket = bucketName || bucket;

    if (!targetBucket) {
      throw new Error(
        "S3 bucket name is required. Provide it as parameter or set AWS_BUCKET in .env"
      );
    }

    const params = {
      Bucket: targetBucket,
      Key: fileName,
      ACL: "public-read",
    };

    await s3.putObjectAcl(params).promise();

    // Generate the public URL
    const region = s3.config.region || "us-east-1";
    const publicUrl = `https://${targetBucket}.s3.${region}.amazonaws.com/${fileName}`;

    return {
      success: true,
      message: `File ${fileName} is now publicly accessible`,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error making file public:", error);
    throw error;
  }
}

/**
 * Get the public URL for a file (assumes it's public or will be made public)
 * @param {string} fileName - Name/key of the file in S3
 * @param {string} bucketName - S3 bucket name (optional, uses AWS_BUCKET from env if not provided)
 * @returns {string} - Public URL for the file
 */
function getPublicUrl(fileName, bucketName = null) {
  const targetBucket = bucketName || bucket;
  const region = s3.config.region || "us-east-1";
  return `https://${targetBucket}.s3.${region}.amazonaws.com/${fileName}`;
}

module.exports = {
  uploadFile,
  uploadPublicFile,
  deleteFile,
  getSignedUrl,
  fileExists,
  makeFilePublic,
  getPublicUrl,
};
