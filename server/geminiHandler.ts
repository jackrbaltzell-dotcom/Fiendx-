import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import type { IncomingMessage, ServerResponse } from 'http';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export async function handleGeminiApi(req: IncomingMessage, res: ServerResponse) {
  const url = req.url || '';
  if (!url.startsWith('/api/gemini')) {
    return false;
  }

  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return true;
  }

  try {
    const ai = getAIClient();
    const body = await parseJsonBody(req);

    // 1. Google Maps Grounding
    if (url === '/api/gemini/maps') {
      const { query, location } = body;
      const prompt = `You are FindX Map Assistant. Using Google Maps data, locate and provide accurate information for: "${query}" in or around "${location || 'the area'}". Provide key details including verified places, approximate distance/neighborhood, highlights, and practical recommendations. Format clearly with bullet points.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });

      res.end(JSON.stringify({
        text: response.text || 'No map details found.',
        candidates: response.candidates,
      }));
      return true;
    }

    // 2. Google Search Grounding
    if (url === '/api/gemini/search') {
      const { query } = body;
      const prompt = `You are FindX Discovery Assistant. Find up-to-date and accurate information using Google Search for: "${query}". Provide concise, real-time insights, market prices, local trends, or verified facts.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      res.end(JSON.stringify({
        text: response.text || 'No search results found.',
        candidates: response.candidates,
      }));
      return true;
    }

    // 3. Smart Listing & Content Enhancer
    if (url === '/api/gemini/enhance') {
      const { title, category, description, type, speed } = body;
      // Model selection: gemini-3.1-pro-preview for complex, gemini-3.1-flash-lite for fast, gemini-3.5-flash for general
      let selectedModel = 'gemini-3.5-flash';
      if (speed === 'fast') {
        selectedModel = 'gemini-3.1-flash-lite';
      } else if (speed === 'complex') {
        selectedModel = 'gemini-3.1-pro-preview';
      }

      const prompt = `As a marketplace optimization AI for the platform FindX, enhance the following ${type || 'listing'}:
Title: "${title}"
Category: "${category}"
Current Description: "${description || 'None'}"

Please generate:
1. An engaging, SEO-optimized title.
2. A professional, trustworthy, and detailed description highlighting key specifications, benefits, and buyer/renter confidence points.
3. 3 suggested tags or keywords.
4. Suggested price guidance or safety note.

Format output as JSON with keys: enhancedTitle (string), enhancedDescription (string), tags (array of strings), safetyTip (string).`;

      try {
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        res.end(JSON.stringify({ result: JSON.parse(response.text || '{}') }));
      } catch (err: any) {
        // Fallback to gemini-3.5-flash if pro requires specific tier
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        res.end(JSON.stringify({ result: JSON.parse(fallbackRes.text || '{}') }));
      }
      return true;
    }

    // 4. Create & Edit Images
    if (url === '/api/gemini/image') {
      const { prompt, editImageBase64, mimeType } = body;
      
      const contents: any[] = [];
      if (editImageBase64) {
        contents.push({
          inlineData: {
            data: editImageBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        });
      }
      contents.push({ text: prompt || 'Generate a professional marketplace product visual' });

      // Use gemini-3.1-flash-image (or gemini-3.1-flash-lite-image)
      let modelToUse = 'gemini-3.1-flash-image';
      try {
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: { parts: contents },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        });

        let imageUrl = '';
        let textResult = '';
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            } else if (part.text) {
              textResult += part.text;
            }
          }
        }

        res.end(JSON.stringify({ imageUrl, text: textResult }));
      } catch (imgErr: any) {
        // Fallback to flash-lite-image
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: contents },
          });
          let imageUrl = '';
          if (fallbackResponse.candidates?.[0]?.content?.parts) {
            for (const part of fallbackResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              }
            }
          }
          res.end(JSON.stringify({ imageUrl }));
        } catch (e2: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e2?.message || 'Failed to generate image' }));
        }
      }
      return true;
    }

    // 5. Analyze Images
    if (url === '/api/gemini/analyze-image') {
      const { imageBase64, mimeType, question } = body;
      if (!imageBase64) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Image data is required' }));
        return true;
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
        },
      };

      const userQuestion = question || 'Analyze this image in detail for a marketplace listing. Identify the item, verify condition, assess authenticity/wear, estimate approximate category and value, and note any damages or standout features.';
      const textPart = { text: userQuestion };

      let modelName = 'gemini-3.1-pro-preview';
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [imagePart, textPart] },
        });
        res.end(JSON.stringify({ analysis: response.text }));
      } catch (err: any) {
        // Fallback to gemini-3.5-flash
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: { parts: [imagePart, textPart] },
        });
        res.end(JSON.stringify({ analysis: fallbackRes.text }));
      }
      return true;
    }

    // 6. Text-to-Speech (TTS)
    if (url === '/api/gemini/tts') {
      const { text, voice } = body;
      if (!text) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Text is required for TTS' }));
        return true;
      }

      const voiceName = voice || 'Zephyr'; // Options: Puck, Charon, Kore, Fenrir, Zephyr

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.slice(0, 500),
                  speechMetadata: {
                    style: 'Warm, clear, and professional marketplace announcer',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        res.end(JSON.stringify({ audio: base64Audio, mimeType: 'audio/wav' }));
      } catch (ttsErr: any) {
        // Fallback to flash-lite-tts
        try {
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [{ text: text.slice(0, 500) }],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
          });
          const base64Audio = fallbackRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          res.end(JSON.stringify({ audio: base64Audio, mimeType: 'audio/wav' }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e?.message || 'TTS generation failed' }));
        }
      }
      return true;
    }

    // 7. Voice Assistant & Quick Dialogue
    if (url === '/api/gemini/voice-dialogue') {
      const { userQuery, context } = body;
      const prompt = `You are FindX Voice Navigator, an ultra-smart local assistant for the FindX platform (tagline: Find Everything. Connect Everyone).
The user is speaking or asking via voice: "${userQuery}".
Current context: ${JSON.stringify(context || {})}
Respond concisely (1 to 3 friendly sentences) so it sounds natural when spoken aloud. Mention real discovery tips, verified categories, or direct actions they can take on FindX.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.end(JSON.stringify({ reply: response.text }));
      return true;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return true;
  } catch (error: any) {
    console.error('Gemini API Handler Error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error?.message || 'Internal server error' }));
    return true;
  }
}
