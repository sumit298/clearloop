import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private ai: GoogleGenAI | null = null;
  private readonly botName = 'Clearloop'; // Change this to your product name!

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY not set - AI features disabled');
      return;
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates a CodeRabbit-style markdown summary from a raw PR diff
   */
  async generateCodeRabbitReview(
    title: string,
    description: string,
    diff: string,
  ): Promise<string | null> {
    if (!this.ai) return null;

    const prompt = `
Analyze this pull request and organize the structural changes into precise categories.

Pull Request Context:
Title: ${title}
Description: ${description || 'No description provided'}

Code Changes Diff:
${diff.substring(0, 5000)}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite', // Fast and accurate for structured categorization
        contents: prompt,
        config: {
          systemInstruction: `You are an expert release engineer mimicking CodeRabbit. Categorize changes precisely into:
- newFeatures: Brand new user-facing functionality or endpoints.
- enhancements: Improvements to existing logic, security, permissions, or performance.
- chores: Upgrading dependencies, updating configs, refactoring types, or fixing internal housekeeping.
Make descriptions action-oriented and clear (e.g., "Users can now retrieve...", "Strengthened role-based access...").`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              newFeatures: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'New features introduced.' 
              },
              enhancements: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'Refinements, performance upgrades, or security hardening.' 
              },
              chores: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'Housekeeping, refactoring without visible impact, or package updates.' 
              }
            },
            required: ['newFeatures', 'enhancements', 'chores']
          }
        }
      });

      if (!response.text) return null;

      const rawData = JSON.parse(response.text.trim());
      return this.buildCodeRabbitMarkdown(rawData);

    } catch (error) {
      this.logger.error('Failed to generate CodeRabbit-style review:', error);
      return null;
    }
  }

  /**
   * Synthesizes a set of already-generated per-PR summaries into ONE
   * combined, deduplicated release note — not a vertical join of N
   * separate summaries, which restates overlapping changes N times.
   */
  async generateReleaseSummary(
    releaseTitle: string,
    prs: Array<{ title: string; aiSummary: string | null }>,
  ): Promise<string | null> {
    if (!this.ai) return null;

    const prContext = prs
      .filter((pr) => pr.aiSummary)
      .map((pr, i) => `PR ${i + 1}: "${pr.title}"\n${pr.aiSummary}`)
      .join('\n\n---\n\n');

    if (!prContext) return null;

    const prompt = `
Synthesize the following individual pull request summaries into ONE combined,
deduplicated set of release notes for "${releaseTitle}".

If multiple PRs touch the same feature or fix related issues, merge them into
a single bullet rather than listing them separately. Do not repeat a PR's
title or number in the output — describe the net effect of the release.

Individual PR summaries:
${prContext}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: `You are an expert release engineer writing
consolidated release notes from a set of already-reviewed pull requests.
Merge overlapping or related changes into single, clear bullets. Categorize into:
- newFeatures: Brand new user-facing functionality.
- enhancements: Improvements to existing behavior, performance, or security.
- chores: Internal housekeeping with no user-facing effect.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              newFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
              enhancements: { type: Type.ARRAY, items: { type: Type.STRING } },
              chores: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['newFeatures', 'enhancements', 'chores'],
          },
        },
      });

      if (!response.text) return null;
      const rawData = JSON.parse(response.text.trim());
      return this.buildCodeRabbitMarkdown(rawData);
    } catch (error) {
      this.logger.error('Failed to generate release summary:', error);
      return null;
    }
  }

  /**
   * Assembles the structured JSON into CodeRabbit markdown syntax
   */
  private buildCodeRabbitMarkdown(data: {
    newFeatures: string[];
    enhancements: string[];
    chores: string[];
  }): string {
    let md = `### Summary by ${this.botName}\n\n`;
    md += `#### Release Notes\n\n`;

    // 1. Render New Features if present
    if (data.newFeatures && data.newFeatures.length > 0) {
      md += `##### New Features\n`;
      data.newFeatures.forEach((item) => {
        md += `* ${item}\n`;
      });
      md += `\n`;
    }

    // 2. Render Enhancements if present
    if (data.enhancements && data.enhancements.length > 0) {
      md += `##### Enhancements\n`;
      data.enhancements.forEach((item) => {
        md += `* ${item}\n`;
      });
      md += `\n`;
    }

    // 3. Render Chores if present
    if (data.chores && data.chores.length > 0) {
      md += `##### Chores\n`;
      data.chores.forEach((item) => {
        md += `* ${item}\n`;
      });
      md += `\n`;
    }

    // Final fallback trim if all sections were empty strings
    return md.trim();
  }
}