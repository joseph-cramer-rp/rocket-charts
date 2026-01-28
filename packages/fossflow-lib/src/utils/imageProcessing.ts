/**
 * Image processing utilities for icon imports
 * Handles scaling, centering, and format conversion
 */

export interface ProcessImageOptions {
  targetSize?: number;
  scale?: number; // 1-300 (percentage as decimal would be 0.01-3.0)
  quality?: number;
}

const DEFAULT_TARGET_SIZE = 128;
const DEFAULT_QUALITY = 1.0;

/**
 * Process an image file for use as an icon
 * - SVG files are used as-is
 * - Raster images are scaled to fit in a square canvas
 * - Image is centered with transparent background
 * - Returns data URL
 */
export const processIconImage = async (
  file: File,
  options: ProcessImageOptions = {}
): Promise<string> => {
  const {
    targetSize = DEFAULT_TARGET_SIZE,
    scale = 100,
    quality = DEFAULT_QUALITY
  } = options;

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const originalDataUrl = e.target?.result as string;

      // For SVG files, use as-is since they scale naturally
      if (file.type === 'image/svg+xml') {
        resolve(originalDataUrl);
        return;
      }

      // For raster images, scale them to fit in a square bounding box
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas for scaling
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(originalDataUrl); // Fallback to original
            return;
          }

          // Calculate scaling to fit within square while maintaining aspect ratio
          const baseScale = Math.min(targetSize / img.width, targetSize / img.height);
          // Apply user's custom scaling
          const finalScale = baseScale * (scale / 100);
          const scaledWidth = img.width * finalScale;
          const scaledHeight = img.height * finalScale;

          // Set canvas to square size
          canvas.width = targetSize;
          canvas.height = targetSize;

          // Clear canvas with transparent background
          ctx.clearRect(0, 0, targetSize, targetSize);

          // Calculate position to center the image in the square
          const x = (targetSize - scaledWidth) / 2;
          const y = (targetSize - scaledHeight) / 2;

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw scaled and centered image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // Convert to data URL (using PNG for transparency)
          resolve(canvas.toDataURL('image/png', quality));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = originalDataUrl;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Validate that a file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const match = filename.match(/\.([^/.]+)$/);
  return match ? match[1] : '';
};

/**
 * Remove file extension from filename
 */
export const removeFileExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '');
};

/**
 * Generate a unique name by appending a counter if needed
 */
export const generateUniqueName = (
  baseName: string,
  existingNames: Set<string>
): string => {
  let finalName = baseName;
  let counter = 1;

  while (existingNames.has(finalName.toLowerCase())) {
    finalName = `${baseName}_${counter}`;
    counter++;
  }

  return finalName;
};
