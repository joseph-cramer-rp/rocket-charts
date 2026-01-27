import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { Icon } from 'src/types';
import { getProjectionUtils } from 'src/utils';
import { useUiStateStore } from 'src/stores/uiStateStore';

interface Props {
  icon: Icon;
}

export const NonIsometricIcon = ({ icon }: Props) => {
  const viewMode = useUiStateStore((state) => state.viewMode);
  const projection = useMemo(() => getProjectionUtils(viewMode), [viewMode]);
  const tileSize = useMemo(() => projection.getTileSize(), [projection]);

  // Smart scaling: boost icon size in 2D view to maintain visual consistency
  // Compensates for tile size reduction (141.5px -> 100px)
  const viewModeScaleBoost = useMemo(() => {
    return viewMode === '2D' ? 1.4 : 1.0;
  }, [viewMode]);

  return (
    <Box sx={{ pointerEvents: 'none' }}>
      <Box
        sx={{
          position: 'absolute',
          left: -tileSize.width / 2,
          top: -tileSize.height / 2,
          transformOrigin: 'top left',
          transform: projection.getProjectionCss()
        }}
      >
        <Box
          component="img"
          src={icon.url}
          alt={`icon-${icon.id}`}
          sx={{ width: tileSize.width * 0.7 * (icon.scale || 1) * viewModeScaleBoost }}
        />
      </Box>
    </Box>
  );
};
