
import React, { useRef, memo } from 'react';
import { ImageFile, AspectRatio } from '../types';
import { PortraitIcon, SquareIcon, LandscapeIcon, CloseIcon } from './icons';

interface ImageUploaderProps {
  title: string;
  icon: React.ReactNode;
  image: ImageFile | null;
  onImageUpload: (file: ImageFile) => void;
  onClear: () => void;
}

const resizeAndProcessImage = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_DIMENSION = 1024;
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64Data = dataUrl.split(',')[1];

        const ratio = width / height;
        let aspectRatio: AspectRatio = 'square';
        if (ratio > 1.1) aspectRatio = 'landscape';
        else if (ratio < 0.9) aspectRatio = 'portrait';

        // FIX: Added a unique `id` to the resolved object to match the `ImageFile` type.
        resolve({ id: crypto.randomUUID(), data: base64Data, mimeType: 'image/jpeg', aspectRatio });
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


const ImageUploader: React.FC<ImageUploaderProps> = ({ title, icon, image, onImageUpload, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
        const processedImage = await resizeAndProcessImage(file);
        onImageUpload(processedImage);
    } catch (error) {
        console.error("Failed to process image:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleAspectRatioChange = (newRatio: AspectRatio) => {
    if (image) {
      onImageUpload({ ...image, aspectRatio: newRatio });
    }
  };

  const handleClearInternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
    if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">{title}</h3>
      <div
        className="relative aspect-square w-full bg-slate-900/20 rounded-lg border border-dashed border-slate-700/70 focus:outline-none focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/50 transition-all duration-300 flex items-center justify-center cursor-pointer group hover:shadow-[0_0_25px_-5px_var(--accent-glow)] hover:border-sky-500/50"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={handleKeyDown}
        tabIndex={image ? -1 : 0}
        role="button"
        aria-label={image ? `Image uploaded: ${title}. Press to change.` : `Upload image for ${title}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFileChange}
        />
        {image ? (
          <>
            <img
              src={`data:${image.mimeType};base64,${image.data}`}
              alt={title}
              className="object-contain w-full h-full rounded-lg"
            />
            <button
              onClick={handleClearInternal}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-600/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-white transition-all duration-200 transform hover:scale-110 backdrop-blur-sm"
              aria-label="Clear image"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full flex items-center gap-1 p-1 shadow-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                <button
                    onClick={(e) => { e.stopPropagation(); handleAspectRatioChange('portrait'); }}
                    className={`p-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400 ${image.aspectRatio === 'portrait' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                    title="Portrait"
                >
                    <PortraitIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleAspectRatioChange('square'); }}
                    className={`p-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400 ${image.aspectRatio === 'square' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                    title="Square"
                >
                    <SquareIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleAspectRatioChange('landscape'); }}
                    className={`p-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400 ${image.aspectRatio === 'landscape' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                    title="Landscape"
                >
                    <LandscapeIcon className="w-5 h-5" />
                </button>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-500 group-hover:text-sky-400 transition-colors duration-300 p-4">
            {icon}
            <p className="mt-2 text-sm font-semibold">Click or Drag & Drop</p>
            <p className="text-xs text-slate-600">to upload your image</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ImageUploader);
