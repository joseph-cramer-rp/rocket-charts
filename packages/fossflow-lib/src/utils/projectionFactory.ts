import { ViewMode } from 'src/types/ui';
import { Coords, TileOrigin, Size, Scroll, ProjectionOrientationEnum } from 'src/types';
import {
  screenToIso,
  getTilePosition,
  isoToScreen,
  getIsoMatrix,
  getIsoProjectionCss
} from './renderer';
import {
  screenToOrtho,
  getTilePositionOrtho,
  orthoToScreen,
  getOrthoMatrix,
  getOrthoProjectionCss,
  getOrthoTileSize
} from './orthoProjection';
import { PROJECTED_TILE_SIZE } from 'src/config';

/**
 * Projection utilities interface
 * Provides a unified interface for both isometric and orthographic projections
 */
export interface ProjectionUtils {
  /**
   * Convert mouse screen position to tile coordinates
   */
  screenToTile: (params: {
    mouse: Coords;
    zoom: number;
    scroll: Scroll;
    rendererSize: Size;
  }) => Coords;

  /**
   * Convert tile coordinates to screen position
   */
  getTilePosition: (params: { tile: Coords; origin?: TileOrigin }) => Coords;

  /**
   * Convert tile position to absolute screen coordinates
   */
  tileToScreen: (params: {
    tile: Coords;
    origin?: TileOrigin;
    rendererSize: Size;
  }) => Coords;

  /**
   * Get projection matrix values
   */
  getMatrix: (orientation?: keyof typeof ProjectionOrientationEnum) => number[];

  /**
   * Get CSS transform string for projection
   */
  getProjectionCss: (
    orientation?: keyof typeof ProjectionOrientationEnum
  ) => string;

  /**
   * Get the tile size for this projection
   */
  getTileSize: () => Size;
}

/**
 * Get projection utilities based on view mode
 * Returns the appropriate projection functions for isometric or 2D view
 */
export const getProjectionUtils = (viewMode: ViewMode): ProjectionUtils => {
  if (viewMode === '2D') {
    // Orthographic (2D) projection
    return {
      screenToTile: screenToOrtho,
      getTilePosition: getTilePositionOrtho,
      tileToScreen: orthoToScreen,
      getMatrix: getOrthoMatrix,
      getProjectionCss: getOrthoProjectionCss,
      getTileSize: getOrthoTileSize
    };
  }

  // Isometric projection (default)
  return {
    screenToTile: screenToIso,
    getTilePosition: getTilePosition,
    tileToScreen: isoToScreen,
    getMatrix: getIsoMatrix,
    getProjectionCss: getIsoProjectionCss,
    getTileSize: () => PROJECTED_TILE_SIZE
  };
};
