# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.2.1] - 2026-02-04

### Added
- CHANGELOG.md for version history tracking

### Changed
- Updated package.json version to 0.2.1

---

## [v0.2.2] - 2026-02-04

### Added
- `.env.example` template for environment variables setup
- Comprehensive `.gitignore` improvements:
  - Build outputs: `build/`, `out/`, `.next/`, `.vercel/`
  - Environment variable patterns: `.env.local`, `.env.*.local`
  - OS-specific files: Windows/Mac/Linux system files
  - Editor configurations: VSCode, IntelliJ, Vim, etc.
  - Testing outputs: `coverage/`, `.nyc_output`
  - Temporary files: `*.tmp`, `*.temp`, `.cache/`
  - Korean documentation: `도사제공자료/`, `*기획서*`, `*설계도*`
  - TypeScript build files: `*.tsbuildinfo`, `next-env.d.ts`

### Security
- ✅ Enhanced environment variable protection (all variants blocked)
- ✅ API Key document protection
- ✅ Project documentation leak prevention

### Improved
- **Collaboration**: Prevented editor config conflicts across different IDEs
- **Security**: Comprehensive sensitive file protection
- **Repository**: Optimized repository size by excluding cache/temp files

---

## [v0.2.0] - 2026-02-04

### Added
- Auto-expand info panels for selected 3D parts
- Collapsible panels with gesture hints upgrade
- Smooth camera focus and reset animations

### Improved
- Camera control improvements with better UX
- Enhanced user interaction feedback

---

## [v0.1.0] - 2026-02-02

### Added
- 3D part selection logic improvements
- AI integration environment setup (.env configuration)

### Fixed
- 3D part selection accuracy and responsiveness

---

## [v0.0.0] - Initial Release

### Added
- Initial project structure with React + TypeScript + Three.js
- Basic 3D viewer implementation
- Zustand state management setup
- Vite build configuration
