import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { Coords } from 'src/types';
import { getProjectionUtils } from 'src/utils';
import { useIcon } from 'src/hooks/useIcon';
import { useUiStateStore } from 'src/stores/uiStateStore';

interface Props {
  iconId: string;
  tile: Coords;
}

export const DragAndDrop = ({ iconId, tile }: Props) => {
  const { iconComponent } = useIcon(iconId);

  // Get projection-aware utilities for positioning
  const viewMode = useUiStateStore((state) => state.viewMode);
  const projection = useMemo(() => getProjectionUtils(viewMode), [viewMode]);

  const tilePosition = useMemo(() => {
    return projection.getTilePosition({ tile, origin: 'BOTTOM' });
  }, [tile, projection]);

  return (
    <Box
      sx={{
        position: 'absolute'
      }}
      style={{ left: tilePosition.x, top: tilePosition.y }}
    >
      {iconComponent}
    </Box>
  );
};
