"""Quiz data seeded from frontend src/data/quizData.ts"""

from typing import TypedDict


class QuizQuestionData(TypedDict):
    id: str
    machinery_id: str
    question: str
    options: list[str]
    correct_answer: int


QUIZ_DATA: list[QuizQuestionData] = [
    # V4 Engine
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
    # Drone
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
    # Suspension
    {
        "id": "q5",
        "machinery_id": "Suspension",
        "question": "서스펜션의 주요 역할이 아닌 것은?",
        "options": ["승차감 향상", "타이어 접지력 유지", "엔진 출력 증가", "차체 안정성 확보"],
        "correct_answer": 2,
    },
    # Leaf Spring
    {
        "id": "q6",
        "machinery_id": "Leaf Spring",
        "question": "판 스프링이 주로 사용되는 차량은?",
        "options": ["승용차", "트럭", "오토바이", "자전거"],
        "correct_answer": 1,
    },
    # Machine Vice
    {
        "id": "q7",
        "machinery_id": "Machine Vice",
        "question": "공작 기계 바이스에서 공작물을 고정하는 원리는?",
        "options": ["자석", "나사 회전", "유압", "공압"],
        "correct_answer": 1,
    },
    # Robot Arm
    {
        "id": "q8",
        "machinery_id": "Robot Arm",
        "question": "산업용 로봇 팔의 완전한 위치/자세 제어를 위한 최소 자유도는?",
        "options": ["3축", "4축", "5축", "6축"],
        "correct_answer": 3,
    },
    # Robot Gripper
    {
        "id": "q9",
        "machinery_id": "Robot Gripper",
        "question": "로봇 그리퍼에서 집게를 개폐하는 기구는?",
        "options": ["베어링", "기어와 링크", "스프링", "모터만"],
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
