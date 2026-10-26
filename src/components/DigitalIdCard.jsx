import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from './TrustLogo';
import { Download, ShieldCheck, Users } from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

export const DigitalIdCard = ({ member, onClose }) => {
  const { lang } = useLanguage();
  const cardRef = useRef(null);
  const exportCardRef = useRef(null);
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

  // 3. Ultra-sharp canonical ID Card download (flawless on mobile and desktop)
  const handleDownloadImage = async () => {
    const targetEl = exportCardRef.current || cardRef.current;
    if (!targetEl || isDownloading) return;

    try {
      setIsDownloading(true);

      // Ensure all web fonts are fully ready
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Wait for any embedded images in the target element to load completely
      const imgElements = targetEl.querySelectorAll('img');
      await Promise.all(
        Array.from(imgElements).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const width = 520;
      const height = targetEl.offsetHeight || 330;

      let image;
      try {
        // Primary: native SVG foreignObject with html-to-image
        image = await toPng(targetEl, {
          width,
          height,
          pixelRatio: 3, // 3x ultra-sharp resolution (1560px x ~990px)
          quality: 1.0,
          cacheBust: false,
        });
      } catch (toPngErr) {
        console.warn('html-to-image failed, using html2canvas fallback:', toPngErr);
        const canvas = await html2canvas(targetEl, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
        });
        image = canvas.toDataURL('image/png');
      }

      const safeName = (member.fullName || 'Card').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${isVolunteer ? 'Volunteer_ID_Card' : 'Member_ID_Card'}_${safeName}_${formattedCardId}.png`;

      // Convert Data URL to Blob URL for rock-solid mobile browser download compatibility
      try {
        const res = await fetch(image);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = blobUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();

        setTimeout(() => {
          if (downloadLink.parentNode) {
            downloadLink.parentNode.removeChild(downloadLink);
          }
          URL.revokeObjectURL(blobUrl);
        }, 1500);
      } catch (blobErr) {
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = image;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        setTimeout(() => {
          if (downloadLink.parentNode) {
            downloadLink.parentNode.removeChild(downloadLink);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to download card image:', err);
      alert(lang === 'hi' ? 'पहचान पत्र डाउनलोड करने में समस्या आई। कृपया पुनः प्रयास करें।' : 'Failed to download card image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-primary/30 shadow-card max-w-lg w-full mx-auto text-left relative overflow-hidden">
      
      {/* =========================================================================
          1. ON-SCREEN RESPONSIVE ID CARD (Beautifully adapted for mobile & desktop)
         ========================================================================= */}
      <div
        ref={cardRef}
        id="trust-member-id-card"
        style={{
          width: '100%',
          maxWidth: '490px',
          margin: '0 auto',
          boxSizing: 'border-box',
          borderRadius: '16px',
          lineHeight: 1.3,
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        className={`p-3.5 sm:p-5 border-2 shadow-md relative overflow-hidden ${
          isVolunteer
            ? 'border-emerald-600 bg-gradient-to-br from-[#F0FDF4] via-white to-[#ECFDF5]'
            : 'border-[#E9B44C] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF4E0]'
        }`}
      >
        {/* Background Sacred Watermark */}
        <div
          style={{
            position: 'absolute',
            right: '28%',
            top: '52%',
            transform: 'translate(50%, -50%)',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
            fontFamily: 'serif',
            zIndex: 0,
          }}
          className={`text-[80px] sm:text-[110px] ${
            isVolunteer ? 'text-emerald-700 opacity-[0.04] sm:opacity-[0.05]' : 'text-[#E9B44C] opacity-[0.05] sm:opacity-[0.065]'
          }`}
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
            paddingBottom: '8px',
            marginBottom: '10px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <TrustLogo className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" showText={false} lang={lang} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                letterSpacing: '0.02em',
                display: 'block',
                lineHeight: '1.2',
              }}
              className={`text-[9px] sm:text-[10px] font-black uppercase ${isVolunteer ? 'text-emerald-800' : 'text-primary'}`}
            >
              राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
            </span>
            <h3
              style={{
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
                marginTop: '1px',
                color: '#29180C',
              }}
              className="text-[11px] sm:text-[12px] font-black font-hindi-heading uppercase"
            >
              RASHTRIYA SANATAN SANSKAR SEVA SANSTHAN
            </h3>
            <span
              style={{
                color: '#666666',
                display: 'block',
                lineHeight: '1.2',
                marginTop: '1px',
              }}
              className="text-[8px] sm:text-[9px] font-semibold"
            >
              Registered Public Charitable Trust • Gorakhpur (U.P.) 273016
            </span>
          </div>
        </div>

        {/* Distinct Identity Ribbon */}
        <div
          style={{
            marginBottom: '10px',
            borderRadius: '8px',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className={`h-7 sm:h-8 px-2.5 sm:px-3 ${
            isVolunteer
              ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800'
              : 'bg-gradient-to-r from-primary via-[#EA6F0B] to-secondary'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 min-w-0">
            {isVolunteer ? (
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
            )}
            <span className="text-[10px] sm:text-[11.5px] font-black uppercase tracking-wider truncate text-white">
              {isVolunteer ? 'VOLUNTEER ID CARD' : 'MEMBER ID CARD'}
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              whiteSpace: 'nowrap',
            }}
            className={`text-[9.5px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
              isVolunteer ? 'text-emerald-700 border-emerald-200' : 'text-amber-700 border-amber-200'
            }`}
          >
            ID: {formattedCardId}
          </div>
        </div>

        {/* Card Body */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }} className="sm:gap-3.5">
          {/* Avatar / Profile Photo */}
          <div style={{ flexShrink: 0, textAlign: 'center' }} className="w-[72px] sm:w-[84px]">
            <div
              style={{
                margin: '0 auto',
                borderRadius: '8px',
                borderWidth: '2px',
                borderStyle: 'solid',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box',
              }}
              className={`w-[72px] h-[86px] sm:w-[84px] sm:h-[100px] ${isVolunteer ? 'border-emerald-600/50' : 'border-primary/50'}`}
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
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ padding: '10px 0 8px', textAlign: 'center' }}>
                  <div
                    style={{
                      borderRadius: '9999px',
                      margin: '0 auto 4px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      boxSizing: 'border-box',
                    }}
                    className={`w-8 h-8 sm:w-10 sm:h-10 leading-7 sm:leading-9 text-base sm:text-lg ${
                      isVolunteer
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-[#FFF8EF] text-primary border-[#E9B44C]'
                    }`}
                  >
                    ॐ
                  </div>
                  <span
                    style={{
                      fontSize: '7.5px',
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
                marginTop: '4px',
                padding: '2px 6px',
                lineHeight: '12px',
                borderRadius: '4px',
                backgroundColor: '#F5F5F4',
                border: '1px solid #E7E5E4',
                fontSize: '8px',
                fontWeight: 700,
                color: '#57534E',
                boxSizing: 'border-box',
              }}
            >
              Gorakhpur, UP
            </div>
          </div>

          {/* Member Credentials */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>
              <span style={{ fontSize: '8.5px', color: '#78716C', fontWeight: 600, display: 'block', lineHeight: 1.1 }}>
                {isVolunteer
                  ? (lang === 'hi' ? 'स्वयंसेवक का नाम / Name:' : 'Volunteer Name:')
                  : (lang === 'hi' ? 'सदस्य का नाम / Name:' : 'Member Name:')}
              </span>
              <span
                style={{
                  color: '#1C1917',
                  display: 'block',
                  lineHeight: 1.2,
                  marginTop: '1px',
                }}
                className="text-sm sm:text-[15px] font-black font-hindi-heading break-words"
              >
                {member.fullName}
              </span>
            </div>

            {/* Clean Role */}
            <div>
              <span style={{ fontSize: '8.5px', color: '#78716C', fontWeight: 600, display: 'block', lineHeight: 1.1 }}>
                {isVolunteer ? (lang === 'hi' ? 'पद / भूमिका:' : 'Role:') : (lang === 'hi' ? 'पद / भूमिका:' : 'Designation:')}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  lineHeight: 1.1,
                  marginTop: '1px',
                }}
                className={`text-[11px] sm:text-[12px] font-extrabold ${isVolunteer ? 'text-emerald-800' : 'text-primary'}`}
              >
                {isVolunteer ? 'Trust Volunteer' : 'Trust Member'}
              </span>
            </div>

            {/* Issue & Expiry Dates - Boxed Validity Strip (Responsive on mobile screen) */}
            <div style={{ marginTop: '2px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '3px 6px',
                  padding: '3px 7px',
                  borderRadius: '6px',
                  backgroundColor: isVolunteer ? 'rgba(5, 150, 105, 0.08)' : 'rgba(233, 180, 76, 0.12)',
                  border: isVolunteer ? '1px solid rgba(5, 150, 105, 0.22)' : '1px solid rgba(233, 180, 76, 0.3)',
                  fontSize: '9px',
                  lineHeight: '13px',
                  boxSizing: 'border-box',
                }}
              >
                <span className="whitespace-nowrap">
                  <span style={{ color: '#78716C', fontWeight: 600 }}>{lang === 'hi' ? 'जारी:' : 'Issued:'} </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1C1917' }}>{formattedIssueDate}</span>
                </span>
                <span style={{ color: '#A8A29E', fontWeight: 700 }} className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">
                  <span style={{ color: '#78716C', fontWeight: 600 }}>{lang === 'hi' ? 'समाप्ति:' : 'Expiry:'} </span>
                  <span
                    style={{ fontFamily: 'monospace', fontWeight: 800 }}
                    className={isVolunteer ? 'text-emerald-700' : 'text-primary'}
                  >
                    {formattedExpiryDate}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Strip with Authorized Signatory */}
        <div
          style={{
            marginTop: '10px',
            paddingTop: '6px',
            borderTop: isVolunteer ? '1px dashed rgba(5, 150, 105, 0.35)' : '1px dashed rgba(233, 180, 76, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '8.5px',
            color: '#666666',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
            className={`min-w-0 ${isVolunteer ? 'text-emerald-800' : 'text-trust-green'}`}
          >
            {isVolunteer ? (
              <Users className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-trust-green" />
            )}
            <div className="truncate">
              <span className="block text-[8px] sm:text-[8.5px] leading-tight font-bold truncate">
                {isVolunteer
                  ? (lang === 'hi' ? 'अधिकृत सनातन सेवा स्वयंसेवक' : 'Official Sanatan Volunteer')
                  : (lang === 'hi' ? 'अधिकृत ट्रस्ट पहचान पत्र' : 'Official Verified Trust Member')}
              </span>
              <span className="block text-[7px] sm:text-[7.5px] text-[#78716C] leading-none font-medium truncate">
                {isVolunteer ? 'Authorized Social Volunteer' : 'Registered Member Identity'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span className="block text-[8px] sm:text-[9px] font-black text-[#1C1917] leading-tight whitespace-nowrap">
              {lang === 'hi' ? 'बजरंगी दूबे' : 'Bajrangi Dubey'}
            </span>
            <span className="block text-[7px] sm:text-[8px] text-[#78716C] leading-tight whitespace-nowrap">
              {lang === 'hi' ? 'राष्ट्रीय मंत्री/प्रबन्धक (अधिकृत हस्ताक्षरकर्ता)' : 'Rashtriya Mantri / Prabandhak (Signatory)'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. OFF-SCREEN CANONICAL EXPORT CARD (Locked 520px landscape geometry)
             Captured strictly during download to produce an ultra-sharp, pristine,
             perfectly aligned 1560px x ~990px ID card on all devices (mobile & PC).
         ========================================================================= */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '520px',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <div
          ref={exportCardRef}
          id="trust-member-id-card-canonical"
          style={{
            width: '520px',
            minWidth: '520px',
            maxWidth: '520px',
            boxSizing: 'border-box',
            borderRadius: '16px',
            lineHeight: 1.3,
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
          className={`p-5 border-2 shadow-none relative overflow-hidden ${
            isVolunteer
              ? 'border-emerald-600 bg-gradient-to-br from-[#F0FDF4] via-white to-[#ECFDF5]'
              : 'border-[#E9B44C] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF4E0]'
          }`}
        >
          {/* Background Sacred Watermark */}
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
              gap: '12px',
              borderBottom: isVolunteer ? '1.5px solid rgba(5, 150, 105, 0.25)' : '1.5px solid rgba(233, 180, 76, 0.4)',
              paddingBottom: '10px',
              marginBottom: '12px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <TrustLogo className="w-12 h-12 flex-shrink-0" showText={false} lang={lang} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '10.5px',
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
                  fontSize: '12.5px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.25',
                  marginTop: '2px',
                  color: '#29180C',
                  whiteSpace: 'nowrap',
                }}
                className="font-hindi-heading"
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

          {/* Distinct Identity Ribbon */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                }}
              >
                {isVolunteer ? 'VOLUNTEER ID CARD' : 'MEMBER ID CARD'}
              </span>
            </div>

            <div
              style={{
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

              {/* Issue & Expiry Dates - Boxed Validity Strip (Spacious canonical layout) */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginTop: '4px',
                    padding: '3.5px 10px',
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
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1C1917', marginLeft: '3px' }}>{formattedIssueDate}</span>
                  <span style={{ color: '#A8A29E', margin: '0 8px', fontWeight: 700 }}>•</span>
                  <span style={{ color: '#78716C', fontWeight: 600 }}>{lang === 'hi' ? 'समाप्ति:' : 'Expiry:'} </span>
                  <span
                    style={{ fontFamily: 'monospace', fontWeight: 800, marginLeft: '3px' }}
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
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              className={isVolunteer ? 'text-emerald-800' : 'text-trust-green'}
            >
              {isVolunteer ? (
                <Users style={{ width: '15px', height: '15px', flexShrink: 0 }} className="text-emerald-700" />
              ) : (
                <ShieldCheck style={{ width: '15px', height: '15px', flexShrink: 0 }} className="text-trust-green" />
              )}
              <div>
                <span style={{ display: 'block', lineHeight: 1.2, fontWeight: 800 }}>
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
                {lang === 'hi' ? 'बजरंगी दूबे' : 'Bajrangi Dubey'}
              </span>
              <span style={{ fontSize: '8px', color: '#78716C', display: 'block', lineHeight: 1.2 }}>
                {lang === 'hi' ? 'राष्ट्रीय मंत्री/प्रबन्धक (अधिकृत हस्ताक्षरकर्ता)' : 'Rashtriya Mantri / Prabandhak (Signatory)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip - Image Download */}
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
