import { Machinery } from '../types';

export const machineryData: Record<string, Machinery> = {
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
      { name: 'Part 2 (Shoulder)', file: '/models/Robot Arm/Part2.glb', material: 'Aluminum', role: '1번 관절 링크', position: [0, 4.1, 0], rotation: [0, 0, 0], explodeDirection: [0, 1, 0], explodeDistance: 30 },
      { name: 'Part 3 (Arm Link 1)', file: '/models/Robot Arm/Part3.glb', material: 'Aluminum', role: '상부 암 링크', position: [-1.08, 13, 8.5], rotation: [2.35, 0, 1.57], explodeDirection: [0, 1, 0.5], explodeDistance: 60 },
      { name: 'Part 4 (Arm Link 2)', file: '/models/Robot Arm/Part4.glb', material: 'Aluminum', role: '하부 암 링크', position: [1.6, 28.0, -7.4], rotation: [-0.087, 0, 0], explodeDirection: [0, 1, -0.5], explodeDistance: 90 },
      { name: 'Part 5 (Joint Link 3)', file: '/models/Robot Arm/Part5.glb', material: 'Aluminum', role: '중간 관절 링크', position: [1.6, 29.3, 7.9], rotation: [-0.087, 0, 0], explodeDirection: [0, 1, 0.5], explodeDistance: 120 },
      { name: 'Part 6 (Joint Link 4)', file: '/models/Robot Arm/Part6.glb', material: 'Aluminum', role: '전방 관절 링크', position: [1.6, 28, 15.0], rotation: [-0.698, 0, 0], explodeDirection: [0, 1, 0.8], explodeDistance: 150 },
      { name: 'Part 7 (Joint Link 5)', file: '/models/Robot Arm/Part7.glb', material: 'Aluminum', role: '손목 관절 링크', position: [1.6, 26, 16.7], rotation: [0.887, 0, 0], explodeDirection: [0, 1, 1], explodeDistance: 180 },
      { name: 'Part 8 (Hand) - Left', file: '/models/Robot Arm/Part8.glb', material: 'Aluminum', role: '그리퍼 L', position: [0, 21.7, 19.6], rotation: [-0.698, 0, -0.3], explodeDirection: [-1, 1, 1], explodeDistance: 220 },
      { name: 'Part 8 (Hand) - Right', file: '/models/Robot Arm/Part8.glb', material: 'Aluminum', role: '그리퍼 R', position: [3.2, 22.4, 20.4], rotation: [-0.698, 3.14, -0.3], explodeDirection: [1, 1, 1], explodeDistance: 220 },
    ],
  },
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
    preferredScale: 60,
    parts: [
      { name: 'Crankshaft', file: '/models/V4_Engine/Crankshaft.glb', material: 'Steel', role: '왕복↔회전 변환 메인 크랭크축', position: [0, 0, 0], rotation: [0, 0, 0], isGround: true, explodeDirection: [0, 0, 0], color: '#A0A0A0' },
      { name: 'Rod Cap', file: '/models/V4_Engine/Connecting Rod Cap.glb', material: 'Steel', role: '커넥팅 로드 빅엔드 하부 캡', position: [0, -1.0, 0], rotation: [0, 0, 0], explodeDirection: [0, -1, 0], explodeDistance: 20, color: '#808080' },
      { name: 'Conrod Bolt', file: '/models/V4_Engine/Conrod Bolt.glb', material: 'Steel', role: '캡 체결 볼트', position: [0, -2.0, 0], rotation: [0, 0, 0], explodeDirection: [0, -1, 0], explodeDistance: 40, color: '#DAA520' }, // Goldenish bolt
      { name: 'Connecting Rod', file: '/models/V4_Engine/Connecting Rod.glb', material: 'Steel', role: '직선↔회전 운동 변환 로드', position: [0, 0, 0], rotation: [0, 0, 0], explodeDirection: [0, 1, 0], explodeDistance: 30, color: '#707070' },
      { name: 'Piston Pin', file: '/models/V4_Engine/Piston Pin.glb', material: 'Steel', role: '피스톤 리스트 핀', position: [0, 5.2, 0], rotation: [0, 0, 0], explodeDirection: [1, 0, 0], explodeDistance: 50, color: '#C0C0C0' },
      { name: 'Piston', file: '/models/V4_Engine/Piston.glb', material: 'Aluminum', role: '연소 압력 수용 피스톤', position: [0, 5.2, 0], rotation: [0, 0, 0], explodeDirection: [0, 1, 0], explodeDistance: 60, color: '#E0E0E0' },
      { name: 'Piston Ring', file: '/models/V4_Engine/Piston Ring.glb', material: 'Cast Iron', role: '기밀 유지 피스톤 링', position: [0, 7.5, 0], rotation: [0, 0, 0], explodeDirection: [0, 1, 0], explodeDistance: 80, color: '#333333' },
    ],
  },
  Drone: {
    id: 'Drone',
    name: '쿼드콥터 드론',
    description: '4개의 로터를 이용해 비행하는 드론 시스템입니다.',
    theory: `
**작동 원리:**
4개의 로터를 독립적으로 제어하여 추력과 토크의 균형을 맞춤으로써 비행합니다.
- **수직 상승/하강:** 4개 모터의 속도를 동시에 조절
- **회전 (Yaw):** 대각선 방향 모터 쌍의 속도 차이 이용
- **이동 (Pitch/Roll):** 앞뒤 또는 좌우 모터 쌍의 추력 불균형 생성

**주요 부품:**
- **Main Frame:** 기체의 골격이며 모든 부품이 장착되는 기준점입니다.
- **Arm Gear & Gearing:** 모터의 회전력을 프로펠러로 전달합니다.
- **Impeller Blade:** 회전을 통해 공기를 아래로 밀어내어 양력을 발생시킵니다.
- **Landing Gear (Leg):** 이착륙 시 충격을 흡수하고 본체를 보호합니다.
`,
    thumbnail: '/models/Drone/조립도1.png',
    parts: [
      {
        name: 'Main Frame',
        file: '/models/Drone/Main frame.glb',
        material: 'Carbon Fiber',
        role: '기체 본체 프레임',
        position: [0, 0, 0],
        isGround: true,
        explodeDirection: [0, 0, 0],
      },
      {
        name: 'Main Frame Mirror',
        file: '/models/Drone/Main frame_MIR.glb',
        material: 'Carbon Fiber',
        role: '기체 대칭 프레임',
        position: [0, 0, 0],
        explodeDirection: [0, 0, 0],
        constraint: { type: 'Fixed', offset: [0, 0, 0] },
      },
      {
        name: 'Landing Gear L',
        file: '/models/Drone/Leg.glb',
        material: 'Plastic',
        role: '좌측 착륙용 레그',
        position: [0, 0, 0],
        explodeDirection: [-0.5, -1, 0],
        explodeDistance: 40,
        constraint: { type: 'StackedOn', parentPart: 'Main Frame', offset: [-10, -8, 0] },
      },
      {
        name: 'Landing Gear R',
        file: '/models/Drone/Leg.glb',
        material: 'Plastic',
        role: '우측 착륙용 레그',
        position: [0, 0, 0],
        explodeDirection: [0.5, -1, 0],
        explodeDistance: 40,
        constraint: { type: 'StackedOn', parentPart: 'Main Frame', offset: [10, -8, 0] },
      },
      {
        name: 'Arm Gear FR',
        file: '/models/Drone/Arm gear.glb',
        material: 'Metal',
        role: '전방 우측 암 기어',
        position: [0, 0, 0],
        explodeDirection: [1, 0, 1],
        explodeDistance: 50,
        constraint: { type: 'RadialAroundCenter', centerPart: 'Main Frame', radius: 35, angle: 45, offset: [0, 2, 0] },
      },
      {
        name: 'Propeller FR',
        file: '/models/Drone/Impellar Blade.glb',
        material: 'Plastic',
        role: '전방 우측 프로펠러',
        position: [0, 0, 0],
        explodeDirection: [1, 1, 1],
        explodeDistance: 80,
        constraint: { type: 'StackedOn', parentPart: 'Arm Gear FR', offset: [0, 8, 0] },
      },
      {
        name: 'Screw FR',
        file: '/models/Drone/Screw.glb',
        material: 'Steel',
        role: '프로펠러 고정 볼트',
        position: [0, 0, 0],
        explodeDirection: [1, 1.5, 1],
        explodeDistance: 100,
        constraint: { type: 'Threaded', threadedOn: 'Arm Gear FR', threadDepth: 0.9, offset: [0, 2, 0] },
      },
      {
        name: 'Arm Gear FL',
        file: '/models/Drone/Arm gear.glb',
        material: 'Metal',
        role: '전방 좌측 암 기어',
        position: [0, 0, 0],
        explodeDirection: [-1, 0, 1],
        explodeDistance: 50,
        constraint: { type: 'RadialAroundCenter', centerPart: 'Main Frame', radius: 35, angle: 135, offset: [0, 2, 0] },
      },
      {
        name: 'Propeller FL',
        file: '/models/Drone/Impellar Blade.glb',
        material: 'Plastic',
        role: '전방 좌측 프로펠러',
        position: [0, 0, 0],
        explodeDirection: [-1, 1, 1],
        explodeDistance: 80,
        constraint: { type: 'StackedOn', parentPart: 'Arm Gear FL', offset: [0, 8, 0] },
      },
      {
        name: 'Arm Gear RR',
        file: '/models/Drone/Arm gear.glb',
        material: 'Metal',
        role: '후방 우측 암 기어',
        position: [0, 0, 0],
        explodeDirection: [1, 0, -1],
        explodeDistance: 50,
        constraint: { type: 'RadialAroundCenter', centerPart: 'Main Frame', radius: 35, angle: 315, offset: [0, 2, 0] },
      },
      {
        name: 'Propeller RR',
        file: '/models/Drone/Impellar Blade.glb',
        material: 'Plastic',
        role: '후방 우측 프로펠러',
        position: [0, 0, 0],
        explodeDirection: [1, 1, -1],
        explodeDistance: 80,
        constraint: { type: 'StackedOn', parentPart: 'Arm Gear RR', offset: [0, 8, 0] },
      },
      {
        name: 'Arm Gear RL',
        file: '/models/Drone/Arm gear.glb',
        material: 'Metal',
        role: '후방 좌측 암 기어',
        position: [0, 0, 0],
        explodeDirection: [-1, 0, -1],
        explodeDistance: 50,
        constraint: { type: 'RadialAroundCenter', centerPart: 'Main Frame', radius: 35, angle: 225, offset: [0, 2, 0] },
      },
      {
        name: 'Propeller RL',
        file: '/models/Drone/Impellar Blade.glb',
        material: 'Plastic',
        role: '후방 좌측 프로펠러',
        position: [0, 0, 0],
        explodeDirection: [-1, 1, -1],
        explodeDistance: 80,
        constraint: { type: 'StackedOn', parentPart: 'Arm Gear RL', offset: [0, 8, 0] },
      },
    ],
  },
  'Leaf Spring': {
    id: 'Leaf Spring',
    name: '판 스프링',
    description: '여러 겹의 탄성이 있는 강판을 겹쳐 만든 충격 흡수 장치입니다.',
    theory: `
**작동 원리:**
강철판이 굽어질 때 발생하는 복원력을 이용해 충격을 흡수합니다. 
여러 겹의 판을 겹침으로써 마찰에 의한 감쇠 효과와 높은 하중을 견딜 수 있는 능력을 제공합니다.

**주요 기능:**
- **하중 지지:** 무거운 차체와 적재물의 무게를 분산하여 지지
- **충격 완화:** 노면의 불규칙한 충격을 흡수하여 승차감 및 안정성 확보
- **자기 감쇠:** 판들 사이의 마찰이 진동을 서서히 멈추게 함

**주요 부품:**
- **Leaf Layer:** 주된 양력을 발생하는 강판 레이어
- **Clamp:** 여러 겹의 레이어를 하나로 묶어 고정하는 장치
- **Support & Rubber:** 차체와 스프링을 연결하고 소음/진동을 차단하는 부싱류
`,
    thumbnail: '/models/Leaf Spring/판스프링 조립도.png',
    preferredScale: 80,
    parts: [
      {
        name: 'Main Leaf Layer',
        file: '/models/Leaf Spring/Leaf-Layer.glb',
        material: 'Spring Steel',
        role: '메인 탄성 판',
        position: [0, 0, 0],
        isGround: true,
        explodeDirection: [0, 0, 0],
        color: '#4A7C59',  // Forest green – main spring steel plate
      },
      {
        name: 'Center Clamp',
        file: '/models/Leaf Spring/Clamp-Center.glb',
        material: 'Steel',
        role: '중앙 고정 클램프',
        position: [0, 0, 0],
        explodeDirection: [0, 1, 0],
        explodeDistance: 40,
        constraint: { type: 'StackedOn', parentPart: 'Main Leaf Layer', offset: [0, 5, 0] },
        color: '#D4A030',  // Amber – center clamp
      },
      {
        name: 'Primary Clamp',
        file: '/models/Leaf Spring/Clamp-Primary.glb',
        material: 'Steel',
        role: '측면 주 클램프',
        position: [0, 0, 0],
        explodeDirection: [0, 1, 0],
        explodeDistance: 60,
        constraint: { type: 'StackedOn', parentPart: 'Main Leaf Layer', offset: [-100, 2, 0] },
        color: '#C47B2B',  // Burnt orange – primary clamp
      },
      {
        name: 'Secondary Clamp',
        file: '/models/Leaf Spring/Clamp-Secondary.glb',
        material: 'Steel',
        role: '측면 보조 클램프',
        position: [0, 0, 0],
        explodeDirection: [0, 1, 0],
        explodeDistance: 80,
        constraint: { type: 'StackedOn', parentPart: 'Main Leaf Layer', offset: [100, 2, 0] },
        color: '#E8943A',  // Orange – secondary clamp
      },
      {
        name: 'Main Support',
        file: '/models/Leaf Spring/Support.glb',
        material: 'Steel',
        role: '메인 연결 서포터',
        position: [0, 0, 0],
        explodeDirection: [0, -1, 0],
        explodeDistance: 40,
        constraint: { type: 'StackedOn', parentPart: 'Main Leaf Layer', offset: [0, -5, 0] },
        color: '#5B8FA8',  // Steel blue – main support
      },
      {
        name: 'Chassis Support',
        file: '/models/Leaf Spring/Support-Chassis.glb',
        material: 'Steel',
        role: '차체 체결 브래킷',
        position: [0, 0, 0],
        explodeDirection: [0, -1, 0],
        explodeDistance: 60,
        constraint: { type: 'StackedOn', parentPart: 'Main Support', offset: [0, -4, 0] },
        color: '#3A6B8C',  // Dark blue – chassis support
      },
      {
        name: 'Rigid Support',
        file: '/models/Leaf Spring/Support-Chassis Rigid.glb',
        material: 'Steel',
        role: '차체 고정 리지드 서포트',
        position: [0, 0, 0],
        explodeDirection: [0, -1, 0],
        explodeDistance: 80,
        constraint: { type: 'StackedOn', parentPart: 'Chassis Support', offset: [0, -2, 0] },
        color: '#2E5A73',  // Navy – rigid support
      },
      {
        name: 'Rubber Bushing',
        file: '/models/Leaf Spring/Support-Rubber.glb',
        material: 'Rubber',
        role: '진동 흡수용 고무 부싱',
        position: [0, 0, 0],
        explodeDirection: [-1, -1, 0],
        explodeDistance: 100,
        constraint: { type: 'StackedOn', parentPart: 'Rigid Support', offset: [-20, 0, 0] },
        color: '#333333',  // Dark charcoal – rubber bushing
      },
      {
        name: 'Rubber 60mm',
        file: '/models/Leaf Spring/Support-Rubber 60mm.glb',
        material: 'Rubber',
        role: '60mm 대형 부싱',
        position: [0, 0, 0],
        explodeDirection: [1, -1, 0],
        explodeDistance: 100,
        constraint: { type: 'StackedOn', parentPart: 'Rigid Support', offset: [20, 0, 0] },
        color: '#444444',  // Charcoal – rubber 60mm bushing
      },
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
