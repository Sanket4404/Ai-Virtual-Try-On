import React, { useState, useEffect, memo } from 'react';
import { ImageFile } from '../types';
import { SparklesIcon, DownloadIcon, ExpandIcon, CloseIcon, AspectRatioIcon, ZoomInIcon, ZoomOutIcon, ResetZoomIcon, RefreshIcon } from './icons';

interface ResultDisplayProps {
  isLoading: boolean;
  generatedImage: ImageFile | null;
  error: string | null;
  onRetry: () => void;
}

const loadingMessages = [
    'Warming up the AI stylist...',
    'Consulting with our AI fashion experts...',
    'Tailoring the perfect look...',
    'Stitching pixels together...',
    'Generating your style preview...',
    'Polishing the final look...',
    'Adding the finishing touches...',
];

const MAX_ZOOM = 5;
const MIN_ZOOM = 1;
const ZOOM_STEP = 0.2;

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, generatedImage, error, onRetry }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [useSquareAspectRatio, setUseSquareAspectRatio] = useState(false);

    useEffect(() => {
        if (isLoading) {
            const intervalId = setInterval(() => {
                setCurrentMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
            }, 3000);
            return () => clearInterval(intervalId);
        }
    }, [isLoading]);

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
        const fileExtension = generatedImage.mimeType.split('/')[1] || 'png';
        link.download = `virtual-try-on-${Date.now()}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleToggleAspectRatio = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUseSquareAspectRatio(prev => !prev);
    };

    const openModal = () => {
        if (!generatedImage) return;
        document.body.style.overflow = 'hidden';
        setIsModalOpen(true);
    };

    const closeModal = () => {
        document.body.style.overflow = 'auto';
        setIsModalOpen(false);
        setTimeout(() => {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setIsDragging(false);
        }, 200);
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        };
        if (isModalOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    const handleResetZoom = () => {
        setZoom(MIN_ZOOM);
        setPosition({ x: 0, y: 0 });
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newZoom = e.deltaY > 0 ? zoom - 0.1 : zoom + 0.1;
        setZoom(Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUpOrLeave = () => setIsDragging(false);
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openModal();
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-4">
                    <SparklesIcon className="w-12 h-12 text-sky-400/80 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                    <p key={currentMessageIndex} className="text-lg font-medium text-slate-300 animate-fade-in mt-4">
                        {loadingMessages[currentMessageIndex]}
                    </p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="flex-shrink-0 bg-red-500/10 p-3 rounded-full border border-red-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="mt-4 font-semibold text-xl text-slate-200">Generation Failed</p>
                    <p className="text-sm mt-2 max-w-sm text-slate-400">
                        This might be due to a network issue, a safety policy violation, or incompatible images.
                    </p>
                    <button
                        onClick={onRetry}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-sky-600/90 hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-500 transition-all hover:shadow-[0_0_20px_-5px_var(--accent-glow)]"
                    >
                        <RefreshIcon className="w-5 h-5" />
                        Try Again
                    </button>
                    <p className="text-xs mt-4 text-slate-600 break-all max-w-sm">{error}</p>
                </div>
            );
        }

        if (generatedImage) {
            return (
                <>
                    <div 
                        className="relative w-full h-full group cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 rounded-lg" 
                        onClick={openModal}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        role="button"
                        aria-label="View larger image"
                    >
                         <img
                            src={`data:${generatedImage.mimeType};base64,${generatedImage.data}`}
                            alt="Generated try-on"
                            className="object-contain w-full h-full rounded-lg transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 rounded-lg">
                           <ExpandIcon className="w-12 h-12 text-white/90 drop-shadow-lg" />
                        </div>

                        <div className="absolute top-3 right-3 flex items-center gap-2">
                             <button
                                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                                className="bg-black/50 backdrop-blur-sm text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-sky-500/90 transition-all duration-300 transform scale-90 group-hover:scale-100 hover:!scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                aria-label="Download image"
                                title="Download Image"
                            >
                                <DownloadIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleToggleAspectRatio}
                                className="bg-black/50 backdrop-blur-sm text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-sky-500/90 transition-all duration-300 transform scale-90 group-hover:scale-100 hover:!scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                aria-label="Toggle aspect ratio"
                                title="Toggle Aspect Ratio"
                            >
                                <AspectRatioIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {isModalOpen && (
                        <div 
                            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
                            onClick={closeModal}
                        >
                            <div
                                className="absolute inset-0 overflow-hidden"
                                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave}
                                onWheel={handleWheel} onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={`data:${generatedImage.mimeType};base64,${generatedImage.data}`}
                                    alt="Zoomed try-on"
                                    className="absolute top-1/2 left-1/2 max-w-none transition-transform duration-100 ease-linear"
                                    style={{ 
                                        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'default'),
                                    }}
                                />
                            </div>
                            <button onClick={closeModal} className="absolute top-4 right-4 text-white bg-black/30 rounded-full p-2 hover:bg-red-600/90 transition-all transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close">
                                <CloseIcon className="w-8 h-8" />
                            </button>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-2 p-2 shadow-lg" onClick={e => e.stopPropagation()}>
                                <button onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM} className="p-2 rounded-full text-white hover:bg-white/20 disabled:text-white/30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Zoom out" title="Zoom Out">
                                    <ZoomOutIcon className="w-7 h-7" />
                                </button>
                                <span className="text-base font-medium text-white tabular-nums w-20 text-center">{Math.round(zoom * 100)}%</span>
                                <button onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM} className="p-2 rounded-full text-white hover:bg-white/20 disabled:text-white/30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Zoom in" title="Zoom In">
                                    <ZoomInIcon className="w-7 h-7" />
                                </button>
                                <div className="border-l border-white/20 h-7 mx-1"></div>
                                <button onClick={handleResetZoom} disabled={zoom === MIN_ZOOM && position.x === 0 && position.y === 0} className="p-2 rounded-full text-white hover:bg-white/20 disabled:text-white/30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Reset view" title="Reset View">
                                    <ResetZoomIcon className="w-7 h-7" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6">
                 <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-full blur-2xl opacity-40"></div>
                    <SparklesIcon className="w-24 h-24 text-slate-600" />
                </div>
                <p className="mt-6 text-xl font-semibold text-slate-200">Your Result Awaits</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">Upload your photos and let our AI create your new look.</p>
            </div>
        );
    };

    const containerClasses = [
        "w-full", "bg-black/20", "rounded-lg",
        "flex", "items-center", "justify-center", 
        "overflow-hidden", "transition-all", "duration-300",
        useSquareAspectRatio ? 'aspect-square' : 'aspect-square md:aspect-[4/5]'
    ].join(' ');

    return (
        <div className={containerClasses}>
            {renderContent()}
        </div>
    );
};

export default memo(ResultDisplay);