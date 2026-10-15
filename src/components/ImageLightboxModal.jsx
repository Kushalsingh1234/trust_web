import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export const ImageLightboxModal = ({ image, onClose, onPrev, onNext }) => {
  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-950/80 border-b border-gray-800 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <h4 className="font-bold text-sm sm:text-base text-gray-100 truncate max-w-md sm:max-w-xl">
              {image.title}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Image Stage */}
        <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 bg-black/40 overflow-hidden min-h-[300px]">
          <img
            src={image.src}
            alt={image.title}
            className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-md"
          />

          {/* Nav Controls */}
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Caption Bar */}
        <div className="w-full bg-gray-950 px-5 py-3 border-t border-gray-800">
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed text-center sm:text-left">
            {image.caption}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageLightboxModal;
