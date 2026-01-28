import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Slider,
  Box,
  Stack,
  Alert
} from '@mui/material';
import { DualImageUploader } from './DualImageUploader';
import { Icon } from 'src/types';
import { generateUniqueName } from 'src/utils/imageProcessing';

export interface IconEditDialogProps {
  open: boolean;
  icon: Icon | null;
  onClose: () => void;
  onSave: (iconId: string, updates: Partial<Icon>) => void;
  existingIconNames: string[];
}

export const IconEditDialog: React.FC<IconEditDialogProps> = ({
  open,
  icon,
  onClose,
  onSave,
  existingIconNames
}) => {
  const [iconName, setIconName] = useState('');
  const [urlIsometric, setUrlIsometric] = useState<string | null>(null);
  const [url2D, setUrl2D] = useState<string | null>(null);
  const [scale, setScale] = useState(100);
  const [isIsometric, setIsIsometric] = useState(true);

  // Initialize form when icon changes
  useEffect(() => {
    if (icon && open) {
      setIconName(icon.name);
      setUrlIsometric(icon.url);
      setUrl2D(icon.url2D || null);
      setScale((icon.scale || 1) * 100); // Convert decimal to percentage
      setIsIsometric(icon.isIsometric ?? true);
    }
  }, [icon, open]);

  // Reset form when dialog closes
  const handleClose = useCallback(() => {
    setIconName('');
    setUrlIsometric(null);
    setUrl2D(null);
    setScale(100);
    setIsIsometric(true);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    if (!icon || !urlIsometric) return;

    // Check for name conflicts (excluding current icon)
    const otherIconNames = existingIconNames.filter(name =>
      name.toLowerCase() !== icon.name.toLowerCase()
    );
    const existingNamesSet = new Set(otherIconNames.map(n => n.toLowerCase()));
    const baseName = iconName.trim() || icon.name;
    const finalName = existingNamesSet.has(baseName.toLowerCase())
      ? generateUniqueName(baseName, existingNamesSet)
      : baseName;

    const updates: Partial<Icon> = {
      name: finalName,
      url: urlIsometric,
      url2D: url2D || undefined,
      scale: scale / 100, // Convert percentage to decimal
      scale2D: scale / 100, // Use same scale for both views
      isIsometric
    };

    onSave(icon.id, updates);
    handleClose();
  }, [icon, urlIsometric, url2D, iconName, scale, isIsometric, existingIconNames, onSave, handleClose]);

  const canSave = !!urlIsometric && iconName.trim().length > 0;

  if (!icon) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>Edit Icon: {icon.name}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Name Input */}
          <TextField
            label="Icon Name"
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
            fullWidth
            required
            helperText="A unique name for this icon"
          />

          {/* Dual Image Uploader */}
          <Box>
            <DualImageUploader
              urlIsometric={urlIsometric}
              url2D={url2D}
              onIsometricChange={setUrlIsometric}
              on2DChange={setUrl2D}
              scale={scale}
            />
          </Box>

          {/* Scale Slider */}
          <Box>
            <Typography variant="body2" gutterBottom>
              Icon Scale: {scale}%
            </Typography>
            <Slider
              value={scale}
              onChange={(_, value) => setScale(value as number)}
              min={10}
              max={300}
              step={5}
              marks={[
                { value: 10, label: '10%' },
                { value: 100, label: '100%' },
                { value: 300, label: '300%' }
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              Adjust how large the icon appears in the diagram
            </Typography>
          </Box>

          {/* Isometric Transform Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isIsometric}
                onChange={(e) => setIsIsometric(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2">
                  Apply isometric transform
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Check this for 3D/isometric icons. Uncheck for flat icons (logos, UI elements).
                </Typography>
              </Box>
            }
          />

          {/* Warning about nodes using this icon */}
          <Alert severity="info">
            Changes will apply to all nodes using this icon in your diagram.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!canSave}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
