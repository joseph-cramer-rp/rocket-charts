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
 *
 * Note: Y is negated to match isometric coordinate semantics where positive Y goes up
 */
export const screenToOrtho = ({
  mouse,
  zoom,
  scroll,
  rendererSize
}: ScreenToOrtho): Coords => {
  const tileSize = UNPROJECTED_TILE_SIZE * zoom;
  const halfSize = tileSize / 2;

  // Calculate position relative to renderer center
  const projectPosition = {
    x: -rendererSize.width * 0.5 + mouse.x - scroll.position.x,
    y: -rendererSize.height * 0.5 + mouse.y - scroll.position.y
  };

  // In 2D orthographic view, tile calculation is straightforward
  // Add halfSize offset because tiles are centered at their coordinates
  // (similar to how isometric adds halfW/halfH)
  // Negate Y to match isometric coordinate system (positive Y = up)
  const tile = {
    x: Math.floor((projectPosition.x + halfSize) / tileSize),
    y: -Math.floor((projectPosition.y + halfSize) / tileSize)
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
 *
 * In 2D view:
 * - Tile (0, 0) is at the center of the viewport
 * - Positive X goes right, negative X goes left
 * - Positive Y goes up, negative Y goes down (matches isometric semantics)
 *
 * This differs from isometric where both X and Y affect diagonal positioning
 */
export const getTilePositionOrtho = ({
  tile,
  origin = 'CENTER'
}: GetTilePositionOrtho): Coords => {
  const tileSize = UNPROJECTED_TILE_SIZE;
  const halfSize = tileSize / 2;

  // Base position at CENTER of tile (matches isometric behavior)
  // Negate Y to match isometric coordinate system (positive Y = up)
  // Coordinates are relative to renderer center (0,0)
  const position: Coords = {
    x: tile.x * tileSize,
    y: -(tile.y * tileSize)
  };

  // Adjust based on origin
  // Note: For orthographic rendering with IsoTileArea/useIsoProjection,
  // LEFT and TOP origins need to position the SVG at the top-left corner
  // because there's no transform to handle the geometry like in isometric
  switch (origin) {
    case 'TOP':
      return CoordsUtils.add(position, { x: -halfSize, y: -halfSize });
    case 'BOTTOM':
      return CoordsUtils.add(position, { x: 0, y: halfSize });
    case 'LEFT':
      return CoordsUtils.add(position, { x: -halfSize, y: -halfSize });
    case 'RIGHT':
      return CoordsUtils.add(position, { x: halfSize, y: 0 });
    case 'CENTER':
    default:
      return position;
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
