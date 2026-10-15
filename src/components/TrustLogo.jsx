import React from 'react';

export const TrustLogo = ({ className = 'w-12 h-12', showText = false, lang = 'en' }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="logoSunGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E9B44C" />
              <stop offset="60%" stopColor="#E87516" />
              <stop offset="100%" stopColor="#C65D13" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Outer Deep Saffron Rounded Background */}
          <rect width="100" height="100" rx="18" fill="#C65D13" stroke="#E9B44C" strokeWidth="2.5" />
          
          {/* Radiating Sun Rays in Warm Ivory */}
          <g stroke="#FFF8EF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95">
            <line x1="50" y1="8" x2="50" y2="22" />
            <line x1="50" y1="92" x2="50" y2="78" />
            <line x1="8" y1="50" x2="22" y2="50" />
            <line x1="92" y1="50" x2="78" y2="50" />
            <line x1="20" y1="20" x2="30" y2="30" />
            <line x1="80" y1="80" x2="70" y2="70" />
            <line x1="20" y1="80" x2="30" y2="70" />
            <line x1="80" y1="20" x2="70" y2="30" />
            <line x1="33" y1="12" x2="38" y2="25" />
            <line x1="67" y1="88" x2="62" y2="75" />
            <line x1="12" y1="67" x2="25" y2="62" />
            <line x1="88" y1="33" x2="75" y2="38" />
            <line x1="12" y1="33" x2="25" y2="38" />
            <line x1="88" y1="67" x2="75" y2="62" />
            <line x1="67" y1="12" x2="62" y2="25" />
            <line x1="33" y1="88" x2="38" y2="75" />
          </g>

          {/* Golden Circle Ring */}
          <circle cx="50" cy="50" r="28" fill="url(#logoSunGrad)" stroke="#E9B44C" strokeWidth="2" />
          <circle cx="50" cy="50" r="24" fill="none" stroke="#FFF8EF" strokeWidth="1" strokeDasharray="2,2" />

          {/* Central Sacred OM */}
          <text 
            x="50" 
            y="59" 
            fontFamily="'Noto Sans Devanagari', sans-serif" 
            fontWeight="bold" 
            fontSize="26" 
            textAnchor="middle" 
            fill="#FFFFFF"
            filter="url(#glow)"
          >
            ॐ
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-black text-[#382719] leading-tight text-sm md:text-base tracking-tight">
            {lang === 'hi' ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान' : 'Rashtriya Sanatan Sanskar Seva Sansthan'}
          </span>
          <span className="text-xs text-primary font-bold flex items-center gap-1.5">
            <span className="bg-[#FFF8EF] text-[#C65D13] border border-[#E9B44C]/50 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
              {lang === 'hi' ? 'ट्रस्ट • गोरखपुर' : 'Trust • Gorakhpur'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default TrustLogo;
