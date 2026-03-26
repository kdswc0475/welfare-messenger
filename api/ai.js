export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { model, message } = req.body
  if (!model || !message) return res.status(400).json({ error: 'model과 message가 필요합니다' })

  const SYSTEM_PROMPT = '당신은 사회복지팀의 AI 비서입니다. 사회복지 업무 맥락에 맞게 친절하고 정확하게 한국어로 답변하세요.'

  try {
    // ── Gemini ──────────────────────────────────────────────
    if (model === 'Gemini Flash' || model === 'Gemini Pro') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'Gemini API 키가 설정되지 않았습니다' })

      const geminiModel = model === 'Gemini Pro' ? 'gemini-1.5-pro' : 'gemini-2.0-flash'
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
      if (!response.ok) {
        const errMsg = data.error?.message || 'Gemini 오류'
        if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          throw new Error('Gemini API 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나 다른 AI 모델을 선택해 주세요.')
        }
        throw new Error(errMsg)
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 받지 못했습니다'
      return res.status(200).json({ reply: text })
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
      if (!response.ok) {
        const errMsg = data.error?.message || 'OpenAI 오류'
        if (errMsg.includes('quota') || errMsg.includes('insufficient_quota')) {
          throw new Error('OpenAI API 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나 다른 AI 모델을 선택해 주세요.')
        }
        throw new Error(errMsg)
      }
      const text = data.choices?.[0]?.message?.content || '응답을 받지 못했습니다'
      return res.status(200).json({ reply: text })
    }

    // ── Claude (Anthropic) ───────────────────────────────────
    if (model === 'Claude Sonnet' || model === 'Claude Haiku') {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'Anthropic API 키가 설정되지 않았습니다' })

      const claudeModel = model === 'Claude Sonnet'
        ? 'claude-sonnet-4-5'
        : 'claude-haiku-4-5-20251001'
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
      if (!response.ok) {
        const errMsg = data.error?.message || 'Anthropic 오류'
        if (errMsg.includes('credit') || errMsg.includes('quota') || data.error?.type === 'overloaded_error') {
          throw new Error('Claude API 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나 다른 AI 모델을 선택해 주세요.')
        }
        throw new Error(errMsg)
      }
      const text = data.content?.[0]?.text || '응답을 받지 못했습니다'
      return res.status(200).json({ reply: text })
    }

    return res.status(400).json({ error: `지원하지 않는 모델: ${model}` })

  } catch (err) {
    console.error('AI API 오류:', err)
    return res.status(500).json({ error: err.message || 'AI 응답 중 오류가 발생했습니다' })
  }
}
