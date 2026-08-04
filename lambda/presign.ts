// Mints a short-lived presigned S3 PUT URL so the browser can upload one claim
// file directly to the private bucket — without any AWS credentials.
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME!;
const EXPIRES_SECONDS = 300; // link is valid for 5 minutes

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  // Sanitize the requested filename; default to claim.txt.
  const raw = event.queryStringParameters?.filename ?? 'claim.txt';
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const key = `claims/${Date.now()}-${safe}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: 'text/plain',
    }),
    { expiresIn: EXPIRES_SECONDS },
  );

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ uploadUrl, key }),
  };
}
