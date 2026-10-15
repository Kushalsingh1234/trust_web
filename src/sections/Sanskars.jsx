import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Phone, ChevronRight } from 'lucide-react';

export const Sanskars = () => {
  const { lang, t } = useLanguage();
  const [selectedPhase, setSelectedPhase] = useState('all');

  const phases = [
    { id: 'all', label: lang === 'hi' ? 'सभी १६ संस्कार' : 'All 16 Sanskars' },
    { id: 'prenatal', label: lang === 'hi' ? 'गर्भावस्था संस्कार (१-३)' : 'Prenatal (1-3)' },
    { id: 'childhood', label: lang === 'hi' ? 'शैशव व बाल्यकाल (४-१०)' : 'Childhood (4-10)' },
    { id: 'education', label: lang === 'hi' ? 'शिक्षा व दीक्षा (११-१४)' : 'Education (11-14)' },
    { id: 'grihastha', label: lang === 'hi' ? 'गृहस्थ व मोक्ष (१५-१६)' : 'Family & Rites (15-16)' },
  ];

  const filteredItems = t.sanskars.items.filter(item => {
    if (selectedPhase === 'all') return true;
    if (selectedPhase === 'prenatal') return item.id >= 1 && item.id <= 3;
    if (selectedPhase === 'childhood') return item.id >= 4 && item.id <= 10;
    if (selectedPhase === 'education') return item.id >= 11 && item.id <= 14;
    if (selectedPhase === 'grihastha') return item.id >= 15 && item.id <= 16;
    return true;
  });

  return (
    <section id="sanskars" className="py-16 lg:py-24 bg-[#FFF8EF] relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.sanskars.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.sanskars.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.sanskars.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {phases.map(phase => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
                selectedPhase === phase.id
                  ? 'bg-primary text-white shadow-saffron font-black'
                  : 'bg-white text-[#454545] hover:bg-[#FFF8EF] hover:text-primary border border-[#E9B44C]/40 font-bold'
              }`}
            >
              {phase.label}
            </button>
          ))}
        </div>

        {/* 16 Sanskars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#E9B44C]/35 hover:border-primary flex flex-col justify-between group hover:-translate-y-1 text-left relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-[#FFF8EF] text-primary font-black text-xs flex items-center justify-center border border-[#E9B44C]/40 shadow-sm">
                    {item.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    {lang === 'hi' ? `संस्कार क्र. ${item.id}` : `Rite #${item.id}`}
                  </span>
                </div>

                <h3 className="text-base font-black text-[#382719] mb-2 leading-snug group-hover:text-primary transition-colors font-hindi-heading">
                  {lang === 'hi' ? item.name : `${item.name} (${item.hiName})`}
                </h3>

                <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9B44C]/25 flex items-center justify-between text-xs font-bold text-secondary group-hover:text-primary">
                <span>{lang === 'hi' ? 'कम खर्च में आयोजन' : 'Affordable Rites'}</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Benefits & Call to Action Box from flyer */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-[#E9B44C]/50 shadow-card text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h4 className="text-base sm:text-lg font-black text-[#382719] font-hindi-heading">
                  {t.sanskars.benefitTitle}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-medium">
                {t.sanskars.benefitDesc}
              </p>
              <p className="text-xs sm:text-sm font-bold text-primary pt-1">
                {t.sanskars.ctaText}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary hover:bg-secondary text-white font-black text-xs sm:text-sm shadow-saffron transition-transform active:scale-95 border border-primary"
              >
                <span>{t.sanskars.ctaBtn}</span>
              </a>
              <a
                href="tel:+919794590044"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#E9B44C]/40 bg-[#FFF8EF] hover:bg-white text-[#382719] font-bold text-xs"
              >
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>9794590044 / 9026734887</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Sanskars;
