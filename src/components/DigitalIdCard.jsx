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

      // Wait for any embedded images in cardRef to load completely
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

      // Clone card to a standard 500px landscape container attached to document.body at (0, 0)
      // This completely decouples export from mobile screen width and scroll offsets
      const clone = cardRef.current.cloneNode(true);
      clone.id = 'trust-id-card-render-clone';
      clone.style.width = '500px';
      clone.style.minWidth = '500px';
      clone.style.maxWidth = '500px';
      clone.style.position = 'fixed';
      clone.style.top = '0px';
      clone.style.left = '0px';
      clone.style.zIndex = '-9999';
      clone.style.margin = '0px';
      clone.style.boxSizing = 'border-box';
      clone.style.transform = 'none';
      document.body.appendChild(clone);

      // Wait for images inside clone
      const cloneImgs = clone.querySelectorAll('img');
      await Promise.all(
        Array.from(cloneImgs).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const cloneWidth = 500;
      const cloneHeight = clone.offsetHeight;

      const canvas = await html2canvas(clone, {
        scale: 3, // 3x ultra-sharp resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // Transparent outside the card
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: cloneWidth,
        height: cloneHeight,
        windowWidth: 600,
        windowHeight: 600,
        logging: false,
      });

      // Remove temporary clone from DOM
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }

      // Clip canvas into a perfect rectangle with curved corners matching the card
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const ctx = finalCanvas.getContext('2d');

      const cornerRadius = 18 * 3; // 18px radius at 3x scale
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, finalCanvas.width, finalCanvas.height, cornerRadius);
      } else {
        const r = cornerRadius;
        const w = finalCanvas.width;
        const h = finalCanvas.height;
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
      }
      ctx.clip();
      ctx.drawImage(canvas, 0, 0);

      const image = finalCanvas.toDataURL('image/png');
      const previewEl = document.getElementById('exported-img-preview');
      if (previewEl) {
        previewEl.src = image;
        previewEl.style.display = 'block';
      }
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
    <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 border border-primary/30 shadow-card max-w-lg w-full mx-auto text-left relative overflow-hidden">
      
      {/* Horizontal Card Area */}
      <div
        ref={cardRef}
        id="trust-member-id-card"
        style={{ maxWidth: '480px', margin: '0 auto', boxSizing: 'border-box' }}
        className={`w-full rounded-2xl p-3.5 sm:p-5 border-2 shadow-md relative overflow-hidden ${
          isVolunteer
            ? 'border-emerald-600 bg-gradient-to-br from-[#F0FDF4] via-white to-[#ECFDF5] ring-2 ring-emerald-500/20'
            : 'border-[#E9B44C] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF4E0]'
        }`}
      >
        {/* Background Sacred Watermark - Placed fully inside the card boundary */}
        <div
          style={{
            position: 'absolute',
            right: '16px',
            bottom: '10px',
            opacity: isVolunteer ? 0.08 : 0.14,
            fontSize: '68px',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
            fontFamily: 'serif',
          }}
          className={isVolunteer ? 'text-emerald-700' : 'text-[#E9B44C]'}
        >
          ॐ
        </div>

        {/* Card Header Strip - Full Name without Truncation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottomWidth: '2px',
            paddingBottom: '10px',
            marginBottom: '12px',
          }}
          className={isVolunteer ? 'border-emerald-600/30' : 'border-primary/30'}
        >
          <TrustLogo className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0" showText={false} lang={lang} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                lineHeight: '1.2',
              }}
              className={isVolunteer ? 'text-emerald-800' : 'text-secondary'}
            >
              राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
            </span>
            <h3
              style={{
                fontSize: '12px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                lineHeight: '1.25',
                marginTop: '2px',
                color: '#382719',
              }}
              className="font-hindi-heading break-words"
            >
              RASHTRIYA SANATAN SANSKAR SEVA SANSTHAN
            </h3>
            <span
              style={{
                fontSize: '9px',
                fontWeight: '600',
                color: '#666666',
                display: 'block',
                lineHeight: '1.2',
                marginTop: '2px',
              }}
            >
              Registered Charitable Trust • Gorakhpur (U.P.) 273016
            </span>
          </div>
        </div>

        {/* Distinct Identity Ribbon: strictly VOLUNTEER ID CARD / MEMBER ID CARD on single row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '12px',
            padding: '0 10px',
            height: '28px',
            lineHeight: '28px',
            borderRadius: '8px',
            color: '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            boxSizing: 'border-box',
          }}
          className={
            isVolunteer
              ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800'
              : 'bg-gradient-to-r from-primary via-[#EA6F0B] to-secondary'
          }
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '100%',
              gap: '6px',
              minWidth: 0,
            }}
          >
            {isVolunteer ? (
              <Users style={{ width: '15px', height: '15px', flexShrink: 0, color: '#ffffff', display: 'block' }} />
            ) : (
              <ShieldCheck style={{ width: '15px', height: '15px', flexShrink: 0, color: '#ffffff', display: 'block' }} />
            )}
            <span
              style={{
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                lineHeight: '28px',
                color: '#ffffff',
                display: 'inline-block',
              }}
            >
              {isVolunteer ? 'VOLUNTEER ID CARD' : 'MEMBER ID CARD'}
            </span>
          </div>

          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              padding: '0 8px',
              height: '20px',
              lineHeight: '20px',
              borderRadius: '5px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0,
              boxSizing: 'border-box',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '11px',
              fontWeight: '900',
              letterSpacing: '0.08em',
              color: '#ffffff',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            ID: {formattedCardId}
          </div>
        </div>

        {/* Card Body */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Avatar / Profile Photo */}
          <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '96px',
                margin: '0 auto',
                borderRadius: '12px',
                borderWidth: '2px',
                backgroundColor: '#ffffff',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box',
              }}
              className={isVolunteer ? 'border-emerald-600/50' : 'border-primary/40'}
            >
              {member.photoURL || member.profilePic ? (
                <img
                  src={member.photoURL || member.profilePic}
                  alt={member.fullName || 'Member'}
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      marginBottom: '4px',
                      borderWidth: '1px',
                    }}
                    className={
                      isVolunteer
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-[#FFF8EF] text-primary border-[#E9B44C]'
                    }
                  >
                    ॐ
                  </div>
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                    }}
                    className={isVolunteer ? 'text-emerald-700' : 'text-primary'}
                  >
                    {isVolunteer ? 'Volunteer' : 'Verified'}
                  </span>
                </div>
              )}
            </div>
            <span style={{ fontSize: '9px', fontWeight: '600', color: '#666666', display: 'block', marginTop: '4px' }}>
              Gorakhpur, UP
            </span>
          </div>

          {/* Member Credentials */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span style={{ fontSize: '9px', color: '#666666', display: 'block', lineHeight: 1.2 }}>
                {isVolunteer
                  ? (lang === 'hi' ? 'स्वयंसेवक का नाम / Name:' : 'Volunteer Name:')
                  : (lang === 'hi' ? 'सदस्य का नाम / Name:' : 'Member Name:')}
              </span>
              <span style={{ fontWeight: 900, fontSize: '13px', color: '#382719', display: 'block', lineHeight: 1.25, marginTop: '1px' }}>
                {member.fullName}
              </span>
            </div>

            {/* Clean Role: Strictly Trust Volunteer or Trust Member, No Emojis or Cat B/C */}
            <div>
              <span style={{ fontSize: '9px', color: '#666666', display: 'block', lineHeight: 1.2 }}>
                {isVolunteer ? (lang === 'hi' ? 'पद / भूमिका:' : 'Role:') : (lang === 'hi' ? 'पद / भूमिका:' : 'Designation:')}
              </span>
              <span
                style={{ fontWeight: 800, fontSize: '12px', display: 'block', lineHeight: 1.25, marginTop: '1px' }}
                className={isVolunteer ? 'text-emerald-800' : 'text-primary'}
              >
                {isVolunteer ? 'Trust Volunteer' : 'Trust Member'}
              </span>
            </div>

            {/* Issue & Expiry Dates */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                fontSize: '9px',
                color: '#666666',
                borderTop: '1px solid',
                marginTop: '2px',
              }}
              className={isVolunteer ? 'border-emerald-600/30' : 'border-[#E9B44C]/30'}
            >
              <div>
                <span>{lang === 'hi' ? 'जारी: ' : 'Issued: '}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#382719' }}>{formattedIssueDate}</span>
              </div>
              <div>
                <span>{lang === 'hi' ? 'समाप्ति: ' : 'Expiry: '}</span>
                <span
                  style={{ fontFamily: 'monospace', fontWeight: 800 }}
                  className={isVolunteer ? 'text-emerald-700' : 'text-primary'}
                >
                  {formattedExpiryDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Strip with Authorized Signatory */}
        <div
          style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px dashed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#666666',
          }}
          className={isVolunteer ? 'border-emerald-600/40' : 'border-[#E9B44C]/60'}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
            className={isVolunteer ? 'text-emerald-800' : 'text-trust-green'}
          >
            {isVolunteer ? (
              <Users style={{ width: '14px', height: '14px' }} className="text-emerald-700" />
            ) : (
              <ShieldCheck style={{ width: '14px', height: '14px' }} className="text-trust-green" />
            )}
            <span>
              {isVolunteer
                ? (lang === 'hi' ? 'अधिकृत सनातन सेवा स्वयंसेवक' : 'Official Sanatan Volunteer')
                : (lang === 'hi' ? 'अधिकृत ट्रस्ट पहचान पत्र' : 'Official Verified Trust Member')}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 800, color: '#382719', display: 'block', lineHeight: 1.2 }}>
              {lang === 'hi' ? 'बजरंगी दूबे / कुसुमलता दूबे' : 'Bajrangi Dubey / Kusumlata Dubey'}
            </span>
            <span style={{ fontSize: '8px', color: '#888888', display: 'block', lineHeight: 1.2 }}>
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
