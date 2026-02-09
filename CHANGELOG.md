# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [v0.5.4] - 2026-02-09

### Added
- **로봇 팔(Robot Arm) 정밀 조립 완결**: 9개 부품(Base ~ Dual Gripper)에 대한 고정밀 좌표 시스템 구축.
- **듀얼 그리퍼(Dual Hand) 시스템**: Part 8을 복제 및 ZY 평면 대칭 임플란트(Left/Right)하여 실제 산업용 로봇 도면과 일치화.
- **피벗 동기화**: Part 7(Wrist)의 조인트 구멍과 Part 8(Hand)의 조립 핀 위치를 시각적으로 완벽하게 일치시킴.
- **폭발도(Exploded View) 최적화**: 팔의 기구학적 각도를 고려한 다각도 부품 전개 및 유격 확보.

### Improved
- **데이터 무결성**: 사용자 수동 보정값을 `machineryData.ts`에 영구 반영하여 '하드코딩된 신뢰(Hardcoded-Truth)' 데이터셋 확보.

## [v0.5.3] - 2026-02-09

### Fixed
- **서스펜션(Suspension) 모델 완벽 복원**: v0.5.0의 정밀 좌표 및 스택 순서([BASE, SPRING, NUT, ROD]) 원복.
- **애니메이션 "뭉침(Clumping)" 현상 해결**: 순차적 윈도우 방식을 제거하고, 개별 속도 차등(Differential Velocity)을 적용한 동시 분해 로직으로 회귀하여 유동성 확보.
- **너트 분해 완결성 수정**: 너트 이동 속도를 정상화하여 슬라이더 100% 지점에서 전개가 멈추는 버그 수정.
- **시각적 등간격(Visual Equidistant) 시스템**: 메쉬 부피(스프링 높이 등)를 고려하여 100% 분해 시 모든 부품 사이의 '빈 공간'이 30단위로 동일하게 유지되도록 교정.

### Added
- **Manual-First 기술 결정론**: 서스펜션 등 튜닝된 모델은 AI 분석 대신 `machineryData.ts`의 수동 설정값을 절대적 진실로 사용하도록 강제 (AI 간섭 차단).

## [v0.5.2] - 2026-02-09

### Fixed
- **UI/UX 디자인 전면 개편**: 현대적이고 세련된 프리미엄 디자인 고도화 적용.
- **파비콘(Favicon) 최적화**: 프로젝트 아이덴티티에 맞는 신규 아이콘 반영.
- **MVP 조작 규격 준수 (Right-click Rotate)**: 기획서 요구 사양에 맞춰 마우스 컨트롤 맵핑 수정 (우클릭: 회전, 좌클릭: 이동).
- **데이터 보존(Persistence) 강화**: 페이지 새로고침 시에도 이전의 카메라 위치 및 줌 상태가 완벽하게 복원되도록 수정.

### Added
- **EVALUATION_CHECK.md**: 해커톤 기획서 요건 대비 구현 현황 문서 추가.

## [v0.5.1] - 2026-02-09

### Fixed
- **MVP 조작 규격 준수 (Right-click Rotate)**: 기획서 요구 사양에 맞춰 마우스 컨트롤 맵핑 수정 (우클릭: 회전, 좌클릭: 이동).
- **데이터 보존(Persistence) 강화**: 페이지 새로고침 시에도 이전의 카메라 위치 및 줌 상태가 완벽하게 복원되도록 수정.
- **UI/UX 폴리싱**: 조작 가이드 아이콘 및 설명 문구 업데이트.

### Added
- **EVALUATION_CHECK.md**: 해커톤 기획서 요건 대비 구현 현황 문서 추가.

## [v0.5.0] - 2026-02-08

### Added
- **Suspension 정밀 조립 애니메이션 완성**
  - **조립 우선 로직**: 슬라이더 0%를 '완전 조립' 상태로 고정하여 사용자 경험 개선
  - **정밀 좌표 시스템**: Nut(19.8), Rod(21.0), Spring(0.0) 등 소수점 단위 정밀 위치값 반영
  - **너트 회전(Unscrewing) 효과**: 분해 초기(0~40%) 구간에서 너트가 Y축으로 회전하며 풀려나오는 시각적 디테일 추가
  - **분해 속도 캘리브레이션**: 슬라이더 40% 지점에서 너트가 나사산 끝에 정확히 도달하도록 이동 속도 정밀 조정

