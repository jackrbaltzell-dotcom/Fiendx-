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

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function parseApiResponse(res: Response, fallbackActionName: string) {
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Backend endpoint not found. If this app is hosted on static GitHub Pages, please configure VITE_API_URL pointing to your backend server running server.ts.`
      );
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `${fallbackActionName} failed: ${res.statusText}`);
  }
  return res.json();
}

export const geminiService = {
  // 1. Google Maps Grounding
  async searchMaps(query: string, location?: string): Promise<GroundedResult> {
    const res = await fetch(`${API_BASE}/api/gemini/maps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location }),
    });
    return parseApiResponse(res, 'Maps search');
  },

  // 2. Google Search Grounding
  async searchWeb(query: string): Promise<GroundedResult> {
    const res = await fetch(`${API_BASE}/api/gemini/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return parseApiResponse(res, 'Web search');
  },

  // 3. AI Listing Enhancer
  async enhanceListing(params: EnhanceListingParams): Promise<EnhanceListingResult> {
    const res = await fetch(`${API_BASE}/api/gemini/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await parseApiResponse(res, 'Listing enhancement');
    return data.result;
  },

  // 4. Create & Edit Images
  async generateOrEditImage(
    prompt: string,
    editImageBase64?: string,
    mimeType?: string
  ): Promise<{ imageUrl: string; text?: string }> {
    const res = await fetch(`${API_BASE}/api/gemini/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, editImageBase64, mimeType }),
    });
    return parseApiResponse(res, 'Image creation');
  },

  // 5. Analyze Images
  async analyzeImage(imageBase64: string, mimeType?: string, question?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/api/gemini/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, question }),
    });
    const data = await parseApiResponse(res, 'Image inspection');
    return data.analysis;
  },

  // 6. Text-to-Speech (TTS)
  async convertTextToSpeech(text: string, voice?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/api/gemini/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    const data = await parseApiResponse(res, 'TTS generation');
    return data.audio; // base64 audio
  },

  // 7. Voice dialogue
  async sendVoiceQuery(userQuery: string, context?: any): Promise<string> {
    const res = await fetch(`${API_BASE}/api/gemini/voice-dialogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userQuery, context }),
    });
    const data = await parseApiResponse(res, 'Voice assistant query');
    return data.reply;
  },
};
