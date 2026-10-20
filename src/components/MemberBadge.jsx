import React from 'react';
import { ShieldCheck, Heart, Award, Users, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
 * Brand-Tailored Member Badge for All 3 Categories:
 * - Category A: Destitute & Beneficiary Member (निराश्रित / सहायता लाभार्थी) - Free / ₹0
 * - Category B: Patron & General Member (साधारण / संरक्षक सदस्य) - ₹200
 * - Category C: Active Ground Volunteer Member (समर्पित कार्यकर्ता / स्वयंसेवक) - Seva / ₹200
 */

export const CATEGORY_CONFIG = {
  catA: {
    code: 'A',
    labelEn: 'Cat A • Beneficiary',
    labelHi: 'श्रेणी-क • लाभार्थी',
    shortEn: 'Cat A',
    shortHi: 'श्रेणी-क',
    subEn: 'Destitute & Beneficiary',
    subHi: 'निराश्रित / सहायता लाभार्थी',
    fee: '₹0 (निःशुल्क)',
    badgeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400',
    inlineBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    iconBg: 'bg-emerald-600 text-white',
    iconColor: 'text-emerald-600',
    Icon: Heart
  },
  catB: {
    code: 'B',
    labelEn: 'Cat B • Patron',
    labelHi: 'श्रेणी-ख • संरक्षक',
    shortEn: 'Cat B',
    shortHi: 'श्रेणी-ख',
    subEn: 'Patron Member',
    subHi: 'साधारण / संरक्षक सदस्य',
    fee: '₹200/वर्ष',
    badgeBg: 'bg-gradient-to-r from-[#E87516] to-amber-600 text-white border-amber-400',
    inlineBg: 'bg-[#FFF8EF] text-[#B85A09] border-[#E9B44C]',
    iconBg: 'bg-[#E87516] text-white',
    iconColor: 'text-[#E87516]',
    Icon: Award
  },
  catC: {
    code: 'C',
    labelEn: 'Cat C • Volunteer',
    labelHi: 'श्रेणी-ग • कार्यकर्ता',
    shortEn: 'Cat C',
    shortHi: 'श्रेणी-ग',
    subEn: 'Active Ground Volunteer',
    subHi: 'समर्पित कार्यकर्ता / स्वयंसेवक',
    fee: '₹200/वर्ष',
    badgeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400',
    inlineBg: 'bg-blue-50 text-blue-800 border-blue-300',
    iconBg: 'bg-blue-600 text-white',
    iconColor: 'text-blue-600',
    Icon: Users
  }
};

export const MemberBadge = ({
  category = 'catB', // 'catA' | 'catB' | 'catC' | null
  memberId,
  status = 'approved',
  variant = 'inline', // 'inline' | 'compact' | 'pill' | 'card'
  showId = true,
  lang = 'hi',
  className = ''
}) => {
  // Normalize category
  const catKey = (category && CATEGORY_CONFIG[category]) ? category : 'catB';
  const config = CATEGORY_CONFIG[catKey];
  const IconComponent = config.Icon;
  const isRemoved = status === 'removed';

  if (isRemoved) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-300 shadow-xs ${className}`}
        title="Revoked / Inactive Member"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span>निरस्त (Revoked)</span>
      </span>
    );
  }

  // 1. INLINE VARIANT: Specially designed to sit directly in front of the member's name
  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-black tracking-tight border shadow-2xs select-none ${config.inlineBg} ${className}`}
        title={`${lang === 'hi' ? config.subHi : config.subEn}${memberId ? ` • ID: ${memberId}` : ''}`}
      >
        <IconComponent className="w-3 h-3 flex-shrink-0 fill-current opacity-90" />
        <span className="font-hindi-heading font-extrabold uppercase">
          {lang === 'hi' ? config.shortHi : config.shortEn}
        </span>
        {showId && memberId && (
          <span className="font-mono text-[9px] opacity-75 font-semibold hidden sm:inline ml-0.5">
            #{memberId.replace('TRUST-M-', '')}
          </span>
        )}
      </span>
    );
  }

  // 2. COMPACT PILL VARIANT: For profile dropdowns and table action rows
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-xs border ${config.badgeBg} ${className}`}
        title={`${lang === 'hi' ? config.subHi : config.subEn}${memberId ? ` • ${memberId}` : ''}`}
      >
        <IconComponent className="w-3 h-3 flex-shrink-0 fill-white/20" />
        <span>{lang === 'hi' ? config.labelHi : config.labelEn}</span>
        {showId && memberId && (
          <span className="font-mono font-bold bg-black/20 px-1 py-0.2 rounded text-[9px] ml-0.5">
            {memberId}
          </span>
        )}
      </span>
    );
  }

  // 3. PILL VARIANT: Soft rounded badge with ID
  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-xs ${config.inlineBg} ${className}`}
      >
        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${config.iconBg}`}>
          <IconComponent className="w-2.5 h-2.5 fill-white/20" />
        </div>
        <span>{lang === 'hi' ? config.subHi : config.subEn}</span>
        {showId && memberId && (
          <span className="font-mono font-black text-primary px-1.5 py-0.5 rounded bg-white border border-[#E9B44C]/40 text-[10px]">
            {memberId}
          </span>
        )}
      </span>
    );
  }

  // 4. FULL CARD VARIANT: For dashboards & certificate headers
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#FFF8EF] via-white to-[#FFF8EF] border-2 border-[#E9B44C] shadow-sm text-left ${className}`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${config.iconBg}`}>
          <IconComponent className="w-5 h-5 fill-white/20" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-2.5 h-2.5" />
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-[#382719] uppercase tracking-wide">
            {lang === 'hi' ? config.labelHi : config.labelEn}
          </span>
        </div>
        <p className="text-[10px] text-[#777777] font-medium leading-none mt-0.5">
          {lang === 'hi' ? config.subHi : config.subEn}
        </p>
        {showId && memberId && (
          <span className="font-mono text-[11px] font-black text-primary block mt-1 tracking-tight">
            {memberId}
          </span>
        )}
      </div>
    </div>
  );
};

export default MemberBadge;
