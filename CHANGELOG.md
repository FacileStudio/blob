# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-11-04

### Added
- Showcase banner and terminal art screenshots in README.
- Asset rendering script for documentation.

### Changed
- Eye movement smoothing: removed snap jump threshold so pointer and typing caret tracking glide smoothly without sudden popping or twitching.
- Graceful gaze rest: pointer exit smoothly recenters eyes instead of aiming off-screen.

## [0.2.0] - 2026-11-04

### Changed
- Eye generation geometry: rounder, cute button eyes with ratio clamped to 1.0-1.25, base radius increased to 0.10-0.14 rx, true ellipse shape (n=2), and zero accidental inward/outward tilts.
- Golden test fixtures regenerated across all 1,000 seeds.

## [0.1.1] - 2026-11-03

### Fixed
- Terminal rasterizer centered on blob bounds to keep round shapes symmetric.
- Snapped eye pixels to whole grid units.

## [0.1.0] - 2026-11-03

### Added
- Initial release: deterministic Svelte 5 avatar component and Go terminal truecolor rasterizer.
