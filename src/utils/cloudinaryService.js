/**
 * Cloudinary Secure Upload Utility
 * Handles image uploads for payment receipts, profile pictures, and verification documents
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'tzrl4vgy';
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '932335977771118';
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'fha2UrincBtf-mwvrLa7USQBQmY';

/**
 * Compute SHA-1 hex string in browser or Node environment
 */
async function computeSha1(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Resize and compress image to base64 Data URL (fallback / optimization)
 */
export async function fileToCompressedDataUrl(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(e.target.result);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image (File or Base64 string) to Cloudinary
 * Returns public secure URL string
 */
export async function uploadImageToCloudinary(fileOrDataUrl, folder = 'trust_uploads') {
  try {
    let payload = fileOrDataUrl;
    if (fileOrDataUrl instanceof File) {
      // Compress if it is a large photo
      if (fileOrDataUrl.size > 800 * 1024) {
        try {
          payload = await fileToCompressedDataUrl(fileOrDataUrl, 1280, 0.85);
        } catch {
          payload = fileOrDataUrl;
        }
      }
    }

    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await computeSha1(stringToSign);

    const formData = new FormData();
    formData.append('file', payload);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Cloudinary upload warning:', errData);
      // Fallback: If upload failed but we have dataURL, return the compressed dataURL
      if (typeof payload === 'string' && payload.startsWith('data:image')) {
        return payload;
      }
      if (fileOrDataUrl instanceof File) {
        return await fileToCompressedDataUrl(fileOrDataUrl, 800, 0.7);
      }
      throw new Error(errData?.error?.message || 'Image upload failed');
    }

    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    // Graceful fallback to data URL if local conversion is available
    if (fileOrDataUrl instanceof File) {
      try {
        return await fileToCompressedDataUrl(fileOrDataUrl, 800, 0.7);
      } catch (fallbackErr) {
        throw err;
      }
    }
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:image')) {
      return fileOrDataUrl;
    }
    throw err;
  }
}
