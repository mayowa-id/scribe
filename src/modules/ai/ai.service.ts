import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic | null = null;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY', '');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.isMock = false;
      this.logger.log('AI Service initialised with Anthropic API key');
    } else {
      this.isMock = true;
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — AI Service running in MOCK mode. All AI calls will return dummy data.',
      );
    }
  }

  /**
   * Extracts structured voice attributes from a raw interview answer.
   * Uses Claude Haiku for speed and cost efficiency.
   */
  async extractAttributes(
    rawAnswer: string,
    extractFields: string[],
  ): Promise<Record<string, any>> {
    if (this.isMock) {
      await this.mockDelay(1500);
      return this.mockExtraction(extractFields);
    }

    const systemPrompt = `You are a writing-voice extraction specialist. Analyse the author's answer and extract structured JSON data for the specified fields.
Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `Extract the following fields from this author's answer: ${extractFields.join(', ')}

Author's answer:
"""
${rawAnswer}
"""

Return JSON with exactly these keys: ${extractFields.join(', ')}
Use null for fields not determinable from the answer.`;

    const response = await this.client!.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

    try {
      return JSON.parse(text);
    } catch {
      this.logger.warn(`AI extraction returned non-JSON: ${text}`);
      return {};
    }
  }

  /**
   * Synthesizes all extracted voice attributes into a persistent system prompt.
   * This is THE key method — output becomes voice_profiles.synthesized_prompt.
   * Uses Claude Sonnet for quality.
   */
  async synthesizeVoiceProfile(rawAttributes: Record<string, any>): Promise<string> {
    if (this.isMock) {
      await this.mockDelay(3000);
      return this.mockSynthesizedPrompt();
    }

    const systemPrompt = `You are a master writing coach who creates detailed, first-person AI system prompts for authors.
Given extracted writing-voice attributes, you produce a comprehensive system prompt that an AI model will use to write in that author's exact voice.
The prompt should be rich, specific, and immediately actionable. Write it in second person ("You write...", "Your sentences...").`;

    const userPrompt = `Create a comprehensive author voice system prompt from these extracted attributes:

${JSON.stringify(rawAttributes, null, 2)}

The system prompt should cover: tone, sentence structure, vocabulary level, rhetorical devices, thematic patterns, opening styles, and any unique voice markers present in the data.
Be specific — no generalities. If a field is null, omit it gracefully.`;

    const response = await this.client!.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /**
   * Streams a chapter generation using the author's synthesized voice profile.
   * Returns the Anthropic stream object for SSE forwarding.
   */
  async streamChapterGeneration(
    synthesizedPrompt: string,
    userPrompt: string,
    context?: string,
  ): Promise<AsyncIterable<Anthropic.MessageStreamEvent> | null> {
    if (this.isMock) {
      return this.mockStream();
    }

    const fullUserPrompt = context
      ? `Context:\n${context}\n\n---\n\nGeneration request:\n${userPrompt}`
      : userPrompt;

    return this.client!.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: synthesizedPrompt,
      messages: [{ role: 'user', content: fullUserPrompt }],
    });
  }

  /**
   * Streams a Scribe Assistant response with chapter-aware context.
   */
  async streamAssistantResponse(
    synthesizedPrompt: string,
    chapterContent: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string,
  ): Promise<AsyncIterable<Anthropic.MessageStreamEvent> | null> {
    if (this.isMock) {
      return this.mockStream();
    }

    const systemPrompt = synthesizedPrompt
      ? `${synthesizedPrompt}\n\n---\n\nYou are the Scribe writing assistant. You are helping the author refine and develop their work. The current chapter content is:\n\n${chapterContent}`
      : `You are the Scribe writing assistant. You are helping the author refine and develop their work. The current chapter content is:\n\n${chapterContent}`;

    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return this.client!.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });
  }

  // ─── Mock Helpers ────────────────────────────────────────────────────────────

  private mockDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mockExtraction(fields: string[]): Record<string, any> {
    const mockValues: Record<string, string> = {
      tone: 'authoritative yet accessible',
      opening_style: 'starts with a bold declarative statement',
      sentence_structure: 'varied length, favours medium sentences with occasional short punches',
      vocabulary: 'elevated but not academic',
      rhetorical_devices: 'uses tricolon and anaphora',
      audience: 'intelligent adults seeking transformation',
      thematic_focus: 'personal responsibility and spiritual growth',
    };
    return fields.reduce(
      (acc, field) => {
        acc[field] = mockValues[field] ?? 'rich and distinctive';
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  private mockSynthesizedPrompt(): string {
    return `You are writing in the voice of a seasoned author whose style is authoritative yet deeply personal. 

Your sentences vary in rhythm — you favour medium-length constructions punctuated by short, declarative statements for emphasis. You never pad. Every sentence earns its place.

Your vocabulary is elevated without being academic. You choose the precise word, not the impressive one. When you use technical or spiritual terminology, you immediately ground it in lived experience.

You open chapters and sections with bold declarations that establish the stakes immediately. You do not warm up slowly — you begin in motion.

Your rhetorical signature includes tricolon (three parallel phrases building in intensity) and anaphora (deliberate repetition at the start of consecutive clauses). These are not decorative; they are load-bearing structures.

Your thematic preoccupations are personal responsibility, transformation, and the intersection of the spiritual and the practical. You trust your reader to be intelligent and hungry for change.

This is a mock voice profile generated because no Anthropic API key is configured. Replace with a real synthesis when the key is available.`;
  }

  private async *mockStream(): AsyncIterable<any> {
    const mockText = `This is a mock AI generation. Your Anthropic API key has not been configured yet. 

Once you add your ANTHROPIC_API_KEY to the environment variables, this stream will be replaced with actual Claude-generated content written in your synthesized voice profile.

The streaming infrastructure, BullMQ jobs, SSE endpoint, and database persistence are all fully operational — only the AI model call is mocked.`;

    const words = mockText.split(' ');
    for (const word of words) {
      await this.mockDelay(80);
      yield {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: word + ' ' },
      };
    }
    yield { type: 'message_stop' };
  }
}
