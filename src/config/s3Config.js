const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
const sessionToken = (process.env.AWS_SESSION_TOKEN || '').trim();

const s3Client = new S3Client({
  region,
  ...(accessKeyId && secretAccessKey
    ? {
        credentials: sessionToken
          ? { accessKeyId, secretAccessKey, sessionToken }
          : { accessKeyId, secretAccessKey },
      }
    : {}),
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'gipza-videos';


const getPublicUrl = (key) => {
  const baseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/${key}`;
  }
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
};

/**
 * Upload a file to S3 (generic: use folder 'images' or 'videos')
 */
const uploadFileToS3 = async (folder, fileBuffer, fileName, contentType) => {
  const key = `${folder}/${Date.now()}-${fileName}`;
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  };
  const command = new PutObjectCommand(uploadParams);
  const result = await s3Client.send(command);
  const url = getPublicUrl(key);
  return { success: true, url, key, etag: result.ETag };
};

const uploadImageToS3 = async (fileBuffer, fileName, contentType) => {
  try {
    return await uploadFileToS3('images', fileBuffer, fileName, contentType);
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
};

const uploadVideoToS3 = async (fileBuffer, fileName, contentType) => {
  try {
    return await uploadFileToS3('videos', fileBuffer, fileName, contentType);
  } catch (error) {
    console.error('Error uploading video to S3:', error);
    throw error;
  }
};

const deleteFromS3 = async (key) => {
  try {
    const deleteParams = { Bucket: BUCKET_NAME, Key: key };
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
};

const generatePresignedUrl = async (folder, fileName, contentType, expiresIn = 3600) => {
  try {
    const key = `${folder}/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return {
      uploadUrl: signedUrl,
      key,
      publicUrl: getPublicUrl(key),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

module.exports = {
  s3Client,
  BUCKET_NAME,
  getPublicUrl,
  uploadFileToS3,
  uploadImageToS3,
  uploadVideoToS3,
  deleteFromS3,
  generatePresignedUrl,
}; 