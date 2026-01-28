import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { FileUpload as FileUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';

export interface ImagePreviewWithActionsProps {
  url: string | null;
  label: string;
  required?: boolean;
  disabled?: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export const ImagePreviewWithActions: React.FC<ImagePreviewWithActionsProps> = ({
  url,
  label,
  required = false,
  disabled = false,
  onUpload,
  onRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input to allow selecting the same file again
    event.target.value = '';
  }, [onUpload]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }, [disabled, onUpload]);

  return (
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 1.5,
        backgroundColor: disabled ? '#fafafa' : '#f5f5f5',
        opacity: disabled ? 0.6 : 1
      }}
    >
      {/* Label */}
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>

      {/* Preview or Upload Zone */}
      <Box
        onClick={url ? undefined : handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          width: '100%',
          height: 120,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : '#ccc',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          cursor: url ? 'default' : disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          '&:hover': url ? {} : {
            borderColor: disabled ? '#ccc' : 'primary.main',
            backgroundColor: disabled ? 'background.paper' : 'action.hover'
          }
        }}
      >
        {url ? (
          // Image preview
          <Box
            component="img"
            src={url}
            alt={label}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          // Upload prompt
          <Stack alignItems="center" spacing={0.5}>
            <FileUploadIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" align="center">
              Drop image here
              <br />
              or click to browse
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        {url ? (
          <>
            <Button
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={handleClick}
              disabled={disabled}
              fullWidth
            >
              Replace
            </Button>
            {!required && (
              <IconButton
                size="small"
                onClick={onRemove}
                disabled={disabled}
                color="error"
                sx={{ minWidth: 36 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </>
        ) : (
          <Button
            size="small"
            startIcon={<FileUploadIcon />}
            onClick={handleClick}
            disabled={disabled}
            fullWidth
          >
            Upload
          </Button>
        )}
      </Stack>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled}
      />
    </Box>
  );
};
