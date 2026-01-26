import { UNPROJECTED_TILE_SIZE } from 'src/config';
import { Coords, TileOrigin, Size, Scroll } from 'src/types';
import { CoordsUtils, SizeUtils } from 'src/utils';

/**
 * Orthographic (2D top-down) projection utilities
 * These are the 2D equivalents of the isometric projection functions
 */

interface ScreenToOrtho {
  mouse: Coords;
  zoom: number;
  scroll: Scroll;
  rendererSize: Size;
}

/**
 * Converts a mouse screen position to a tile position in 2D orthographic view
 * This is much simpler than isometric - just divide by tile size
 */
export const screenToOrtho = ({
  mouse,
  zoom,
  scroll,
  rendererSize
}: ScreenToOrtho): Coords => {
  const tileSize = UNPROJECTED_TILE_SIZE * zoom;

  // Calculate position relative to renderer center
  const projectPosition = {
    x: -rendererSize.width * 0.5 + mouse.x - scroll.position.x,
    y: -rendererSize.height * 0.5 + mouse.y - scroll.position.y
  };

  // In 2D orthographic view, tile calculation is straightforward
  const tile = {
    x: Math.floor(projectPosition.x / tileSize),
    y: Math.floor(projectPosition.y / tileSize)
  };

  return tile;
};

interface GetTilePositionOrtho {
  tile: Coords;
  origin?: TileOrigin;
}

/**
 * Converts a tile position to screen coordinates in 2D orthographic view
 * Simple multiplication by tile size
 */
export const getTilePositionOrtho = ({
  tile,
  origin = 'CENTER'
}: GetTilePositionOrtho): Coords => {
  const tileSize = UNPROJECTED_TILE_SIZE;
  const halfSize = tileSize / 2;

  // Base position at top-left corner of tile
  const position: Coords = {
    x: tile.x * tileSize,
    y: tile.y * tileSize
  };

  // Adjust based on origin
  switch (origin) {
    case 'TOP':
      return CoordsUtils.add(position, { x: halfSize, y: 0 });
    case 'BOTTOM':
      return CoordsUtils.add(position, { x: halfSize, y: tileSize });
    case 'LEFT':
      return CoordsUtils.add(position, { x: 0, y: halfSize });
    case 'RIGHT':
      return CoordsUtils.add(position, { x: tileSize, y: halfSize });
    case 'CENTER':
    default:
      return CoordsUtils.add(position, { x: halfSize, y: halfSize });
  }
};

type OrthoToScreen = GetTilePositionOrtho & {
  rendererSize: Size;
};

/**
 * Converts tile position to absolute screen coordinates
 */
export const orthoToScreen = ({
  tile,
  origin,
  rendererSize
}: OrthoToScreen): Coords => {
  const position = getTilePositionOrtho({ tile, origin });

  return {
    x: position.x + rendererSize.width / 2,
    y: position.y + rendererSize.height / 2
  };
};

/**
 * Returns identity matrix for orthographic projection (no transformation)
 * Format: [a, b, c, d, e, f] for matrix(a, b, c, d, e, f)
 */
export const getOrthoMatrix = (): number[] => {
  // Identity matrix: [1, 0, 0, 1, 0, 0]
  // This means: no rotation, no skew, no translation
  return [1, 0, 0, 1, 0, 0];
};

/**
 * Returns CSS transform string for orthographic projection
 * Returns identity transform (no transformation)
 */
export const getOrthoProjectionCss = (): string => {
  const matrixTransformValues = getOrthoMatrix();
  return `matrix(${matrixTransformValues.join(', ')})`;
};

/**
 * Calculate the orthographic tile size (same as unprojected for 2D view)
 */
export const getOrthoTileSize = (): Size => {
  return {
    width: UNPROJECTED_TILE_SIZE,
    height: UNPROJECTED_TILE_SIZE
  };
};
