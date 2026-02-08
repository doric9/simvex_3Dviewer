import { Machinery } from '../types';

export const machineryData: Record<string, Machinery> = {
  V4_Engine: {
    id: 'V4_Engine',
    name: 'V4 실린더 엔진',
    description: '4기통 V형 내연기관 엔진으로, 자동차의 동력원입니다.',
    theory: `
**작동 원리:**
1. 흡입: 실린더에 공기-연료 혼합물 유입
2. 압축: 피스톤이 올라가며 혼합물 압축
3. 폭발: 점화 플러그로 폭발, 피스톤 하강
4. 배기: 연소 가스 배출

**주요 부품:**
- Piston (x4): 왕복 운동하며 압력 생성
- Crankshaft: 피스톤의 직선 운동을 회전 운동으로 변환
- Connecting Rod: 피스톤과 크랭크샤프트 연결
`,
    thumbnail: '/models/V4_Engine/V4실린더 엔진 조립도.png',
    parts: [
      { name: 'Crankshaft', file: '/models/V4_Engine/Crankshaft.glb', material: 'Steel', role: '회전 운동 변환', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },

      // Bank 1 (Left 1)
      { name: 'Piston L1', file: '/models/V4_Engine/Piston.glb', material: 'Aluminum', role: '1번 실린더 피스톤', position: [-20, 45, 0], explodeDirection: [-0.5, 1, 0] },
      { name: 'Rod L1', file: '/models/V4_Engine/Connecting Rod.glb', material: 'Steel', role: '1번 커넥팅 로드', position: [-10, 15, 0], explodeDirection: [-0.3, 1, 0] },
      { name: 'Pin L1', file: '/models/V4_Engine/Piston Pin.glb', material: 'Steel', role: '1번 피스톤 핀', position: [-20, 45, 0], explodeDirection: [0, 0, 1] },

      // Bank 2 (Right 1)
      { name: 'Piston R1', file: '/models/V4_Engine/Piston.glb', material: 'Aluminum', role: '2번 실린더 피스톤', position: [20, 45, 20], explodeDirection: [0.5, 1, 0] },
      { name: 'Rod R1', file: '/models/V4_Engine/Connecting Rod.glb', material: 'Steel', role: '2번 커넥팅 로드', position: [10, 15, 20], explodeDirection: [0.3, 1, 0] },
      { name: 'Pin R1', file: '/models/V4_Engine/Piston Pin.glb', material: 'Steel', role: '2번 피스톤 핀', position: [20, 45, 20], explodeDirection: [0, 0, 1] },

      // Bank 3 (Left 2)
      { name: 'Piston L2', file: '/models/V4_Engine/Piston.glb', material: 'Aluminum', role: '3번 실린더 피스톤', position: [-20, 45, 40], explodeDirection: [-0.5, 1, 0] },
      { name: 'Rod L2', file: '/models/V4_Engine/Connecting Rod.glb', material: 'Steel', role: '3번 커넥팅 로드', position: [-10, 15, 40], explodeDirection: [-0.3, 1, 0] },

      // Bank 4 (Right 2)
      { name: 'Piston R2', file: '/models/V4_Engine/Piston.glb', material: 'Aluminum', role: '4번 실린더 피스톤', position: [20, 45, 60], explodeDirection: [0.5, 1, 0] },
      { name: 'Rod R2', file: '/models/V4_Engine/Connecting Rod.glb', material: 'Steel', role: '4번 커넥팅 로드', position: [10, 15, 60], explodeDirection: [0.3, 1, 0] },

      { name: 'Main Rod Cap', file: '/models/V4_Engine/Connecting Rod Cap.glb', material: 'Steel', role: '로드 캡', position: [0, -5, 30], explodeDirection: [0, -1, 0] },
    ],
  },
  Drone: {
    id: 'Drone',
    name: '드론',
    description: '4개의 프로펠러로 비행하는 쿼드콥터 드론입니다.',
    theory: `
**비행 원리:**
- 4개 모터의 회전 속도 차이로 자세 제어
- 양력 > 중력: 상승
- 양력 < 중력: 하강
- 모터 속도 불균형: 회전/이동

**주요 부품:**
- Main Frame: 드론 본체
- Impeller Blade (x4): 추진력 생성
- Gearing: 동력 전달
`,
    thumbnail: '/models/Drone/조립도1.png',
    parts: [
      { name: 'Main frame', file: '/models/Drone/Main frame.glb', material: 'Carbon Fiber', role: '드론 본체', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },

      // Propeller 1 (FR)
      { name: 'Blade FR', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '전방 우측 프로펠러', position: [30, 5, 30], explodeDirection: [1, 1, 1] },
      { name: 'Leg FR', file: '/models/Drone/Leg.glb', material: 'Plastic', role: '전방 우측 다리', position: [30, -15, 30], explodeDirection: [1, -1, 1] },

      // Propeller 2 (FL)
      { name: 'Blade FL', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '전방 좌측 프로펠러', position: [-30, 5, 30], explodeDirection: [-1, 1, 1] },
      { name: 'Leg FL', file: '/models/Drone/Leg.glb', material: 'Plastic', role: '전방 좌측 다리', position: [-30, -15, 30], explodeDirection: [-1, -1, 1] },

      // Propeller 3 (RR)
      { name: 'Blade RR', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '후방 우측 프로펠러', position: [30, 5, -30], explodeDirection: [1, 1, -1] },
      { name: 'Leg RR', file: '/models/Drone/Leg.glb', material: 'Plastic', role: '후방 우측 다리', position: [30, -15, -30], explodeDirection: [1, -1, -1] },

      // Propeller 4 (RL)
      { name: 'Blade RL', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '후방 좌측 프로펠러', position: [-30, 5, -30], explodeDirection: [-1, 1, -1] },
      { name: 'Leg RL', file: '/models/Drone/Leg.glb', material: 'Plastic', role: '후방 좌측 다리', position: [-30, -15, -30], explodeDirection: [-1, -1, -1] },
    ],
  },
  Suspension: {
    id: 'Suspension',
    name: '서스펜션',
    description: '자동차의 충격 흡수 장치입니다.',
    theory: `
**작동 원리:**
스프링과 댐퍼의 조합으로 노면 충격 흡수

**주요 기능:**
- 승차감 향상
- 타이어 접지력 유지
- 차체 안정성 확보
`,
    thumbnail: '/models/Suspension/서스펜션 조립도.png',
    parts: [
      // ✅ BASE: 바닥에 고정 (변경 없음)
      {
        name: 'BASE',
        file: '/models/Suspension/BASE.glb',
        material: 'Steel',
        role: '베이스',
        position: [0, 0, 0],
        isGround: true,
        assemblyOffset: [0, 0, 0],
        explodeDirection: [0, 0, 0]  // 바닥 고정
      },
      // ✅ ROD: BASE 바로 위
      {
        name: 'ROD',
        file: '/models/Suspension/ROD.glb',
        material: 'Steel',
        role: '로드',
        position: [0, 20, 0],
        explodeDirection: [0, 1, 0],
        assemblyOffset: [0, 3, 0]  // v0.3.2: 부품 간격 확보
      },
      // ✅ SPRING: ROD 바로 위 (스프링이 ROD를 감쌈)
      {
        name: 'SPRING',
        file: '/models/Suspension/SPRING.glb',
        material: 'Spring Steel',
        role: '스프링',
        position: [0, 40, 0],
        explodeDirection: [0, 1, 0],
        assemblyOffset: [0, 6, 0]  // v0.3.2: ROD 높이 고려
      },

      // ✅ NUT: 맨 위 (상단 캡)
      {
        name: 'NUT',
        file: '/models/Suspension/NUT.glb',
        material: 'Steel',
        role: '너트',
        position: [0, 80, 0],
        explodeDirection: [0, 1, 0],
        assemblyOffset: [0, 16, 0]  // v0.3.2: NIT 높이 고려
      },
    ],
  },
  'Leaf Spring': {
    id: 'Leaf Spring',
    name: '판 스프링',
    description: '여러 겹의 강판을 겹쳐 만든 스프링입니다.',
    theory: `
**작동 원리:**
여러 판이 굽어지면서 하중 분산

**특징:**
- 높은 하중 지지
- 내구성 우수
- 트럭, 대형차량에 사용
`,
    thumbnail: '/models/Leaf Spring/판스프링 조립도.png',
    parts: [
      { name: 'Leaf-Layer', file: '/models/Leaf Spring/Leaf-Layer.glb', material: 'Spring Steel', role: '판 레이어', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Clamp-Primary', file: '/models/Leaf Spring/Clamp-Primary.glb', material: 'Steel', role: '1차 클램프', position: [0, 10, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 5, 0] },
      { name: 'Clamp-Secondary', file: '/models/Leaf Spring/Clamp-Secondary.glb', material: 'Steel', role: '2차 클램프', position: [0, 15, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 8, 0] },
      { name: 'Support', file: '/models/Leaf Spring/Support.glb', material: 'Steel', role: '서포트', position: [0, -5, 0], explodeDirection: [0, -1, 0], assemblyOffset: [0, -5, 0] },
    ],
  },
  'Machine Vice': {
    id: 'Machine Vice',
    name: '공작 기계 바이스',
    description: '공작물을 고정하는 장치입니다.',
    theory: `
**작동 원리:**
나사의 회전으로 조(jaw)를 이동시켜 공작물 고정

**구성:**
- 고정 조: 움직이지 않음
- 이동 조: 나사로 이동
- 스핀들: 조 이동
`,
    thumbnail: '/models/Machine Vice/공작 기계 바이스.jpg',
    parts: [
      { name: 'Body', file: '/models/Machine Vice/Part1.glb', material: 'Cast Iron', role: '본체', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Fixed Jaw', file: '/models/Machine Vice/Part2 Feste Backe.glb', material: 'Steel', role: '고정 조', position: [0, 10, 20], explodeDirection: [0, 0, 1], assemblyOffset: [0, 0, 10] },
      { name: 'Movable Jaw', file: '/models/Machine Vice/Part3-lose backe.glb', material: 'Steel', role: '이동 조', position: [0, 10, -20], explodeDirection: [0, 0, -1], assemblyOffset: [0, 0, -15] },
      { name: 'Spindle', file: '/models/Machine Vice/Part7-TrapezSpindel.glb', material: 'Steel', role: '트라페즈 스핀들', position: [0, 5, -40], explodeDirection: [0, 0, -1], assemblyOffset: [0, 0, -25] },
    ],
  },
  'Robot Arm': {
    id: 'Robot Arm',
    name: '로봇 팔',
    description: '산업용 로봇 팔입니다.',
    theory: `
**작동 원리:**
여러 관절(joint)의 회전/이동으로 작업 수행

**자유도:**
- 6축: 완전한 위치/자세 제어
- 각 관절: 모터로 구동

**응용:**
조립, 용접, 도장, 픽앤플레이스
`,
    thumbnail: '/models/Robot Arm/로봇팔 조립도.png',
    parts: [
      { name: 'Base', file: '/models/Robot Arm/base.glb', material: 'Aluminum', role: '베이스', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Joint 1', file: '/models/Robot Arm/Part2.glb', material: 'Aluminum', role: '1번 관절', position: [0, 10, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 5, 0] },
      { name: 'Link 1', file: '/models/Robot Arm/Part3.glb', material: 'Aluminum', role: '1번 링크', position: [0, 25, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 10, 0] },
      { name: 'Joint 2', file: '/models/Robot Arm/Part4.glb', material: 'Aluminum', role: '2번 관절', position: [0, 45, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 15, 0] },
      { name: 'Link 2', file: '/models/Robot Arm/Part5.glb', material: 'Aluminum', role: '2번 링크', position: [0, 60, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 25, 0] },
      { name: 'End Effector', file: '/models/Robot Arm/Part8.glb', material: 'Aluminum', role: '엔드 이펙터', position: [0, 85, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 35, 0] },
    ],
  },
  'Robot Gripper': {
    id: 'Robot Gripper',
    name: '로봇 집게',
    description: '물체를 잡는 로봇 그리퍼입니다.',
    theory: `
**작동 원리:**
기어와 링크 기구로 집게 개폐

**특징:**
- 평행 그리퍼: 두 손가락 평행 이동
- 힘 제어: 물체 손상 방지
- 센서: 물체 감지

**응용:**
픽앤플레이스, 조립 작업
`,
    thumbnail: '/models/Robot Gripper/로봇집게 조립도.png',
    parts: [
      { name: 'Base Plate', file: '/models/Robot Gripper/Base Plate.glb', material: 'Aluminum', role: '베이스 플레이트', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Mounting Bracket', file: '/models/Robot Gripper/Base Mounting bracket.glb', material: 'Aluminum', role: '마운팅 브래킷', position: [0, 10, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 5, 0] },
      { name: 'Gripper Jaw', file: '/models/Robot Gripper/Gripper.glb', material: 'Aluminum', role: '그리퍼 조', position: [15, 25, 0], explodeDirection: [1, 1, 0], assemblyOffset: [10, 10, 0] },
      { name: 'Linkage', file: '/models/Robot Gripper/Link.glb', material: 'Aluminum', role: '링크 기구', position: [0, 25, 0], explodeDirection: [0, 1, 0], assemblyOffset: [0, 15, 0] },
    ],
  },
};

export const machineryList = Object.values(machineryData);
