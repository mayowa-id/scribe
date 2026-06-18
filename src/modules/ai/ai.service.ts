import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    GoogleGenerativeAI,
    GenerativeModel,
    GenerateContentStreamResult,
} from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly genAI: GoogleGenerativeAI | null = null;
    private readonly flashModel: GenerativeModel | null = null;
    private readonly proModel: GenerativeModel | null = null;
    private readonly isMock: boolean;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY', '');

        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            // Flash = fast, cheap — used for extraction (replaces Claude Haiku)
            this.flashModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            // Pro = highest quality — used for synthesis + generation (replaces Claude Sonnet)
            this.proModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            this.isMock = false;
            this.logger.log('AI Service initialised with Google Gemini');
        } else {
            this.isMock = true;
            this.logger.warn(
                'GOOGLE_AI_API_KEY not set — AI Service running in MOCK mode. All AI calls will return dummy data.',
            );
        }
    }

    /**
     * Extracts structured voice attributes from a raw interview answer.
     * Uses Gemini Flash for speed and cost efficiency.
     */
    async extractAttributes(
        rawAnswer: string,
        extractFields: string[],
    ): Promise<Record<string, any>> {
        if (this.isMock) {
            await this.mockDelay(1500);
            return this.mockExtraction(extractFields);
        }

        const prompt = `You are a writing-voice extraction specialist. Analyse the author's answer and extract structured JSON data.

Extract the following fields: ${extractFields.join(', ')}

Author's answer:
"""
${rawAnswer}
"""

Return ONLY valid JSON with exactly these keys: ${extractFields.join(', ')}
Use null for fields not determinable from the answer. No markdown, no explanation — pure JSON only.`;

        try {
            const result = await this.flashModel!.generateContent(prompt);
            const text = result.response.text().trim();

            // Strip markdown code fences if model includes them
            const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            return JSON.parse(cleaned);
        } catch (err: any) {
            this.logger.warn(`AI extraction failed: ${err.message}`);
            return {};
        }
    }

    /**
     * Synthesizes all extracted voice attributes into a persistent system prompt.
     * This is THE key method — output becomes voice_profiles.synthesized_prompt.
     * Uses Gemini Pro for quality.
     */
    async synthesizeVoiceProfile(rawAttributes: Record<string, any>): Promise<string> {
        if (this.isMock) {
            await this.mockDelay(3000);
            return this.mockSynthesizedPrompt();
        }

        const prompt = `You are a master writing coach who creates detailed author voice system prompts for AI writing assistants.

Given these extracted writing-voice attributes from an author interview:
${JSON.stringify(rawAttributes, null, 2)}

Write a comprehensive, first-person-addressed system prompt that an AI model will use to write in this author's exact voice.
Cover: tone, sentence structure, vocabulary level, rhetorical devices, thematic patterns, opening styles, and unique voice markers.
Write it in second person ("You write...", "Your sentences..."). Be specific and immediately actionable.
Omit gracefully any fields that are null. No preamble — start the prompt directly.`;

        const result = await this.proModel!.generateContent(prompt);
        return result.response.text().trim();
    }

    /**
     * Streams a chapter generation using the author's synthesized voice profile.
     * Returns an async iterable of text chunks for SSE forwarding.
     */
    async streamChapterGeneration(
        synthesizedPrompt: string,
        userPrompt: string,
        context?: string,
    ): Promise<AsyncIterable<string> | null> {
        if (this.isMock) {
            return this.mockTextStream();
        }

        const fullPrompt = [
            synthesizedPrompt,
            context ? `\n\nContext:\n${context}` : '',
            `\n\nGeneration request:\n${userPrompt}`,
        ]
            .filter(Boolean)
            .join('');

        const result: GenerateContentStreamResult =
            await this.proModel!.generateContentStream(fullPrompt);

        return this.geminiStreamToTextIterable(result);
    }

    /**
     * Streams a Scribe Assistant response with chapter-aware context.
     */
    async streamAssistantResponse(
        synthesizedPrompt: string,
        chapterContent: string,
        conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
        userMessage: string,
    ): Promise<AsyncIterable<string> | null> {
        if (this.isMock) {
            return this.mockTextStream();
        }

        const systemContext = [
            synthesizedPrompt,
            `\n\nYou are the Scribe writing assistant helping the author refine their work.`,
            `\n\nCurrent chapter content:\n${chapterContent}`,
        ]
            .filter(Boolean)
            .join('');

        // Build Gemini chat history format
        const history = conversationHistory.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const chat = this.proModel!.startChat({
            history,
            systemInstruction: systemContext,
        });

        const result = await chat.sendMessageStream(userMessage);
        return this.geminiStreamToTextIterable(result);
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────────

    private async *geminiStreamToTextIterable(
        result: GenerateContentStreamResult,
    ): AsyncIterable<string> {
        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) yield text;
        }
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

Your vocabulary is elevated without being academic. You choose the precise word, not the impressive one.

You open chapters and sections with bold declarations that establish the stakes immediately. You do not warm up slowly — you begin in motion.

Your rhetorical signature includes tricolon and anaphora. These are not decorative; they are load-bearing structures.

Your thematic preoccupations are personal responsibility, transformation, and the intersection of the spiritual and the practical.

This is a mock voice profile — add your GOOGLE_AI_API_KEY to activate real synthesis.`;
    }

    private async *mockTextStream(): AsyncIterable<string> {
        const mockText =
            `This is a mock AI generation. Your GOOGLE_AI_API_KEY is not yet configured. ` +
            `Once you add it to the .env file, this stream will produce real content written in your synthesized voice profile. ` +
            `The full pipeline — BullMQ jobs, SSE streaming, and database persistence — is operational.`;

        const words = mockText.split(' ');
        for (const word of words) {
            await this.mockDelay(60);
            yield word + ' ';
        }
    }
}
