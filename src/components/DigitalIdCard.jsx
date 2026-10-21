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

  // 2. Sequential Order ID (e.g. 001, 002, 014 based on order)
  const extractCleanOrderId = (rawId) => {
    if (!rawId) return '001';
    const str = String(rawId).trim();
    const matches = str.match(/\d+/g);
    if (matches && matches.length > 0) {
      const lastNum = matches[matches.length - 1];
      const num = parseInt(lastNum, 10);
      return String(num).padStart(3, '0');
    }
    return str;
  };

  const rawIdNumber = isVolunteer
    ? (member.volunteerId || member.memberId || member.membershipNumber || member.membershipId || member.orderNumber || member.orderId || member.id)
    : (member.memberId || member.membershipNumber || member.membershipId || member.orderNumber || member.orderId || member.id);

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

      // Clone card to a standard 500px landscape container attached offscreen
      const clone = cardRef.current.cloneNode(true);
      clone.id = 'trust-id-card-render-clone';
      clone.style.width = '500px';
      clone.style.minWidth = '500px';
      clone.style.maxWidth = '500px';
      clone.style.margin = '0px';
      clone.style.boxSizing = 'border-box';
      clone.style.transform = 'none';

      const renderContainer = document.createElement('div');
      renderContainer.id = 'trust-id-card-render-container';
      renderContainer.style.position = 'fixed';
      renderContainer.style.left = '-99999px';
      renderContainer.style.top = '0px';
      renderContainer.style.width = '500px';
      renderContainer.style.pointerEvents = 'none';
      renderContainer.appendChild(clone);
      document.body.appendChild(renderContainer);

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

      const canvas = await html2canvas(clone, {
        scale: 3, // 3x ultra-sharp resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // Transparent outside the card
        logging: false,
      });

      // Remove temporary render container from DOM
      if (renderContainer.parentNode) {
        renderContainer.parentNode.removeChild(renderContainer);
      }

      // Smooth canvas clipping matching exact 16px radius at 3x scale without cutting 2px border
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const ctx = finalCanvas.getContext('2d');

      const cornerRadius = 16 * 3; // exact 16px matching rounded-2xl at 3x scale
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
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-primary/30 shadow-card max-w-lg w-full mx-auto text-left relative overflow-hidden">
      
      {/* Horizontal Card Area */}
      <div
        ref={cardRef}
        id="trust-member-id-card"
        style={{
          width: '100%',
          maxWidth: '490px',
          margin: '0 auto',
          boxSizing: 'border-box',
          borderRadius: '16px',
        }}
        className={`p-3.5 sm:p-5 border-2 shadow-md relative overflow-hidden ${
          isVolunteer
            ? 'border-emerald-600 bg-gradient-to-br from-[#F0FDF4] via-white to-[#ECFDF5]'
            : 'border-[#E9B44C] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF4E0]'
        }`}
      >
        {/* Background Sacred Watermark - Elegantly Centered, Non-Colliding */}
        <div
          style={{
            position: 'absolute',
            right: '28%',
            top: '52%',
            transform: 'translate(50%, -50%)',
            opacity: isVolunteer ? 0.05 : 0.065,
            fontSize: '110px',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
            fontFamily: 'serif',
            zIndex: 0,
          }}
          className={isVolunteer ? 'text-emerald-700' : 'text-[#E9B44C]'}
        >
          ॐ
        </div>

        {/* Card Header Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: isVolunteer ? '1.5px solid rgba(5, 150, 105, 0.25)' : '1.5px solid rgba(233, 180, 76, 0.4)',
            paddingBottom: '10px',
            marginBottom: '12px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <TrustLogo className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0" showText={false} lang={lang} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                display: 'block',
                lineHeight: '1.2',
              }}
              className={isVolunteer ? 'text-emerald-800' : 'text-primary'}
            >
              राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
            </span>
            <h3
              style={{
                fontSize: '12px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                lineHeight: '1.25',
                marginTop: '2px',
                color: '#29180C',
              }}
              className="font-hindi-heading break-words"
            >
              RASHTRIYA SANATAN SANSKAR SEVA SANSTHAN
            </h3>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                color: '#666666',
                display: 'block',
                lineHeight: '1.2',
                marginTop: '2px',
              }}
            >
              Registered Public Charitable Trust • Gorakhpur (U.P.) 273016
            </span>
          </div>
        </div>

        {/* Distinct Identity Ribbon: VOLUNTEER ID CARD / MEMBER ID CARD */}
        <div
          style={{
            height: '32px',
            lineHeight: '32px',
            marginBottom: '12px',
            padding: '0 12px',
            borderRadius: '8px',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 1,
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
              height: '32px',
              gap: '6px',
            }}
          >
            {isVolunteer ? (
              <Users style={{ width: '16px', height: '16px', flexShrink: 0, color: '#ffffff' }} />
            ) : (
              <ShieldCheck style={{ width: '16px', height: '16px', flexShrink: 0, color: '#ffffff' }} />
            )}
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                lineHeight: '32px',
                color: '#ffffff',
                display: 'inline-block',
              }}
            >
              {isVolunteer ? 'VOLUNTEER ID CARD' : 'MEMBER ID CARD'}
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              right: '8px',
              top: '5px',
              height: '22px',
              lineHeight: '20px',
              backgroundColor: '#FFFFFF',
              color: isVolunteer ? '#047857' : '#B45309',
              padding: '0 10px',
              borderRadius: '9999px',
              border: isVolunteer ? '1px solid #A7F3D0' : '1px solid #FDE68A',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            ID: {formattedCardId}
          </div>
        </div>

        {/* Card Body */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
          {/* Avatar / Profile Photo */}
          <div style={{ width: '84px', flexShrink: 0, textAlign: 'center' }}>
            <div
              style={{
                width: '84px',
                height: '100px',
                margin: '0 auto',
                borderRadius: '10px',
                borderWidth: '2px',
                borderStyle: 'solid',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box',
              }}
              className={isVolunteer ? 'border-emerald-600/50' : 'border-primary/50'}
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
                    borderRadius: '7px',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ padding: '14px 0 10px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      lineHeight: '38px',
                      borderRadius: '9999px',
                      margin: '0 auto 6px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '19px',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      boxSizing: 'border-box',
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
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'block',
                      lineHeight: 1,
                    }}
                    className={isVolunteer ? 'text-emerald-700' : 'text-primary'}
                  >
                    {isVolunteer ? 'Volunteer' : 'Verified'}
                  </span>
                </div>
              )}
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '2px 8px',
                lineHeight: '13px',
                borderRadius: '4px',
                backgroundColor: '#F5F5F4',
                border: '1px solid #E7E5E4',
                fontSize: '8.5px',
                fontWeight: 700,
                color: '#57534E',
                boxSizing: 'border-box',
              }}
            >
              Gorakhpur, UP
            </div>
          </div>

          {/* Member Credentials */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>
              <span style={{ fontSize: '9px', color: '#78716C', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                {isVolunteer
                  ? (lang === 'hi' ? 'स्वयंसेवक का नाम / Name:' : 'Volunteer Name:')
                  : (lang === 'hi' ? 'सदस्य का नाम / Name:' : 'Member Name:')}
              </span>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  color: '#1C1917',
                  display: 'block',
                  lineHeight: 1.2,
                  marginTop: '2px',
                }}
                className="font-hindi-heading"
              >
                {member.fullName}
              </span>
            </div>

            {/* Clean Role */}
            <div>
              <span style={{ fontSize: '9px', color: '#78716C', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                {isVolunteer ? (lang === 'hi' ? 'पद / भूमिका:' : 'Role:') : (lang === 'hi' ? 'पद / भूमिका:' : 'Designation:')}
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '12px',
                  display: 'inline-block',
                  lineHeight: 1.2,
                  marginTop: '1px',
                }}
                className={isVolunteer ? 'text-emerald-800' : 'text-primary'}
              >
                {isVolunteer ? 'Trust Volunteer' : 'Trust Member'}
              </span>
            </div>

            {/* Issue & Expiry Dates - Boxed Validity Strip */}
            <div>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  padding: '3px 8px 4px 8px',
                  borderRadius: '6px',
                  backgroundColor: isVolunteer ? 'rgba(5, 150, 105, 0.08)' : 'rgba(233, 180, 76, 0.12)',
                  border: isVolunteer ? '1px solid rgba(5, 150, 105, 0.22)' : '1px solid rgba(233, 180, 76, 0.3)',
                  fontSize: '9.5px',
                  lineHeight: '14px',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ color: '#78716C', fontWeight: 600 }}>{lang === 'hi' ? 'जारी:' : 'Issued:'} </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1C1917' }}>{formattedIssueDate}</span>
                <span style={{ color: '#A8A29E', margin: '0 6px', fontWeight: 700 }}>•</span>
                <span style={{ color: '#78716C', fontWeight: 600 }}>{lang === 'hi' ? 'समाप्ति:' : 'Expiry:'} </span>
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
            borderTop: isVolunteer ? '1px dashed rgba(5, 150, 105, 0.35)' : '1px dashed rgba(233, 180, 76, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#666666',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
            className={isVolunteer ? 'text-emerald-800' : 'text-trust-green'}
          >
            {isVolunteer ? (
              <Users style={{ width: '15px', height: '15px' }} className="text-emerald-700" />
            ) : (
              <ShieldCheck style={{ width: '15px', height: '15px' }} className="text-trust-green" />
            )}
            <div>
              <span style={{ display: 'block', lineHeight: 1.2 }}>
                {isVolunteer
                  ? (lang === 'hi' ? 'अधिकृत सनातन सेवा स्वयंसेवक' : 'Official Sanatan Volunteer')
                  : (lang === 'hi' ? 'अधिकृत ट्रस्ट पहचान पत्र' : 'Official Verified Trust Member')}
              </span>
              <span style={{ fontSize: '7.5px', color: '#78716C', display: 'block', lineHeight: 1.1, fontWeight: 500 }}>
                {isVolunteer ? 'Authorized Social Volunteer' : 'Registered Member Identity'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 800, color: '#1C1917', display: 'block', lineHeight: 1.2 }}>
              {lang === 'hi' ? 'बजरंगी दूबे / कुसुमलता दूबे' : 'Bajrangi Dubey / Kusumlata Dubey'}
            </span>
            <span style={{ fontSize: '8px', color: '#78716C', display: 'block', lineHeight: 1.2 }}>
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
          id={isVolunteer ? 'volunteer-download-btn' : 'member-download-btn'}
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
