import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.AWS_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export const s3Bucket = process.env.AWS_S3_BUCKET_NAME!;

export function publicS3Url(key: string) {
  return `/api/uploads?key=${encodeURIComponent(key)}`;
}
