import React, { useRef, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { getProjectionUtils } from 'src/utils';
import { useResizeObserver } from 'src/hooks/useResizeObserver';
import { useUiStateStore } from 'src/stores/uiStateStore';

interface Props {
  url: string;
  scale?: number;
  onImageLoaded?: () => void;
}

export const IsometricIcon = ({ url, scale = 1, onImageLoaded }: Props) => {
  const ref = useRef<HTMLImageElement>(null);
  const { size, observe, disconnect } = useResizeObserver();
  const viewMode = useUiStateStore((state) => state.viewMode);
  const projection = useMemo(() => getProjectionUtils(viewMode), [viewMode]);
  const tileSize = useMemo(() => projection.getTileSize(), [projection]);

  // Smart scaling: boost icon size in 2D view to maintain visual consistency
  // Compensates for tile size reduction (141.5px -> 100px)
  const viewModeScaleBoost = useMemo(() => {
    return viewMode === '2D' ? 1.4 : 1.0;
  }, [viewMode]);

  useEffect(() => {
    if (!ref.current) return;

    observe(ref.current);

    return disconnect;
  }, [observe, disconnect]);

  return (
    <Box
      ref={ref}
      component="img"
      onLoad={onImageLoaded}
      src={url}
      sx={{
        position: 'absolute',
        width: tileSize.width * 0.8 * scale * viewModeScaleBoost,
        top: -size.height,
        left: -size.width / 2,
        pointerEvents: 'none'
      }}
    />
  );
};
