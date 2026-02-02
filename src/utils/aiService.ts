import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API Key가 설정되지 않았습니다. AI 기능이 작동하지 않습니다.');
}

const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
}) : null;

const systemPrompts: Record<string, string> = {
  V4_Engine: '당신은 자동차 엔진 전문가입니다. V4 엔진의 구조와 작동 원리에 대해 학생들이 이해하기 쉽게 설명해주세요.',
  Drone: '당신은 드론 전문가입니다. 드론의 비행 원리와 각 부품의 역할을 학생들에게 쉽게 설명해주세요.',
  Suspension: '당신은 자동차 섀시 전문가입니다. 서스펜션의 작동 원리와 역할을 학생들에게 설명해주세요.',
  'Leaf Spring': '당신은 기계공학 전문가입니다. 판 스프링의 원리와 응용을 학생들에게 설명해주세요.',
  'Machine Vice': '당신은 공작기계 전문가입니다. 바이스의 구조와 사용법을 학생들에게 설명해주세요.',
  'Robot Arm': '당신은 로봇공학 전문가입니다. 로봇 팔의 구조와 제어 원리를 학생들에게 설명해주세요.',
  'Robot Gripper': '당신은 로봇공학 전문가입니다. 로봇 그리퍼의 메커니즘을 학생들에게 설명해주세요.',
};

export async function sendMessageToAI(
  machineryId: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  if (!openai) {
    return 'OpenAI API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.';
  }

  try {
    const systemPrompt = systemPrompts[machineryId] || '당신은 기계공학 전문가입니다.';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
  } catch (error: any) {
    console.error('OpenAI API 에러:', error);
    console.error('에러 상세:', error?.message, error?.status, error?.code);

    if (error?.status === 401) {
      return 'API 키가 유효하지 않습니다. .env 파일의 VITE_OPENAI_API_KEY를 확인해주세요.';
    }
    if (error?.status === 429) {
      return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    }
    if (error?.status === 500) {
      return 'OpenAI 서버 오류입니다. 잠시 후 다시 시도해주세요.';
    }

    return `AI 응답 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`;
  }
}
