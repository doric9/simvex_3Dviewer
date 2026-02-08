# SimVex 3D Viewer

**Blaybus 2026 해커톤 MVP**  
SimVex 3D 뷰어 - 기계 조립/분해 시뮬레이션 교육 플랫폼

---

## 🎯 프로젝트 개요

기계 구조를 3D로 시각화하고 조립/분해 과정을 학습할 수 있는 교육용 3D 뷰어입니다.

### 주요 기능
- 🔧 **3D 모델 뷰어**: Three.js 기반 실시간 3D 렌더링
- 📦 **조립/분해 애니메이션**: 부품별 조립/분해 과정 시각화
- 🎮 **인터랙티브 컨트롤**: 카메라 조작, 부품 선택, 정보 패널
- 🧩 **다양한 기계 지원**: V4 엔진, 드론, 서스펜션, 로봇 암 등

---

## 🏗️ 기술 스택

| 카테고리 | 기술 |
|---------|------|
| **Frontend** | React + TypeScript + Vite |
| **3D Engine** | Three.js + React Three Fiber |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS |
| **Build & Deploy** | Vite + Vercel |

---

## 📁 프로젝트 구조 (Hook 패턴)

```
simvex-3d-viewer/
├── src/
│   ├── hooks/                    # 커스텀 Hook 모음
│   │   ├── useSceneSetup.ts        # 씬 설정 (조명, 카메라)
│   │   ├── useOrbitControls.ts     # 카메라 컨트롤
│   │   ├── useModelAnimations.ts   # 애니메이션 로직
│   │   ├── useModelLoader.ts       # 모델 로딩
│   │   └── usePartInteraction.ts   # 부품 상호작용
│   │
│   ├── components/
│   │   └── Viewer/
│   │       ├── Scene3D.tsx         # 메인 3D 씬
│   │       └── ModelGroup.tsx      # 모델 그룹 관리
│   │
│   ├── stores/                     # Zustand 상태 관리
│   ├── data/                       # 기계 데이터 (machineryData.ts)
│   ├── utils/                      # 유틸리티 함수
│   └── types/                      # TypeScript 타입 정의
│
└── public/models/                  # 3D 모델 파일 (GLB)
```

---

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에 API URL 및 필요한 설정 입력
```

### 3. 개발 서버 실행 (프론트엔드)
```bash
npm run dev
```

### 4. 백엔드 서버 실행 (AI 기능 사용 시 필수)
```bash
# 백엔드 폴더로 이동
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env에 OPENAI_API_KEY 입력

# 데이터베이스 초기화
alembic upgrade head

# 개발 서버 실행
python run_dev.py
```

### 5. 프로덕션 빌드
```bash
npm run build
```

### 6. 배포 (Vercel)
```bash
vercel
```

---

## 🎨 Hook 패턴 아키텍처

### Hook 사용 예시

```typescript
import { useSceneSetup } from '../../hooks/useSceneSetup';
import { useOrbitControls } from '../../hooks/useOrbitControls';
import { useModelAnimations } from '../../hooks/useModelAnimations';

function MyComponent() {
  // Hook으로 로직 분리
  const { lightingConfig } = useSceneSetup();
  const { controlsConfig } = useOrbitControls();
  const { calculateExplodePosition } = useModelAnimations(0.5, null);

  return (
    <Canvas>
      {/* Hook에서 가져온 설정 적용 */}
      <ambientLight intensity={lightingConfig.ambient.intensity} />
      <OrbitControls {...controlsConfig} />
    </Canvas>
  );
}
```

---

## 🔧 개발 워크플로우

### 브랜치 전략
```bash
# 기능 개발
git checkout -b feature/scene-setup
git commit -m "feat: 씬 설정 Hook 추가"
git push origin feature/scene-setup

# 버그 수정
git checkout -b fix/assembly-animation
git commit -m "fix: Suspension 조립 오프셋 수정"
git push origin fix/assembly-animation
```

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
docs: 문서 수정
style: 코드 포맷팅
test: 테스트 추가
chore: 빌드/환경 설정
```

**예시**:
```bash
git commit -m "feat: Suspension 조립/분해 애니메이션 구현"
git commit -m "fix: assemblyOffset 계산 로직 수정"
git commit -m "refactor: useModelLoader 성능 최적화"
```

---

## 📦 지원 기계 목록

| 기계 | 부품 수 | 조립/분해 | 상태 |
|------|---------|-----------|------|
| **Suspension** | 5개 | ✅ 완료 | 정상 작동 |
| **Robot Gripper** | 7개 | 🚧 작업 중 | 개발 중 |
| **Drone** | 8개 | 🚧 작업 중 | 개발 중 |
| **V4 Engine** | 9개 | ⏳ 대기 | 계획 중 |
| **Leaf Spring** | 7개 | ⏳ 대기 | 계획 중 |
| **Machine Vice** | 12개 | ⏳ 대기 | 계획 중 |
| **Robot Arm** | 5개 | ⏳ 대기 | 계획 중 |

---

## 🎯 로드맵

### Week 1 (2/1 - 2/7)
- ✅ Day 1 (2/1): 프로젝트 초기 설정
- ✅ Day 2 (2/2): Hook 패턴 구조 설계
- ✅ Day 3 (2/3): 3D 뷰어 기본 기능 구현
- ✅ Day 4 (2/4): .gitignore 및 환경 설정 개선 (v0.2.2)
- 🚧 Day 5 (2/5): Suspension 조립/분해 기능 구현
- ⏳ Day 6 (2/6): 추가 기계 조립/분해 구현
- ⏳ Day 7 (2/7): UI/UX 개선

### Week 2 (2/8 - 2/10)
- ⏳ Day 8 (2/8): AI 기능 통합
- ⏳ Day 9 (2/9): 최종 테스트 및 버그 수정
- ⏳ Day 10 (2/10): 해커톤 제출

---

## 🏆 해커톤 목표

### Bronze (기본 목표)
- ✅ 3D 뷰어 구현 (1개 기계)
- ✅ 조립/분해 기능
- ⏳ AI 채팅 기능

### Silver (도전 목표)
- Bronze +
- ⏳ 3-5개 기계 지원
- ⏳ 퀴즈/노트 기능

### Gold (최종 목표)
- Silver +
- ⏳ 전체 기계 조립/분해 완성
- ⏳ 고급 UI/UX

---

## 📄 라이센스

MIT License

---

## 🤝 기여

이 프로젝트는 Blaybus 2026 해커톤을 위한 MVP입니다.

---

**⚡ 현재 버전**: v0.5.0  
**🚀 최종 목표**: 완전한 3D 기계 교육 플랫폼

---

## 🔗 관련 링크

- [GitHub Repository](https://github.com/Jhun-bee/simvex_3Dviewer)
- [CHANGELOG](./CHANGELOG.md)
- [API Key 사용 가이드](./docs/API%20Key%20사용%20가이드.docx)

---

**Happy Coding! 🎉**
