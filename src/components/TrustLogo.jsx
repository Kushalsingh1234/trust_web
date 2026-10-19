import React from 'react';

export const TrustLogo = ({ 
  className = 'w-12 h-12', 
  showText = false, 
  lang = 'en', 
  containerClassName = '',
  hasBackground = false,
  animated = false
}) => {
  return (
    <div className={`flex items-center ${showText ? 'gap-3' : 'justify-center'} ${containerClassName}`}>
      <div className={`relative flex-shrink-0 ${className}`}>
        <svg 
          viewBox="-110 -110 220 220" 
          className="w-full h-full select-none overflow-visible"
          aria-label="Rashtriya Sanatan Sanskar Seva Sansthan Emblem"
        >
          <defs>
            <style>{`
              @keyframes celestialRaysSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              /* ONLY animate on desktop screens (768px and up) when animated prop is true */
              @media (min-width: 768px) {
                .celestial-spin {
                  transform-origin: 0px 0px;
                  animation: celestialRaysSpin 65s linear infinite;
                }
                .celestial-spin:hover {
                  animation-duration: 35s;
                }
              }
              /* Strict animation disable on mobile / small screens */
              @media (max-width: 767px) {
                .celestial-spin {
                  animation: none !important;
                  transform: none !important;
                }
              }
            `}</style>

            {/* 3D Primary Flame Facet Gradients */}
            <linearGradient id="pRayLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFDE6" />
              <stop offset="25%" stopColor="#FFDE6A" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D96514" />
            </linearGradient>

            <linearGradient id="pRayDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFC72C" />
              <stop offset="40%" stopColor="#E87516" />
              <stop offset="85%" stopColor="#A94406" />
              <stop offset="100%" stopColor="#782904" />
            </linearGradient>

            {/* 3D Secondary Intermediate Ray Gradients */}
            <linearGradient id="sRayLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7C2" />
              <stop offset="45%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#E87516" />
            </linearGradient>

            <linearGradient id="sRayDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="60%" stopColor="#C65D13" />
              <stop offset="100%" stopColor="#6C2402" />
            </linearGradient>

            {/* Royal Gold Beveled Rim Gradient */}
            <linearGradient id="goldBevelRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF0" />
              <stop offset="20%" stopColor="#F3D17A" />
              <stop offset="40%" stopColor="#C69224" />
              <stop offset="60%" stopColor="#FFECA0" />
              <stop offset="80%" stopColor="#B37812" />
              <stop offset="100%" stopColor="#FFE07A" />
            </linearGradient>

            {/* Core Sun Disc Radial Gradient - Radiant Divine Orb */}
            <radialGradient id="divineSunOrb" cx="38%" cy="36%" r="65%">
              <stop offset="0%" stopColor="#FFFEEA" />
              <stop offset="18%" stopColor="#FDE68A" />
              <stop offset="38%" stopColor="#F59E0B" />
              <stop offset="62%" stopColor="#E87516" />
              <stop offset="84%" stopColor="#C65D13" />
              <stop offset="100%" stopColor="#7C2402" />
            </radialGradient>

            {/* Sacred Om Golden Shimmer Gradient */}
            <linearGradient id="sacredOmGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#FFFBEB" />
              <stop offset="55%" stopColor="#FEEFAD" />
              <stop offset="85%" stopColor="#F5D061" />
              <stop offset="100%" stopColor="#E5A82E" />
            </linearGradient>

            {/* Pearl Gem Gradient */}
            <radialGradient id="pearlGem" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FFF4BE" />
              <stop offset="85%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#92400E" />
            </radialGradient>

            {/* Subtle Drop Shadows & Divine Halos */}
            <filter id="omWarmGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#421300" floodOpacity="0.85" />
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFA726" floodOpacity="0.6" />
            </filter>

            <filter id="rimGoldShine" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="discSunGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>

            {/* Reusable 3D Sculpted Primary Ray (Faceted with Light & Dark Sides) */}
            <g id="sculptedPrimaryRay">
              {/* Left Lighted Facet */}
              <path 
                d="M 0 -50 L -8.5 -50 Q -10.5 -74 0 -102 Z" 
                fill="url(#pRayLight)" 
              />
              {/* Right Shaded Facet */}
              <path 
                d="M 0 -50 L 8.5 -50 Q 10.5 -74 0 -102 Z" 
                fill="url(#pRayDark)" 
              />
              {/* Center Ridge Highlight Line */}
              <line 
                x1="0" 
                y1="-50" 
                x2="0" 
                y2="-102" 
                stroke="#FFFBEB" 
                strokeWidth="0.6" 
                opacity="0.85" 
              />
            </g>

            {/* Reusable 3D Sculpted Secondary Spear Ray */}
            <g id="sculptedSecondaryRay">
              {/* Left Lighted Facet */}
              <path 
                d="M 0 -50 L -5 -50 L 0 -85 Z" 
                fill="url(#sRayLight)" 
              />
              {/* Right Shaded Facet */}
              <path 
                d="M 0 -50 L 5 -50 L 0 -85 Z" 
                fill="url(#sRayDark)" 
              />
              {/* Center Ridge Highlight Line */}
              <line 
                x1="0" 
                y1="-50" 
                x2="0" 
                y2="-85" 
                stroke="#FFFDD0" 
                strokeWidth="0.45" 
                opacity="0.75" 
              />
            </g>

            {/* Decorative Golden Lotus Tooth around Core Disc */}
            <polygon id="discLotusPetal" points="0,-51 -2.8,-47 2.8,-47" fill="url(#goldBevelRim)" />
          </defs>

          {/* Optional Background Tile (Default: false / transparent) */}
          {hasBackground && (
            <rect 
              x="-106" 
              y="-106" 
              width="212" 
              height="212" 
              rx="40" 
              fill="url(#divineSunOrb)" 
              stroke="#E9B44C" 
              strokeWidth="2.5" 
            />
          )}

          {/* Outer Ambient Sun Halo Glow */}
          <circle 
            r="82" 
            fill="none" 
            stroke="url(#pRayLight)" 
            strokeWidth="8" 
            opacity="0.12" 
            filter="url(#discSunGlow)" 
          />

          {/* Celestial Radiating Sun Rays (Chakra) - Spins only on desktop if animated */}
          <g className={animated ? "celestial-spin" : ""}>
            {/* 16 Secondary Intermediate Rays */}
            {[11.25, 33.75, 56.25, 78.75, 101.25, 123.75, 146.25, 168.75, 191.25, 213.75, 236.25, 258.75, 281.25, 303.75, 326.25, 348.75].map((deg) => (
              <use key={`sec-${deg}`} href="#sculptedSecondaryRay" transform={`rotate(${deg})`} />
            ))}

            {/* 16 Primary Sculpted Flame Rays */}
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg) => (
              <use key={`pri-${deg}`} href="#sculptedPrimaryRay" transform={`rotate(${deg})`} />
            ))}

            {/* Elegant Outer Ring Orbit with Fine Golden Hairline */}
            <circle 
              r="52.5" 
              fill="none" 
              stroke="#FFDF73" 
              strokeWidth="0.8" 
              opacity="0.5" 
            />

            {/* 16 Sacred Pearl Beads (षोडश संस्कार मणिका) */}
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg) => (
              <circle 
                key={`pearl-${deg}`}
                cx="0" 
                cy="-52.5" 
                r="2.2" 
                fill="url(#pearlGem)" 
                stroke="#92400E" 
                strokeWidth="0.4" 
                transform={`rotate(${deg})`} 
              />
            ))}
          </g>

          {/* Stationary Royal Central Disc Assembly */}

          {/* Layer 1: Heavy Beveled Gold Rim */}
          <circle 
            r="49.5" 
            fill="none" 
            stroke="url(#goldBevelRim)" 
            strokeWidth="3.5" 
            filter="url(#rimGoldShine)" 
          />

          {/* Layer 2: 32 Lotus Teeth / Petals Framing Disc */}
          <g>
            {[0, 11.25, 22.5, 33.75, 45, 56.25, 67.5, 78.75, 90, 101.25, 112.5, 123.75, 135, 146.25, 157.5, 168.75, 180, 191.25, 202.5, 213.75, 225, 236.25, 247.5, 258.75, 270, 281.25, 292.5, 303.75, 315, 326.25, 337.5, 348.75].map((deg) => (
              <use key={`petal-${deg}`} href="#discLotusPetal" transform={`rotate(${deg})`} />
            ))}
          </g>

          {/* Layer 3: Inner Golden Accent Hairline */}
          <circle 
            r="46.5" 
            fill="none" 
            stroke="#FFECA0" 
            strokeWidth="0.9" 
            opacity="0.85" 
          />

          {/* Layer 4: Radiant Saffron Core Sun Disc */}
          <circle 
            r="45" 
            fill="url(#divineSunOrb)" 
          />

          {/* Layer 5: Subtle Specular Top Arc Highlight */}
          <path 
            d="M -34 -24 A 41 41 0 0 1 34 -24 A 44 44 0 0 0 -34 -24 Z" 
            fill="#FFFFFF" 
            opacity="0.22" 
          />

          {/* Central Sacred OM (ॐ) - Magnificent Divine Typography */}
          <g filter="url(#omWarmGlow)">
            {/* Ambient Base Shadow Layer */}
            <text 
              x="0" 
              y="18.5" 
              fontFamily="'Tiro Devanagari Hindi', 'Noto Serif Devanagari', 'Noto Sans Devanagari', 'Yatra One', serif" 
              fontWeight="900" 
              fontSize="52" 
              textAnchor="middle" 
              fill="#3A1000"
              opacity="0.4"
              className="select-none pointer-events-none"
            >
              ॐ
            </text>

            {/* Glowing Golden Foreground OM with Metallic Edge */}
            <text 
              x="0" 
              y="17.5" 
              fontFamily="'Tiro Devanagari Hindi', 'Noto Serif Devanagari', 'Noto Sans Devanagari', 'Yatra One', serif" 
              fontWeight="900" 
              fontSize="52" 
              textAnchor="middle" 
              fill="url(#sacredOmGold)"
              stroke="#FFF8D6"
              strokeWidth="0.75"
              className="select-none pointer-events-none"
            >
              ॐ
            </text>
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left min-w-0">
          <span className="font-black text-[#382719] leading-tight text-sm md:text-base tracking-tight font-hindi-heading truncate">
            {lang === 'hi' ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान' : 'Rashtriya Sanatan Sanskar Seva Sansthan'}
          </span>
          <span className="text-xs text-primary font-bold flex items-center gap-1.5 mt-0.5">
            <span className="bg-[#FFF8EF] text-[#C65D13] border border-[#E9B44C]/50 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-xs">
              {lang === 'hi' ? 'ट्रस्ट • गोरखपुर' : 'Trust • Gorakhpur'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default TrustLogo;
