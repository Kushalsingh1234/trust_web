import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from './TrustLogo';
import { Download, ShieldCheck, Users } from 'lucide-react';
import html2canvas from 'html2canvas';

export const DigitalIdCard = ({ member, onClose }) => {
  const { lang } = useLanguage();
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!member || (member.status && member.status !== 'active' && member.status !== 'approved')) return null;

  const isVolunteer = member.cardType === 'volunteer' || member.role === 'volunteer' || member.memberType === 'volunteer' || member.category === 'catC';

  // 1. Issue & Expiry Date (Expiry is strictly 1 year from issued date)
  const issueDateObj = member.approvedAt?.toDate
    ? member.approvedAt.toDate()
    : member.memberSince?.toDate
    ? member.memberSince.toDate()
    : member.submittedAt?.toDate
    ? member.submittedAt.toDate()
    : new Date();

  const formattedIssueDate = issueDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const expiryDateObj = new Date(issueDateObj);
  expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
  const formattedExpiryDate = expiryDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // 2. Sequential Order ID (e.g. 001, 002, 007 based on order)
  const extractCleanOrderId = (rawId) => {
    if (!rawId) return '001';
    const str = String(rawId).trim();
    const match = str.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return String(num).padStart(3, '0');
    }
    return str;
  };

  const rawIdNumber = isVolunteer
    ? (member.volunteerId || member.memberId || member.membershipNumber)
    : (member.membershipNumber || member.memberId);

  const formattedCardId = extractCleanOrderId(rawIdNumber);

  // 3. Download ID Card strictly as an image in clean horizontal form
  const handleDownloadImage = async () => {
    if (!cardRef.current || isDownloading) return;
    try {
      setIsDownloading(true);

      // Wait for any embedded images (avatar/logo) to load completely
      const imgElements = cardRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(imgElements).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // 3x ultra-sharp resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        onclone: (clonedDoc) => {
          const cardElement = clonedDoc.getElementById('trust-member-id-card');
          if (cardElement) {
            cardElement.style.width = '520px';
            cardElement.style.maxWidth = '520px';
            cardElement.style.borderRadius = '16px';
            cardElement.style.margin = '0';
          }
        }
      });

      const image = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const safeName = (member.fullName || 'Card').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${isVolunteer ? 'Volunteer_ID_Card' : 'Member_ID_Card'}_${safeName}_${formattedCardId}.png`;
      downloadLink.download = filename;
      downloadLink.href = image;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to download card image:', err);
      alert(lang === 'hi' ? 'पहचान पत्र छवि डाउनलोड करने में समस्या आई। कृपया पुनः प्रयास करें।' : 'Failed to download card image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-primary/30 shadow-card max-w-lg w-full mx-auto text-left relative overflow-hidden">
      
      {/* Horizontal Printable Card Area */}
      <div
        ref={cardRef}
        id="trust-member-id-card"
        className={`w-full rounded-2xl p-4 sm:p-5 border-2 shadow-md relative overflow-hidden ${
          isVolunteer
            ? 'border-emerald-600 bg-gradient-to-br from-[#F0FDF4] via-white to-[#ECFDF5] ring-2 ring-emerald-500/20'
            : 'border-[#E9B44C] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF4E0]'
        }`}
      >
        {/* Background Sacred Watermark - Soft & Transparent */}
        <div
          style={{ opacity: isVolunteer ? 0.08 : 0.14 }}
          className={`absolute right-2 -bottom-6 font-serif text-8xl sm:text-9xl select-none pointer-events-none ${
            isVolunteer ? 'text-emerald-700' : 'text-[#E9B44C]'
          }`}
        >
          ॐ
        </div>

        {/* Card Header Strip - Full Name without Truncation */}
        <div className={`flex items-center gap-3 border-b-2 pb-2.5 mb-3 ${
          isVolunteer ? 'border-emerald-600/30' : 'border-primary/30'
        }`}>
          <TrustLogo className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0" showText={false} lang={lang} />
          <div className="flex-1 min-w-0">
            <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider block leading-tight ${
              isVolunteer ? 'text-emerald-800' : 'text-secondary'
            }`}>
              राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
            </span>
            <h3 className="font-extrabold text-[11px] sm:text-[13px] md:text-sm text-[#382719] leading-snug font-hindi-heading tracking-tight break-words uppercase mt-0.5">
              RASHTRIYA SANATAN SANSKAR SEVA SANSTHAN
            </h3>
            <span className="text-[8px] sm:text-[9px] text-[#666666] font-semibold block leading-tight mt-0.5">
              Registered Charitable Trust • Gorakhpur (U.P.) 273016
            </span>
          </div>
        </div>

        {/* Distinct Identity Ribbon: strictly VOLUNTEER ID CARD / MEMBER ID CARD */}
        <div className={`flex items-center justify-between gap-2 mb-3.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs ${
          isVolunteer
            ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800'
            : 'bg-gradient-to-r from-primary via-[#EA6F0B] to-secondary'
        }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            {isVolunteer ? <Users className="w-3.5 h-3.5 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase">
              {isVolunteer ? 'VOLUNTEER ID CARD' : 'MEMBER ID CARD'}
            </span>
          </div>
          <span className="font-mono text-xs sm:text-[13px] bg-black/30 px-2.5 py-0.5 rounded text-white font-black tracking-wider border border-white/20 shrink-0">
            ID: {formattedCardId}
          </span>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Avatar / Profile Photo */}
          <div className="col-span-4 text-center">
            <div className={`w-18 h-22 sm:w-20 sm:h-24 mx-auto rounded-xl border-2 bg-white shadow-inner flex flex-col items-center justify-center p-1 overflow-hidden relative ${
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
          <div className="col-span-8 space-y-2 text-xs">
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

            {/* Clean Role: Strictly Trust Volunteer or Trust Member, No Emojis or Cat B/C */}
            <div>
              <span className="text-[9px] sm:text-[10px] text-[#666666] block">
                {isVolunteer ? (lang === 'hi' ? 'पद / भूमिका:' : 'Role:') : (lang === 'hi' ? 'पद / भूमिका:' : 'Designation:')}
              </span>
              <span className={`font-bold text-xs sm:text-[13px] block ${
                isVolunteer ? 'text-emerald-800' : 'text-primary'
              }`}>
                {isVolunteer ? 'Trust Volunteer' : 'Trust Member'}
              </span>
            </div>

            {/* Issue & Expiry Dates */}
            <div className={`flex items-center justify-between pt-1.5 text-[9px] sm:text-[10px] text-[#666666] border-t ${
              isVolunteer ? 'border-emerald-600/30' : 'border-[#E9B44C]/30'
            }`}>
              <div>
                <span>{lang === 'hi' ? 'जारी / Issued: ' : 'Issued: '}</span>
                <span className="font-mono font-bold text-[#382719]">{formattedIssueDate}</span>
              </div>
              <div>
                <span>{lang === 'hi' ? 'समाप्ति / Expiry: ' : 'Expiry: '}</span>
                <span className={`font-mono font-bold ${isVolunteer ? 'text-emerald-700' : 'text-primary'}`}>
                  {formattedExpiryDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Strip with Authorized Signatory */}
        <div className={`mt-3 sm:mt-4 pt-2 border-t border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[8px] sm:text-[9px] text-[#666666] ${
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

      {/* Action Strip - Image Download Only (No Print, No PDF) */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-[10px] sm:text-[11px] text-[#666666]">
          {isVolunteer
            ? (lang === 'hi' ? '* यह पहचान पत्र संस्था के वैदिक संस्कार व सेवा शिविरों में मान्य है।' : '* Officially recognized for all Trust awareness camps & drives.')
            : (lang === 'hi' ? '* यह पहचान पत्र संस्था के कार्यक्रमों व शिविरों में मान्य है।' : '* Officially recognized across all trust camps.')}
        </p>
        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
            isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-102 active:scale-98'
          } ${
            isVolunteer
              ? 'bg-emerald-700 hover:bg-emerald-800'
              : 'bg-primary hover:bg-secondary'
          }`}
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{lang === 'hi' ? 'छवि तैयार हो रही है...' : 'Generating Image...'}</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{lang === 'hi' ? 'पहचान पत्र डाउनलोड करें (Image)' : 'Download ID Card (Image)'}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default DigitalIdCard;
