# Dual Icon Assets Implementation Plan

**Created**: January 28, 2026
**Updated**: January 28, 2026
**Status**: In Progress
**Feature**: Support separate Isometric and 2D image assets for each icon

---

## Overview

Enable each icon to have two separate image assets:
- **Isometric Image**: Displayed when in Isometric view mode
- **2D Image**: Displayed when in 2D view mode

Users should be able to view, edit, upload, and manage both images for existing and new icons.

---

## Key Architectural Decisions

Following detailed review and analysis, these decisions have been finalized:

### Decision 1: Hook Implementation - Minimal Change Approach ✅
**Chosen**: Compute `activeUrl` in `useIcon` hook and pass to components appropriately.
- `IsometricIcon`: Pass `activeUrl` directly as `url` prop (already separated)
- `NonIsometricIcon`: Use spread operator `{...icon, url: activeUrl}` (minimal change)
- **Rationale**: Fastest implementation, lowest risk, no component API changes needed.

### Decision 2: Override Persistence - Store in Model ✅
**Chosen**: Add `iconOverrides` field to Model schema, NOT localStorage.
```typescript
model: {
  icons: [...],
  iconOverrides: { [iconId]: { url2D: "..." } } // NEW
}
```
- **Rationale**: Portable across sessions/devices, participates in undo/redo, included in exports.
- **Trade-off**: Slightly larger diagram files (acceptable - only overridden icons).

### Decision 3: Export Handling - Automatic Behavior ✅
**Chosen**: No special export logic needed.
- JSON export: `JSON.stringify(model)` automatically includes new fields
- PNG/SVG export: `dom-to-image-more` captures rendered output (already using correct URL)
- **Rationale**: KISS principle - works correctly without additional code.

### Decision 4: Icon Pack Handling - Override System Only ✅
**Chosen**: Use override system for pack icons, NO cloning to "imported" collection.
- Pack icons: Show "Customize" button → adds override to `model.iconOverrides`
- Imported icons: Show "Edit" button → directly modifies icon in `model.icons`
- **Rationale**: Cleaner data model, no duplicate icons, clear relationship to original.

### Decision 5: Override Scope - url2D Only for MVP ✅
**Chosen**: Initially support only `url2D` in overrides.
- Future can add: scale override, name override, etc.
- **Rationale**: Focused scope for MVP, extensible for future enhancements.

---

## Current State Analysis

### Existing Icon Schema
**File:** `packages/fossflow-lib/src/schemas/icons.ts`

```typescript
export const iconSchema = z.object({
  id,
  name: constrainedStrings.name,
  url: z.string(),
  collection: constrainedStrings.name.optional(),
  isIsometric: z.boolean().optional(),
  scale: z.number().min(0.1).max(3).optional()
});
```

### Current Rendering Logic
**File:** `packages/fossflow-lib/src/hooks/useIcon.tsx`

- `useIcon` hook selects `IsometricIcon` or `NonIsometricIcon` based on `icon.isIsometric`
- Both components apply a 1.4x scale boost in 2D view mode
- Single `url` field used for all view modes

### Current Import Flow
**File:** `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/IconSelectionControls.tsx`

1. User drags/drops or selects image file
2. Image processed (scaled to 128x128 for raster, SVG used as-is)
3. User sets name, scale slider, isIsometric checkbox
4. Icon saved with single URL

---

## Phase 1: Core Infrastructure

### 1.1 Update Icon Schema

**File:** `packages/fossflow-lib/src/schemas/icons.ts`

**Changes:**
```typescript
export const iconSchema = z.object({
  id,
  name: constrainedStrings.name,
  url: z.string(),                    // Primary/isometric image (required)
  url2D: z.string().optional(),       // 2D view image (optional)
  collection: constrainedStrings.name.optional(),
  isIsometric: z.boolean().optional(), // Controls projection transform behavior
  scale: z.number().min(0.1).max(3).optional()
});
```

