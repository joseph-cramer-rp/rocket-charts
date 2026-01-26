import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import gsap from 'gsap';
import { Size } from 'src/types';
import gridTileSvg from 'src/assets/grid-tile-bg.svg';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { PROJECTED_TILE_SIZE, UNPROJECTED_TILE_SIZE } from 'src/config';
import { SizeUtils } from 'src/utils/SizeUtils';
import { useResizeObserver } from 'src/hooks/useResizeObserver';

export const Grid = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { size } = useResizeObserver(elementRef.current);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const scroll = useUiStateStore((state) => {
    return state.scroll;
  });
  const zoom = useUiStateStore((state) => {
    return state.zoom;
  });
  const viewMode = useUiStateStore((state) => {
    return state.viewMode;
  });

  useEffect(() => {
    if (!elementRef.current) return;

    const elSize = elementRef.current.getBoundingClientRect();

    if (viewMode === '2D') {
      // Orthographic 2D grid - simple rectangular grid
      const tileSize = UNPROJECTED_TILE_SIZE * zoom;
      const backgroundPosition = {
        x: elSize.width / 2 + scroll.position.x,
        y: elSize.height / 2 + scroll.position.y
      };

      // Create a linear gradient for 2D grid lines
      const gridColor = 'rgba(0, 0, 0, 0.1)';
      const backgroundColor = 'transparent';
      const backgroundImage = `
        linear-gradient(to right, ${gridColor} 1px, ${backgroundColor} 1px),
        linear-gradient(to bottom, ${gridColor} 1px, ${backgroundColor} 1px)
      `;

      gsap.to(elementRef.current, {
        duration: isFirstRender ? 0 : 0.016,
        ease: 'none',
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundPosition: `${backgroundPosition.x}px ${backgroundPosition.y}px`,
        backgroundImage: backgroundImage
      });
    } else {
      // Isometric grid - diamond pattern using SVG
      const tileSize = SizeUtils.multiply(PROJECTED_TILE_SIZE, zoom);
      const backgroundPosition: Size = {
        width: elSize.width / 2 + scroll.position.x + tileSize.width / 2,
        height: elSize.height / 2 + scroll.position.y
      };

      gsap.to(elementRef.current, {
        duration: isFirstRender ? 0 : 0.016,
        ease: 'none',
        backgroundSize: `${tileSize.width}px ${tileSize.height * 2}px`,
        backgroundPosition: `${backgroundPosition.width}px ${backgroundPosition.height}px`,
        backgroundImage: `url("${gridTileSvg}")`
      });
    }

    if (isFirstRender) {
      setIsFirstRender(false);
    }
  }, [scroll, zoom, isFirstRender, size, viewMode]);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      <Box
        ref={elementRef}
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundRepeat: 'repeat'
        }}
      />
    </Box>
  );
};
