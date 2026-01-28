import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Alert
} from '@mui/material';
import { ImagePreviewWithActions } from './ImagePreviewWithActions';
import { Icon } from 'src/types';
import { processIconImage, isImageFile } from 'src/utils/imageProcessing';

export interface CustomizeIconDialogProps {
  open: boolean;
  icon: Icon | null;
  currentUrl2D: string | null; // From override if exists
  onClose: () => void;
  onSave: (iconId: string, url2D: string | null) => void;
}

export const CustomizeIconDialog: React.FC<CustomizeIconDialogProps> = ({
  open,
  icon,
  currentUrl2D,
  onClose,
  onSave
}) => {
  const [url2D, setUrl2D] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize form when icon changes
  useEffect(() => {
    if (icon && open) {
      setUrl2D(currentUrl2D);
      setError(null);
    }
  }, [icon, currentUrl2D, open]);

  // Reset form when dialog closes
  const handleClose = useCallback(() => {
    setUrl2D(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleImageUpload = useCallback(async (file: File) => {
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
      const dataUrl = await processIconImage(file, {
        scale: (icon?.scale || 1) * 100 // Use icon's existing scale
      });
      setUrl2D(dataUrl);
    } catch (err) {
      setError(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [icon]);

  const handleRemove = useCallback(() => {
    setUrl2D(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!icon) return;
    onSave(icon.id, url2D);
    handleClose();
  }, [icon, url2D, onSave, handleClose]);

  const handleRemoveCustomization = useCallback(() => {
    if (!icon) return;
    onSave(icon.id, null); // Remove override
    handleClose();
  }, [icon, onSave, handleClose]);

  if (!icon) return null;

  const hasCustomization = !!currentUrl2D;
  const isModified = url2D !== currentUrl2D;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Customize Icon: {icon.name}
        <Typography variant="caption" display="block" color="text.secondary">
          from {icon.collection} collection
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Info Alert */}
          <Alert severity="info">
            This is a pack icon. You can add a custom 2D variant that will be shown in 2D view mode. The original icon remains unchanged.
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <Alert severity="info">
              Processing image...
            </Alert>
          )}

          {/* Original Icon (Read-only) */}
          <Box>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Original (Isometric View)
            </Typography>
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1.5,
                backgroundColor: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120
              }}
            >
              <Box
                component="img"
                src={icon.url}
                alt={icon.name}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              This is the pack icon and cannot be modified
            </Typography>
          </Box>

          {/* 2D Variant (Editable) */}
          <Box>
            <ImagePreviewWithActions
              url={url2D}
              label="Custom 2D Variant"
              required={false}
              disabled={isProcessing}
              onUpload={handleImageUpload}
              onRemove={handleRemove}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Optional: This will be shown in 2D (flat) view mode
            </Typography>
          </Box>

          {/* Fallback Info */}
          {!url2D && (
            <Alert severity="info">
              Without a 2D variant, the original icon will be used in both view modes.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Box>
          {hasCustomization && (
            <Button
              onClick={handleRemoveCustomization}
              color="error"
              variant="outlined"
            >
              Remove Customization
            </Button>
          )}
        </Box>
        <Box>
          <Button onClick={handleClose} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!isModified}
          >
            Save Custom Variant
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
