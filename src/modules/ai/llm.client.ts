import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { extractJson } from './json-extract.util';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

/**
 * Provider-agnostic LLM access. `AI_PROVIDER=anthropic` uses Claude; `openai`
 * targets any OpenAI-compatible endpoint (Google Gemini, Groq, OpenRouter,
 * Ollama, ...), which is how the app can run on a free tier.
 */
@Injectable()
export class LlmClient {
  private readonly anthropic: Anthropic | null = null;
  private readonly openai: { apiKey: string; baseUrl: string } | null = null;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const ai = this.configService.get('ai');
    this.model = ai.model;
    this.timeoutMs = ai.timeoutMs ?? 8000;

    if (ai.provider === 'openai') {
      if (ai.llmApiKey && ai.llmBaseUrl) {
        this.openai = { apiKey: ai.llmApiKey, baseUrl: String(ai.llmBaseUrl).replace(/\/+$/, '') };
      }
    } else if (ai.claudeApiKey) {
      this.anthropic = new Anthropic({ apiKey: ai.claudeApiKey, timeout: this.timeoutMs });
    }
  }

  isConfigured(): boolean {
    return this.anthropic !== null || this.openai !== null;
  }

  /** Strict-JSON reply, parsed. Throws on timeout, API error, or unparseable output — callers own the fallback. */
  async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const text = await this.complete(
      `${systemPrompt}\n\nRespond with ONLY valid JSON. No markdown fences, no prose before or after.`,
      [{ role: 'user', content: userPrompt }],
      1024,
    );
    return extractJson<T>(text);
  }

  /** Free-form multi-turn reply (used by the coach chat). */
  async generateText(systemPrompt: string, messages: ChatTurn[]): Promise<string> {
    return this.complete(systemPrompt, messages, 600);
  }

  private async complete(system: string, messages: ChatTurn[], maxTokens: number): Promise<string> {
    if (this.anthropic) {
      const response = await this.anthropic.messages.create(
        { model: this.model, max_tokens: maxTokens, system, messages },
        { timeout: this.timeoutMs },
      );
      const block = response.content.find((b) => b.type === 'text');
      if (!block || block.type !== 'text' || !block.text.trim()) {
        throw new Error('LLM response did not contain a text block');
      }
      return block.text.trim();
    }

    if (this.openai) {
      const res = await fetch(`${this.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.openai.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new Error(`LLM provider returned HTTP ${res.status}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('LLM response did not contain message content');
      return content;
    }

    throw new Error('No LLM provider is configured');
  }
}
