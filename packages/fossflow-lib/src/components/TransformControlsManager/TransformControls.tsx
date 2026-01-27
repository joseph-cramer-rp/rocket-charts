import React, { useMemo } from 'react';
import { Coords, AnchorPosition } from 'src/types';
import { Svg } from 'src/components/Svg/Svg';
import { TRANSFORM_CONTROLS_COLOR } from 'src/config';
import { useIsoProjection } from 'src/hooks/useIsoProjection';
import {
  getBoundingBox,
  outermostCornerPositions,
  getProjectionUtils,
  convertBoundsToNamedAnchors
} from 'src/utils';
import { TransformAnchor } from './TransformAnchor';
import { useUiStateStore } from 'src/stores/uiStateStore';

interface Props {
  from: Coords;
  to: Coords;
  onAnchorMouseDown?: (anchorPosition: AnchorPosition) => void;
}

const strokeWidth = 2;

export const TransformControls = ({ from, to, onAnchorMouseDown }: Props) => {
  const { css, pxSize } = useIsoProjection({
    from,
    to
  });

  // Get projection-aware utilities for anchor positioning
  const viewMode = useUiStateStore((state) => state.viewMode);
  const projection = useMemo(() => getProjectionUtils(viewMode), [viewMode]);

  const anchors = useMemo(() => {
    if (!onAnchorMouseDown) return [];

    const corners = getBoundingBox([from, to]);
    const namedCorners = convertBoundsToNamedAnchors(corners);
    const cornerPositions = Object.entries(namedCorners).map(
      ([key, value], i) => {
        // Use projection-aware positioning for anchors
        const position = projection.getTilePosition({
          tile: value,
          origin: outermostCornerPositions[i]
        });

        return {
          position,
          onMouseDown: () => {
            onAnchorMouseDown(key as AnchorPosition);
          }
        };
      }
    );

    return cornerPositions;
  }, [onAnchorMouseDown, from, to, projection]);

  return (
    <>
      <Svg
        style={{
          ...css,
          pointerEvents: 'none'
        }}
      >
        <g transform={`translate(${strokeWidth}, ${strokeWidth})`}>
          <rect
            width={pxSize.width - strokeWidth * 2}
            height={pxSize.height - strokeWidth * 2}
            fill="none"
            stroke={TRANSFORM_CONTROLS_COLOR}
            strokeDasharray={`${strokeWidth * 2} ${strokeWidth * 2}`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </g>
      </Svg>

      {anchors.map(({ position, onMouseDown }) => {
        return (
          <TransformAnchor position={position} onMouseDown={onMouseDown} />
        );
      })}
    </>
  );
};
