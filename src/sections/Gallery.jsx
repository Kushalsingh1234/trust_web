import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Eye } from 'lucide-react';

export const Gallery = ({ onSelectImage }) => {
  const { lang, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: t.gallery.all },
    { id: 'events', label: t.gallery.events },
    { id: 'banners', label: t.gallery.banners },
    { id: 'documents', label: t.gallery.documents },
  ];

  const filteredItems = t.gallery.items.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <section id="gallery" className="py-12 sm:py-16 lg:py-24 bg-white relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.gallery.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.gallery.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.gallery.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Category Tabs (Swipeable on Mobile) */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2 sm:flex-wrap sm:justify-center sm:pb-0 px-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all shadow-sm ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-saffron font-black'
                  : 'bg-[#FFF8EF] text-[#454545] hover:bg-white hover:text-primary border border-[#E9B44C]/40 font-bold'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid (Responsive Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((img, idx) => {
            const webpSrc = img.src.replace(/\.(jpg|png)$/, '.webp');
            return (
              <div
                key={idx}
                onClick={() => onSelectImage(img, idx, filteredItems)}
                className="group cursor-pointer rounded-2xl overflow-hidden bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col text-left hover:-translate-y-1"
              >
                {/* Image Container with overlay */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#FFF8EF]">
                  <picture>
                    <source srcSet={webpSrc} type="image/webp" />
                    <img
                      src={img.src}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = img.src;
                      }}
                    />
                  </picture>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-3 rounded-full bg-white/95 text-primary shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                      {img.category}
                    </span>
                  </div>
                </div>

                {/* Text Caption Container */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-[#382719] group-hover:text-primary transition-colors leading-snug font-hindi-heading">
                      {img.title}
                    </h4>
                    <p className="text-xs text-[#454545] mt-1 line-clamp-2 leading-relaxed">
                      {img.caption}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E9B44C]/25 flex items-center justify-between text-[11px] text-primary font-bold">
                    <span>{lang === 'hi' ? 'बड़ा देखें' : 'Click to enlarge'}</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Gallery;
