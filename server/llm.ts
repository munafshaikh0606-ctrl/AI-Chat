import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { IMessage } from './db';

let ai: GoogleGenAI | null = null;

export function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

export async function generateChatResponse(history: IMessage[]): Promise<string> {
  const aiClient = getAI();
  
  const generateImageFunc: FunctionDeclaration = {
    name: 'generateImage',
    description: 'Generates a realistic image based on the provided detailed prompt.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'A very detailed, descriptive prompt for generating the image.',
        },
        aspectRatio: {
          type: Type.STRING,
          description: 'The aspect ratio of the image (e.g. "16:9", "1:1", "3:4"). Defaults to "1:1" if not specified.',
        },
      },
      required: ['prompt'],
    },
  };

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const response = await aiClient.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: contents,
    config: {
      systemInstruction: 'You are an intelligent, helpful chat assistant. If the user asks for an image to be generated, call the generateImage tool with a detailed prompt.',
      tools: [{ functionDeclarations: [generateImageFunc] }],
    }
  });

  const functionCalls = response.functionCalls;
  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    if (call.name === 'generateImage') {
      const args = call.args as any;
      const prompt = args.prompt;
      const aspectRatio = args.aspectRatio || '1:1';

      try {
        const imageResponse = await aiClient.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: "1K"
            }
          }
        });

        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64 = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const imgMarkdown = `\n\n![Generated Image](data:${mimeType};base64,${base64})\n`;
            return (response.text || `Here is the image you requested for: "${prompt}"`) + imgMarkdown;
          }
        }
      } catch (error) {
        console.error('Image generation error (falling back to alternative image service):', error);
        const encodedPrompt = encodeURIComponent(prompt);
        const imgMarkdown = `\n\n![Generated Image](https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true)\n`;
        return (response.text || `Here is the image you requested for: "${prompt}"`) + imgMarkdown;
      }
    }
  }

  return response.text || '';
}
