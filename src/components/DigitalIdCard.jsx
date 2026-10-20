import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from './TrustLogo';
import { Printer, ShieldCheck, CheckCircle2, Award, Calendar, MapPin } from 'lucide-react';

export const DigitalIdCard = ({ member, onClose }) => {
  const { lang } = useLanguage();
  const cardRef = useRef(null);

  if (!member || (member.status && member.status !== 'active' && member.status !== 'approved')) return null;

  const isVolunteer = member.cardType === 'volunteer' || member.role === 'volunteer';

  const handlePrint = () => {
    window.print();
  };

  const getCategoryTitle = (cat) => {
    if (isVolunteer) return lang === 'hi' ? 'समर्पित स्वयंसेवक / कार्यकर्ता' : 'Dedicated Volunteer / Worker';
    if (cat === 'catA') return lang === 'hi' ? 'श्रेणी-क (सहायता लाभार्थी)' : 'Category A (Beneficiary)';
    if (cat === 'catB') return lang === 'hi' ? 'श्रेणी-ख (सम्पन्न / दानदाता सदस्य)' : 'Category B (Donor / Supporter)';
    if (cat === 'catC') return lang === 'hi' ? 'श्रेणी-ग (कर्मठ स्वयंसेवक)' : 'Category C (Volunteer Member)';
    return lang === 'hi' ? 'सत्यापित सदस्य' : 'Verified Member';
  };

  const formattedDate = member.approvedAt?.toDate
    ? member.approvedAt.toDate().toLocaleDateString('en-IN')
    : member.memberSince?.toDate
    ? member.memberSince.toDate().toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border-2 border-primary/40 shadow-card max-w-lg w-full mx-auto text-left relative overflow-hidden">
      
      {/* Printable Card Area */}
      <div
        ref={cardRef}
        id="trust-member-id-card"
        className="rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-[#E9B44C] bg-gradient-to-br from-[#FFF8EF] via-white to-[#FFF8EF] shadow-md relative overflow-hidden print:m-0 print:border-black"
      >
        {/* Top Watermark Om Background */}
        <div className="absolute right-2 -bottom-6 text-[#E9B44C]/15 font-serif text-8xl sm:text-9xl select-none pointer-events-none">
          ॐ
        </div>

        {/* Card Header Strip */}
        <div className="flex items-center gap-2.5 sm:gap-3 border-b-2 border-primary/30 pb-2.5 sm:pb-3 mb-3 sm:mb-4">
          <TrustLogo className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" showText={false} lang={lang} />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-secondary block truncate">
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

        {/* Identity Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 sm:mb-4 bg-primary text-white px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold">
          <span className="text-[11px] sm:text-xs">
            {isVolunteer
              ? (lang === 'hi' ? 'डिजिटल स्वयंसेवक पहचान पत्र (VOLUNTEER ID)' : 'DIGITAL VOLUNTEER ID CARD')
              : (lang === 'hi' ? 'डिजिटल सदस्यता पहचान पत्र (MEMBER ID)' : 'DIGITAL MEMBER ID CARD')}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] bg-secondary px-2 py-0.5 rounded text-white font-extrabold w-fit">
            {member.membershipNumber || member.memberId || (isVolunteer ? `VOL-${(member.phone || '9999').slice(-4)}` : 'TRUST-MEM')}
          </span>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
          {/* Member Avatar / Profile Photo */}
          <div className="col-span-4 text-center">
            <div className="w-16 h-20 sm:w-20 sm:h-24 mx-auto rounded-xl border-2 border-primary/40 bg-white shadow-inner flex flex-col items-center justify-center p-1 overflow-hidden relative">
              {member.photoURL || member.profilePic ? (
                <img
                  src={member.photoURL || member.profilePic}
                  alt={member.fullName || 'Member'}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FFF8EF] text-primary flex items-center justify-center font-bold text-base sm:text-lg mb-1 border border-[#E9B44C]">
                    ॐ
                  </div>
                  <span className="text-[7px] sm:text-[8px] font-black text-trust-green uppercase">Verified</span>
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
              <span className="text-[9px] sm:text-[10px] text-[#666666] block">सदस्य का नाम / Name:</span>
              <span className="font-extrabold text-[#382719] text-xs sm:text-sm block">
                {member.fullName}
              </span>
            </div>

            {member.fatherHusbandName && (
              <div>
                <span className="text-[9px] sm:text-[10px] text-[#666666] block">पिता / पति:</span>
                <span className="font-medium text-[#454545] text-[11px] sm:text-xs">
                  {member.fatherHusbandName}
                </span>
              </div>
            )}

            <div>
              <span className="text-[9px] sm:text-[10px] text-[#666666] block">सदस्यता श्रेणी / Category:</span>
              <span className="font-bold text-primary text-[11px] sm:text-xs">
                {getCategoryTitle(member.category)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-[9px] sm:text-[10px] text-[#666666] border-t border-[#E9B44C]/30">
              <div>
                <span>{lang === 'hi' ? 'जारी: ' : 'Issued: '}</span>
                <span className="font-mono font-bold text-[#382719]">{formattedDate}</span>
              </div>
              <div>
                <span>{lang === 'hi' ? 'वैधता: ' : 'Valid: '}</span>
                <span className="font-mono font-bold text-trust-green">{member.validUntil || (lang === 'hi' ? '1 वर्ष' : '1 Year')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Strip with Authorized Signatory */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-2.5 border-t border-dashed border-[#E9B44C]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[8px] sm:text-[9px] text-[#666666]">
          <div className="flex items-center gap-1 text-trust-green font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'अधिकृत ट्रस्ट पहचान पत्र' : 'Official Verified Trust ID'}</span>
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
          {lang === 'hi' ? '* यह पहचान पत्र संस्था के कार्यक्रमों व शिविरों में मान्य है।' : '* This digital ID is officially recognized across all trust camps.'}
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'hi' ? 'प्रिंट / डाउनलोड करें' : 'Print / Download'}</span>
        </button>
      </div>

    </div>
  );
};

export default DigitalIdCard;
