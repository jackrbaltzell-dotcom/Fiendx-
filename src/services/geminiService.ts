export interface GroundedResult {
  text: string;
  candidates?: any[];
}

export interface EnhanceListingParams {
  title: string;
  category: string;
  description?: string;
  type?: string;
  speed?: 'fast' | 'general' | 'complex';
}

export interface EnhanceListingResult {
  enhancedTitle: string;
  enhancedDescription: string;
  tags: string[];
  safetyTip: string;
}

export const geminiService = {
  // 1. Google Maps Grounding
  async searchMaps(query: string, location?: string): Promise<GroundedResult> {
    const res = await fetch('/api/gemini/maps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location }),
    });
    if (!res.ok) {
      throw new Error(`Maps search failed: ${res.statusText}`);
    }
    return res.json();
  },

  // 2. Google Search Grounding
  async searchWeb(query: string): Promise<GroundedResult> {
    const res = await fetch('/api/gemini/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new Error(`Web search failed: ${res.statusText}`);
    }
    return res.json();
  },

  // 3. AI Listing Enhancer
  async enhanceListing(params: EnhanceListingParams): Promise<EnhanceListingResult> {
    const res = await fetch('/api/gemini/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Listing enhancement failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data.result;
  },

  // 4. Create & Edit Images
  async generateOrEditImage(prompt: string, editImageBase64?: string, mimeType?: string): Promise<{ imageUrl: string; text?: string }> {
    const res = await fetch('/api/gemini/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, editImageBase64, mimeType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate image');
    }
    return res.json();
  },

  // 5. Analyze Images
  async analyzeImage(imageBase64: string, mimeType?: string, question?: string): Promise<string> {
    const res = await fetch('/api/gemini/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, question }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Image analysis failed');
    }
    const data = await res.json();
    return data.analysis;
  },

  // 6. Text-to-Speech (TTS)
  async convertTextToSpeech(text: string, voice?: string): Promise<string> {
    const res = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'TTS conversion failed');
    }
    const data = await res.json();
    return data.audio; // base64 audio
  },

  // 7. Voice dialogue
  async sendVoiceQuery(userQuery: string, context?: any): Promise<string> {
    const res = await fetch('/api/gemini/voice-dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userQuery, context }),
    });
    if (!res.ok) {
      throw new Error('Voice query failed');
    }
    const data = await res.json();
    return data.reply;
  },
};
