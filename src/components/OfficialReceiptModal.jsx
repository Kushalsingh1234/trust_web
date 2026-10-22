import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { X, Download, Image as ImageIcon, Loader2, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';


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

export const OfficialReceiptModal = ({ isOpen, onClose, receipt }) => {
  const { lang } = useLanguage();
  const toast = useToast();
  const receiptCardRef = useRef(null);
  const exportReceiptRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !receipt) return null;

  // Extract fields with robust fallbacks
  const receiptNumber = receipt.receiptNumber || receipt.receiptNo || (receipt.id ? `RSSSST-2026-${receipt.id.slice(0, 4).toUpperCase()}` : 'RSSSST-2026-2864');
  const name = receipt.donorName || receipt.fullName || receipt.name || receipt.payerName || '—';
  const mobile = receipt.donorPhone || receipt.phone || receipt.mobile || receipt.payerMobile || receipt.whatsapp || '—';
  const fatherHusbandName = receipt.fatherHusbandName || receipt.fatherName || '—';
  const address = receipt.address || receipt.location || receipt.cityDistrict || '—';
  const block = receipt.block || 'सदर';
  const district = receipt.district || receipt.cityDistrict || 'गोरखपुर';
  const state = receipt.state || 'उत्तर प्रदेश';

  const numericAmount = Number(receipt.verifiedAmount || receipt.amount || receipt.claimedAmount || 200);
  const amountWords = receipt.amountWords || numberToHindiWords(numericAmount);

  const isMembership = receipt.purpose === 'membership_fee' || receipt.category || Boolean(receipt.memberId);
  const receiptHeading = isMembership ? 'सनातन संस्थान — सदस्यता निधि' : 'सनातन संरक्षण — समर्पण निधि';
  const receiptClosingText = isMembership ? 'सह धन्यवाद प्राप्त किया।' : 'सहर्ष प्राप्त किया।';

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

  // Helper: Capture canonical 800px landscape voucher image (never clipped by mobile viewport)
  const getCanonicalReceiptImage = async () => {
    const targetEl = exportReceiptRef.current || receiptCardRef.current;
    if (!targetEl) return null;

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

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

    const width = 800;
    const height = targetEl.offsetHeight || 520;

    let image;
    try {
      // Primary: High-fidelity native SVG foreignObject engine
      image = await toPng(targetEl, {
        width,
        height,
        pixelRatio: 2.5, // 2000px x ~1300px ultra-high-definition
        quality: 1.0,
        cacheBust: false,
      });
    } catch (toPngErr) {
      console.warn('html-to-image failed, using html2canvas fallback:', toPngErr);
      const canvas = await html2canvas(targetEl, {
        scale: 2.5,
        width: 800,
        height,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: height,
        useCORS: true,
        backgroundColor: '#FFFDF9',
        logging: false,
      });
      image = canvas.toDataURL('image/png');
    }

    return image;
  };

  // Download PDF matching authentic landscape voucher
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
      const imgWidth = pdfWidth - margin * 2; // 277mm

      // Compute aspect ratio
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = image;
      });

      const imgHeight = (img.height * imgWidth) / img.width;
      const yOffset = Math.max(margin, (pdfHeight - imgHeight) / 2);

      pdf.addImage(image, 'PNG', margin, yOffset, imgWidth, imgHeight);

      if (Capacitor.isNativePlatform()) {
        const fileName = `${receiptNumber}.pdf`;
        const dataUri = pdf.output('datauristring');
        const base64Data = dataUri.split(',')[1];
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        toast.success(
          lang === 'hi'
            ? `रसीद PDF (${fileName}) सफलतापूर्वक डाउनलोड हो गई है!`
            : `Receipt PDF (${fileName}) downloaded successfully!`
        );
      } else {
        pdf.save(`${receiptNumber}.pdf`);
        toast.success(
          lang === 'hi'
            ? `रसीद PDF (${receiptNumber}.pdf) डाउनलोड हो गई है!`
            : `Receipt PDF (${receiptNumber}.pdf) downloaded successfully!`
        );
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error(lang === 'hi' ? 'रसीद PDF तैयार करने में समस्या आई।' : 'PDF generation failed.');
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

      if (Capacitor.isNativePlatform()) {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        toast.success(
          lang === 'hi'
            ? `रसीद इमेज (${filename}) सफलतापूर्वक डाउनलोड हो गई है!`
            : `Receipt image (${filename}) downloaded successfully!`
        );
      } else {
        // Convert to Blob URL for rock-solid mobile browser download compatibility
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
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      toast.error(lang === 'hi' ? 'रसीद छवि तैयार करने में समस्या आई।' : 'Image generation failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Dedicated Share Receipt via System Share Sheet
  const handleShareReceipt = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const image = await getCanonicalReceiptImage();
      if (!image) return;

      const filename = `${receiptNumber}.png`;

      if (Capacitor.isNativePlatform()) {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        await Share.share({
          title: `Receipt - ${receiptNumber}`,
          text: `Sanatan Trust Receipt: ${receiptNumber}`,
          url: result.uri,
          dialogTitle: lang === 'hi' ? 'रसीद शेयर करें' : 'Share Receipt'
        });
      } else if (navigator.share) {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        await navigator.share({
          title: `Receipt - ${receiptNumber}`,
          text: `Sanatan Trust Receipt: ${receiptNumber}`,
          files: [file]
        });
      } else {
        await handleDownloadPNG();
      }
    } catch (err) {
      console.warn("Share failed or dismissed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-6 max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar */}
        <div className="bg-[#B84A06] text-white px-4 sm:px-6 py-3 flex items-center justify-between print:hidden flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
              ॐ
            </div>
            <span className="font-extrabold text-sm sm:text-base font-hindi-heading truncate">
              {lang === 'hi' ? 'आधिकारिक समर्पण / सदस्यता रसीद' : 'Official Trust Receipt'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#B84A06] hover:bg-[#FFF8EF] font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Download official PDF"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">डाउनलोड PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Download high-resolution image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>इमेज</span>
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Share receipt"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>शेयर</span>
            </button>

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
        <div className="p-3 sm:p-6 overflow-y-auto bg-[#F7F3EB] flex-1 flex items-center justify-center">
          
          {/* EXACT OLD TRADITIONAL RECEIPT VOUCHER (Responsive On-Screen Preview) */}
          <div
            ref={receiptCardRef}
            id="traditional-receipt-card"
            className="w-full max-w-3xl bg-[#FFFDF8] border-4 border-[#C65D13] rounded-2xl p-4 sm:p-7 shadow-xl relative overflow-hidden text-[#382719] font-sans"
            style={{
              backgroundImage: 'radial-gradient(#E9B44C 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Subtle Historic Trust Voucher Watermark in Background */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.06] flex items-center justify-center select-none"
              style={{
                backgroundImage: 'url(/images/gallery/receipt_samarpan_nidhi.jpg)',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
              }}
            />

            {/* Top Row: Left Om + Center Title + Right Om */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 relative z-10">
              {/* Left Om Saffron Box */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-[#C65D13] rounded-xl text-white flex items-center justify-center font-bold text-xl sm:text-3xl font-serif drop-shadow shadow-xs">
                ॐ
              </div>

              {/* Center Trust Name & Office Address */}
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

              {/* Right Om Saffron Box */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-[#C65D13] rounded-xl text-white flex items-center justify-center font-bold text-xl sm:text-3xl font-serif drop-shadow shadow-xs">
                ॐ
              </div>
            </div>

            {/* Slogan Deep Saffron Banner Strip */}
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

            {/* Receipt Form Fields with Traditional Dotted Underlines */}
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
                  {isMembership ? 'से सदस्यता निधि' : 'से समर्पण निधि'} (रूपया शब्दों में):
                </span>
                <span className="font-black text-[#C65D13] underline decoration-[#C65D13]/40">
                  {amountWords}
                </span>
                <span className="text-[#382719] font-medium">{receiptClosingText}</span>
              </div>
            </div>

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

                {/* Subtle verified QR imprint */}
                <div className="w-10 h-10 border border-amber-300 rounded bg-white/70 p-0.5 opacity-60 hidden sm:flex items-center justify-center">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=boim-135883270012@boi&pn=RSSSST"
                    alt="UPI Verification QR"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
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

      </div>

      {/* =========================================================================
          OFF-SCREEN CANONICAL EXPORT RECEIPT (800px Landscape Geometry)
          Captured strictly during download to produce an authentic, 100% complete,
          never-clipped receipt on all devices (mobile & desktop).
         ========================================================================= */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '800px',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <div
          ref={exportReceiptRef}
          id="traditional-receipt-card-canonical"
          style={{
            width: '800px',
            minWidth: '800px',
            maxWidth: '800px',
            boxSizing: 'border-box',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            backgroundImage: 'radial-gradient(#E9B44C 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px',
          }}
          className="w-full bg-[#FFFDF8] border-4 border-[#C65D13] rounded-2xl p-7 shadow-none relative overflow-hidden text-[#382719]"
        >
          {/* Background subtle historic watermark */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.06] flex items-center justify-center select-none"
            style={{
              backgroundImage: 'url(/images/gallery/receipt_samarpan_nidhi.jpg)',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover'
            }}
          />

          {/* Top Row: Left Om + Center Title + Right Om */}
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

          {/* Receipt Form Fields with Traditional Dotted Underlines */}
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
                {isMembership ? 'से सदस्यता निधि' : 'से समर्पण निधि'} (रूपया शब्दों में):
              </span>
              <span className="font-black text-[#C65D13] underline decoration-[#C65D13]/40">
                {amountWords}
              </span>
              <span className="text-[#382719] font-medium">{receiptClosingText}</span>
            </div>
          </div>

          {/* Bottom Section: Rupee Box + Bank of India Account + Signatures */}
          <div className="mt-5 pt-3.5 border-t-2 border-[#E9B44C]/50 flex items-center justify-between gap-4 relative z-10">
            {/* Rupee Amount Box + QR Watermark */}
            <div className="flex items-center gap-2">
              <div className="flex items-center shadow-xs">
                <div className="bg-[#C65D13] text-white px-3.5 py-1.5 rounded-l-lg font-bold text-xl flex items-center justify-center">
                  ₹
                </div>
                <div className="border-2 border-l-0 border-[#C65D13] bg-white px-4 py-1.5 rounded-r-lg font-black text-2xl text-[#C65D13] font-mono tracking-tight">
                  {numericAmount}/-
                </div>
              </div>

              {/* Subtle verified QR imprint */}
              <div className="w-10 h-10 border border-amber-300 rounded bg-white/70 p-0.5 opacity-60 flex items-center justify-center">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=boim-135883270012@boi&pn=RSSSST"
                  alt="UPI Verification QR"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Bank of India Official Account Credentials */}
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

            {/* Authorized Signatory Endorsement */}
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

          {/* Official Footer Verification Note */}
          <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[10px] text-[#666666] relative z-10 leading-tight">
            Receipt generated with Trust Watermark, Bank of India Verification & General Secretary Endorsement. • संपर्क: 9794590044, 9026734887
          </div>
        </div>
      </div>

    </div>
  );
};

export default OfficialReceiptModal;
