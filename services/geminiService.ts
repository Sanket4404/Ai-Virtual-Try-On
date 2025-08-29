import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ImageFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateVirtualTryOnImage(
  modelImage: ImageFile,
  garmentImage: ImageFile,
  customPrompt?: string
): Promise<Omit<ImageFile, 'id' | 'isFavorite'>> {
  try {
    let prompt = `
      Take the person from the first image (a ${modelImage.aspectRatio} photo) and the clothing item from the second image (a ${garmentImage.aspectRatio} photo). 
      Create a new, photorealistic image where the person is wearing the clothing. 
      The fit should be natural and flattering. Maintain the person's pose and the original background as much as possible.
      Ensure lighting and shadows on the clothing match the person's image.
    `;

    if (customPrompt && customPrompt.trim() !== '') {
        prompt += `\n\nAdditional user instructions: ${customPrompt.trim()}`;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: modelImage.data,
                mimeType: modelImage.mimeType,
              },
            },
            {
              inlineData: {
                data: garmentImage.data,
                mimeType: garmentImage.mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
                aspectRatio: 'portrait', // Default output aspect ratio
            };
        }
    }

    throw new Error("API did not return an image. It may have been blocked due to safety settings or an internal error.");

  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image generation.");
  }
}