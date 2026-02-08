# SimVex MVP 기능 구현 평가 체크리스트 (v0.5.1)

본 문서는 해커톤 기획서의 필수 요건이 SimVex 프로젝트에 어떻게 구현되었는지 요약합니다.

## 1. 필수(Essential) 요건 체크리스트

| 구분 | 요건 | 구현 현황 | 세부 구현 내용 (코드/위치) |
| :--- | :--- | :---: | :--- |
| **필수** | 학습 기계/장비 조회 | ✅ | `MachineryGrid.tsx`, `machineryData.ts` (리스트 4~7개 지원) |
| **필수** | 3D 모델 출력 | ✅ | `Scene3D.tsx`, `ModelGroup_ai.tsx` (PBR 렌더링 및 조명 최적화) |
| **필수** | 3D 오브젝트 배치 및 인터렉션 | ✅ | `TrackballControls` 사용 (줌, **우클릭 회전**, 좌클릭 이동) |
| **필수** | 분해/조립 조절 GUI | ✅ | `ExplodeSlider.tsx`, `ProductInfo.tsx` (실시간 변위 조절 및 이론 설명) |
| **필수** | 부품 정보 조회 | ✅ | `PartInfo.tsx` (클릭 시 이름, 재질, 역할 정보 실시간 출력) |
| **필수** | 사용자 데이터 저장 | ✅ | `viewerStore.ts`, `aiStore.ts` (Zustand Persist로 JSON 직렬화 저장) |
| **필수** | 측면 서브 노트(메모장) | ✅ | `Sidebar.tsx`, `NotePanel.tsx` (부품별 메모 및 인/아웃 슬라이딩) |
| **필수** | 서브 AI 어시스턴트 | ✅ | `AIPanel.tsx`, `aiService.ts` (Gemini 2.0/OpenAI 연동 튜터링) |

## 2. 추가(Bonus) 요건 체크리스트

| 구분 | 요건 | 구현 현황 | 세부 구현 내용 |
| :--- | :--- | :---: | :--- |
| 추가 | 퀴즈 기능 | ✅ | `QuizPanel.tsx` (학습 내용 기반 적응형 퀴즈 생성) |
| 추가 | 워크플로우 차트 | ✅ | `FlowchartPage.tsx` (노드 기반 학습 프로세스 시각화) |
| 추가 | PDF 출력 | ✅ | `pdfExport.ts` (이미지 캡처 및 학습 로그 문서화) |
| 추가 | AI 조립 분석 | ✅ | `aiAssemblyService.ts` (이미지 분석을 통한 부품 자동 배치) |

## 3. 조작 방법 (MVP 사양 준수)
- **마우스 우클릭 (Right Click)**: 화면 회전 (Rotate) - *기획서 요구사항 준수*
- **마우스 좌클릭 (Left Click)**: 화면 이동 (Pan)
- **휠 (Scroll)**: 줌 인/아웃 (Zoom)
- **더블 클릭 (Double Click)**: 카메라 시점 초기화

---
**SimVex PM**: 배정윤  
**최종 업데이트**: 2026-02-09 (v0.5.1)
