import { useState } from 'react';
import { getUploadUrl, uploadClaim, IS_MOCK } from './api';

type Status =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'done'; key: string }
  | { kind: 'error'; message: string };

const SAMPLE = `Claimant Name: Michael Torres
Policy Number: AUTO-100482
Date of Incident: 2026-05-14
Claim Amount: $4,200.00
Incident Type: Collision

Description: Another vehicle ran a red light and struck the front-right
quarter panel. No injuries. Police report filed (TR-88213).`;

export function App() {
  const [claimText, setClaimText] = useState(SAMPLE);
  const [filename, setFilename] = useState('claim.txt');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    file.text().then(setClaimText);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!claimText.trim()) {
      setStatus({ kind: 'error', message: 'Claim details are empty.' });
      return;
    }
    setStatus({ kind: 'uploading' });
    try {
      const safeName = filename.trim() || 'claim.txt';
      const { uploadUrl, key } = await getUploadUrl(safeName);
      await uploadClaim(uploadUrl, claimText);
      setStatus({ kind: 'done', key });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  }

  return (
    <main className="wrap">
      <h1>Submit an insurance claim</h1>
      <p className="sub">
        Uploads the claim as a text file to Amazon S3 under the <code>claims/</code> prefix.
      </p>

      {IS_MOCK && (
        <div className="banner">
          Mock mode — no backend configured. Set <code>VITE_API_BASE_URL</code> in{' '}
          <code>.env</code> to upload to your real bucket.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <label>
          Claim file name
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="claim.txt"
          />
        </label>

        <label>
          Claim details
          <textarea
            rows={12}
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
          />
        </label>

        <div className="row">
          <label className="file">
            Load a .txt file
            <input type="file" accept=".txt,text/plain" onChange={onFile} />
          </label>

          <button type="submit" disabled={status.kind === 'uploading'}>
            {status.kind === 'uploading' ? 'Uploading…' : 'Upload claim'}
          </button>
        </div>
      </form>

      {status.kind === 'done' && (
        <div className="result ok">
          ✓ Uploaded as <code>{status.key}</code>
          {IS_MOCK ? ' (simulated)' : ''}
        </div>
      )}
      {status.kind === 'error' && <div className="result err">✗ {status.message}</div>}
    </main>
  );
}
