// Talks to the claim-upload backend. When VITE_API_BASE_URL is empty it runs in
// MOCK mode, so you can build and click through the UI with no backend.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
export const IS_MOCK = API_BASE === '';

export interface PresignResponse {
  uploadUrl: string; // presigned S3 PUT URL
  key: string;       // object key, e.g. claims/1699-claim.txt
}

/** Ask the backend for a presigned URL to upload `filename`. */
export async function getUploadUrl(filename: string): Promise<PresignResponse> {
  if (IS_MOCK) {
    const key = `claims/${Date.now()}-${filename}`;
    return { uploadUrl: `mock://upload/${key}`, key };
  }
  const res = await fetch(
    `${API_BASE}/upload-url?filename=${encodeURIComponent(filename)}`,
  );
  if (!res.ok) throw new Error(`Failed to get upload URL (${res.status})`);
  return (await res.json()) as PresignResponse;
}

/** PUT the claim text to S3 using the presigned URL. */
export async function uploadClaim(uploadUrl: string, content: string): Promise<void> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 600)); // simulate latency
    return;
  }
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: content,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}
