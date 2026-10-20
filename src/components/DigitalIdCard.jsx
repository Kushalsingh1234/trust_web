import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from './TrustLogo';
import { Printer, ShieldCheck, Users, CheckCircle2, Award, Calendar, MapPin, Sparkles } from 'lucide-react';

export const DigitalIdCard = ({ member, onClose }) => {
  const { lang } = useLanguage();
  const cardRef = useRef(null);

  if (!member || (member.status && member.status !== 'active' && member.status !== 'approved')) return null;

  const isVolunteer = member.cardType === 'volunteer' || member.role === 'volunteer' || member.memberType === 'volunteer' || member.category === 'catC';

  const handlePrint = () => {
    window.print();
  };

  const getCategoryTitle = (cat) => {
    if (isVolunteer) {
      return lang === 'hi'
        ? '🤝 श्रेणी-ग: समर्पित सनातन स्वयंसेवक (Dedicated Volunteer)'
        : '🤝 Cat-C: Dedicated Sanatan Volunteer';
    }
    if (cat === 'catA') {
      return lang === 'hi'
        ? '❤️ श्रेणी-क: सहायता लाभार्थी (Beneficiary Member)'
        : '❤️ Cat-A: Destitute Beneficiary';
    }
    return lang === 'hi'
      ? '🛡️ श्रेणी-ख: साधारण / संरक्षक सदस्य (Trust Member)'
      : '🛡️ Cat-B: General Patron Member';
  };

  const formattedDate = member.approvedAt?.toDate
    ? member.approvedAt.toDate().toLocaleDateString('en-IN')
    : member.memberSince?.toDate
    ? member.memberSince.toDate().toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  const cardIdNumber = isVolunteer
    ? (member.volunteerId || member.memberId || member.membershipNumber || `TRUST-V-${(member.phone || '9999').slice(-4)}`)
    : (member.membershipNumber || member.memberId || `TRUST-M-${(member.phone || '9999').slice(-4)}`);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border-2 border-primary/40 shadow-card max-w-lg w-full mx-auto text-left relative overflow-hidden">
      
      {/* Printable Card Area */}
      <div
        ref={cardRef}
        id="trust-member-id-card"
        className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 shadow-md relative overflow-hidden print:m-0 print:border-black ${
          isVolunteer
            ? 'border-emerald-600 bg-gradient-to-br from-[#F0FDF4] via-white to-[#ECFDF5] ring-2 ring-emerald-500/20'
            : 'border-[#E9B44C] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF4E0]'
        }`}
      >
        {/* Background Sacred Watermark */}
        <div className={`absolute right-2 -bottom-6 font-serif text-8xl sm:text-9xl select-none pointer-events-none ${
          isVolunteer ? 'text-emerald-700/12' : 'text-[#E9B44C]/15'
        }`}>
          ॐ
        </div>

        {/* Card Header Strip */}
        <div className={`flex items-center gap-2.5 sm:gap-3 border-b-2 pb-2.5 sm:pb-3 mb-3 sm:mb-4 ${
          isVolunteer ? 'border-emerald-600/30' : 'border-primary/30'
        }`}>
          <TrustLogo className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" showText={false} lang={lang} />
          <div className="flex-1 min-w-0">
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider block truncate ${
              isVolunteer ? 'text-emerald-800' : 'text-secondary'
            }`}>
              राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
            </span>
            <h3 className="font-extrabold text-[11px] sm:text-sm text-[#382719] leading-tight font-hindi-heading truncate">
              RASHTRIYA SANATAN SANSKAR SEVA SANSTHAN
            </h3>
            <span className="text-[8px] sm:text-[9px] text-[#666666] block truncate">
              Registered Charitable Trust • Gorakhpur (U.P.) 273016
            </span>
          </div>
        </div>

        {/* Distinct Identity Ribbon */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 sm:mb-4 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold text-white shadow-xs ${
          isVolunteer
            ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700'
            : 'bg-gradient-to-r from-primary via-[#EA6F0B] to-secondary'
        }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            {isVolunteer ? <Users className="w-3.5 h-3.5 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
            <span className="text-[11px] sm:text-xs font-black truncate">
              {isVolunteer
                ? (lang === 'hi' ? 'डिजिटल स्वयंसेवक पहचान पत्र' : 'DIGITAL VOLUNTEER ID CARD')
                : (lang === 'hi' ? 'डिजिटल ट्रस्ट सदस्यता पहचान पत्र' : 'DIGITAL MEMBER ID CARD')}
            </span>
          </div>
          <span className="font-mono text-[10px] sm:text-[11px] bg-black/25 px-2 py-0.5 rounded text-white font-extrabold w-fit tracking-wider border border-white/20">
            {cardIdNumber}
          </span>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
          {/* Avatar / Profile Photo */}
          <div className="col-span-4 text-center">
            <div className={`w-16 h-20 sm:w-20 sm:h-24 mx-auto rounded-xl border-2 bg-white shadow-inner flex flex-col items-center justify-center p-1 overflow-hidden relative ${
              isVolunteer ? 'border-emerald-600/50' : 'border-primary/40'
            }`}>
              {member.photoURL || member.profilePic ? (
                <img
                  src={member.photoURL || member.profilePic}
                  alt={member.fullName || 'Member'}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg mb-1 border ${
                    isVolunteer
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-[#FFF8EF] text-primary border-[#E9B44C]'
                  }`}>
                    ॐ
                  </div>
                  <span className={`text-[7px] sm:text-[8px] font-black uppercase ${
                    isVolunteer ? 'text-emerald-700' : 'text-primary'
                  }`}>
                    {isVolunteer ? 'Volunteer' : 'Verified'}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[8px] sm:text-[9px] text-[#666666] font-semibold block mt-1">
              Gorakhpur, UP
            </span>
          </div>

          {/* Member Credentials */}
          <div className="col-span-8 space-y-1 sm:space-y-1.5 text-xs">
            <div>
              <span className="text-[9px] sm:text-[10px] text-[#666666] block">
                {isVolunteer
                  ? (lang === 'hi' ? 'स्वयंसेवक का नाम / Name:' : 'Volunteer Name:')
                  : (lang === 'hi' ? 'सदस्य का नाम / Name:' : 'Member Name:')}
              </span>
              <span className="font-extrabold text-[#382719] text-xs sm:text-sm block">
                {member.fullName}
              </span>
            </div>

            {member.fatherHusbandName && (
              <div>
                <span className="text-[9px] sm:text-[10px] text-[#666666] block">पिता / पति (Guardian):</span>
                <span className="font-medium text-[#454545] text-[11px] sm:text-xs">
                  {member.fatherHusbandName}
                </span>
              </div>
            )}

            <div>
              <span className="text-[9px] sm:text-[10px] text-[#666666] block">
                {isVolunteer ? (lang === 'hi' ? 'सेवा संकल्प / Role:' : 'Seva Role:') : (lang === 'hi' ? 'सदस्यता श्रेणी / Category:' : 'Membership Category:')}
              </span>
              <span className={`font-bold text-[11px] sm:text-xs block ${
                isVolunteer ? 'text-emerald-800' : 'text-primary'
              }`}>
                {getCategoryTitle(member.category)}
              </span>
            </div>

            <div className={`flex items-center justify-between pt-1 text-[9px] sm:text-[10px] text-[#666666] border-t ${
              isVolunteer ? 'border-emerald-600/30' : 'border-[#E9B44C]/30'
            }`}>
              <div>
                <span>{lang === 'hi' ? 'जारी: ' : 'Issued: '}</span>
                <span className="font-mono font-bold text-[#382719]">{formattedDate}</span>
              </div>
              <div>
                <span>{lang === 'hi' ? 'वैधता: ' : 'Valid: '}</span>
                <span className={`font-mono font-bold ${isVolunteer ? 'text-emerald-700' : 'text-trust-green'}`}>
                  {member.validUntil || (lang === 'hi' ? '1 वर्ष' : '1 Year')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Strip with Authorized Signatory */}
        <div className={`mt-3 sm:mt-4 pt-2 sm:pt-2.5 border-t border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[8px] sm:text-[9px] text-[#666666] ${
          isVolunteer ? 'border-emerald-600/40' : 'border-[#E9B44C]/60'
        }`}>
          <div className={`flex items-center gap-1 font-bold ${
            isVolunteer ? 'text-emerald-800' : 'text-trust-green'
          }`}>
            {isVolunteer ? <Users className="w-3.5 h-3.5 text-emerald-700" /> : <ShieldCheck className="w-3.5 h-3.5 text-trust-green" />}
            <span>
              {isVolunteer
                ? (lang === 'hi' ? 'अधिकृत सनातन सेवा स्वयंसेवक' : 'Official Sanatan Volunteer')
                : (lang === 'hi' ? 'अधिकृत ट्रस्ट पहचान पत्र' : 'Official Verified Trust Member')}
            </span>
          </div>
          <div className="text-left sm:text-right">
            <span className="font-bold text-[#382719] block">
              {lang === 'hi' ? 'बजरंगी दूबे / कुसुमलता दूबे' : 'Bajrangi Dubey / Kusumlata Dubey'}
            </span>
            <span className="text-[7px] sm:text-[8px] text-[#888888]">
              {lang === 'hi' ? 'अधिकृत हस्ताक्षरकर्ता (प्रबंधकारिणी)' : 'Authorized Signatory (Executive)'}
            </span>
          </div>
        </div>

      </div>

      {/* Action Strip */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 print:hidden">
        <p className="text-[10px] sm:text-[11px] text-[#666666]">
          {isVolunteer
            ? (lang === 'hi' ? '* यह पहचान पत्र संस्था के वैदिक संस्कार व सेवा शिविरों में मान्य है।' : '* Officially recognized for all Trust awareness camps & drives.')
            : (lang === 'hi' ? '* यह पहचान पत्र संस्था के कार्यक्रमों व शिविरों में मान्य है।' : '* This digital ID is officially recognized across all trust camps.')}
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all ${
            isVolunteer
              ? 'bg-emerald-700 hover:bg-emerald-800'
              : 'bg-primary hover:bg-secondary'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'hi' ? 'प्रिंट / डाउनलोड करें' : 'Print / Download'}</span>
        </button>
      </div>

    </div>
  );
};

export default DigitalIdCard;
