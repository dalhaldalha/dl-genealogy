/**
 * Reads an image file from the user's device and compresses it into a high-performance
 * Base64 JPEG data URL for local storage and fast canvas rendering.
 */
export function processImageFile(
  file: File,
  maxDimension = 500,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file (PNG, JPG, WebP, etc.).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image from device.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      // Attempt client-side canvas downscaling for performance
      const img = new Image();
      img.onerror = () => {
        // If image object fails to decode, resolve raw data URL as fallback
        resolve(rawDataUrl);
      };
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Resize if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
