export type AspectRatio = 'portrait' | 'landscape' | 'square';

export interface ImageFile {
  id: string; // Unique identifier for the image
  data: string; // base64 encoded string without the data URL prefix
  mimeType: string;
  aspectRatio: AspectRatio;
  isFavorite?: boolean;
}