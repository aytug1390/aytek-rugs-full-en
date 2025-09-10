import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

function extractDriveId(input) {
  if (!input) return null;
  const m1 = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = input.match(/\/d\/([A-Za-z0-9_-]+)(?:[/?#]|$)/);
  if (m2) return m2[1];
  return null;
}

function resolveDriveUrlWithFallback(rawUrl, size=1600) {
  const id = extractDriveId(rawUrl);
  if (!id) return { primary: null, fallback: null };
  return {
    primary: `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`,
    fallback: `https://drive.google.com/uc?export=view&id=${id}`,
  };
}

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sample = [
  'https://drive.google.com/uc?export=view&id=1DmkPUDiv0a-2aoOrhkTnT2V__EHr8CIg',
  'https://drive.google.com/uc?export=view&id=1g4JsuB_H_VXREc8Yv6A-efLVc80_VQgK'
];

for (const s of sample) {
  const { primary, fallback } = resolveDriveUrlWithFallback(s, 400);
  console.log('srcs ->', { primary, fallback });
}
