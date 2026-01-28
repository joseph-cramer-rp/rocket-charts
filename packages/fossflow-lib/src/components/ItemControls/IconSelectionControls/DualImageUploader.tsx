import React, { useCallback, useState } from 'react';
import { Box, Grid, Alert, Typography } from '@mui/material';
import { ImagePreviewWithActions } from './ImagePreviewWithActions';
import { processIconImage, isImageFile } from 'src/utils/imageProcessing';

export interface DualImageUploaderProps {
  urlIsometric: string | null;
  url2D: string | null;
  onIsometricChange: (url: string | null) => void;
  on2DChange: (url: string | null) => void;
  disabled?: boolean;
  scale?: number; // 1-300 scale percentage for processing
}

export const DualImageUploader: React.FC<DualImageUploaderProps> = ({
  urlIsometric,
  url2D,
  onIsometricChange,
  on2DChange,
  disabled = false,
  scale = 100
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = useCallback(async (
    file: File,
    onChange: (url: string | null) => void
  ) => {
    // Clear previous errors
    setError(null);

    // Validate file type
    if (!isImageFile(file)) {
      setError(`Invalid file type: ${file.name}. Please upload an image file.`);
      return;
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setError(`File too large: ${file.name}. Maximum size is 5MB.`);
      return;
    }

    setIsProcessing(true);

    try {
      const dataUrl = await processIconImage(file, { scale });
      onChange(dataUrl);
    } catch (err) {
      setError(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [scale]);

  const handleIsometricUpload = useCallback((file: File) => {
    handleImageUpload(file, onIsometricChange);
  }, [handleImageUpload, onIsometricChange]);

  const handleIsometricRemove = useCallback(() => {
    onIsometricChange(null);
  }, [onIsometricChange]);

  const handle2DUpload = useCallback((file: File) => {
    handleImageUpload(file, on2DChange);
  }, [handleImageUpload, on2DChange]);

  const handle2DRemove = useCallback(() => {
    on2DChange(null);
  }, [on2DChange]);

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      {!urlIsometric && !url2D && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload at least the isometric image. The 2D variant is optional and will be shown when in 2D view mode.
        </Alert>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Processing image...
        </Alert>
      )}

      {/* Side-by-side image uploaders */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <ImagePreviewWithActions
            url={urlIsometric}
            label="Isometric View"
            required={true}
            disabled={disabled || isProcessing}
            onUpload={handleIsometricUpload}
            onRemove={handleIsometricRemove}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Displayed in isometric (3D) view mode
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <ImagePreviewWithActions
            url={url2D}
            label="2D View"
            required={false}
            disabled={disabled || isProcessing}
            onUpload={handle2DUpload}
            onRemove={handle2DRemove}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Optional: Shown in 2D (flat) view mode
          </Typography>
        </Grid>
      </Grid>

      {/* Fallback Info */}
      {urlIsometric && !url2D && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No 2D variant provided. The isometric image will be used in both view modes.
        </Alert>
      )}
    </Box>
  );
};
