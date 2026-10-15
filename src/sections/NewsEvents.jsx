import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export const NewsEvents = () => {
  const { lang, t } = useLanguage();

  return (
    <section id="news" className="py-16 lg:py-24 bg-[#FFF8EF] relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#382719] bg-white border border-[#E9B44C]/40 px-4 py-1 rounded-full shadow-sm">
            {t.news.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.news.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.news.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-secondary to-[#E9B44C] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* News Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.news.items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 shadow-card hover:shadow-lift transition-all duration-300 border border-[#E9B44C]/35 flex flex-col justify-between text-left group hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-secondary mb-3 bg-[#FFF8EF] px-3 py-1 rounded-full w-fit border border-[#E9B44C]/40">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  <span>{item.date}</span>
                </div>

                <h3 className="font-black text-[#382719] text-base sm:text-lg mb-2 leading-snug font-hindi-heading group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#454545] leading-relaxed mb-4 font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E9B44C]/25 flex items-start gap-1.5 text-xs text-[#454545] font-medium">
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{item.location}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default NewsEvents;
