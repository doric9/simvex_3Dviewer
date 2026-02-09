// src/utils/aiAssemblyService.ts
// AI Assembly Analysis Service with caching and error handling

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';

// src/utils/aiAssemblyService.ts
import { AssemblyConstraint } from '../types';

export interface AIAssemblyResult {
  basePart: string;
  parts: Array<{
    id: string;
    position: [number, number, number];
    explodeDirection: [number, number, number];
    description: string;
    constraint?: AssemblyConstraint;
  }>;
  assemblyOrder: string[];
  confidence: number;
  timestamp?: number;
}
// ...


export interface AIAssemblyOptions {
  useCache?: boolean;
  cacheExpiry?: number; // milliseconds
  temperature?: number;
  maxRetries?: number;
}

export class AIAssemblyService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private cache: Map<string, AIAssemblyResult> = new Map();

  constructor() {
    const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const googleKey = import.meta.env.VITE_GOOGLE_API_KEY;

    if (openAiKey) {
      this.openai = new OpenAI({
        apiKey: openAiKey,
        dangerouslyAllowBrowser: true
      });
      console.log('[AIService] Initialized OpenAI');
    }

    if (googleKey) {
      this.gemini = new GoogleGenerativeAI(googleKey);
      console.log('[AIService] Initialized Gemini');
    }

    if (!openAiKey && !googleKey) {
      console.warn('[AIService] No API keys found, AI features disabled');
    }

    this.loadCacheFromStorage();
  }

  public isAvailable(): boolean {
    return this.openai !== null || this.gemini !== null;
  }

  public async analyzeAssembly(
    imageUrl: string,
    partIds: string[],
    machineryId: string,
    options: AIAssemblyOptions = {}
  ): Promise<AIAssemblyResult> {
    console.log('[AIService] V2 (Gemini-Only) analyzeAssembly called');
    if (!this.isAvailable()) {
      throw new Error('AI service not available (no API keys)');
    }

    const {
      useCache = true,
      cacheExpiry = 24 * 60 * 60 * 1000, // 24시간
      // temperature = 0.1, // temperature is not used here, only passed to callGPT4Vision which is currently disabled
      maxRetries = 2
    } = options;

    // Check cache
    const cacheKeyVersion = 'v11_assembled_'; // Campatibility break to force re-analysis
    if (useCache) {
      const cached = this.getFromCache(cacheKeyVersion + machineryId, cacheExpiry);
      if (cached) return cached;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AIService] Analysis attempt ${attempt}/${maxRetries}`);

        let result: AIAssemblyResult;

        // Prioritize Gemini
        if (this.gemini) {
          try {
            result = await this.callGeminiVision(imageUrl, partIds);
            if (useCache) this.saveToCache(cacheKeyVersion + machineryId, result);
            return result;
          } catch (geminiError) {
            console.error('[AIService] Gemini failed:', geminiError);
            throw geminiError; // Don't fallback to OpenAI for now
          }
        }

        // Try OpenAI (Fallback - currently disabled/unreachable if Gemini fails above)
        if (this.openai) {
          // result = await this.callGPT4Vision(imageUrl, partIds, temperature);
          throw new Error('OpenAI fallback is disabled');
        } else {
          if (!this.gemini) throw new Error('No AI clients available');
          throw new Error('Gemini failed and OpenAI not available');
        }

      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        console.error(`[AIService] Attempt ${attempt} failed:`, lastError.message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error('AI analysis failed');
  }

  private async callGeminiVision(
    imageUrl: string,
    partIds: string[]
  ): Promise<AIAssemblyResult> {
    if (!this.gemini) throw new Error("Gemini not initialized");

    const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = this.buildPrompt(partIds) + "\n\nIMPORTANT: Return ONLY raw JSON without markdown formatting.";

    let imagePart;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(';')[0].split(':')[1];
      if (!base64Data || !mimeType) throw new Error("Invalid base64 image data");

      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    } else {
      try {
        console.log(`[AIService] Fetching image from URL: ${imageUrl}`);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: blob.type || 'image/png'
          }
        };
      } catch (err) {
        console.error('[AIService] Failed to fetch image:', err);
        throw new Error("Failed to load image for Gemini analysis.");
      }
    }

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    const parsed = this.parseResponse(text);
    this.validateResult(parsed, partIds);
    parsed.timestamp = Date.now();
    return parsed;
  }


  private buildPrompt(partIds: string[]): string {
    return `You are a CAD assembly expert. Analyze this mechanical assembly diagram.
The image shows a "Reference Assembly Diagram" (Final Assembled State or Exploded View).
Your task is to analyze this diagram to determine the correct SPATIAL RELATIONSHIPS and ASSEMBLY ORDER.

Input Parts: ${partIds.join(', ')}

Task:
1. Identify each part.
2. Determine the ASSEMBLY RELATIONSHIP for each part.
   - Use "Fixed" for the base/ground part.
   - Use "StackedOn" for parts that sit on top/bottom of others.
   - Use "Threaded" for nuts/bolts on rods/threads.
   
   *** CRITICAL: ANALYZE PART INTERACTIONS (One-Shot Learning) ***
   - Example (Suspension):
     * Part "BASE" acts as the ground.
     * Part "ROD" (Cylinder) is mounted on BASE. (Constraint: StackedOn BASE)
     * Part "SPRING" sits on BASE (around ROD). (Constraint: StackedOn BASE)
     * Part "NUT" (Top Cap) screws onto the top of ROD, compressing the Spring. (Constraint: ThreadedOn ROD)
   
   - General Rule for Coaxial Parts:
     * If Part A (Spring) surrounds Part B (Rod), look for a "Seat" or "Flange" that Part A rests on.
   - General Rule for Axis:
     * "Up" is +Y axis. "Down" is -Y axis.
     * Stacked parts should have "explodeDirection": [0, 1, 0].
     * DO NOT use Z-axis for vertical stacking.
     
3. Determine explode directions (for later animation). Always use [0, 1, 0] for vertical parts.
4. Suggest assembly order (Base -> Rod -> Spring -> Nut).

Output ONLY valid JSON:
{
  "basePart": "BASE",
  "parts": [
    {
      "id": "BASE",
      "position": [0, 0, 0],
      "explodeDirection": [0, -1, 0],
      "description": "Base part",
      "constraint": { "type": "Fixed", "offset": [0, 0, 0] }
    },
    {
      "id": "ROD",
      "position": [0, 20, 0],
      "explodeDirection": [0, 1, 0],
      "description": "Rod mounted on Base",
      "constraint": { "type": "StackedOn", "parentPart": "BASE", "offset": [0, 0, 0] }
    },
    {
      "id": "SPRING",
      "position": [0, 40, 0], 
      "explodeDirection": [0, 1, 0],
      "description": "Spring on Base",
      "constraint": { 
        "type": "StackedOn", 
        "parentPart": "BASE", 
        "offset": [0, 0, 0] 
      }
    },
    {
      "id": "NUT",
      "position": [0, 80, 0],
      "explodeDirection": [0, 1, 0],
      "description": "Nut threaded on Rod",
      "constraint": {
        "type": "Threaded",
        "threadedOn": "ROD",
        "threadDepth": 0.8
      }
    }
  ],
  "assemblyOrder": ["BASE", "ROD", "SPRING", "NUT"],
  "confidence": 0.95
}

Requirements:
- CRITICAL: You MUST use the EXACT ID strings provided in "Input Parts". Do NOT rename them.
- CRITICAL: Return "constraint" object for logic-based assembly.
- "StackedOn" offset [0,0,0] will automatically calculate based on parent's height.
- Coaxial Rule: Springs usually stack on the BASE, not the Rod.
- Confidence: 0.0 to 1.0`;
  }

  /**
   * 응답 파싱
   */
  private parseResponse(content: string): AIAssemblyResult {
    // 마크다운 코드 블록 제거
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^```json\s*/m, '');
    cleaned = cleaned.replace(/^```\s*/m, '');
    cleaned = cleaned.replace(/```\s*$/m, '');

    // JSON 추출
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      throw new Error(`JSON parse error: ${err}`);
    }
  }

  /**
   * 결과 검증
   */
  private validateResult(result: AIAssemblyResult, partIds: string[]): void {
    if (!result.basePart) {
      throw new Error('Missing basePart in result');
    }

    if (!Array.isArray(result.parts) || result.parts.length === 0) {
      throw new Error('Invalid or empty parts array');
    }

    // 모든 파트가 포함되었는지 확인
    const resultIds = new Set(result.parts.map(p => p.id));
    const missingParts = partIds.filter(id => !resultIds.has(id));

    if (missingParts.length > 0) {
      console.warn(`[AIService] Missing parts: ${missingParts.join(', ')}`);
      // 경고만 하고 진행 (AI가 일부 파트를 누락할 수 있음)
    }

    // 각 파트 검증
    result.parts.forEach(part => {
      if (!part.id || !part.position || !part.explodeDirection) {
        throw new Error(`Invalid part data: ${JSON.stringify(part)}`);
      }

      if (part.position.length !== 3 || part.explodeDirection.length !== 3) {
        throw new Error(`Invalid vector length for part ${part.id}`);
      }
    });

    // 신뢰도 기본값
    if (typeof result.confidence !== 'number') {
      result.confidence = 0.8;
    }
  }

  /**
   * 캐시에서 가져오기
   */
  private getFromCache(
    machineryId: string,
    expiry: number
  ): AIAssemblyResult | null {
    // 메모리 캐시
    const cached = this.cache.get(machineryId);
    if (cached) {
      const age = Date.now() - (cached.timestamp || 0);
      if (age < expiry) {
        return cached;
      }
    }

    // localStorage 캐시
    try {
      const key = `ai_assembly_${machineryId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: AIAssemblyResult = JSON.parse(stored);
        const age = Date.now() - (parsed.timestamp || 0);

        if (age < expiry) {
          this.cache.set(machineryId, parsed); // 메모리에도 저장
          return parsed;
        } else {
          localStorage.removeItem(key); // 만료된 캐시 삭제
        }
      }
    } catch (err) {
      console.error('[AIService] Cache read error:', err);
    }

    return null;
  }

  /**
   * 캐시에 저장
   */
  private saveToCache(machineryId: string, result: AIAssemblyResult): void {
    // 메모리 캐시
    this.cache.set(machineryId, result);

    // localStorage 캐시
    try {
      const key = `ai_assembly_${machineryId}`;
      localStorage.setItem(key, JSON.stringify(result));
    } catch (err) {
      console.error('[AIService] Cache write error:', err);
    }
  }

  /**
   * localStorage에서 캐시 복원
   */
  private loadCacheFromStorage(): void {
    try {
      const prefix = 'ai_assembly_';

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const machineryId = key.slice(prefix.length);
          const data = localStorage.getItem(key);

          if (data) {
            const result: AIAssemblyResult = JSON.parse(data);
            this.cache.set(machineryId, result);
          }
        }
      }

      console.log(`[AIService] Loaded ${this.cache.size} cached results`);
    } catch (err) {
      console.error('[AIService] Cache restore error:', err);
    }
  }

  /**
   * 캐시 초기화
   */
  public clearCache(machineryId?: string): void {
    if (machineryId) {
      // 특정 항목만 삭제
      this.cache.delete(machineryId);
      localStorage.removeItem(`ai_assembly_${machineryId}`);
      console.log(`[AIService] Cleared cache for ${machineryId}`);
    } else {
      // 전체 캐시 삭제
      this.cache.clear();

      const prefix = 'ai_assembly_';
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('[AIService] Cleared all cache');
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const aiAssemblyService = new AIAssemblyService();
