const SYSTEM_PROMPT = '당신은 사회복지팀의 AI 비서입니다. 사회복지 업무 맥락에 맞게 친절하고 정확하게 한국어로 답변하세요.'

// ── Groq 호출 ────────────────────────────────────────────────
async function callGroq(groqModel, message) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY_MISSING')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: message },
      ],
      max_tokens: 1000,
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    const isQuota = data.error?.code === 'rate_limit_exceeded' || response.status === 429
    const err = new Error(data.error?.message || 'Groq 오류')
    err.isQuota = isQuota
    throw err
  }
  return data.choices?.[0]?.message?.content || '응답을 받지 못했습니다'
}

// ── Gemini 호출 ──────────────────────────────────────────────
async function callGemini(geminiModel, message) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY_MISSING')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
      }),
    }
  )
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Gemini 오류')
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 받지 못했습니다'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { model, message } = req.body
  if (!model || !message) return res.status(400).json({ error: 'model과 message가 필요합니다' })

  try {
    // ── Llama / Mixtral → 한도 초과 시 Gemini Flash 자동 폴백 ──
    if (model === 'Llama 3.3 (무료)' || model === 'Mixtral (무료)') {
      const groqModel = model === 'Llama 3.3 (무료)'
        ? 'llama-3.3-70b-versatile'
        : 'mixtral-8x7b-32768'

      try {
        const text = await callGroq(groqModel, message)
        return res.status(200).json({ reply: text, usedModel: model })
      } catch (groqErr) {
        // Groq API 키 없음 또는 한도 초과 → Gemini Flash로 자동 전환
        if (groqErr.message === 'GROQ_API_KEY_MISSING' || groqErr.isQuota) {
          console.warn(`Groq 폴백 사유: ${groqErr.message} — Gemini Flash로 전환합니다.`)
          const geminiApiKey = process.env.GEMINI_API_KEY
          if (!geminiApiKey) {
            return res.status(500).json({ error: 'Groq 한도 초과 및 Gemini API 키도 없습니다. 관리자에게 문의하세요.' })
          }
          const text = await callGemini('gemini-2.0-flash', message)
          return res.status(200).json({ reply: text, usedModel: 'Gemini Flash (자동전환)' })
        }
        throw groqErr
      }
    }

    // ── Gemini ──────────────────────────────────────────────
    if (model === 'Gemini Flash' || model === 'Gemini Pro') {
      const geminiModel = model === 'Gemini Pro' ? 'gemini-1.5-pro' : 'gemini-2.0-flash'
      const text = await callGemini(geminiModel, message)
      return res.status(200).json({ reply: text, usedModel: model })
    }

    // ── ChatGPT (OpenAI) ─────────────────────────────────────
    if (model === 'GPT-4o' || model === 'GPT-3.5') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'OpenAI API 키가 설정되지 않았습니다' })

      const gptModel = model === 'GPT-4o' ? 'gpt-4o' : 'gpt-3.5-turbo'
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: gptModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: message },
          ],
          max_tokens: 1000,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'OpenAI 오류')
      const text = data.choices?.[0]?.message?.content || '응답을 받지 못했습니다'
      return res.status(200).json({ reply: text, usedModel: model })
    }

    // ── Claude (Anthropic) ───────────────────────────────────
    if (model === 'Claude Sonnet' || model === 'Claude Haiku') {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'Anthropic API 키가 설정되지 않았습니다' })

      const claudeModel = model === 'Claude Sonnet'
        ? 'claude-sonnet-4-5'
        : 'claude-haiku-4-5'
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: claudeModel,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'Anthropic 오류')
      const text = data.content?.[0]?.text || '응답을 받지 못했습니다'
      return res.status(200).json({ reply: text, usedModel: model })
    }

    return res.status(400).json({ error: `지원하지 않는 모델: ${model}` })

  } catch (err) {
    console.error('AI API 오류:', err)
    return res.status(500).json({ error: err.message || 'AI 응답 중 오류가 발생했습니다' })
  }
}
