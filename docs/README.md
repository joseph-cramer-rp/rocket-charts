# Rocket Charts Documentation

This directory contains all documentation for the Rocket Charts (FossFLOW) project.

## Documentation Structure

### 📁 Core Documentation

- **[FOSSFLOW_ENCYCLOPEDIA.md](./FOSSFLOW_ENCYCLOPEDIA.md)** - Comprehensive guide to the FossFLOW library architecture, components, and patterns
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guidelines for contributing to the project

### 📁 Implementation Plans (`/implementation`)

Detailed technical specifications and implementation plans for major features:

- **[2D_VIEW_IMPLEMENTATION.md](./implementation/2D_VIEW_IMPLEMENTATION.md)** - 2D view mode implementation details
- **[DUAL_ICON_ASSETS_IMPLEMENTATION.md](./implementation/DUAL_ICON_ASSETS_IMPLEMENTATION.md)** - Dual icon assets feature (isometric + 2D variants per icon)

### 📁 TODO Lists (`/todo`)

Active development tasks and future enhancements:

- **[2D_VIEW_TODO.md](./todo/2D_VIEW_TODO.md)** - 2D view mode future improvements
- **[FOSSFLOW_TODO.md](./todo/FOSSFLOW_TODO.md)** - General project TODO items

### 📁 User Guides (`/guides`)

How-to guides and best practices:

- **[icon-list-generation-guide.md](./guides/icon-list-generation-guide.md)** - Guide for generating icon lists
- **[LLM-GENERATION-GUIDE.md](./guides/LLM-GENERATION-GUIDE.md)** - Using LLMs to generate diagrams

---

## Quick Links

- [Main README](../README.md) - Project overview and getting started
- [FossFLOW Encyclopedia](./FOSSFLOW_ENCYCLOPEDIA.md) - Start here for architecture overview
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

---

## Recent Feature: Dual Icon Assets

The dual icon assets feature allows each icon to have separate images for isometric and 2D view modes. See [DUAL_ICON_ASSETS_IMPLEMENTATION.md](./implementation/DUAL_ICON_ASSETS_IMPLEMENTATION.md) for full details.

### Key Features:
- ✅ Import icons with both isometric and 2D images
- ✅ Automatic view-mode switching
- ✅ Independent scale control per view mode
- ✅ Icon pack customization without modifying originals
- ✅ Visual indicators for dual-asset icons
- ✅ Export/import preserves both images
