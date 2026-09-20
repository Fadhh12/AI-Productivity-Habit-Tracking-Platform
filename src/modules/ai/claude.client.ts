import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeClient {
  private readonly client: Anthropic | null;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.claudeApiKey');
    this.model = this.configService.get<string>('ai.claudeModel') ?? 'claude-sonnet-5';
    this.timeoutMs = this.configService.get<number>('ai.timeoutMs') ?? 8000;
    this.client = apiKey ? new Anthropic({ apiKey, timeout: this.timeoutMs }) : null;
  }

  /** Sends a prompt asking for a strict-JSON reply and parses it. Throws on timeout, API error, or unparseable output — callers are responsible for the fallback path. */
  async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    if (!this.client) {
      throw new Error('CLAUDE_API_KEY is not configured');
    }

    const response = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: 1024,
        system: `${systemPrompt}\n\nRespond with ONLY valid JSON. No markdown fences, no prose before or after.`,
        messages: [{ role: 'user', content: userPrompt }],
      },
      { timeout: this.timeoutMs },
    );

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude response did not contain a text block');
    }

    const jsonText = textBlock.text
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    return JSON.parse(jsonText) as T;
  }

  /** Free-form multi-turn reply (used by the coach chat). Throws on timeout or API error — callers own the fallback. */
  async generateText(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    if (!this.client) {
      throw new Error('CLAUDE_API_KEY is not configured');
    }

    const response = await this.client.messages.create(
      { model: this.model, max_tokens: 600, system: systemPrompt, messages },
      { timeout: this.timeoutMs },
    );

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) {
      throw new Error('Claude response did not contain a text block');
    }
    return textBlock.text.trim();
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}
