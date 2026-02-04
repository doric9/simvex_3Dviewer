"""Machinery data mirrored from frontend src/data/machineryData.ts"""

from typing import TypedDict, Optional


class MachineryPart(TypedDict, total=False):
    name: str
    file: str
    material: str
    role: str
    parent: Optional[str]


class Machinery(TypedDict):
    id: str
    name: str
    description: str
    theory: str
    parts: list[MachineryPart]


MACHINERY_DATA: dict[str, Machinery] = {
    "V4_Engine": {
        "id": "V4_Engine",
        "name": "V4 실린더 엔진",
        "description": "4기통 V형 내연기관 엔진으로, 자동차의 동력원입니다.",
        "theory": """**작동 원리:**
1. 흡입: 실린더에 공기-연료 혼합물 유입
2. 압축: 피스톤이 올라가며 혼합물 압축
3. 폭발: 점화 플러그로 폭발, 피스톤 하강
4. 배기: 연소 가스 배출

**주요 부품:**
- Piston: 왕복 운동하며 압력 생성
- Crankshaft: 피스톤의 직선 운동을 회전 운동으로 변환
- Connecting Rod: 피스톤과 크랭크샤프트 연결""",
        "parts": [
            {"name": "Piston", "material": "Aluminum", "role": "왕복 운동으로 압력 생성"},
            {"name": "Crankshaft", "material": "Steel", "role": "회전 운동 변환"},
            {"name": "Connecting Rod", "material": "Steel", "role": "피스톤과 크랭크샤프트 연결"},
            {"name": "Connecting Rod Cap", "material": "Steel", "role": "연결봉 고정"},
            {"name": "Conrod Bolt", "material": "Steel", "role": "볼트 체결"},
            {"name": "Piston Pin", "material": "Steel", "role": "피스톤 핀"},
            {"name": "Piston Ring", "material": "Cast Iron", "role": "밀봉 링"},
        ],
    },
    "Drone": {
        "id": "Drone",
        "name": "드론",
        "description": "4개의 프로펠러로 비행하는 쿼드콥터 드론입니다.",
        "theory": """**비행 원리:**
- 4개 모터의 회전 속도 차이로 자세 제어
- 양력 > 중력: 상승
- 양력 < 중력: 하강
- 모터 속도 불균형: 회전/이동

**주요 부품:**
- Main Frame: 드론 본체
- Impeller Blade: 추진력 생성
- Gearing: 동력 전달""",
        "parts": [
            {"name": "Main frame", "material": "Carbon Fiber", "role": "드론 본체"},
            {"name": "Arm gear", "material": "Plastic", "role": "암 기어"},
            {"name": "Beater disc", "material": "Plastic", "role": "비터 디스크"},
            {"name": "Gearing", "material": "Metal", "role": "기어 시스템"},
            {"name": "Impellar Blade", "material": "Plastic", "role": "프로펠러"},
            {"name": "Leg", "material": "Plastic", "role": "착륙 다리"},
            {"name": "Nut", "material": "Metal", "role": "너트"},
            {"name": "Screw", "material": "Metal", "role": "나사"},
        ],
    },
    "Suspension": {
        "id": "Suspension",
        "name": "서스펜션",
        "description": "자동차의 충격 흡수 장치입니다.",
        "theory": """**작동 원리:**
스프링과 댐퍼의 조합으로 노면 충격 흡수

**주요 기능:**
- 승차감 향상
- 타이어 접지력 유지
- 차체 안정성 확보""",
        "parts": [
            {"name": "BASE", "material": "Steel", "role": "베이스"},
            {"name": "ROD", "material": "Steel", "role": "로드"},
            {"name": "SPRING", "material": "Spring Steel", "role": "스프링"},
            {"name": "NIT", "material": "Steel", "role": "빨간 기어"},
            {"name": "NUT", "material": "Steel", "role": "너트"},
        ],
    },
    "Leaf Spring": {
        "id": "Leaf Spring",
        "name": "판 스프링",
        "description": "여러 겹의 강판을 겹쳐 만든 스프링입니다.",
        "theory": """**작동 원리:**
여러 판이 굽어지면서 하중 분산

**특징:**
- 높은 하중 지지
- 내구성 우수
- 트럭, 대형차량에 사용""",
        "parts": [
            {"name": "Leaf-Layer", "material": "Spring Steel", "role": "판 레이어"},
            {"name": "Clamp-Primary", "material": "Steel", "role": "1차 클램프"},
            {"name": "Clamp-Secondary", "material": "Steel", "role": "2차 클램프"},
            {"name": "Clamp-Center", "material": "Steel", "role": "중앙 클램프"},
            {"name": "Support", "material": "Steel", "role": "서포트"},
            {"name": "Support-Chassis", "material": "Steel", "role": "섀시 서포트"},
            {"name": "Support-Rubber", "material": "Rubber", "role": "고무 서포트"},
        ],
    },
    "Machine Vice": {
        "id": "Machine Vice",
        "name": "공작 기계 바이스",
        "description": "공작물을 고정하는 장치입니다.",
        "theory": """**작동 원리:**
나사의 회전으로 조(jaw)를 이동시켜 공작물 고정

**구성:**
- 고정 조: 움직이지 않음
- 이동 조: 나사로 이동
- 스핀들: 조 이동""",
        "parts": [
            {"name": "Part1", "material": "Cast Iron", "role": "본체"},
            {"name": "Part1 Fuhrung", "material": "Steel", "role": "가이드"},
            {"name": "Part2 Feste Backe", "material": "Steel", "role": "고정 조"},
            {"name": "Part3-lose backe", "material": "Steel", "role": "이동 조"},
            {"name": "Part4 spindelsockel", "material": "Steel", "role": "스핀들 소켓"},
            {"name": "Part5-Spannbacke", "material": "Steel", "role": "클램프 조"},
            {"name": "Part6-fuhrungschiene", "material": "Steel", "role": "가이드 레일"},
            {"name": "Part7-TrapezSpindel", "material": "Steel", "role": "트라페즈 스핀들"},
        ],
    },
    "Robot Arm": {
        "id": "Robot Arm",
        "name": "로봇 팔",
        "description": "산업용 로봇 팔입니다.",
        "theory": """**작동 원리:**
여러 관절(joint)의 회전/이동으로 작업 수행

**자유도:**
- 6축: 완전한 위치/자세 제어
- 각 관절: 모터로 구동

**응용:**
조립, 용접, 도장, 픽앤플레이스""",
        "parts": [
            {"name": "base", "material": "Aluminum", "role": "베이스"},
            {"name": "Part2", "material": "Aluminum", "role": "1번 링크"},
            {"name": "Part3", "material": "Aluminum", "role": "2번 링크"},
            {"name": "Part4", "material": "Aluminum", "role": "3번 링크"},
            {"name": "Part5", "material": "Aluminum", "role": "4번 링크"},
            {"name": "Part6", "material": "Aluminum", "role": "5번 링크"},
            {"name": "Part7", "material": "Aluminum", "role": "6번 링크"},
            {"name": "Part8", "material": "Aluminum", "role": "엔드 이펙터"},
        ],
    },
    "Robot Gripper": {
        "id": "Robot Gripper",
        "name": "로봇 집게",
        "description": "물체를 잡는 로봇 그리퍼입니다.",
        "theory": """**작동 원리:**
기어와 링크 기구로 집게 개폐

**특징:**
- 평행 그리퍼: 두 손가락 평행 이동
- 힘 제어: 물체 손상 방지
- 센서: 물체 감지

**응용:**
픽앤플레이스, 조립 작업""",
        "parts": [
            {"name": "Base Plate", "material": "Aluminum", "role": "베이스 플레이트"},
            {"name": "Base Gear", "material": "Steel", "role": "베이스 기어"},
            {"name": "Base Mounting bracket", "material": "Aluminum", "role": "마운팅 브래킷"},
            {"name": "Gripper", "material": "Aluminum", "role": "그리퍼"},
            {"name": "Link", "material": "Aluminum", "role": "링크"},
            {"name": "Gear link 1", "material": "Steel", "role": "기어 링크 1"},
            {"name": "Gear link 2", "material": "Steel", "role": "기어 링크 2"},
        ],
    },
}


def get_machinery(machinery_id: str) -> Machinery | None:
    return MACHINERY_DATA.get(machinery_id)


def get_machinery_context(machinery_id: str) -> str:
    """Generate context string for AI agents from machinery data."""
    machinery = get_machinery(machinery_id)
    if not machinery:
        return ""

    parts_info = "\n".join(
        f"- {p['name']}: {p.get('role', '')} (재질: {p.get('material', '알 수 없음')})"
        for p in machinery["parts"]
    )

    return f"""## {machinery['name']}
{machinery['description']}

### 이론 및 작동 원리
{machinery['theory']}

### 부품 목록
{parts_info}
"""
