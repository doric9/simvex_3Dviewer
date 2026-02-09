import { Machinery } from '../types';

export const machineryData: Record<string, Machinery> = {
  V4_Engine: {
    id: 'V4_Engine',
    name: 'V4 실린더 엔진',
    description: '내연기관의 핵심인 4기통 V형 엔진입니다. (시연용 1기통 정밀 모형)',
    theory: `
**작동 원리:**
1. 흡입 -> 2. 압축 -> 3. 폭발 -> 4. 배기

**주요 부품:**
- Piston: 연소 압력으로 왕복 운동
- Crankshaft: 직선 운동을 회전 운동으로 변환
- Connecting Rod: 피스톤과 크랭크 연결
`,
    thumbnail: '/models/V4_Engine/V4실린더 엔진 조립도.png',
    parts: [
      { name: 'Crankshaft', file: '/models/V4_Engine/Crankshaft.glb', material: 'Steel', role: '회전 운동 메인 축', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Rod Cap', file: '/models/V4_Engine/Connecting Rod Cap.glb', material: 'Steel', role: '커넥팅 로드 하단 캡', position: [0, -4, 10], explodeDirection: [0, -1, 0], explodeDistance: 15 },
      { name: 'Connecting Rod', file: '/models/V4_Engine/Connecting Rod.glb', material: 'Steel', role: '피스톤 연결봉', position: [0, 8, 10], explodeDirection: [0, 1, 0], explodeDistance: 20 },
      { name: 'Piston', file: '/models/V4_Engine/Piston.glb', material: 'Aluminum', role: '연소실 피스톤', position: [0, 25, 10], explodeDirection: [0, 1, 0], explodeDistance: 25 },
      { name: 'Piston Pin', file: '/models/V4_Engine/Piston Pin.glb', material: 'Steel', role: '피스톤 고정 핀', position: [0, 25, 10], explodeDirection: [1, 0, 0], explodeDistance: 15 },
      { name: 'Piston Ring', file: '/models/V4_Engine/Piston Ring.glb', material: 'Cast Iron', role: '압축 및 오일 제어 링', position: [0, 32, 10], explodeDirection: [0, 1, 0], explodeDistance: 35 },
    ],
  },
  Drone: {
    id: 'Drone',
    name: '쿼드콥터 드론',
    description: '4개의 로터를 이용해 비행하는 드론 시스템입니다.',
    theory: `
**비행 제어:**
- 4개 모터의 RPM 조절을 통해 상승, 하강, 회전, 이동을 수행합니다.
`,
    thumbnail: '/models/Drone/조립도1.png',
    parts: [
      { name: 'Main Frame', file: '/models/Drone/Main frame.glb', material: 'Carbon Fiber', role: '기체 본체 프레임', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Propeller FR', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '전방 우측 프로펠러', position: [25, 5, 25], explodeDirection: [1, 1, 1], explodeDistance: 30, explodeSpeed: 1.5 },
      { name: 'Propeller FL', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '전방 좌측 프로펠러', position: [-25, 5, 25], explodeDirection: [-1, 1, 1], explodeDistance: 30, explodeSpeed: 1.5 },
      { name: 'Propeller RR', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '후방 우측 프로펠러', position: [25, 5, -25], explodeDirection: [1, 1, -1], explodeDistance: 30, explodeSpeed: 1.5 },
      { name: 'Propeller RL', file: '/models/Drone/Impellar Blade.glb', material: 'Plastic', role: '후방 좌측 프로펠러', position: [-25, 5, -25], explodeDirection: [-1, 1, -1], explodeDistance: 30, explodeSpeed: 1.5 },
      { name: 'Landing Gear', file: '/models/Drone/Leg.glb', material: 'Plastic', role: '착륙용 레그', position: [0, -10, 0], explodeDirection: [0, -1, 0], explodeDistance: 20 },
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
- 차체 안정성 확보
`,
    thumbnail: '/models/Suspension/서스펜션 조립도.png',
    parts: [
      {
        name: 'BASE',
        file: '/models/Suspension/BASE.glb',
        material: 'Steel',
        role: '서스펜션 하단 고정부',
        position: [0, 0, 0],
        isGround: true,
        explodeDirection: [0, 0, 0]
      },
      {
        name: 'SPRING',
        file: '/models/Suspension/SPRING.glb',
        material: 'Spring Steel',
        role: '충격 흡수용 코일 스프링',
        position: [0, 0, 0], // v0.5.0 Confirmed
        explodeDirection: [0, 1, 0],
        explodeDistance: 30.0
      },
      {
        name: 'NUT',
        file: '/models/Suspension/NUT.glb',
        material: 'Steel',
        role: '스프링 상단 고정 너트',
        position: [0, 19.8, 0], // v0.5.0 Confirmed
        explodeDirection: [0, 1, 0],
        explodeDistance: 60.2 // Final Y: 80.0 (Gap to Spring Top[50]: 30)
      },
      {
        name: 'ROD',
        file: '/models/Suspension/ROD.glb',
        material: 'Steel',
        role: '댐퍼 로드 및 상단 체결부',
        position: [0, 20.0, 0], // v0.5.0 Confirmed
        explodeDirection: [0, 1, 0],
        explodeDistance: 95.0 // Final Y: 115.0 (Gap to Nut Top[85]: 30)
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
- 트럭, 대형차량에 사용
`,
    thumbnail: '/models/Leaf Spring/판스프링 조립도.png',
    parts: [
      { name: 'Lower Plate', file: '/models/Leaf Spring/Leaf-Layer.glb', material: 'Spring Steel', role: '메인 판 레이어', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Support', file: '/models/Leaf Spring/Support.glb', material: 'Steel', role: '서포트 부싱', position: [0, -5, 0], explodeDirection: [0, -1, 0] },
      { name: 'Clamp 1', file: '/models/Leaf Spring/Clamp-Primary.glb', material: 'Steel', role: '고정용 1차 클램프', position: [0, 10, 0], explodeDirection: [0, 1, 0] },
      { name: 'Clamp 2', file: '/models/Leaf Spring/Clamp-Secondary.glb', material: 'Steel', role: '고정용 2차 클램프', position: [0, 20, 0], explodeDirection: [0, 1, 0] },
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
      { name: 'Main Body', file: '/models/Machine Vice/Part1.glb', material: 'Cast Iron', role: '바이스 본체', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Fixed Jaw', file: '/models/Machine Vice/Part2 Feste Backe.glb', material: 'Steel', role: '고정용 조', position: [0, 10, 20], explodeDirection: [0, 0, 1] },
      { name: 'Movable Jaw', file: '/models/Machine Vice/Part3-lose backe.glb', material: 'Steel', role: '이동용 조', position: [0, 10, -20], explodeDirection: [0, 0, -1] },
      { name: 'Trapez Spindle', file: '/models/Machine Vice/Part7-TrapezSpindel.glb', material: 'Steel', role: '구동용 스핀들 나사', position: [0, 5, -40], explodeDirection: [0, 0, -1] },
    ],
  },
  'Robot Arm': {
    id: 'Robot Arm',
    name: '로봇 팔',
    description: '산업용 로봇 팔입니다.',
    theory: `
**작동 원리:**
여러 관절(joint)의 회전/이동으로 작업 수행
`,
    thumbnail: '/models/Robot Arm/로봇팔 조립도.png',
    parts: [
      { name: 'Base', file: '/models/Robot Arm/base.glb', material: 'Aluminum', role: '로봇 베이스', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Shoulder', file: '/models/Robot Arm/Part2.glb', material: 'Aluminum', role: '1번 관절 링크', position: [0, 10, 0], explodeDirection: [0, 1, 0] },
      { name: 'Arm Upper', file: '/models/Robot Arm/Part3.glb', material: 'Aluminum', role: '상부 암 링크', position: [0, 25, 0], explodeDirection: [0, 1, 0] },
      { name: 'Arm Lower', file: '/models/Robot Arm/Part4.glb', material: 'Aluminum', role: '하부 암 링크', position: [0, 45, 0], explodeDirection: [0, 1, 0] },
      { name: 'Gripper', file: '/models/Robot Arm/Part8.glb', material: 'Aluminum', role: '엔드 이펙터 그리퍼', position: [0, 70, 0], explodeDirection: [0, 1, 0] },
    ],
  },
  'Robot Gripper': {
    id: 'Robot Gripper',
    name: '로봇 집게',
    description: '물체를 잡는 로봇 그리퍼입니다.',
    theory: `
**작동 원리:**
기어와 링크 기구로 집게 개폐
`,
    thumbnail: '/models/Robot Gripper/로봇집게 조립도.png',
    parts: [
      { name: 'Base Plate', file: '/models/Robot Gripper/Base Plate.glb', material: 'Aluminum', role: '그리퍼 베이스', position: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0] },
      { name: 'Mounting bracket', file: '/models/Robot Gripper/Base Mounting bracket.glb', material: 'Aluminum', role: '마운팅 브래킷', position: [0, 15, 0], explodeDirection: [0, 1, 0] },
      { name: 'Left Jaw', file: '/models/Robot Gripper/Gripper.glb', material: 'Aluminum', role: '왼쪽 집게 조', position: [-20, 30, 0], explodeDirection: [-1, 1, 0] },
      { name: 'Right Jaw', file: '/models/Robot Gripper/Gripper.glb', material: 'Aluminum', role: '오른쪽 집게 조', position: [20, 30, 0], explodeDirection: [1, 1, 0] },
    ],
  },
};

export const machineryList = Object.values(machineryData);
