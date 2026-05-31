import { getSupabaseAdmin } from './supabase'

// Claude Haiku 4.5 pricing (USD per 1M tokens)
const CLAUDE_HAIKU_IN  = 0.80
const CLAUDE_HAIKU_OUT = 4.00
// Claude Sonnet 4.6 pricing
const CLAUDE_SONNET_IN  = 3.00
const CLAUDE_SONNET_OUT = 15.00

export type ApiName = 'claude-haiku' | 'claude-sonnet' | 'gemini'

function costUsd(api: ApiName, inputTokens: number, outputTokens: number): number {
  if (api === 'claude-haiku') {
    return (inputTokens / 1_000_000) * CLAUDE_HAIKU_IN + (outputTokens / 1_000_000) * CLAUDE_HAIKU_OUT
  }
  if (api === 'claude-sonnet') {
    return (inputTokens / 1_000_000) * CLAUDE_SONNET_IN + (outputTokens / 1_000_000) * CLAUDE_SONNET_OUT
  }
  return 0 // Gemini free tier — no cost tracking
}

export async function logApiUsage(
  api: ApiName,
  route: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('api_usage_log') as any).insert({
      api,
      route,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd(api, inputTokens, outputTokens),
    })
  } catch {
    // Non-critical — log silently so it never breaks a translation
    console.warn('[api-usage] Failed to log usage for', route)
  }
}
