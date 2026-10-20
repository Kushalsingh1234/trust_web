import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, HeartHandshake, Trees, Building2, PhoneOff, Users, CalendarCheck, Coins, Sparkles } from 'lucide-react';

export const Guidelines = () => {
  const { lang, t } = useLanguage();

  const icons = [
    Sparkles, ShieldCheck, HeartHandshake, Building2, Coins, Trees,
    Building2, Building2, PhoneOff, Users, CalendarCheck, Coins
  ];

  return (
    <section id="guidelines" className="py-12 sm:py-16 lg:py-24 bg-white relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.guidelines.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.guidelines.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.guidelines.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* 12 Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {t.guidelines.items.map((item, idx) => {
            const Icon = icons[idx % icons.length] || Sparkles;
            return (
              <div
                key={item.no}
                className="p-4 sm:p-6 rounded-2xl bg-[#FFF8EF] hover:bg-[#FDF4E5] border border-[#E9B44C]/35 shadow-card hover:shadow-card-hover transition-all duration-300 flex items-start gap-3.5 sm:gap-4 text-left group hover:-translate-y-1"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary text-white font-black flex items-center justify-center flex-shrink-0 shadow-saffron text-sm sm:text-base border border-primary">
                  {item.no}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-[#382719] text-base sm:text-lg mb-1 sm:mb-1.5 group-hover:text-primary transition-colors font-hindi-heading">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Guidelines;