**Rationale:**
- `url` remains required for backwards compatibility
- `url2D` is optional - icons without it fall back to `url`
- No data migration required for existing diagrams
- Matches pattern suggested in `2D_VIEW_TODO.md:251-254`

**Tasks:**
- [ ] Add `url2D` field to schema
- [ ] Update TypeScript types (`Icon` type will auto-update via zod inference)
- [ ] Verify schema validation works for both cases (with/without url2D)

---

### 1.2 Add Icon Overrides to Model Schema

**File:** `packages/fossflow-lib/src/schemas/model.ts`

**New Schemas:**
```typescript
// Icon override schema - currently only url2D, extensible for future
export const iconOverrideSchema = z.object({
  url2D: z.string().optional()
});

export const iconOverridesSchema = z.record(z.string(), iconOverrideSchema);
```

**Update Model Schema:**
```typescript
export const modelSchema = z
  .object({
    version: z.string().max(10).optional(),
    title: constrainedStrings.name,
    description: constrainedStrings.description.optional(),
    items: modelItemsSchema,
    views: viewsSchema,
    icons: iconsSchema,
    colors: colorsSchema,
    iconOverrides: iconOverridesSchema.optional() // NEW
  })
  .superRefine((model, ctx) => {
    // ... existing validation
  });
```

**Tasks:**
- [ ] Create `iconOverrideSchema` with `url2D` field
- [ ] Create `iconOverridesSchema` as record type
- [ ] Add `iconOverrides` to `modelSchema` as optional
- [ ] Verify schema validation accepts both old and new format

---

### 1.3 Update Icon Rendering Hook

**File:** `packages/fossflow-lib/src/hooks/useIcon.tsx`

**Implementation:**
```typescript
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

    // Apply overrides if they exist (for pack icons)
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

  // Reset loaded state when URL changes
  useEffect(() => {
    setHasLoaded(false);
  }, [activeUrl]);

  const iconComponent = useMemo(() => {
    if (!icon.isIsometric) {
      setHasLoaded(true);
      // NonIsometricIcon reads icon.url internally
      return <NonIsometricIcon icon={{ ...icon, url: activeUrl }} />;
    }

    // IsometricIcon takes url as prop
    return (
      <IsometricIcon
        url={activeUrl}
        scale={icon.scale || 1}
        onImageLoaded={() => setHasLoaded(true)}
      />
    );
  }, [icon, activeUrl]);

  return {
    icon,
    iconComponent,
    hasLoaded
  };
};
```

**Tasks:**
- [ ] Import `useUiStateStore` for viewMode
- [ ] Get `iconOverrides` from model store
- [ ] Merge overrides with base icon
- [ ] Compute `activeUrl` based on viewMode and url2D
- [ ] Update icon component rendering to use `activeUrl`
- [ ] Update useEffect dependency to track `activeUrl`
- [ ] Test view mode switching updates displayed image

---

### 1.4 Add Model Store Actions for Overrides

**File:** `packages/fossflow-lib/src/stores/modelStore.tsx`

**New Actions:**
```typescript
setIconOverride: (iconId: string, override: Partial<IconOverride>) => {
  set((state) => ({
    iconOverrides: {
      ...state.iconOverrides,
      [iconId]: {
        ...(state.iconOverrides?.[iconId] || {}),
        ...override
      }
    }
  }));
},

removeIconOverride: (iconId: string) => {
  set((state) => {
    const { [iconId]: removed, ...rest } = state.iconOverrides || {};
    return { iconOverrides: rest };
  });
}
```

**Tasks:**
- [ ] Add `setIconOverride` action to model store
- [ ] Add `removeIconOverride` action to model store
- [ ] Verify overrides participate in undo/redo system
- [ ] Test setting and removing overrides

---

### 1.5 Verify Icon Components

**Files:**
- `packages/fossflow-lib/src/components/SceneLayers/Nodes/Node/IconTypes/IsometricIcon.tsx`
- `packages/fossflow-lib/src/components/SceneLayers/Nodes/Node/IconTypes/NonIsometricIcon.tsx`

