# 2D View Mode - TODO & Future Enhancements

**Last Updated**: January 26, 2026
**Status**: Core functionality complete, enhancements pending

---

## 🎯 Priority: Critical (Blocking Issues)

### ✅ COMPLETED
- [x] Fix coordinate alignment issues (grid, cursor, Y-axis)
- [x] Fix context menu positioning in 2D view
- [x] Fix camera preservation when switching views
- [x] Fix smart icon scaling in 2D view
- [x] Fix TransformControls (resize handles) in 2D view
- [x] Fix DragAndDrop (icon preview) in 2D view
- [x] Fix camera drift when repeatedly switching views

---

## 📦 Priority: High (Code Quality & Consistency)

### Reduce Code Duplication

#### Extract Scale Boost Constant
**Status**: Not Started
**Effort**: Small (15 min)
**Files**: `IsometricIcon.tsx`, `NonIsometricIcon.tsx`, `config.ts`

**Issue**: The `1.4` scale multiplier is duplicated in both icon components.

**Proposal**:
```typescript
// In src/config.ts
export const VIEW_MODE_ICON_SCALE = {
  ISOMETRIC: 1.0,
  '2D': 1.4  // Compensates for tile size difference (141.5px → 100px)
} as const;

// Or calculate dynamically:
export const VIEW_MODE_ICON_SCALE = {
  ISOMETRIC: 1.0,
  '2D': PROJECTED_TILE_SIZE.width / UNPROJECTED_TILE_SIZE  // ~1.415
} as const;
```

**Benefits**:
- Single source of truth
- Easier to adjust scaling factor
- Self-documenting via constant name

---

#### Create Scale Boost Utility Hook
**Status**: Not Started
**Effort**: Small (20 min)
**Files**: `hooks/useViewModeScaleBoost.ts`, `IsometricIcon.tsx`, `NonIsometricIcon.tsx`

**Issue**: Every icon component independently calculates the same `viewModeScaleBoost` value.

**Proposal**:
```typescript
// In src/hooks/useViewModeScaleBoost.ts
export const useViewModeScaleBoost = () => {
  const viewMode = useUiStateStore((state) => state.viewMode);
  return useMemo(() => {
    return VIEW_MODE_ICON_SCALE[viewMode];
  }, [viewMode]);
};

// Usage in icon components:
const scaleBoost = useViewModeScaleBoost();
```

**Benefits**:
- Reusable hook
- Consistent behavior across components
- Easier to test

---

## ⚡ Priority: Medium (Performance Optimizations)

### Projection Context Provider
**Status**: Not Started
**Effort**: Medium (1-2 hours)
**Files**: `contexts/ProjectionContext.tsx`, multiple consumers

**Issue**: Many components (~10+) independently call `getProjectionUtils(viewMode)`, creating redundant calculations.

**Impact**:
- With 50+ icons/nodes, each creates projection utils independently
- Minimal but unnecessary recalculations on viewMode change

**Proposal**:
```typescript
// src/contexts/ProjectionContext.tsx
export const ProjectionProvider = ({ children }) => {
  const viewMode = useUiStateStore((state) => state.viewMode);
  const projection = useMemo(() => getProjectionUtils(viewMode), [viewMode]);

  return (
    <ProjectionContext.Provider value={projection}>
      {children}
    </ProjectionContext.Provider>
  );
};

export const useProjection = () => useContext(ProjectionContext);

// Usage:
const projection = useProjection();  // Single calculation, shared by all
```

**Benefits**:
- Single projection calculation per view mode
- Better performance with many nodes/icons
- Cleaner component code

**Trade-offs**:
- Adds context provider complexity
- Needs to be added high in component tree

---

## 🎨 Priority: Low (UX Polish)

### View Mode Transition Animation
**Status**: Not Started
**Effort**: Small (30 min)
**Files**: `SceneLayer.tsx` or similar

**Opportunity**: Add smooth visual transition when switching view modes.

**Proposal**:
```typescript
// In SceneLayer.tsx
const viewMode = useUiStateStore((state) => state.viewMode);
const prevViewModeRef = useRef(viewMode);

useEffect(() => {
  if (prevViewModeRef.current !== viewMode && elementRef.current) {
    // Fade or scale transition
    gsap.fromTo(elementRef.current,
      { opacity: 0.7 },
      { opacity: 1, duration: 0.2, ease: 'power2.out' }
    );
  }
  prevViewModeRef.current = viewMode;
}, [viewMode]);
```

**Benefits**:
- Smoother, more polished UX
- Visual feedback that mode changed
- Reduces jarring effect of instant switch

---

### Keyboard Shortcut for View Toggle
**Status**: Not Started
**Effort**: Small (20 min)
**Files**: `config/hotkeys.ts`, keyboard event handler

**Issue**: No keyboard shortcut to toggle view mode.

**Proposal**:
```typescript
// In src/config/hotkeys.ts
export const HOTKEY_PROFILES = {
  default: {
    // ... existing
    toggleViewMode: 'V',
  }
};
```

**Benefits**:
- Faster workflow for power users
- Consistent with other hotkey patterns

---

### Persist View Mode Preference
**Status**: Not Started
**Effort**: Small (30 min)
**Files**: `uiStateStore.tsx`

**Opportunity**: Remember user's preferred view mode across sessions.

**Proposal**:
```typescript
// In uiStateStore.tsx setViewMode
localStorage.setItem('preferredViewMode', newViewMode);

// On store initialization
const savedViewMode = localStorage.getItem('preferredViewMode') || 'ISOMETRIC';
viewMode: savedViewMode as ViewMode,
```

