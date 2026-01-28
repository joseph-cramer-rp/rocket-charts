import React, { useState } from 'react';
import { Icon as IconI } from 'src/types';
import { Grid, Box } from '@mui/material';
import { Icon } from './Icon';

interface Props {
  icons: IconI[];
  onMouseDown?: (icon: IconI) => void;
  onClick?: (icon: IconI) => void;
  onDoubleClick?: (icon: IconI) => void;
  hoveredIndex?: number;
  onHover?: (index: number) => void;
  onEdit?: (icon: IconI) => void;
  onCustomize?: (icon: IconI) => void;
  iconOverrides?: Record<string, { url2D?: string }>;
}

export const IconGrid = ({
  icons,
  onMouseDown,
  onClick,
  onDoubleClick,
  hoveredIndex,
  onHover,
  onEdit,
  onCustomize,
  iconOverrides = {}
}: Props) => {
  const [localHoveredIndex, setLocalHoveredIndex] = useState<number | null>(null);

  return (
    <Grid container>
      {icons.map((icon, index) => {
        const isHovered = hoveredIndex === index || localHoveredIndex === index;
        const isPackIcon = !!(icon.collection && icon.collection !== 'imported');
        const hasOverride = !!iconOverrides[icon.id];
        const hasUrl2D = !!icon.url2D;

        return (
          <Grid item xs={3} key={icon.id}>
            <Box
              sx={{
                backgroundColor: isHovered ? 'action.hover' : 'transparent',
                borderRadius: 1,
                transition: 'background-color 0.2s',
                position: 'relative'
              }}
              onMouseEnter={() => {
                setLocalHoveredIndex(index);
                onHover?.(index);
              }}
              onMouseLeave={() => {
                setLocalHoveredIndex(null);
              }}
            >
              <Icon
                icon={icon}
                onClick={() => {
                  onClick?.(icon);
                }}
                onMouseDown={() => {
                  onMouseDown?.(icon);
                }}
                onDoubleClick={() => {
                  onDoubleClick?.(icon);
                }}
                isHovered={isHovered}
                isPackIcon={isPackIcon}
                hasOverride={hasOverride}
                hasUrl2D={hasUrl2D}
                onEdit={onEdit ? () => onEdit(icon) : undefined}
                onCustomize={onCustomize ? () => onCustomize(icon) : undefined}
              />
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};
