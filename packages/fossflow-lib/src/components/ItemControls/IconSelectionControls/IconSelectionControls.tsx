import React, { useCallback, useState } from 'react';
import { Stack, Alert, IconButton as MUIIconButton, Box, Button } from '@mui/material';
import { ControlsContainer } from 'src/components/ItemControls/components/ControlsContainer';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useModelStore } from 'src/stores/modelStore';
import { Icon } from 'src/types';
import { Section } from 'src/components/ItemControls/components/Section';
import { Searchbox } from 'src/components/ItemControls/IconSelectionControls/Searchbox';
import { useIconFiltering } from 'src/hooks/useIconFiltering';
import { useIconCategories } from 'src/hooks/useIconCategories';
import { Close as CloseIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import { Icons } from './Icons';
import { IconGrid } from './IconGrid';
import { ImportIconDialog } from './ImportIconDialog';
import { IconEditDialog } from './IconEditDialog';
import { CustomizeIconDialog } from './CustomizeIconDialog';

export const IconSelectionControls = () => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const mode = useUiStateStore((state) => {
    return state.mode;
  });
  const iconCategoriesState = useUiStateStore((state) => state.iconCategoriesState);
  const modelActions = useModelStore((state) => state.actions);
  const currentIcons = useModelStore((state) => state.icons);
  const iconOverrides = useModelStore((state) => state.iconOverrides || {});
  const { setFilter, filteredIcons, filter } = useIconFiltering();
  const { iconCategories } = useIconCategories();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [showAlert, setShowAlert] = useState(() => {
    // Check localStorage to see if user has dismissed the alert
    return localStorage.getItem('fossflow-show-drag-hint') !== 'false';
  });


  const onMouseDown = useCallback(
    (icon: Icon) => {
      if (mode.type !== 'PLACE_ICON') return;

      uiStateActions.setMode({
        type: 'PLACE_ICON',
        showCursor: true,
        id: icon.id
      });
    },
    [mode, uiStateActions]
  );

  const handleImportClick = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const dismissAlert = useCallback(() => {
    setShowAlert(false);
    localStorage.setItem('fossflow-show-drag-hint', 'false');
  }, []);

  const handleIconImport = useCallback((newIcon: Icon) => {
    // Add new icon to the model
    const updatedIcons = [...currentIcons, newIcon];
    modelActions.set({ icons: updatedIcons });

    // Update icon categories to include imported collection
    const hasImported = iconCategoriesState.some(cat => cat.id === 'imported');
    if (!hasImported) {
      uiStateActions.setIconCategoriesState([
        ...iconCategoriesState,
        { id: 'imported', isExpanded: true }
      ]);
    }
  }, [currentIcons, modelActions, iconCategoriesState, uiStateActions]);

  const handleEditIcon = useCallback((icon: Icon) => {
    setSelectedIcon(icon);
    setEditDialogOpen(true);
  }, []);

  const handleCustomizeIcon = useCallback((icon: Icon) => {
    setSelectedIcon(icon);
    setCustomizeDialogOpen(true);
  }, []);

  const handleIconEdit = useCallback((iconId: string, updates: Partial<Icon>) => {
    const updatedIcons = currentIcons.map(icon =>
      icon.id === iconId ? { ...icon, ...updates } : icon
    );
    modelActions.set({ icons: updatedIcons });
  }, [currentIcons, modelActions]);

  const handleIconCustomize = useCallback((iconId: string, url2D: string | null) => {
    if (url2D) {
      // Set override
      modelActions.setIconOverride(iconId, { url2D });
    } else {
      // Remove override
      modelActions.removeIconOverride(iconId);
    }
  }, [modelActions]);

  return (
    <ControlsContainer
      header={
        <Section
          sx={{
            top: 0,
            pt: 6,
            pb: 3,
            position: 'relative',
            paddingTop: '32px'
          }}
        >
          {/* Close button */}
          <MUIIconButton
            aria-label="Close"
            onClick={() => {
              return uiStateActions.setItemControls(null);
            }}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              padding: 0,
              background: 'none'
            }}
            size="small"
          >
            <CloseIcon />
          </MUIIconButton>
          <Stack spacing={2}>
            <Box sx={{ marginTop: '8px' }}>
              <Searchbox value={filter} onChange={setFilter} />
            </Box>
          </Stack>
        </Section>
      }
    >
      {filteredIcons && (
        <Section>
          <IconGrid
            icons={filteredIcons}
            onMouseDown={onMouseDown}
            onEdit={handleEditIcon}
            onCustomize={handleCustomizeIcon}
            iconOverrides={iconOverrides}
          />
        </Section>
      )}
      {!filteredIcons && (
        <Icons
          iconCategories={iconCategories}
          onMouseDown={onMouseDown}
          onEdit={handleEditIcon}
          onCustomize={handleCustomizeIcon}
          iconOverrides={iconOverrides}
        />
      )}
      
      <Section>
        <Box sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 1.5,
          backgroundColor: '#f5f5f5'
        }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
            fullWidth
          >
            Import Custom Icon
          </Button>
        </Box>

        {showAlert && (
          <Alert
            severity="info"
            onClose={dismissAlert}
            sx={{ cursor: 'pointer', mt: 1 }}
          >
            You can drag and drop any item below onto the canvas.
          </Alert>
        )}
      </Section>

      {/* Import Icon Dialog */}
      <ImportIconDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleIconImport}
        existingIconNames={currentIcons.map(icon => icon.name)}
      />

      {/* Edit Icon Dialog */}
      <IconEditDialog
        open={editDialogOpen}
        icon={selectedIcon}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedIcon(null);
        }}
        onSave={handleIconEdit}
        existingIconNames={currentIcons.map(icon => icon.name)}
      />

      {/* Customize Icon Dialog */}
      <CustomizeIconDialog
        open={customizeDialogOpen}
        icon={selectedIcon}
        currentUrl2D={selectedIcon ? iconOverrides[selectedIcon.id]?.url2D || null : null}
        onClose={() => {
          setCustomizeDialogOpen(false);
          setSelectedIcon(null);
        }}
        onSave={handleIconCustomize}
      />
    </ControlsContainer>
  );
};
