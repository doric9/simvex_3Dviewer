# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.2.3] - 2026-02-04

### Added
- Suspension 부품 디버깅 코드 (콘솔에 Y축 위치/바운딩 박스 출력)

### Changed
- Suspension `assemblyOffset` 값 조정 (조립도에 맞게 부품 배치)
  - ROD: `[0, 1, 0]`, SPRING: `[0, 2, 0]`, NIT: `[0, 6, 0]`, NUT: `[0, 8, 0]`
- 카메라 컨트롤 마우스 버튼 매핑 변경
  - 왼쪽 드래그: 패닝(화면 이동)
  - 오른쪽 드래그: 회전

### Fixed
- `calculateExplodePosition` 함수에 `assemblyOffset` 지원 추가
- 조립 상태(factor=0)에서 부품들이 올바른 위치에 배치되도록 수정

---

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
