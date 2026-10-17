import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

const AnimatedCounter = ({ target, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(target);
  const elementRef = useRef(null);

  useEffect(() => {
    let start = target > 50 ? target - 30 : Math.max(0, target - 5);
    const duration = 1200;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = (target - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span ref={elementRef} className="tabular-nums font-black">
      {prefix}{count}{suffix}
    </span>
  );
};

export const Impact = () => {
  const { lang, t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-[#382719] via-[#302319] to-[#241911] text-white relative overflow-hidden border-y border-[#E9B44C]/40 shadow-card">
      {/* Decorative Golden Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-[#E87516]/15 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-white bg-primary px-4 py-1 rounded-full shadow-saffron inline-block">
            {t.impact.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mt-3.5 font-hindi-heading text-accent">
            {t.impact.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-2 font-medium">
            {t.impact.subtitle}
          </p>
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {t.impact.stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-md border border-[#E9B44C]/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 text-center hover:bg-white/15 transition-all duration-300 group shadow-lg"
            >
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-accent tracking-tight mb-1 sm:mb-2 drop-shadow">
                <AnimatedCounter
                  target={stat.value}
                  prefix={stat.prefix || ''}
                  suffix={stat.suffix || ''}
                />
              </div>
              <h3 className="text-xs sm:text-base font-extrabold text-white mb-0.5 sm:mb-1 leading-snug">
                {stat.label}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-300 font-medium">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Verification Footer Note */}
        <div className="mt-8 sm:mt-10 text-center text-[11px] sm:text-xs text-accent/90 font-medium">
          <span>{lang === 'hi' 
            ? '★ आँकड़े संस्थान के प्रचार-प्रसार पत्रक व जमीनी शिविरों के अनुसार प्रस्तुत हैं।' 
            : '★ Metrics documented from trust manifestos and on-ground worker facilitation camps.'}</span>
        </div>

      </div>
    </section>
  );
};

export default Impact;
