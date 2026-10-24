import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Download, Image as ImageIcon, Loader2, MessageSquare, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { uploadImageToCloudinary } from '../utils/cloudinaryService';
import {
  formatDonationReceiptWhatsAppMessage,
  buildWhatsAppUrl,
  checkBaileysServerStatus,
  sendPersonalMessageViaBaileys
} from '../firebase/whatsappService';

// Helper: Convert numeric amount into formal Hindi words
export const numberToHindiWords = (amount) => {
  const num = Math.floor(Number(amount) || 0);
  if (num <= 0) return 'शून्य रुपये मात्र';

  const units = [
    '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
    'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
    'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
    'इकतालीस', 'बयालीस', 'तैंतालीस', 'चौवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
    'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
    'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
    'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी',
    'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
    'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
  ];

  let words = '';
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = Math.floor(rem / 100);
  rem = rem % 100;

  if (crore > 0) words += units[crore] + ' करोड़ ';
  if (lakh > 0) words += units[lakh] + ' लाख ';
  if (thousand > 0) words += units[thousand] + ' हज़ार ';
  if (hundred > 0) words += units[hundred] + ' सौ ';
  if (rem > 0) words += units[rem] + ' ';

  return `${words.trim()} रुपये मात्र`;
};

export const OfficialReceiptModal = ({ isOpen, onClose, receipt, onReceiptSent }) => {
  const { lang } = useLanguage();
  const receiptCardRef = useRef(null);
  const exportReceiptRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Generate verified local UPI QR Code safely without any external network dependency
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL('upi://pay?pa=boim-135883270012@boi&pn=RSSSST', {
      margin: 1,
      width: 140,
      color: {
        dark: '#2B1B10',
        light: '#FFFFFF'
      }
    }).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    }).catch((err) => {
      console.warn('QR generation fallback:', err);
    });
    return () => { isMounted = false; };
  }, []);

  if (!isOpen || !receipt) return null;

  // Extract fields cleanly
  const receiptNumber = receipt.receiptNumber || receipt.receiptNo || (receipt.id ? `RSSSST-2026-${receipt.id.slice(0, 4).toUpperCase()}` : 'RSSSST-2026-0001');
  const name = receipt.donorName || receipt.fullName || receipt.name || receipt.payerName || receipt.applicantName || '—';

  let rawMobile = receipt.donorPhone || receipt.phone || receipt.mobile || receipt.payerMobile || receipt.whatsapp || '';
  let mobile = '—';
  if (rawMobile) {
    const digits = String(rawMobile).replace(/\D/g, '');
    if (digits.length === 10) mobile = digits;
    else if (digits.length === 12 && digits.startsWith('91')) mobile = digits.slice(2);
    else if (digits.length > 0) mobile = String(rawMobile);
  }

  const fatherHusbandName = (receipt.fatherHusbandName || receipt.fatherName || receipt.husbandName || receipt.guardianName || '').trim() || '—';
  const address = (receipt.address || receipt.villageOrLocality || receipt.locality || receipt.location || '').trim() || '—';
  const block = (receipt.block || receipt.tehsil || '').trim() || '—';

  const rawDistrict = (receipt.district || receipt.cityDistrict || receipt.city || receipt.cityOrDistrict || '').trim();
  const district = rawDistrict ? rawDistrict.replace(/\s*\([^\)]*\)/g, '').trim() : 'गोरखपुर';

  const rawState = (receipt.state || '').trim();
  const state = rawState ? rawState.replace(/\s*\([^\)]*\)/g, '').trim() : 'उत्तर प्रदेश';

  const numericAmount = Number(receipt.verifiedAmount ?? receipt.amount ?? receipt.claimedAmount ?? 0);
  const amountWords = receipt.amountWords || numberToHindiWords(numericAmount);

  const purpose = String(receipt.purpose || '').toLowerCase();
  const itemType = String(receipt.itemType || receipt.type || '').toLowerCase();
  const isDonation = purpose === 'samarpan' || purpose === 'donation' || purpose === 'voluntary_contribution' || itemType === 'donation' || itemType === 'donations' || receipt.tab === 'donations';
  const isVolunteer = purpose === 'volunteer_registration' || itemType === 'volunteer' || receipt.role === 'volunteer' || receipt.memberType === 'volunteer';
  const isMembership = !isDonation && !isVolunteer && (purpose === 'membership_fee' || itemType === 'membership' || Boolean(receipt.category));

  // Determine if this is a Public / Non-member Donor (no father's name or address filled)
  const isPublicDonor = Boolean(receipt.isPublicDonor) || (isDonation && (!receipt.fatherHusbandName || receipt.fatherHusbandName === '—') && (!receipt.address || receipt.address === '—') && !receipt.memberId);

  const getPurposeTitle = () => {
    if (receipt.purpose === 'cow_service') return 'गौ सेवा एवं पोषण प्रकल्प';
    if (receipt.purpose === 'sanskar_camps') return '१६ वैदिक संस्कार जागरण शिविर';
    if (receipt.purpose === 'medical_aid') return 'निर्धन चिकित्सा एवं औषधि सहयोग';
    if (receipt.purpose === 'labor_welfare') return 'श्रमिक कल्याण एवं दुर्घटना सहायता';
    return receipt.purposeTitle || receipt.purpose || 'सामान्य सनातन धर्मार्थ समर्पण निधि';
  };
  const purposeTitle = getPurposeTitle();

  let receiptHeading = isPublicDonor ? 'सनातन संरक्षण — ई-समर्पण रसीद' : 'सनातन संरक्षण — समर्पण निधि';
  let receiptClosingText = 'सहर्ष प्राप्त किया।';
  let purposeLabel = 'से समर्पण निधि';

  if (isMembership) {
    receiptHeading = 'सनातन संस्थान — सदस्यता निधि';
    receiptClosingText = 'सह धन्यवाद प्राप्त किया।';
    purposeLabel = 'से सदस्यता निधि';
  } else if (isVolunteer) {
    receiptHeading = 'सनातन संस्थान — स्वयंसेवक पंजीकरण निधि';
    receiptClosingText = 'सह धन्यवाद प्राप्त किया।';
    purposeLabel = 'से स्वयंसेवक पंजीकरण निधि';
  }

  // Format Date (DD/MM/YYYY)
  const getDateString = () => {
    try {
      const raw = receipt.date || receipt.approvedAt || receipt.issuedAt || receipt.createdAt;
      if (raw?.toDate) {
        const d = raw.toDate();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } else if (raw?.seconds) {
        const d = new Date(raw.seconds * 1000);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } else if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
      }
    } catch {}
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  };

  const formattedDate = getDateString();

  // Capture canonical 800px landscape voucher image
  const getCanonicalReceiptImage = async () => {
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    } catch {}

    const targetEl = exportReceiptRef.current || receiptCardRef.current;
    if (!targetEl) return null;

    // Ensure all internal images are ready
    const imgElements = targetEl.querySelectorAll('img');
    await Promise.all(
      Array.from(imgElements).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 400);
        });
      })
    );

    const width = targetEl.offsetWidth || 800;
    const height = targetEl.offsetHeight || 540;

    let image = null;

    // Primary attempt: html2canvas with exact coordinates
    try {
      const canvas = await html2canvas(targetEl, {
        scale: 2.5,
        width,
        height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#FFFDF8',
        logging: false,
      });

      if (canvas && canvas.width > 0 && canvas.height > 0) {
        const dataUrl = canvas.toDataURL('image/png');
        if (dataUrl && dataUrl.length > 1500) {
          image = dataUrl;
        }
      }
    } catch (canvasErr) {
      console.warn('html2canvas on exportReceiptRef failed:', canvasErr);
    }

    // Secondary attempt: html-to-image toPng
    if (!image) {
      try {
        const dataUrl = await toPng(targetEl, {
          width,
          height,
          pixelRatio: 2.0,
          quality: 1.0,
          cacheBust: false,
        });
        if (dataUrl && dataUrl.length > 1500) {
          image = dataUrl;
        }
      } catch (toPngErr) {
        console.warn('html-to-image failed, using visible card fallback:', toPngErr);
      }
    }

    // Tertiary fallback: capture the visible receipt card directly
    if (!image && receiptCardRef.current) {
      try {
        const fallbackCanvas = await html2canvas(receiptCardRef.current, {
          scale: 2.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#FFFDF8',
          logging: false,
        });
        if (fallbackCanvas && fallbackCanvas.width > 0 && fallbackCanvas.height > 0) {
          image = fallbackCanvas.toDataURL('image/png');
        }
      } catch (fallbackErr) {
        console.error('Visible card fallback failed:', fallbackErr);
      }
    }

    return image;
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const image = await getCanonicalReceiptImage();
      if (!image) return;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = image;
      });

      const imgHeight = (img.height * imgWidth) / img.width;
      const yOffset = Math.max(margin, (pdfHeight - imgHeight) / 2);

      pdf.addImage(image, 'PNG', margin, yOffset, imgWidth, imgHeight);
      pdf.save(`${receiptNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(lang === 'hi' ? 'रसीद PDF तैयार करने में समस्या आई।' : 'PDF generation failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download PNG Image
  const handleDownloadPNG = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const image = await getCanonicalReceiptImage();
      if (!image) return;

      const filename = `${receiptNumber}.png`;

      try {
        const res = await fetch(image);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1500);
      } catch (blobErr) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
        }, 1500);
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      alert(lang === 'hi' ? 'रसीद छवि तैयार करने में समस्या आई।' : 'Image generation failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Send Receipt Image / PDF directly to Donor on WhatsApp
  const handleShareToWhatsApp = async () => {
    if (isSharingWhatsApp) return;
    setIsSharingWhatsApp(true);
    try {
      const image = await getCanonicalReceiptImage();
      if (!image) {
        alert(lang === 'hi' ? 'रसीद छवि तैयार नहीं हो सकी।' : 'Could not generate receipt image.');
        return;
      }

      const receiptCaption = formatDonationReceiptWhatsAppMessage(receipt);
      const targetPhone = mobile !== '—' ? mobile : (receipt.donorPhone || receipt.phone || receipt.mobile || '');
      const cleanPhone = targetPhone.replace(/\D/g, '');

      // 1. In native Android/iOS mobile app: write to cache and trigger Native Share
      if (Capacitor.isNativePlatform()) {
        try {
          const fileName = `Receipt_${receiptNumber}.png`;
          const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          await Share.share({
            title: `समर्पण रसीद - ${receiptNumber}`,
            text: receiptCaption,
            url: savedFile.uri,
            dialogTitle: 'व्हाट्सएप पर रसीद भेजें'
          });

          if (onReceiptSent) onReceiptSent(receipt);
          return;
        } catch (shareErr) {
          console.warn('Native share fallback to Cloudinary/Web:', shareErr);
        }
      }

      // 2. Web Browser: Try native navigator.share with File
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        try {
          const res = await fetch(image);
          const blob = await res.blob();
          const file = new File([blob], `Receipt_${receiptNumber}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `समर्पण रसीद - ${receiptNumber}`,
              text: receiptCaption
            });
            if (onReceiptSent) onReceiptSent(receipt);
            return;
          }
        } catch (webShareErr) {
          console.warn('Web share file fallback:', webShareErr);
        }
      }

      // 3. Automated Baileys or Cloudinary Hosted Link
      let uploadedUrl = null;
      try {
        uploadedUrl = await uploadImageToCloudinary(image, 'receipts');
      } catch (uploadErr) {
        console.warn('Cloudinary upload fallback:', uploadErr);
      }

      let sentViaBot = false;
      if (uploadedUrl && cleanPhone) {
        try {
          const serverState = await checkBaileysServerStatus();
          if (serverState.connected) {
            await sendPersonalMessageViaBaileys(cleanPhone, receiptCaption, uploadedUrl);
            sentViaBot = true;
          }
        } catch (botErr) {
          console.warn('Bot dispatch fallback:', botErr);
        }
      }

      // 4. Open WhatsApp Chat directly with recipient
      if (cleanPhone) {
        const fullMessage = uploadedUrl 
          ? `${receiptCaption}\n\n🖼️ *आपकी आधिकारिक रसीद छवि (High-Res Image):*\n${uploadedUrl}`
          : receiptCaption;
        const { mobileUrl, webUrl } = buildWhatsAppUrl(cleanPhone, fullMessage);
        const targetUrl = window.innerWidth > 768 ? (webUrl || mobileUrl) : mobileUrl;
        window.open(targetUrl, '_blank');
      }

      if (onReceiptSent) onReceiptSent(receipt);
      if (sentViaBot) {
        alert(lang === 'hi' ? 'रसीद छवि सीधे दानदाता के व्हाट्सएप पर भेज दी गई!' : 'Receipt image sent directly to donor on WhatsApp!');
      }
    } catch (err) {
      console.error('WhatsApp receipt dispatch failed:', err);
      alert('Error sending receipt: ' + err.message);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-6 max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar */}
        <div className="bg-[#B84A06] text-white px-3 sm:px-6 py-3 flex items-center justify-between print:hidden flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
              ॐ
            </div>
            <span className="font-extrabold text-xs sm:text-base font-hindi-heading truncate">
              {isPublicDonor ? 'दानदाता ई-रसीद (Donation Receipt)' : 'आधिकारिक समर्पण / सदस्यता रसीद'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-1">
            {/* WhatsApp Send Button */}
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              disabled={isSharingWhatsApp || isExporting}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Send Receipt Image to WhatsApp"
            >
              {isSharingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>{isSharingWhatsApp ? 'भेज रहे हैं...' : 'व्हाट्सएप रसीद'}</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white text-[#B84A06] hover:bg-[#FFF8EF] font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Download official PDF"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">डाउनलोड PDF</span>
            </button>

            {/* Download PNG */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Download high-resolution image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>इमेज (PNG)</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all ml-1 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-[#F7F3EB] flex-1 flex justify-center items-start">
          
          {/* VISIBLE ON-SCREEN PREVIEW */}
          <div
            ref={receiptCardRef}
            id="traditional-receipt-card"
            className="w-full max-w-3xl bg-[#FFFDF8] border-4 border-[#C65D13] rounded-2xl p-4 sm:p-7 shadow-xl relative overflow-hidden text-[#382719] font-sans my-1 sm:my-3"
            style={{
              backgroundImage: 'radial-gradient(#E9B44C 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Watermark */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.06] flex items-center justify-center select-none"
              style={{
                backgroundImage: 'url(/images/gallery/receipt_samarpan_nidhi.jpg)',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
              }}
            />

            {/* Header: Om + Trust Name + Om */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 relative z-10">
              <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-[#C65D13] rounded-xl text-white flex items-center justify-center font-bold text-xl sm:text-3xl font-serif drop-shadow shadow-xs">
                ॐ
              </div>

              <div className="text-center flex-1 px-1 min-w-0">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-[#C65D13] font-hindi-heading leading-tight tracking-tight">
                  राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
                </h2>
                <p className="text-[10px] sm:text-xs text-[#382719] font-medium mt-0.5 leading-snug">
                  मुख्य कार्यालय: शिवाजीनगर सेक्टर-2 (बागरानी) रूस्तमपुर, गोरखपुर, उ.प्र. - 273016
                </p>
                <p className="text-[9px] sm:text-[11px] text-[#382719] font-medium leading-snug">
                  सम्पर्क एवं सहयोग कार्यस्थल: साकेतनगर (मधुर शहनाई लान के सामने) रूस्तमपुर, गोरखपुर
                </p>
              </div>

              <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-[#C65D13] rounded-xl text-white flex items-center justify-center font-bold text-xl sm:text-3xl font-serif drop-shadow shadow-xs">
                ॐ
              </div>
            </div>

            {/* Slogan Banner Strip */}
            <div className="bg-[#C65D13] text-white text-center py-1.5 px-3 rounded-lg font-bold text-xs sm:text-sm mb-3.5 shadow-xs relative z-10">
              हमारा लक्ष्य — वैदिक 16 संस्कारों का संरक्षण एवं जनकल्याणकारी सेवा कार्य
            </div>

            {/* Receipt Number, Title & Date Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E9B44C]/50 pb-2 mb-3.5 gap-2 relative z-10">
              <div>
                <span className="text-[11px] sm:text-xs text-[#555555] block">क्र.म. / Receipt No:</span>
                <span className="font-mono font-black text-xs sm:text-sm text-[#C65D13] tracking-wide">{receiptNumber}</span>
              </div>

              <div className="text-left sm:text-center">
                <h3 className="text-base sm:text-xl font-black text-[#2B1B10] underline decoration-[#C65D13] decoration-2 underline-offset-8">
                  {receiptHeading}
                </h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] sm:text-xs text-[#555555] block">दिनांक / Date:</span>
                <span className="font-bold text-xs sm:text-sm text-[#2B1B10] font-mono">{formattedDate}</span>
              </div>
            </div>

            {/* BODY: Public Donor Layout OR Traditional Member Layout */}
            {isPublicDonor ? (
              /* ========================================================
                 PUBLIC / GUEST DONOR CUSTOM LAYOUT
                 (No father's name or address lines!)
                 ======================================================== */
              <div className="space-y-3 relative z-10">
                <div className="bg-[#FFF8EF]/80 border-2 border-[#C65D13]/30 rounded-xl p-3 sm:p-4 shadow-xs">
                  {/* Row 1: Donor Name & Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-2.5 border-b border-dashed border-[#C65D13]/30">
                    <div className="sm:col-span-7">
                      <span className="text-[10px] sm:text-xs font-bold text-[#777777] uppercase block tracking-wider">
                        दानदाता का नाम / Donor Name
                      </span>
                      <div className="font-extrabold text-sm sm:text-lg text-[#2B1B10] mt-0.5">
                        श्री / श्रीमती {name}
                      </div>
                    </div>
                    <div className="sm:col-span-5 text-left sm:text-right">
                      <span className="text-[10px] sm:text-xs font-bold text-[#777777] uppercase block tracking-wider">
                        व्हाट्सएप / मो० नं० / Mobile
                      </span>
                      <div className="font-bold text-xs sm:text-base text-[#2B1B10] font-mono mt-0.5">
                        {mobile !== '—' ? `+91 ${mobile}` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Purpose & Transaction Ref */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2.5 border-b border-dashed border-[#C65D13]/30">
                    <div className="sm:col-span-7">
                      <span className="text-[10px] sm:text-xs font-bold text-[#777777] uppercase block tracking-wider">
                        समर्पण प्रयोजन / Contribution Purpose
                      </span>
                      <div className="font-extrabold text-xs sm:text-sm text-[#C65D13] mt-0.5">
                        {purposeTitle}
                      </div>
                    </div>
                    <div className="sm:col-span-5 text-left sm:text-right">
                      <span className="text-[10px] sm:text-xs font-bold text-[#777777] uppercase block tracking-wider">
                        यूटीआर / संदर्भ संख्या / UTR No.
                      </span>
                      <div className="font-mono font-bold text-xs sm:text-sm text-[#2B1B10] mt-0.5">
                        {receipt.paymentId || receipt.utrNumber || 'UPI-VERIFIED'}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Amount in Words */}
                  <div className="pt-2">
                    <span className="text-[10px] sm:text-xs font-bold text-[#777777] uppercase block tracking-wider">
                      समर्पण राशि (शब्दों में) / Amount in Words
                    </span>
                    <div className="font-black text-xs sm:text-sm text-[#C65D13] underline decoration-[#C65D13]/40 underline-offset-4 mt-0.5">
                      {amountWords}
                    </div>
                  </div>
                </div>

                {/* Blessings Note */}
                <div className="bg-[#FFF4E5] border-l-4 border-[#C65D13] px-3.5 py-2 rounded-r-lg text-[11px] sm:text-xs text-[#382719] leading-relaxed shadow-xs">
                  🙏 <strong>संस्थान की ओर से साधुवाद:</strong> आपके द्वारा सनातन संस्कृति के संवर्धन, गौ-सेवा व जनकल्याण हेतु समर्पित यह सहयोग सहर्ष प्राप्त किया गया। प्रभु श्रीराम का आशीर्वाद आप व आपके परिवार पर सदैव बना रहे।
                </div>
              </div>
            ) : (
              /* ========================================================
                 TRADITIONAL MEMBER VOUCHER LAYOUT (Registered Members)
                 ======================================================== */
              <div className="space-y-2.5 text-xs sm:text-sm text-[#454545] leading-relaxed relative z-10">
                {/* Row 1: Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                    <span className="font-bold text-[#2B1B10] flex-shrink-0">नाम / Name:</span>
                    <span className="font-extrabold text-[#2B1B10] truncate">{name}</span>
                  </div>
                  <div className="sm:col-span-5 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                    <span className="font-bold text-[#2B1B10] flex-shrink-0">मो० न० / Mobile:</span>
                    <span className="font-bold text-[#2B1B10] font-mono">{mobile}</span>
                  </div>
                </div>

                {/* Row 2: Father's Name */}
                <div className="border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10] flex-shrink-0">पिता / पति का नाम / Father's Name:</span>
                  <span className="font-bold text-[#2B1B10] truncate">{fatherHusbandName}</span>
                </div>

                {/* Row 3: Address & Block */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                    <span className="font-bold text-[#2B1B10] flex-shrink-0">पता / ग्राम / मोहल्ला:</span>
                    <span className="font-medium text-[#2B1B10] truncate">{address}</span>
                  </div>
                  <div className="sm:col-span-5 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                    <span className="font-bold text-[#2B1B10] flex-shrink-0">विकास खण्ड / Block:</span>
                    <span className="font-medium text-[#2B1B10]">{block}</span>
                  </div>
                </div>

                {/* Row 4: District & State */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                    <span className="font-bold text-[#2B1B10] flex-shrink-0">जिला / District:</span>
                    <span className="font-medium text-[#2B1B10]">{district}</span>
                  </div>
                  <div className="sm:col-span-5 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                    <span className="font-bold text-[#2B1B10] flex-shrink-0">प्रदेश / State:</span>
                    <span className="font-medium text-[#2B1B10]">{state}</span>
                  </div>
                </div>

                {/* Row 5: Amount in Hindi words */}
                <div className="border-b border-dotted border-gray-400 pb-1 flex flex-wrap items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10]">
                    {purposeLabel} (रूपया शब्दों में):
                  </span>
                  <span className="font-black text-[#C65D13] underline decoration-[#C65D13]/40">
                    {amountWords}
                  </span>
                  <span className="text-[#382719] font-medium">{receiptClosingText}</span>
                </div>
              </div>
            )}

            {/* Bottom Section: Rupee Box + Bank of India Account + Signatures */}
            <div className="mt-5 pt-3.5 border-t-2 border-[#E9B44C]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
              
              {/* Rupee Amount Box + QR Watermark */}
              <div className="flex items-center gap-2">
                <div className="flex items-center shadow-xs">
                  <div className="bg-[#C65D13] text-white px-3.5 py-1.5 rounded-l-lg font-bold text-lg sm:text-xl flex items-center justify-center">
                    ₹
                  </div>
                  <div className="border-2 border-l-0 border-[#C65D13] bg-white px-4 py-1.5 rounded-r-lg font-black text-xl sm:text-2xl text-[#C65D13] font-mono tracking-tight">
                    {numericAmount}/-
                  </div>
                </div>

                {/* Verified QR imprint */}
                <div className="w-10 h-10 border border-amber-300 rounded bg-white/70 p-0.5 opacity-60 hidden sm:flex items-center justify-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="UPI Verification QR"
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                </div>
              </div>

              {/* Bank of India Official Account Credentials */}
              <div className="text-left leading-tight">
                <p className="font-bold text-xs sm:text-sm text-[#C65D13]">
                  बैंक ऑफ़ इण्डिया (Bank of India)
                </p>
                <p className="font-mono text-xs sm:text-sm font-bold text-[#2B1B10]">
                  खाता सं. : 135820110000012
                </p>
                <p className="text-[10px] text-[#555555] font-mono break-all">
                  UPI: boim-135883270012@boi
                </p>
              </div>

              {/* Authorized Signatory Endorsement */}
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="font-serif italic font-black text-base sm:text-lg text-[#C65D13] tracking-wider">
                  बजरंगी दूबे
                </div>
                <div className="text-[11px] font-bold text-[#2B1B10] border-t border-gray-400 pt-0.5 mt-0.5">
                  राष्ट्रीय महामंत्री / प्रबन्धक
                </div>
                <div className="text-[10px] text-[#555555]">
                  हस्ताक्षर प्राप्तकर्ता (Authorized Signatory)
                </div>
              </div>
            </div>

            {/* Official Footer Verification Note */}
            <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[10px] text-[#666666] relative z-10 leading-tight">
              Receipt generated with Trust Watermark, Bank of India Verification & General Secretary Endorsement. • संपर्क: 9794590044, 9026734887
            </div>
          </div>
        </div>

        {/* ====================================================================
            OFFSCREEN CANONICAL 800px CONTAINER (Used for crisp PDF & PNG Image)
            ==================================================================== */}
        <div
          ref={exportReceiptRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '800px',
            zIndex: -9999,
            pointerEvents: 'none',
            opacity: 1,
            visibility: 'visible',
            backgroundColor: '#FFFDF8',
            color: '#382719',
            fontFamily: "'Noto Sans Devanagari', 'Tiro Devanagari Hindi', sans-serif",
            padding: '24px',
            border: '4px solid #C65D13',
            borderRadius: '16px',
            boxSizing: 'border-box',
            backgroundImage: 'radial-gradient(#E9B44C 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* Watermark */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.06] select-none"
            style={{
              backgroundImage: 'url(/images/gallery/receipt_samarpan_nidhi.jpg)',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover'
            }}
          />
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-2 relative z-10">
            <div className="w-14 h-14 flex-shrink-0 bg-[#C65D13] rounded-xl text-white flex items-center justify-center font-bold text-3xl font-serif drop-shadow shadow-xs">
              ॐ
            </div>
            <div className="text-center flex-1 px-1 min-w-0">
              <h2 className="text-2xl font-black text-[#C65D13] font-hindi-heading leading-tight tracking-tight">
                राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
              </h2>
              <p className="text-xs text-[#382719] font-medium mt-0.5 leading-snug">
                मुख्य कार्यालय: शिवाजीनगर सेक्टर-2 (बागरानी) रूस्तमपुर, गोरखपुर, उ.प्र. - 273016
              </p>
              <p className="text-[11px] text-[#382719] font-medium leading-snug">
                सम्पर्क एवं सहयोग कार्यस्थल: साकेतनगर (मधुर शहनाई लान के सामने) रूस्तमपुर, गोरखपुर
              </p>
            </div>
            <div className="w-14 h-14 flex-shrink-0 bg-[#C65D13] rounded-xl text-white flex items-center justify-center font-bold text-3xl font-serif drop-shadow shadow-xs">
              ॐ
            </div>
          </div>

          {/* Slogan Banner Strip */}
          <div className="bg-[#C65D13] text-white text-center py-1.5 px-3 rounded-lg font-bold text-sm mb-3.5 shadow-xs relative z-10">
            हमारा लक्ष्य — वैदिक 16 संस्कारों का संरक्षण एवं जनकल्याणकारी सेवा कार्य
          </div>

          {/* Receipt Number, Title & Date Row */}
          <div className="flex items-center justify-between border-b border-[#E9B44C]/50 pb-2 mb-3.5 gap-2 relative z-10">
            <div>
              <span className="text-xs text-[#555555] block">क्र.म. / Receipt No:</span>
              <span className="font-mono font-black text-sm text-[#C65D13] tracking-wide">{receiptNumber}</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-[#2B1B10] underline decoration-[#C65D13] decoration-2 underline-offset-8">
                {receiptHeading}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#555555] block">दिनांक / Date:</span>
              <span className="font-bold text-sm text-[#2B1B10] font-mono">{formattedDate}</span>
            </div>
          </div>

          {/* BODY: Public Donor Layout OR Traditional Member Layout */}
          {isPublicDonor ? (
            <div className="space-y-3 relative z-10">
              <div className="bg-[#FFF8EF] border-2 border-[#C65D13]/30 rounded-xl p-4 shadow-xs">
                {/* Row 1: Name & Mobile */}
                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-dashed border-[#C65D13]/30">
                  <div className="col-span-7">
                    <span className="text-xs font-bold text-[#777777] uppercase block tracking-wider">
                      दानदाता का नाम / Donor Name
                    </span>
                    <div className="font-extrabold text-lg text-[#2B1B10] mt-0.5">
                      श्री / श्रीमती {name}
                    </div>
                  </div>
                  <div className="col-span-5 text-right">
                    <span className="text-xs font-bold text-[#777777] uppercase block tracking-wider">
                      व्हाट्सएप / मो० नं० / Mobile
                    </span>
                    <div className="font-bold text-base text-[#2B1B10] font-mono mt-0.5">
                      {mobile !== '—' ? `+91 ${mobile}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Row 2: Purpose & UTR */}
                <div className="grid grid-cols-12 gap-2 py-2.5 border-b border-dashed border-[#C65D13]/30">
                  <div className="col-span-7">
                    <span className="text-xs font-bold text-[#777777] uppercase block tracking-wider">
                      समर्पण प्रयोजन / Contribution Purpose
                    </span>
                    <div className="font-extrabold text-sm text-[#C65D13] mt-0.5">
                      {purposeTitle}
                    </div>
                  </div>
                  <div className="col-span-5 text-right">
                    <span className="text-xs font-bold text-[#777777] uppercase block tracking-wider">
                      यूटीआर / संदर्भ संख्या / UTR No.
                    </span>
                    <div className="font-mono font-bold text-sm text-[#2B1B10] mt-0.5">
                      {receipt.paymentId || receipt.utrNumber || 'UPI-VERIFIED'}
                    </div>
                  </div>
                </div>

                {/* Row 3: Amount in Words */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-[#777777] uppercase block tracking-wider">
                    समर्पण राशि (शब्दों में) / Amount in Words
                  </span>
                  <div className="font-black text-sm text-[#C65D13] underline decoration-[#C65D13]/40 underline-offset-4 mt-0.5">
                    {amountWords}
                  </div>
                </div>
              </div>

              {/* Blessings Note */}
              <div className="bg-[#FFF4E5] border-l-4 border-[#C65D13] px-3.5 py-2.5 rounded-r-lg text-xs text-[#382719] leading-relaxed shadow-xs">
                🙏 <strong>संस्थान की ओर से साधुवाद:</strong> आपके द्वारा सनातन संस्कृति के संवर्धन, गौ-सेवा व जनकल्याण हेतु समर्पित यह सहयोग सहर्ष प्राप्त किया गया। प्रभु श्रीराम का आशीर्वाद आप व आपके परिवार पर सदैव बना रहे।
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-sm text-[#454545] leading-relaxed relative z-10">
              {/* Row 1: Name & Mobile */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10] flex-shrink-0">नाम / Name:</span>
                  <span className="font-extrabold text-[#2B1B10] truncate">{name}</span>
                </div>
                <div className="col-span-5 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10] flex-shrink-0">मो० न० / Mobile:</span>
                  <span className="font-bold text-[#2B1B10] font-mono">{mobile}</span>
                </div>
              </div>

              {/* Row 2: Father's Name */}
              <div className="border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                <span className="font-bold text-[#2B1B10] flex-shrink-0">पिता / पति का नाम / Father's Name:</span>
                <span className="font-bold text-[#2B1B10] truncate">{fatherHusbandName}</span>
              </div>

              {/* Row 3: Address & Block */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10] flex-shrink-0">पता / ग्राम / मोहल्ला:</span>
                  <span className="font-medium text-[#2B1B10] truncate">{address}</span>
                </div>
                <div className="col-span-5 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10] flex-shrink-0">विकास खण्ड / Block:</span>
                  <span className="font-medium text-[#2B1B10]">{block}</span>
                </div>
              </div>

              {/* Row 4: District & State */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10] flex-shrink-0">जिला / District:</span>
                  <span className="font-medium text-[#2B1B10]">{district}</span>
                </div>
                <div className="col-span-5 border-b border-dotted border-gray-400 pb-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#2B1B10] flex-shrink-0">प्रदेश / State:</span>
                  <span className="font-medium text-[#2B1B10]">{state}</span>
                </div>
              </div>

              {/* Row 5: Amount in Hindi words */}
              <div className="border-b border-dotted border-gray-400 pb-1 flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-[#2B1B10]">
                  {purposeLabel} (रूपया शब्दों में):
                </span>
                <span className="font-black text-[#C65D13] underline decoration-[#C65D13]/40">
                  {amountWords}
                </span>
                <span className="text-[#382719] font-medium">{receiptClosingText}</span>
              </div>
            </div>
          )}

          {/* Bottom Section */}
          <div className="mt-5 pt-3.5 border-t-2 border-[#E9B44C]/50 flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="flex items-center shadow-xs">
                <div className="bg-[#C65D13] text-white px-3.5 py-1.5 rounded-l-lg font-bold text-xl flex items-center justify-center">
                  ₹
                </div>
                <div className="border-2 border-l-0 border-[#C65D13] bg-white px-4 py-1.5 rounded-r-lg font-black text-2xl text-[#C65D13] font-mono tracking-tight">
                  {numericAmount}/-
                </div>
              </div>

              <div className="w-10 h-10 border border-amber-300 rounded bg-white/70 p-0.5 opacity-60 flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="UPI Verification QR"
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </div>
            </div>

            <div className="text-left leading-tight">
              <p className="font-bold text-sm text-[#C65D13]">
                बैंक ऑफ़ इण्डिया (Bank of India)
              </p>
              <p className="font-mono text-sm font-bold text-[#2B1B10]">
                खाता सं. : 135820110000012
              </p>
              <p className="text-[10px] text-[#555555] font-mono break-all">
                UPI: boim-135883270012@boi
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-serif italic font-black text-lg text-[#C65D13] tracking-wider">
                बजरंगी दूबे
              </div>
              <div className="text-[11px] font-bold text-[#2B1B10] border-t border-gray-400 pt-0.5 mt-0.5">
                राष्ट्रीय महामंत्री / प्रबन्धक
              </div>
              <div className="text-[10px] text-[#555555]">
                हस्ताक्षर प्राप्तकर्ता (Authorized Signatory)
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[10px] text-[#666666] relative z-10 leading-tight">
            Receipt generated with Trust Watermark, Bank of India Verification & General Secretary Endorsement. • संपर्क: 9794590044, 9026734887
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialReceiptModal;
