const BACKUP_IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp|svg\+xml));base64,([A-Za-z0-9+/]*={0,2})$/;

/** Decode an image embedded by FileReader without making a network request. */
export function backupImageFromDataUrl(value: string): Blob {
  const match = BACKUP_IMAGE_DATA_URL.exec(value);
  if (!match || match[2].length % 4 === 1) throw new Error('Invalid backup image');

  let decoded: string;
  try {
    decoded = atob(match[2]);
  } catch {
    throw new Error('Invalid backup image');
  }

  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return new Blob([bytes], { type: match[1] });
}