**Benefits**:
- Better UX - remembers user preference
- One-time setup, persistent benefit

**Considerations**:
- Decide if this should be per-project or global
- Handle migration/defaults gracefully

---

## 🔍 Priority: Research (Needs Investigation)

### Camera Preservation Without Drift
**Status**: Research
**Effort**: Large (4-8 hours)

**Current State**: Camera preservation was removed due to cumulative drift.

**Problem**:
- Users may want camera to stay centered on same content when switching views
- Current approach (removed) caused drift due to Math.floor() precision loss

**Potential Solutions**:
1. **Floating-point tile tracking**: Store precise (non-floored) tile coordinates
2. **World-space anchor**: Track a stable reference point in world coordinates
3. **Scroll ratio preservation**: Calculate and preserve scroll position as ratio of viewport

**Research Needed**:
- Test different approaches with various zoom levels
- Measure precision requirements
- User testing to determine if benefit outweighs complexity

**Decision**: Deferred - current "no adjustment" approach is acceptable

---

### Isometric Icon Display in 2D Mode
**Status**: Research
**Effort**: Medium-Large (2-4 hours)

**Issue**: Icons with `isIsometric: true` have baked-in 3D perspective. They may look odd in flat 2D view.

**Current State**: Icons scale correctly but retain their isometric appearance.

**Potential Solutions**:
1. **Inverse Transform**: Apply CSS transform to "flatten" isometric icons
   ```typescript
   transform: viewMode === '2D' ? 'matrix(...)' : 'none'
   ```
2. **Alternative Assets**: Support optional 2D versions of icons
   ```typescript
   icon: {
     url: 'isometric.png',
     url2D?: 'flat.png',  // Optional flat version
   }
   ```
3. **Visual Indicator**: Show badge/warning when using isometric icons in 2D
4. **Do Nothing**: Current behavior may be acceptable

**Research Needed**:
- User testing with real isometric icons
- Assess visual quality of inverse transform
- Gauge demand for alternative assets

**Decision**: Deferred - awaiting user feedback

---

## 📊 Known Limitations

### Grid Background Pattern in 2D
**Status**: Working as designed
**Current**: CSS linear gradients for rectangular grid
**Alternative**: Could use SVG pattern for consistency with isometric

**Decision**: Current approach is sufficient

---

### Transform Controls in 2D
**Status**: Fixed (PR #3)
**Note**: Resize handles now work correctly in both views

---

### Export Functionality
**Status**: Untested
**Files**: Export/screenshot functionality

**Need to Test**:
- PNG export in 2D view
- PDF export in 2D view
- Ensure correct projection is captured

**Priority**: Low - likely works already, but should be verified

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Switch view modes with empty canvas
- [ ] Switch with 50+ nodes and observe performance
- [ ] Test all zoom levels (0.1x to 3x)
- [ ] Test resize handles on rectangles in 2D
- [ ] Test icon placement preview in 2D
- [ ] Test context menu positioning in 2D
- [ ] Test connector drawing in 2D
- [ ] Test lasso selection in 2D
- [ ] Test text box placement in 2D
- [ ] Verify camera doesn't drift on repeated switches
- [ ] Test with various icon types (isometric vs flat)

### Automated Testing
- [ ] Unit tests for orthoProjection utilities
- [ ] Unit tests for projectionFactory
- [ ] Integration tests for view mode switching
- [ ] Snapshot tests for visual regression

---

## 📝 Documentation Needs

### User-Facing
- [ ] Update help dialog with 2D view information
- [ ] Add tooltip/hint for view mode toggle button
- [ ] Document keyboard shortcut (if added)
- [ ] Add to user guide/documentation

### Developer-Facing
- [ ] Update architecture documentation
- [ ] Document projection system design
- [ ] Add JSDoc comments to projection utilities
- [ ] Update contributing guidelines

---

## 🚀 Related PRs

- **PR #1**: Core coordinate alignment fixes (`jc/2d-view-test`)
- **PR #2**: Icon scaling & camera optimization (`jc/2d-shapes`)
- **PR #3**: Critical bug fixes (`jc/2d-critical-fixes`)

---

## 📌 Notes for Future Developers

### Design Decisions

1. **Why two projection systems?**
   - Isometric and orthographic projections have fundamentally different math
   - Separating them keeps code clean and maintainable

2. **Why no camera preservation?**
   - Original implementation caused cumulative drift
   - Trade-off between complexity and user benefit
   - Can be revisited if users strongly request it

3. **Why 1.4x scale boost in 2D?**
   - Compensates for tile size difference (141.5px → 100px)
   - Maintains visual consistency across view modes
   - Calculated as `PROJECTED_TILE_SIZE.width / UNPROJECTED_TILE_SIZE`

### Common Pitfalls

1. **Always use projection utils**: Don't call `getTilePosition()` directly - use `projection.getTilePosition()`
2. **Include projection in dependencies**: When using projection in useMemo/useCallback, include it in dependency array
3. **Test in both views**: Any positioning/sizing changes must be tested in both isometric and 2D modes

### Getting Help

- See `2D_VIEW_IMPLEMENTATION.md` for comprehensive implementation details
- Check git history for context on decisions
- PRs #1-3 contain detailed explanations and examples

---

**Document maintained by**: Claude Sonnet 4.5
**Created**: January 26, 2026