### Improved
- **Viewer UI**
  - 페이지 진입 시 항상 조립 완료(0%) 상태로 초기화되도록 수정
  - AI 분석 상태 표시줄 버전 태그 업데이트 (`v0.5.0 Final Release`)

## [v0.4.1] - 2026-02-08

### Added
- **Deployment & Infrastructure (PR #11)**
  - Backend Dockerization: `Dockerfile` 및 `start.sh` 추가
  - Render.com 배포 지원: `render.yaml` 설정 파일 추가
  - 환경 변수 템플릿 고도화: `.env.example`, `backend/.env.example` 업데이트
  - Backend 환경 설정 최적화: `app/config.py` 및 `models/database.py` 수정

## [v0.4.0] - 2026-02-07

### Added
- **AI RAG System**
  - Hybrid Search & Contextual Chunks 도입으로 검색 정확도 향상
  - Source Re-ranking: 관련성 높은 문서 우선 노출
- **Knowledge Search UI**
  - 기술 문서 검색 전용 인터페이스 추가 (`components/Education/KnowledgeSearch.tsx`)
  - 검색 출처(Source) 표시 기능

### Improved
- **Quiz Performance**
  - 퀴즈 피드백 스트리밍 지원 (실시간 피드백)
  - 퀴즈 로딩 속도 최적화

## [v0.3.3] - 2026-02-05

### Added
- **자동 BoundingBox 기반 조립 시스템**
  - `AssemblyConstraintResolver` 클래스 추가: 런타임 BBox 자동 계산
  - `BoundingBoxDebugger` UI: 실시간 BBox 시각화 디버그 패널
  - `AssemblyConstraint` 타입: Fixed, StackedOn, Threaded, RadialAroundCenter 지원
- **카메라 컨트롤 안내 UI**
  - `ControlsHint` 컴포넌트: 마우스/키보드/터치 조작법 안내
  - 좌클릭 드래그=화면 이동, 우클릭 드래그=회전, 휠=줌

### Changed
- `src/types/index.ts`: AssemblyConstraint 타입 및 MachineryPart.constraint 필드 추가
- 기존 assemblyOffset과 하위 호환 유지

---

## [v0.3.2] - 2026-02-05

### Fixed
- **Suspension 조립 위치 완전 수정**
  - assemblyOffset 값 재계산: 부품 간 간격 최적화
  - ROD: `[0,3,0]` (이전 `[0,1,0]`)
  - SPRING: `[0,6,0]` (이전 `[0,2,0]`)
  - NIT: `[0,12,0]` (이전 `[0,6,0]`)
  - NUT: `[0,16,0]` (이전 `[0,8,0]`)
- 0% 분해도 시 부품들이 조립도와 일치하도록 개선
- 부품 간 겹침 현상 완전 해결

---

## [v0.3.1] - 2026-02-05

### Changed
- CHANGELOG.md 업데이트 (v0.3.0 내용 추가)
- README.md 백엔드 설정 가이드 추가
- package.json 버전 업데이트

---

## [v0.3.0] - 2026-02-05

### Added
- **AI Teacher Backend** (FastAPI 기반)
  - `/api/v1/chat/{machinery_id}` - AI 챗봇 API
  - `/api/v1/quiz/{machinery_id}/generate` - 퀴즈 생성 API
  - `/api/v1/quiz/{machinery_id}/answer` - 답변 제출 API
  - `/api/v1/progress/{user_id}` - 학습 진도 API
- **LangChain 에이전트**
  - ExplainerAgent: 기계 개념 설명
  - QuizzerAgent: 적응형 퀴즈 생성
- **데이터베이스 지원**
  - SQLite (개발용)
  - PostgreSQL (운영용)
  - Alembic 마이그레이션
- **성능 최적화**
  - Rate Limiting (글로벌 5개, 사용자별 분당 10회)
  - Multi-worker 지원 (20-100명 동시 접속)

### Changed
- `src/utils/aiService.ts` - 백엔드 API 호출 방식으로 변경
- `.env.example` - 백엔드 URL 환경 변수 추가

### Security
- API Key가 프론트엔드에서 백엔드로 이동 (보안 강화)

---

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
