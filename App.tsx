import React, { useState, useCallback, useMemo } from 'react';
import { ImageFile } from './types';
import { generateVirtualTryOnImage } from './services/geminiService';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import History from './components/History';
import { GarmentIcon, PersonIcon, SparklesIcon, TrashIcon, ChevronDownIcon } from './components/icons';

const App: React.FC = () => {
  const [modelImage, setModelImage] = useLocalStorageState<ImageFile | null>('vto-modelImage', null);
  const [garmentImage, setGarmentImage] = useLocalStorageState<ImageFile | null>('vto-garmentImage', null);
  const [history, setHistory] = useLocalStorageState<ImageFile[]>('vto-history', []);
  const [customPrompt, setCustomPrompt] = useLocalStorageState<string>('vto-customPrompt', '');

  const [generatedImage, setGeneratedImage] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);


  const handleGenerate = useCallback(async () => {
    if (!modelImage || !garmentImage) {
      setError('Please upload both a person and a garment image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const resultData = await generateVirtualTryOnImage(modelImage, garmentImage, customPrompt);
      const newImage: ImageFile = {
        ...resultData,
        id: Date.now().toString(),
        isFavorite: false,
      };
      setGeneratedImage(newImage);
      setHistory(prev => [newImage, ...prev].slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [modelImage, garmentImage, customPrompt, setHistory]);

  const handleClearHistory = () => {
    setHistory([]);
    setGeneratedImage(null);
  };

  const handleClear = () => {
    setModelImage(null);
    setGarmentImage(null);
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setHistory([]);
    setCustomPrompt('');
    setIsAdvancedOpen(false);
  };
  
  const handleToggleFavorite = (id: string) => {
    const newHistory = history.map(img =>
      img.id === id ? { ...img, isFavorite: !img.isFavorite } : img
    );
    setHistory(newHistory);

    // If the currently displayed image is the one being toggled, update it too
    if (generatedImage?.id === id) {
      setGeneratedImage(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };
  
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      // Favorites come first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Then sort by ID (chronologically, newest first)
      return parseInt(b.id) - parseInt(a.id);
    });
  }, [history]);

  const handleModelImageUpload = useCallback((img: ImageFile) => setModelImage(prev => ({...img, id: prev?.id || Date.now().toString()})), [setModelImage]);
  const handleGarmentImageUpload = useCallback((img: ImageFile) => setGarmentImage(prev => ({...img, id: prev?.id || Date.now().toString()})), [setGarmentImage]);
  const handleHistorySelect = useCallback((image: ImageFile) => setGeneratedImage(image), []);
  const handleClearModelImage = useCallback(() => setModelImage(null), [setModelImage]);
  const handleClearGarmentImage = useCallback(() => setGarmentImage(null), [setGarmentImage]);

  const canGenerate = modelImage && garmentImage && !isLoading;

  return (
    <div className="min-h-screen text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
            <div className="inline-flex items-center gap-3">
                 <SparklesIcon className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                    Your Wardrobe, Reimagined
                </h1>
            </div>
          <p className="mt-3 text-lg text-slate-400 max-w-3xl mx-auto">Upload a photo. Pick an outfit. See your new look, photorealistically rendered by Gemini AI.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="lg:sticky lg:top-8 aurora-panel p-6 rounded-2xl flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUploader
                title="1. Your Photo"
                icon={<PersonIcon className="w-12 h-12" />}
                image={modelImage}
                onImageUpload={handleModelImageUpload}
                onClear={handleClearModelImage}
              />
              <ImageUploader
                title="2. Garment Image"
                icon={<GarmentIcon className="w-12 h-12" />}
                image={garmentImage}
                onImageUpload={handleGarmentImageUpload}
                onClear={handleClearGarmentImage}
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setIsAdvancedOpen(prev => !prev)}
                className="w-full flex items-center justify-between text-left text-sm font-medium text-slate-400 hover:text-sky-300 p-2 rounded-md"
              >
                <span>Advanced Options</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAdvancedOpen && (
                <div className="animate-fade-in">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., in the style of a vintage photograph, on a beach at sunset, with a more casual fit..."
                    className="w-full h-24 p-3 bg-slate-900/40 border border-slate-700 rounded-lg text-slate-300 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    aria-label="Advanced custom prompt"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-6 border-t border-slate-700/50">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 border border-transparent text-base font-semibold rounded-lg shadow-lg text-white bg-gradient-to-r from-sky-500 to-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-sky-500/30 hover:shadow-sky-400/50 disabled:shadow-none"
              >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Generating...' : 'Generate Try-On'}
              </button>
              <button
                onClick={handleClear}
                className="w-full sm:w-auto px-6 py-3 border border-slate-700 text-base font-medium rounded-lg text-slate-300 bg-white/5 hover:bg-white/10 hover:border-slate-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-slate-500"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 aurora-panel p-6 rounded-2xl flex flex-col">
            <h2 className="text-xl font-semibold text-slate-200 mb-4 tracking-tight">Result</h2>
            <ResultDisplay
              isLoading={isLoading}
              generatedImage={generatedImage}
              error={error}
              onRetry={handleGenerate}
            />
             {history.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-300">Session History</h3>
                      <button 
                          onClick={handleClearHistory}
                          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 focus-visible:ring-red-400"
                          title="Clear session history"
                      >
                          <TrashIcon className="w-4 h-4" />
                          Clear
                      </button>
                  </div>
                  <History
                      history={sortedHistory}
                      activeImage={generatedImage}
                      onSelect={handleHistorySelect}
                      onToggleFavorite={handleToggleFavorite}
                  />
                </div>
            )}
          </div>
        </main>
        
        <footer className="text-center mt-16 text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Virtual Try-On. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;