**Assessment:** These components already work correctly - no changes needed.
- `IsometricIcon`: Receives `url` prop directly ✅
- `NonIsometricIcon`: Receives full `icon` object and reads `icon.url` ✅

**Tasks:**
- [ ] Verify IsometricIcon renders activeUrl correctly
- [ ] Verify NonIsometricIcon renders activeUrl correctly
- [ ] Test both components in isometric and 2D view modes
- [ ] Test with icons that have url2D and without

---

## Phase 2: Import UI Updates

### 2.1 Create Dual Image Uploader Component

**New File:** `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/DualImageUploader.tsx`

**Component Design:**
```typescript
interface DualImageUploaderProps {
  urlIsometric: string | null;
  url2D: string | null;
  onIsometricChange: (url: string | null) => void;
  on2DChange: (url: string | null) => void;
  disabled?: boolean;
}
```

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Isometric     │  │      2D         │          │
│  │   (Required)    │  │   (Optional)    │          │
│  │  ┌───────────┐  │  │  ┌───────────┐  │          │
│  │  │           │  │  │  │           │  │          │
│  │  │  [image]  │  │  │  │  [image]  │  │          │
│  │  │           │  │  │  │           │  │          │
│  │  └───────────┘  │  │  └───────────┘  │          │
│  │  [Upload/Drop]  │  │  [Upload/Drop]  │          │
│  │  [Remove]       │  │  [Remove]       │          │
│  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop zones for each image
- Click to browse file selection
- Image preview with remove button
- Visual indication of required vs optional
- Shared image processing logic (128x128 scaling, PNG conversion)

**Tasks:**
- [ ] Create `DualImageUploader.tsx` component
- [ ] Extract image processing logic into reusable utility
- [ ] Add drag-and-drop handling for both zones
- [ ] Add file input handling for both zones
- [ ] Add preview display with remove functionality
- [ ] Style to match existing UI patterns

---

### 2.2 Create Image Preview Component

**New File:** `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/ImagePreviewWithActions.tsx`

**Component Design:**
```typescript
interface ImagePreviewWithActionsProps {
  url: string | null;
  label: string;
  required?: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}
```

**Tasks:**
- [ ] Create reusable preview component
- [ ] Handle empty state with upload prompt
- [ ] Handle populated state with image + remove button
- [ ] Support drag-and-drop on the component

---

### 2.3 Update Icon Import Dialog

**File:** `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/IconSelectionControls.tsx`

**Current State Variables:**
```typescript
const [iconUrl, setIconUrl] = useState<string | null>(null);
const [iconName, setIconName] = useState<string>('');
const [iconScale, setIconScale] = useState<number>(100);
const [isIsometric, setIsIsometric] = useState<boolean>(true);
```

**Proposed State Variables:**
```typescript
interface ImportIconState {
  name: string;
  urlIsometric: string | null;  // Required
  url2D: string | null;         // Optional
  scale: number;
  isIsometric: boolean;         // Transform behavior
}

const [importState, setImportState] = useState<ImportIconState>({
  name: '',
  urlIsometric: null,
  url2D: null,
  scale: 100,
  isIsometric: true
});
```

