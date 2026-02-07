import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "autumnnus-assets";

export async function uploadFile(
  filename: string,
  buffer: Buffer,
  contentType: string,
) {
  const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
  if (!bucketExists) {
    await minioClient.makeBucket(BUCKET_NAME, "");
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            AWS: ["*"],
          },
          Action: [
            "s3:GetBucketLocation",
            "s3:ListBucket",
            "s3:ListBucketMultipartUploads",
          ],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}`],
        },
        {
          Effect: "Allow",
          Principal: {
            AWS: ["*"],
          },
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:AbortMultipartUpload",
          ],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  }

  await minioClient.putObject(BUCKET_NAME, filename, buffer, undefined, {
    "Content-Type": contentType,
  });

  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  return `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${filename}`;
}

export async function deleteFolder(prefix: string) {
  const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
  if (!bucketExists) return;

  const objectsList: string[] = [];
  const objectsStream = minioClient.listObjectsV2(BUCKET_NAME, prefix, true);

  for await (const obj of objectsStream) {
    if (obj.name) {
      objectsList.push(obj.name);
    }
  }

  if (objectsList.length > 0) {
    await minioClient.removeObjects(BUCKET_NAME, objectsList);
  }
}

export async function getFile(filename: string): Promise<Buffer> {
  let objectName = filename;
  if (filename.startsWith("http")) {
    const urlParts = filename.split(`/${BUCKET_NAME}/`);
    if (urlParts.length > 1) {
      objectName = urlParts[1];
    } else {
      console.warn("External URL or unparseable MinIO URL:", filename);
      try {
        const response = await fetch(filename);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (e) {
        console.error("Failed to fetch external URL:", e);
        throw new Error(`Failed to fetch file: ${filename}`);
      }
    }
  }

  try {
    const stream = await minioClient.getObject(BUCKET_NAME, objectName);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`Failed to get object ${objectName} from MinIO:`, error);
    throw error;
  }
}

export function getBucketName() {
  return BUCKET_NAME;
}

export { minioClient };
