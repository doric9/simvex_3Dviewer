"""Quiz data seeded from frontend src/data/quizData.ts"""

from typing import TypedDict


class QuizQuestionData(TypedDict):
    id: str
    machinery_id: str
    question: str
    options: list[str]
    correct_answer: int


QUIZ_DATA: list[QuizQuestionData] = [
    # V4 Engine (5 questions)
    {
        "id": "q1",
        "machinery_id": "V4_Engine",
        "question": "V4 엔진에서 피스톤의 직선 운동을 회전 운동으로 변환하는 부품은?",
        "options": ["Piston Ring", "Crankshaft", "Connecting Rod", "Piston Pin"],
        "correct_answer": 1,
    },
    {
        "id": "q2",
        "machinery_id": "V4_Engine",
        "question": "내연기관의 4행정 사이클 순서는?",
        "options": [
            "흡입-압축-폭발-배기",
            "압축-흡입-폭발-배기",
            "흡입-폭발-압축-배기",
            "폭발-흡입-압축-배기",
        ],
        "correct_answer": 0,
    },
    {
        "id": "q10",
        "machinery_id": "V4_Engine",
        "question": "커넥팅 로드(Connecting Rod)의 주요 역할은?",
        "options": [
            "연료 분사",
            "피스톤과 크랭크샤프트 연결",
            "배기가스 배출",
            "냉각수 순환",
        ],
        "correct_answer": 1,
    },
    {
        "id": "q11",
        "machinery_id": "V4_Engine",
        "question": "피스톤 링의 주요 기능이 아닌 것은?",
        "options": ["기밀 유지", "열 전달", "오일 조절", "연료 혼합"],
        "correct_answer": 3,
    },
    {
        "id": "q12",
        "machinery_id": "V4_Engine",
        "question": "엔진에서 '압축 행정'이란?",
        "options": [
            "혼합기를 실린더로 흡입",
            "혼합기를 압축하여 온도와 압력 상승",
            "연소로 피스톤 하강",
            "연소 가스를 배출",
        ],
        "correct_answer": 1,
    },
    # Drone (5 questions)
    {
        "id": "q3",
        "machinery_id": "Drone",
        "question": "드론이 상승하려면?",
        "options": ["양력 > 중력", "양력 < 중력", "양력 = 중력", "추진력 > 항력"],
        "correct_answer": 0,
    },
    {
        "id": "q4",
        "machinery_id": "Drone",
        "question": "드론의 추진력을 생성하는 부품은?",
        "options": ["Main Frame", "Gearing", "Impeller Blade", "Leg"],
        "correct_answer": 2,
    },
    {
        "id": "q13",
        "machinery_id": "Drone",
        "question": "쿼드콥터 드론에서 전진하려면?",
        "options": [
            "모든 모터 속도 증가",
            "후방 모터 속도 증가",
            "전방 모터 속도 증가",
            "좌측 모터만 가동",
        ],
        "correct_answer": 1,
    },
    {
        "id": "q14",
        "machinery_id": "Drone",
        "question": "드론이 제자리에서 hover(정지 비행)하려면?",
        "options": [
            "양력 > 중력",
            "양력 < 중력",
            "양력 = 중력",
            "모든 모터 정지",
        ],
        "correct_answer": 2,
    },
    {
        "id": "q15",
        "machinery_id": "Drone",
        "question": "드론에서 yaw(좌우 회전)를 제어하는 방법은?",
        "options": [
            "모든 프로펠러 속도 증가",
            "대각선 프로펠러 쌍의 속도 차이 조절",
            "한쪽 프로펠러만 정지",
            "드론 기울이기",
        ],
        "correct_answer": 1,
    },
    # Suspension (4 questions)
    {
        "id": "q5",
        "machinery_id": "Suspension",
        "question": "서스펜션의 주요 역할이 아닌 것은?",
        "options": ["승차감 향상", "타이어 접지력 유지", "엔진 출력 증가", "차체 안정성 확보"],
        "correct_answer": 2,
    },
    {
        "id": "q16",
        "machinery_id": "Suspension",
        "question": "댐퍼(damper)의 역할은?",
        "options": [
            "스프링 진동 억제",
            "차체 높이 조절",
            "조향력 전달",
            "브레이크 보조",
        ],
        "correct_answer": 0,
    },
    {
        "id": "q17",
        "machinery_id": "Suspension",
        "question": "서스펜션 스프링의 역할은?",
        "options": [
            "충격 에너지 흡수 및 저장",
            "바퀴 회전",
            "엔진 동력 전달",
            "연료 공급",
        ],
        "correct_answer": 0,
    },
    {
        "id": "q18",
        "machinery_id": "Suspension",
        "question": "독립 서스펜션의 장점은?",
        "options": [
            "구조가 단순함",
            "각 바퀴가 독립적으로 움직여 승차감 향상",
            "제작 비용 저렴",
            "무게가 가벼움",
        ],
        "correct_answer": 1,
    },
    # Leaf Spring (4 questions)
    {
        "id": "q6",
        "machinery_id": "Leaf Spring",
        "question": "판 스프링이 주로 사용되는 차량은?",
        "options": ["승용차", "트럭", "오토바이", "자전거"],
        "correct_answer": 1,
    },
    {
        "id": "q19",
        "machinery_id": "Leaf Spring",
        "question": "판 스프링의 장점이 아닌 것은?",
        "options": [
            "높은 하중 지지력",
            "단순한 구조",
            "부드러운 승차감",
            "내구성이 높음",
        ],
        "correct_answer": 2,
    },
    {
        "id": "q20",
        "machinery_id": "Leaf Spring",
        "question": "판 스프링에서 판의 개수가 많아지면?",
        "options": [
            "스프링 상수 감소",
            "스프링 상수 증가",
            "무게 감소",
            "유연성 증가",
        ],
        "correct_answer": 1,
    },
    {
        "id": "q21",
        "machinery_id": "Leaf Spring",
        "question": "판 스프링의 클램프 역할은?",
        "options": [
            "판들을 하나로 고정",
            "차축에 동력 전달",
            "진동 흡수",
            "방향 조절",
        ],
        "correct_answer": 0,
    },
    # Machine Vice (4 questions)
    {
        "id": "q7",
        "machinery_id": "Machine Vice",
        "question": "공작 기계 바이스에서 공작물을 고정하는 원리는?",
        "options": ["자석", "나사 회전", "유압", "공압"],
        "correct_answer": 1,
    },
    {
        "id": "q22",
        "machinery_id": "Machine Vice",
        "question": "바이스의 조(jaw) 역할은?",
        "options": [
            "공작물 직접 접촉 및 고정",
            "나사 회전",
            "베이스 고정",
            "핸들 조작",
        ],
        "correct_answer": 0,
    },
    {
        "id": "q23",
        "machinery_id": "Machine Vice",
        "question": "바이스 스핀들의 나사 피치가 작으면?",
        "options": [
            "빠른 조임, 약한 힘",
            "느린 조임, 강한 힘",
            "조임 불가",
            "자동 해제",
        ],
        "correct_answer": 1,
    },
    {
        "id": "q24",
        "machinery_id": "Machine Vice",
        "question": "정밀 바이스의 특징은?",
        "options": [
            "조 면이 거칠다",
            "높은 평행도와 직각도",
            "플라스틱 재질",
            "수동 조작 불가",
        ],
        "correct_answer": 1,
    },
    # Robot Arm (4 questions)
    {
        "id": "q8",
        "machinery_id": "Robot Arm",
        "question": "산업용 로봇 팔의 완전한 위치/자세 제어를 위한 최소 자유도는?",
        "options": ["3축", "4축", "5축", "6축"],
        "correct_answer": 3,
    },
    {
        "id": "q25",
        "machinery_id": "Robot Arm",
        "question": "로봇 팔에서 '링크'란?",
        "options": [
            "관절 사이의 강체 부분",
            "모터의 종류",
            "센서 이름",
            "제어 알고리즘",
        ],
        "correct_answer": 0,
    },
    {
        "id": "q26",
        "machinery_id": "Robot Arm",
        "question": "로봇 팔의 엔드 이펙터란?",
        "options": [
            "로봇의 베이스",
            "작업을 수행하는 말단 장치",
            "로봇의 전원 장치",
            "로봇의 제어기",
        ],
        "correct_answer": 1,
    },
    {
        "id": "q27",
        "machinery_id": "Robot Arm",
        "question": "로봇 팔에서 역기구학(Inverse Kinematics)이란?",
        "options": [
            "관절 각도로 말단 위치 계산",
            "말단 위치로 관절 각도 계산",
            "로봇 무게 계산",
            "모터 토크 계산",
        ],
        "correct_answer": 1,
    },
    # Robot Gripper (4 questions)
    {
        "id": "q9",
        "machinery_id": "Robot Gripper",
        "question": "로봇 그리퍼에서 집게를 개폐하는 기구는?",
        "options": ["베어링", "기어와 링크", "스프링", "모터만"],
        "correct_answer": 1,
    },
    {
        "id": "q28",
        "machinery_id": "Robot Gripper",
        "question": "평행 그리퍼의 특징은?",
        "options": [
            "손가락이 평행하게 이동",
            "회전 운동만 가능",
            "한 손가락만 움직임",
            "흡착 방식 사용",
        ],
        "correct_answer": 0,
    },
    {
        "id": "q29",
        "machinery_id": "Robot Gripper",
        "question": "그리퍼에서 힘 센서의 역할은?",
        "options": [
            "물체 색상 인식",
            "파지 힘 측정 및 제어",
            "온도 측정",
            "거리 측정",
        ],
        "correct_answer": 1,
    },
    {
        "id": "q30",
        "machinery_id": "Robot Gripper",
        "question": "진공 흡착 그리퍼의 장점은?",
        "options": [
            "모든 표면에 사용 가능",
            "평평한 표면의 물체를 손상 없이 파지",
            "무거운 물체에 적합",
            "습한 환경에서 효과적",
        ],
        "correct_answer": 1,
    },
]


def get_questions_by_machinery(machinery_id: str) -> list[QuizQuestionData]:
    return [q for q in QUIZ_DATA if q["machinery_id"] == machinery_id]


def get_question_by_id(question_id: str) -> QuizQuestionData | None:
    for q in QUIZ_DATA:
        if q["id"] == question_id:
            return q
    return None