**Updated Import Dialog Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Import Icon                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Name: [________________]                           │
│                                                     │
│  <DualImageUploader />                              │
│                                                     │
│  Scale: [────●────────] 100%                       │
│                                                     │
│  [ ] Apply isometric transform (for 3D icons)      │
│                                                     │
│              [Cancel]  [Import]                     │
└─────────────────────────────────────────────────────┘
```

**Validation:**
- Isometric image is required
- 2D image is optional
- Name is required and auto-generated from filename

**Tasks:**
- [ ] Update state management to track both URLs
- [ ] Replace single upload zone with `DualImageUploader`
- [ ] Update validation logic (require at least isometric image)
- [ ] Update icon creation to include `url2D` if provided
- [ ] Update auto-naming logic to work with either image
- [ ] Test full import flow with various combinations

---

## Phase 3: Icon Edit Capability

### 3.1 Create Icon Edit Dialog

**New File:** `packages/fossflow-lib/src/components/ItemControls/IconEditDialog/IconEditDialog.tsx`

**Component Design:**
```typescript
interface IconEditDialogProps {
  icon: Icon;
  open: boolean;
  onClose: () => void;
  onSave: (updatedIcon: Icon) => void;
}
```

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Edit Icon: "AWS Lambda"                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Name: [AWS Lambda_______]                          │
│                                                     │
│  <DualImageUploader                                 │
│    urlIsometric={icon.url}                          │
│    url2D={icon.url2D}                               │
│  />                                                 │
│                                                     │
│  Scale: [────●────────] 100%                       │
│                                                     │
│  [ ] Apply isometric transform                      │
│                                                     │
│              [Cancel]  [Save Changes]               │
└─────────────────────────────────────────────────────┘
```

**Behavior:**
- Pre-populate all fields from existing icon
- Allow changing any field
- Save updates the icon in model store
- All existing usages automatically update (icons referenced by ID)

**Tasks:**
- [ ] Create `IconEditDialog.tsx` component
- [ ] Create `index.tsx` barrel export
- [ ] Wire up to model store for saving changes
- [ ] Handle validation (name required, at least one image)
- [ ] Test editing updates all icon usages

---

### 3.2 Add Edit Action to Icon Grid

**File:** `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/IconGrid.tsx`

**Current:** Icons displayed in grid, click/double-click to select

**Proposed:** Add context menu or edit button on hover

**Options:**
1. **Hover Edit Button:** Show edit icon button on hover
2. **Context Menu:** Right-click shows "Edit", "Delete" options
3. **Both:** Support both interaction patterns

**Recommended:** Hover edit button (simpler, more discoverable)

**Tasks:**
- [ ] Add hover state to icon grid items
- [ ] Add edit button that appears on hover
- [ ] Wire up edit button to open `IconEditDialog`
- [ ] Pass selected icon to dialog

---

### 3.3 Handle Icon Pack vs Imported Icons

**Decision:** Use override system for pack icons, direct edit for imported icons.

**Approach:**
```typescript
const isPackIcon = icon.collection && icon.collection !== 'imported';
const iconOverrides = useModelStore((state) => state.iconOverrides || {});
const hasOverride = !!iconOverrides[icon.id];

if (isPackIcon) {
  // Pack icon: Use override system
  // Opens CustomizeIconDialog - only allows adding url2D
  modelStore.actions.setIconOverride(icon.id, { url2D: newUrl });
} else {
  // Imported icon: Direct edit
  // Opens IconEditDialog - full edit capability
  modelStore.actions.updateIcon(icon.id, changes);
}
```

**UI Indication:**
- **Imported icons**: Show "Edit" button (pencil icon) → Full edit dialog
- **Pack icons**: Show "Customize" button (add icon) → Limited override dialog
- **Pack icons with override**: Show badge "Custom" + allow removing override

**Benefits:**
- No duplicate icons created
- Clear distinction between pack and custom icons
- Overrides are portable (included in diagram JSON)
- Can revert to original by removing override

**Tasks:**
- [ ] Detect icon source (check `collection !== 'imported'`)
- [ ] Create `CustomizeIconDialog` for pack icons (url2D only)
- [ ] Keep `IconEditDialog` for imported icons (full edit)
- [ ] Add visual indicator (badge) for overridden pack icons
- [ ] Add "Remove customization" option for overridden icons
- [ ] Test both flows work correctly

---

## Phase 4: Polish & Icon Pack Support

### 4.1 Visual Indicators in Icon Grid

**File:** `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/IconGrid.tsx`

**Current:** Shows "flat" badge for non-isometric icons

**Proposed:** Add badge indicating dual-asset availability

**Badge Options:**
```
┌──────────┐
│  [icon]  │
│    2D ✓  │  ← Small badge in corner
└──────────┘
```

Or tooltip on hover showing asset status.

