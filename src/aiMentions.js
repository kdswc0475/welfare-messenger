// AI 멘션 목록 — api/ai.js 모델명과 반드시 일치해야 합니다
export const AI_MENTIONS = [
  { tag: '@llama',   label: 'Llama 3.3',    sub: '무료 · Groq',   model: 'Llama 3.3 (무료)', free: true  },
  { tag: '@mixtral', label: 'Mixtral',       sub: '무료 · Groq',   model: 'Mixtral (무료)',   free: true  },
  { tag: '@gemini',  label: 'Gemini Flash',  sub: '무료 · Google', model: 'Gemini Flash',     free: true  },
  { tag: '@gpt',     label: 'GPT-4o',        sub: 'OpenAI',        model: 'GPT-4o',           free: false },
  { tag: '@claude',  label: 'Claude Sonnet', sub: 'Anthropic',     model: 'Claude Sonnet',    free: false },
  { tag: '@ai',      label: 'AI 비서',       sub: '기본 모델',     model: null,               free: true  },
]

/**
 * 메시지 텍스트에서 어떤 AI 모델을 호출할지 감지합니다.
 * @returns {string|null} 모델명 (null 이면 AI 멘션 없음)
 */
export function detectMentionedModel(text, defaultModel) {
  const lower = text.toLowerCase()

  // 구체적인 모델 (@llama, @gemini 등) 먼저 확인
  for (const m of AI_MENTIONS) {
    if (m.tag === '@ai') continue
    if (lower.includes(m.tag)) return m.model
  }

  // 일반 @ai / @ai비서 → 설정의 기본 모델 사용
  if (lower.includes('@ai')) return defaultModel

  return null
}
