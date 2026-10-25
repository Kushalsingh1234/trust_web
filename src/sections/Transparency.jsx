import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FileCheck, Clock, ShieldCheck, FileSpreadsheet, Download, ExternalLink } from 'lucide-react';

export const Transparency = () => {
  const { lang, t } = useLanguage();

  const iconMap = {
    FileCheck: FileCheck,
    Clock: Clock,
    ShieldCheck: ShieldCheck,
    FileSpreadsheet: FileSpreadsheet
  };

  return (
    <section id="transparency" className="py-12 sm:py-16 lg:py-24 bg-white relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#382719] bg-[#FFF8EF] border border-[#E9B44C]/40 px-4 py-1 rounded-full shadow-sm">
            {t.transparency.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.transparency.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.transparency.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-secondary to-[#E9B44C] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* 4 Transparency Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {t.transparency.cards.map((card, idx) => {
            const Icon = iconMap[card.icon] || FileCheck;
            return (
              <div
                key={idx}
                className="bg-[#FFF8EF] rounded-3xl p-5 sm:p-6 border border-[#E9B44C]/35 shadow-card hover:shadow-lift transition-all duration-300 flex flex-col justify-between text-left group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors border border-[#E9B44C]/35 shadow-sm flex-shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white border border-[#E9B44C]/35 text-[#382719] shadow-sm">
                      {card.status}
                    </span>
                  </div>

                  <h3 className="font-black text-[#382719] text-base sm:text-lg mb-2 font-hindi-heading group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#454545] leading-relaxed mb-4 font-normal">
                    {card.detail}
                  </p>
                </div>

                <div className="pt-3.5 sm:pt-4 border-t border-[#E9B44C]/30">
                  <div className="p-2.5 rounded-xl bg-white border border-[#E9B44C]/40 text-[11px] font-bold text-[#382719] flex items-center justify-between gap-1 shadow-xs">
                    <span className="truncate">{card.badge || card.placeholder}</span>
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Governance Commitment Statement */}
        <div className="mt-10 sm:mt-12 p-5 sm:p-8 rounded-3xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <h4 className="font-black text-[#382719] text-base sm:text-lg font-hindi-heading">
              {lang === 'hi' 
                ? 'संस्थागत सूचना के अधिकार एवं शुचिता के प्रति निष्ठा' 
                : 'Commitment to Public Accountability & Clean Governance'}
            </h4>
            <p className="text-xs sm:text-sm text-[#454545] mt-1 font-medium leading-relaxed">
              {lang === 'hi'
                ? 'संस्थान द्वारा एकत्र की गई प्रत्येक सदस्यता एवं समर्पण निधि का विवरण वार्षिक साधारण सभा में प्रस्तुत किया जाता है।'
                : 'Every contribution and membership fee received is formally reported in the Annual General Body meeting and audited.'}
            </p>
          </div>
          <a
            href="tel:+919794590044"
            className="flex-shrink-0 px-5 py-3 sm:py-2.5 rounded-full bg-white border border-[#E9B44C]/40 hover:border-primary text-xs font-black text-primary shadow-sm hover:bg-[#FFF8EF] transition-all text-center inline-flex justify-center"
          >
            {lang === 'hi' ? 'लेखा पूछताछ' : 'Accounts Inquiry'}
          </a>
        </div>

      </div>
    </section>
  );
};

export default Transparency;