**Tasks:**
- [ ] Add visual indicator for icons with `url2D`
- [ ] Update existing "flat" badge styling for consistency
- [ ] Consider tooltip showing "Has 2D variant" on hover

---

### 4.2 Icon Override System - Already Implemented! ✅

**Status:** Core override functionality completed in Phase 1.

**Implementation Summary:**
- Overrides stored in `model.iconOverrides` (not localStorage)
- `useIcon` hook already merges overrides with base icons
- Model store actions `setIconOverride` and `removeIconOverride` available
- Participates in undo/redo automatically
- Included in diagram export/import automatically

**Integration (Already in useIcon.tsx):**
```typescript
const iconOverrides = useModelStore((state) => state.iconOverrides || {});
const override = iconOverrides[id];
if (override) {
  return { ...baseIcon, ...override };
}
```

**Remaining Tasks for Phase 4:**
- [ ] Create UI for managing overrides (CustomizeIconDialog)
- [ ] Add "Remove customization" button for overridden icons
- [ ] Add visual indicators in IconGrid
- [ ] Test override workflow end-to-end

**Note:** No separate service file needed - using model store actions directly.

---

### 4.3 Update Drag Preview

**File:** `packages/fossflow-lib/src/components/DragAndDrop/DragAndDrop.tsx`

**Current:** Uses icon URL for drag preview

**Update:** Use view-mode-appropriate URL

```typescript
const viewMode = useUiStateStore((state) => state.viewMode);

const previewUrl = useMemo(() => {
  if (viewMode === '2D' && icon.url2D) {
    return icon.url2D;
  }
  return icon.url;
}, [viewMode, icon.url, icon.url2D]);
```

**Tasks:**
- [ ] Add viewMode awareness to DragAndDrop
- [ ] Compute preview URL based on view mode
- [ ] Test drag preview shows correct image per view

---

### 4.4 Update Quick Icon Selector

**File:** `packages/fossflow-lib/src/components/ItemControls/NodeControls/QuickIconSelector.tsx`

**Enhancement:** Show view-mode-appropriate preview in selector

**Tasks:**
- [ ] Add viewMode awareness
- [ ] Show appropriate image preview per current view
- [ ] Optional: Add indicator if current view's asset is missing

---

### 4.5 Documentation Updates

**Files to Update:**
- `packages/fossflow-lib/src/components/HelpDialog/HelpDialog.tsx` - Add info about dual assets
- User-facing documentation (if exists)

**Tasks:**
- [ ] Update help dialog with dual asset information
- [ ] Add tooltip/hint for import dialog explaining both images
- [ ] Document the feature for developers

---

## Testing Checklist

### Manual Testing

**Import Flow:**
- [ ] Import icon with only isometric image
- [ ] Import icon with both images
- [ ] Import icon - verify 2D-only is rejected/warned
- [ ] Verify auto-naming works with either image as source

**View Mode Switching:**
- [ ] Place icon with dual assets
- [ ] Switch to 2D view - verify 2D image displays
- [ ] Switch to Isometric view - verify isometric image displays
- [ ] Place icon with only isometric asset
- [ ] Switch views - verify fallback to isometric image works

**Edit Flow:**
- [ ] Edit imported icon - change name
- [ ] Edit imported icon - add 2D variant
- [ ] Edit imported icon - remove 2D variant
- [ ] Edit imported icon - replace isometric image
- [ ] Edit pack icon - verify creates clone

**Persistence:**
- [ ] Export diagram with dual-asset icons
- [ ] Import diagram with dual-asset icons
- [ ] Verify icon overrides persist across sessions

**Edge Cases:**
- [ ] Undo/redo icon edits
- [ ] Delete icon with dual assets
- [ ] Copy/paste node with dual-asset icon

### Automated Tests

**Schema Tests:**
- [ ] `url2D` field validates correctly
- [ ] Schema accepts icons without `url2D`
- [ ] Schema accepts icons with `url2D`

