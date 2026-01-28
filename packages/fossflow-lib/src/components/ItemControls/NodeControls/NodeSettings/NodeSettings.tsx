import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Slider, Box, TextField } from '@mui/material';
import { ModelItem, ViewItem } from 'src/types';
import { RichTextEditor } from 'src/components/RichTextEditor/RichTextEditor';
import { useModelItem } from 'src/hooks/useModelItem';
import { useModelStore } from 'src/stores/modelStore';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { DeleteButton } from '../../components/DeleteButton';
import { Section } from '../../components/Section';

export type NodeUpdates = {
  model: Partial<ModelItem>;
  view: Partial<ViewItem>;
};

interface Props {
  node: ViewItem;
  onModelItemUpdated: (updates: Partial<ModelItem>) => void;
  onViewItemUpdated: (updates: Partial<ViewItem>) => void;
  onDeleted: () => void;
}

export const NodeSettings = ({
  node,
  onModelItemUpdated,
  onViewItemUpdated,
  onDeleted
}: Props) => {
  const modelItem = useModelItem(node.id);
  const modelActions = useModelStore((state) => state.actions);
  const icons = useModelStore((state) => state.icons);
  const viewMode = useUiStateStore((state) => state.viewMode);

  // Local state for smooth slider interaction
  const currentIcon = icons.find(icon => icon.id === modelItem?.icon);

  // Get the appropriate scale based on current view mode
  const currentScale = viewMode === '2D' && currentIcon?.scale2D !== undefined
    ? currentIcon.scale2D
    : (currentIcon?.scale || 1);

  const [localScale, setLocalScale] = useState(currentScale);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update local scale when icon or view mode changes
  useEffect(() => {
    const newScale = viewMode === '2D' && currentIcon?.scale2D !== undefined
      ? currentIcon.scale2D
      : (currentIcon?.scale || 1);
    setLocalScale(newScale);
  }, [currentIcon?.scale, currentIcon?.scale2D, viewMode]);

  // Debounced update to store - updates the appropriate scale field based on view mode
  const updateIconScale = useCallback((scale: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const updatedIcons = icons.map(icon => {
        if (icon.id === modelItem?.icon) {
          // Update the appropriate scale field based on current view mode
          if (viewMode === '2D') {
            return { ...icon, scale2D: scale };
          } else {
            return { ...icon, scale };
          }
        }
        return icon;
      });
      modelActions.set({ icons: updatedIcons });
    }, 100); // 100ms debounce
  }, [icons, modelItem?.icon, modelActions, viewMode]);

  // Handle slider change with local state + debounced store update
  const handleScaleChange = useCallback((e: Event, newScale: number | number[]) => {
    const scale = newScale as number;
    setLocalScale(scale); // Immediate UI update
    updateIconScale(scale); // Debounced store update
  }, [updateIconScale]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!modelItem) {
    return null;
  }

  return (
    <>
      <Section title="Name">
        <TextField
          value={modelItem.name}
          onChange={(e) => {
            const text = e.target.value as string;
            if (modelItem.name !== text) onModelItemUpdated({ name: text });
          }}
        />
      </Section>
      <Section title="Description">
        <RichTextEditor
          value={modelItem.description}
          onChange={(text) => {
            if (modelItem.description !== text)
              onModelItemUpdated({ description: text });
          }}
        />
      </Section>
      {modelItem.name && (
        <Section title="Label height">
          <Slider
            marks
            step={20}
            min={60}
            max={280}
            value={node.labelHeight}
            onChange={(e, newHeight) => {
              const labelHeight = newHeight as number;
              onViewItemUpdated({ labelHeight });
            }}
          />
        </Section>
      )}

      <Section title={`Icon size (${viewMode === '2D' ? '2D view' : 'Isometric view'})`}>
        <Slider
          marks
          step={0.1}
          min={0.3}
          max={2.5}
          value={localScale}
          onChange={handleScaleChange}
        />
      </Section>
      <Section>
        <Box>
          <DeleteButton onClick={onDeleted} />
        </Box>
      </Section>
    </>
  );
};
