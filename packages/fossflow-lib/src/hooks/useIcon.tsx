import React, { useMemo, useEffect } from 'react';
import { useModelStore } from 'src/stores/modelStore';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { getItemById } from 'src/utils';
import { IsometricIcon } from 'src/components/SceneLayers/Nodes/Node/IconTypes/IsometricIcon';
import { NonIsometricIcon } from 'src/components/SceneLayers/Nodes/Node/IconTypes/NonIsometricIcon';
import { DEFAULT_ICON } from 'src/config';

export const useIcon = (id: string | undefined) => {
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const viewMode = useUiStateStore((state) => state.viewMode);

  const icons = useModelStore((state) => state.icons);
  const iconOverrides = useModelStore((state) => state.iconOverrides || {});

  // Get base icon and merge with overrides
  const icon = useMemo(() => {
    if (!id) return DEFAULT_ICON;

    const item = getItemById(icons, id);
    const baseIcon = item ? item.value : DEFAULT_ICON;

    // Apply overrides if they exist (for pack icons with custom variants)
    const override = iconOverrides[id];
    if (override) {
      return { ...baseIcon, ...override };
    }

    return baseIcon;
  }, [icons, iconOverrides, id]);

  // Select URL based on view mode with fallback
  const activeUrl = useMemo(() => {
    if (viewMode === '2D' && icon.url2D) {
      return icon.url2D;
    }
    return icon.url;
  }, [viewMode, icon.url, icon.url2D]);

  // Select scale based on view mode with fallback
  const activeScale = useMemo(() => {
    if (viewMode === '2D' && icon.scale2D !== undefined) {
      return icon.scale2D;
    }
    return icon.scale || 1;
  }, [viewMode, icon.scale, icon.scale2D]);

  // Reset loaded state when URL changes
  useEffect(() => {
    setHasLoaded(false);
  }, [activeUrl]);

  const iconComponent = useMemo(() => {
    if (!icon.isIsometric) {
      setHasLoaded(true);
      // NonIsometricIcon reads icon.url and icon.scale internally, pass modified icon
      return <NonIsometricIcon icon={{ ...icon, url: activeUrl, scale: activeScale }} />;
    }

    // IsometricIcon takes url and scale as props
    return (
      <IsometricIcon
        url={activeUrl}
        scale={activeScale}
        onImageLoaded={() => {
          setHasLoaded(true);
        }}
      />
    );
  }, [icon, activeUrl, activeScale]);

  return {
    icon,
    iconComponent,
    hasLoaded
  };
};