**Hook Tests:**
- [ ] `useIcon` returns correct URL in isometric mode
- [ ] `useIcon` returns correct URL in 2D mode
- [ ] `useIcon` falls back to `url` when `url2D` missing

**Service Tests:**
- [ ] Icon override service stores/retrieves correctly
- [ ] Overrides merge correctly with base icon

---

## ✅ Finalized Decisions

All key decisions have been made and documented. See "Key Architectural Decisions" section at the top.

### 1. Required vs Optional 2D Image - DECIDED ✅
**Decision:** Optional with fallback to `url`
- Better UX - users can add 2D later
- Backwards compatible with existing icons
- Fallback behavior: `url2D ?? url`

### 2. Icon Pack Handling - DECIDED ✅
**Decision:** Override system stored in model (Option B: Local overrides)
- Overrides stored in `model.iconOverrides`
- No external dependencies on `@isoflow/isopacks`
- No icon duplication/cloning
- Portable across sessions (included in diagram JSON)

### 3. Transform Behavior (`isIsometric` flag) - DECIDED ✅
**Decision:** `isIsometric` controls projection transform, separate from URL selection
- `isIsometric: true` = apply isometric CSS transform
- `isIsometric: false` = no transform (flat rendering)
- URL selection is independent, based on `viewMode`
- Icon can have `isIsometric: true` and still show different images per view

### 4. Scale Per Asset - DECIDED ✅
**Decision:** Shared scale for both images (MVP)
- Single `scale` property applies to both `url` and `url2D`
- Simpler UI and data model
- Can add per-asset scale later if user feedback demands it

### 5. Default/Fallback Image - DECIDED ✅
**Decision:** Fall back to isometric asset (`url`)
- Clear behavior: `activeUrl = viewMode === '2D' && icon.url2D ? icon.url2D : icon.url`
- Better than showing nothing or error
- User can add 2D variant anytime

---

## File Change Summary

### New Files
- `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/DualImageUploader.tsx`
- `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/ImagePreviewWithActions.tsx`
- `packages/fossflow-lib/src/components/ItemControls/IconEditDialog/IconEditDialog.tsx`
- `packages/fossflow-lib/src/components/ItemControls/IconEditDialog/index.tsx`
- `packages/fossflow-lib/src/services/iconOverrideService.ts`

### Modified Files
- `packages/fossflow-lib/src/schemas/icons.ts` - Add `url2D` field
- `packages/fossflow-lib/src/hooks/useIcon.tsx` - View-mode URL selection
- `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/IconSelectionControls.tsx` - Dual upload UI
- `packages/fossflow-lib/src/components/ItemControls/IconSelectionControls/IconGrid.tsx` - Edit button, badges
- `packages/fossflow-lib/src/components/DragAndDrop/DragAndDrop.tsx` - View-mode preview
- `packages/fossflow-lib/src/components/ItemControls/NodeControls/QuickIconSelector.tsx` - View-mode preview

---

## Implementation Order

**Recommended sequence for minimal risk and incremental value:**

1. **Phase 1.1** - Schema update (backwards compatible, no UI changes)
2. **Phase 1.2** - Hook update (enables feature, no UI changes)
3. **Phase 1.3** - Verify components work (testing only)
4. **Phase 2.1-2.3** - Import UI (users can create dual-asset icons)
5. **Phase 3.1-3.3** - Edit UI (users can update existing icons)
6. **Phase 4.1** - Visual indicators (polish)
7. **Phase 4.2** - Icon pack overrides (advanced feature)
8. **Phase 4.3-4.4** - Preview updates (polish)
9. **Phase 4.5** - Documentation

Each phase can be shipped independently, providing incremental value.

---

## Related Documentation

- `2D_VIEW_IMPLEMENTATION.md` - 2D view architecture details
- `2D_VIEW_TODO.md` - Related future work items
- `FOSSFLOW_ENCYCLOPEDIA.md` - General codebase documentation

---

**Document maintained by**: Claude Opus 4.5
**Created**: January 28, 2026
