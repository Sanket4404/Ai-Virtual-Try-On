import React from 'react';
import { ImageFile } from '../types';
import { StarIcon } from './icons';

interface HistoryProps {
  history: ImageFile[];
  activeImage: ImageFile | null;
  onSelect: (image: ImageFile) => void;
  onToggleFavorite: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ history, activeImage, onSelect, onToggleFavorite }) => {
  
  const handleFavoriteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };
  
  return (
    <div className="flex space-x-3 overflow-x-auto pb-3 -mx-1 px-1">
      {history.map((image) => (
        <button
          key={image.id}
          onClick={() => onSelect(image)}
          className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden focus:outline-none transition-all duration-300 transform group
            ${activeImage?.id === image.id 
              ? 'ring-2 ring-sky-400 scale-105 shadow-[0_0_25px_-5px_hsl(197_90%_58%)]' 
              : 'ring-1 ring-slate-700/50 hover:ring-sky-500/70 hover:scale-105 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800'}`}
        >
          <img
            src={`data:${image.mimeType};base64,${image.data}`}
            alt={`History item ${image.id}`}
            className="w-full h-full object-cover"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
           
           <button 
              onClick={(e) => handleFavoriteClick(e, image.id)}
              className={`absolute top-1.5 right-1.5 p-1.5 rounded-full transition-all duration-200 transform scale-90 group-hover:scale-100 hover:!scale-110
              ${image.isFavorite
                ? 'bg-amber-400/90 text-white'
                : 'bg-black/40 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-amber-400/90'
              }`}
              aria-label={image.isFavorite ? 'Unmark as favorite' : 'Mark as favorite'}
              title={image.isFavorite ? 'Unmark as favorite' : 'Mark as favorite'}
            >
             <StarIcon className={`w-4 h-4 ${image.isFavorite ? 'fill-white stroke-white' : 'fill-none stroke-current'}`} />
           </button>
        </button>
      ))}
    </div>
  );
};

export default History;