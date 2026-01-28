import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Button, Typography, IconButton, Chip, Tooltip } from '@mui/material';
import { Edit as EditIcon, Tune as TuneIcon } from '@mui/icons-material';
import { Icon as IconI } from 'src/types';

const SIZE = 50;

interface Props {
  icon: IconI;
  onClick?: () => void;
  onMouseDown?: () => void;
  onDoubleClick?: () => void;
  isHovered?: boolean;
  isPackIcon?: boolean;
  hasOverride?: boolean;
  hasUrl2D?: boolean;
  onEdit?: () => void;
  onCustomize?: () => void;
}

export const Icon = ({
  icon,
  onClick,
  onMouseDown,
  onDoubleClick,
  isHovered = false,
  isPackIcon = false,
  hasOverride = false,
  hasUrl2D = false,
  onEdit,
  onCustomize
}: Props) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleCustomizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCustomize?.();
  };

  const showEditButton = !isPackIcon && onEdit;
  const showCustomizeButton = isPackIcon && onCustomize;

  return (
    <Box sx={{ position: 'relative' }}>
      <Button
        variant="text"
        onClick={onClick}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        sx={{
          userSelect: 'none',
          position: 'relative'
        }}
      >
        <Stack
          sx={{ overflow: 'hidden', justifyContent: 'flex-start', width: SIZE }}
          spacing={1}
        >
          <Box sx={{ position: 'relative', width: SIZE, height: SIZE, overflow: 'hidden' }}>
            <Box
              component="img"
              draggable={false}
              src={icon.url}
              alt={`Icon ${icon.name}`}
              sx={{ width: SIZE, height: SIZE }}
            />

            {/* Flat badge */}
            {icon.isIsometric === false && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  padding: '1px 4px',
                  borderRadius: '4px',
                  backgroundColor: '#eeeb',
                  color: '#000'
                }}
              >
                <Typography variant="body2">
                  flat
                </Typography>
              </Box>
            )}

            {/* 2D badge */}
            {(hasUrl2D || hasOverride) && (
              <Chip
                label="2D"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  height: 16,
                  fontSize: '0.65rem',
                  backgroundColor: hasOverride ? 'primary.main' : 'success.main',
                  color: 'white',
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            textOverflow="ellipsis"
          >
            {icon.name}
          </Typography>
        </Stack>
      </Button>

      {/* Edit/Customize button on hover */}
      {isHovered && (showEditButton || showCustomizeButton) && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            zIndex: 10
          }}
        >
          {showEditButton && (
            <Tooltip title="Edit icon">
              <IconButton
                size="small"
                onClick={handleEditClick}
                sx={{
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: 'background.paper'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {showCustomizeButton && (
            <Tooltip title={hasOverride ? 'Edit customization' : 'Add 2D variant'}>
              <IconButton
                size="small"
                onClick={handleCustomizeClick}
                sx={{
                  backgroundColor: hasOverride ? 'primary.light' : 'background.paper',
                  color: hasOverride ? 'primary.contrastText' : 'inherit',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: hasOverride ? 'primary.main' : 'action.hover'
                  }
                }}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};
