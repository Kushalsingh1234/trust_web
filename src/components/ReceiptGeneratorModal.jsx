import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, CheckCircle2, Shield, Download, Image as ImageIcon, HeartHandshake, UserPlus, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const ReceiptGeneratorModal = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();

  const [receiptType, setReceiptType] = useState('samarpan'); // 'samarpan' or 'sadasyata'
  const [formData, setFormData] = useState({
    name: '',
    fatherHusbandName: '',
    address: '',
    postOffice: '',
    block: 'सदर',
    district: 'गोरखपुर',
    state: 'उत्तर प्रदेश',
    mobile: '',
    amount: '200',
    amountWords: 'दो सौ रुपये मात्र',
    category: 'catB'
  });

  const [generated, setGenerated] = useState(false);
  const [receiptNo, setReceiptNo] = useState('RSSSST-2026-0842');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  });

  const receiptRef = useRef(null);
  const exportReceiptRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'amount') {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          updated.amountWords = lang === 'hi' ? `${num} रुपये मात्र` : `Rupees ${num} only`;
        }
      }
      return updated;
    });
  };

  const handleTypeChange = (type) => {
    setReceiptType(type);
    if (type === 'sadasyata') {
      setFormData(prev => ({
        ...prev,
        amount: '200',
        amountWords: lang === 'hi' ? 'दो सौ रुपये मात्र (वार्षिक सदस्यता)' : 'Two Hundred Rupees only (Annual Membership)'
      }));
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    const randomNo = Math.floor(1000 + Math.random() * 9000);
    setReceiptNo(`RSSSST-2026-${randomNo}`);
    setGenerated(true);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Confetti fallback
    }
  };

  // Helper: Capture canonical 800px landscape voucher image (never clipped by mobile viewport)
  const getCanonicalReceiptImage = async () => {
    const targetEl = exportReceiptRef.current || receiptRef.current;
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
      image = await toPng(targetEl, {
        width,
        height,
        pixelRatio: 2.5,
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
        backgroundColor: '#FFF8EF',
        logging: false,
      });
      image = canvas.toDataURL('image/jpeg', 0.95);
    }
    return image;
  };

  const handleDownloadImage = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const image = await getCanonicalReceiptImage();
      if (!image) return;

      const filename = `${receiptNo}.png`;

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
      console.error('Image download failed:', err);
      alert(lang === 'hi' ? 'रसीद छवि तैयार करने में समस्या आई।' : 'Image download failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const image = await getCanonicalReceiptImage();
      if (!image) return;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
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
      pdf.save(`${receiptNo}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert(lang === 'hi' ? 'रसीद PDF तैयार करने में समस्या आई।' : 'PDF generation failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-8 max-h-[94vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="bg-primary text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
              ॐ
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-lg leading-tight truncate">
                {t.receiptModal.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-white/80 truncate">
                {lang === 'hi' 
                  ? 'डिजिटल रसीद सृजन एवं ऑनलाइन सदस्यता विवरण' 
                  : 'Official Self-Generated Receipt & Membership Form'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!generated ? (
            /* Form Mode */
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Receipt Type Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  {t.receiptModal.chooseType}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('samarpan')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      receiptType === 'samarpan'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <HeartHandshake className={`w-5 h-5 mt-0.5 ${receiptType === 'samarpan' ? 'text-primary' : 'text-gray-400'}`} />
                    <div>
                      <span className="font-bold text-sm block text-gray-900">
                        {t.receiptModal.typeSamarpan}
                      </span>
                      <span className="text-xs text-gray-500">
                        {lang === 'hi' ? 'सनातन संरक्षण - समर्पण निधि (स्वैच्छिक राशि)' : 'Voluntary donation for cause'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('sadasyata')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      receiptType === 'sadasyata'
                        ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/30 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <UserPlus className={`w-5 h-5 mt-0.5 ${receiptType === 'sadasyata' ? 'text-secondary-dark' : 'text-gray-400'}`} />
                    <div>
                      <span className="font-bold text-sm block text-gray-900">
                        {t.receiptModal.typeSadasyata}
                      </span>
                      <span className="text-xs text-gray-500">
                        {lang === 'hi' ? 'वार्षिक ₹200 (कैलेंडर व परिचय पत्र हेतु)' : '₹200/yr with ID & Calendar'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Member Category (As specified in founder notes) */}
              <div className="p-3.5 rounded-xl bg-cream border border-cream-border">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {t.receiptModal.memberCategory}
                </label>
                <div className="space-y-2 text-xs sm:text-sm">
                  {[
                    { id: 'catA', text: t.receiptModal.catA },
                    { id: 'catB', text: t.receiptModal.catB },
                    { id: 'catC', text: t.receiptModal.catC },
                  ].map(cat => (
                    <label key={cat.id} className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={formData.category === cat.id}
                        onChange={handleInputChange}
                        className="mt-1 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-800">{cat.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.fullName} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.fatherHusbandName} *
                  </label>
                  <input
                    type="text"
                    name="fatherHusbandName"
                    required
                    value={formData.fatherHusbandName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.address} *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.postOffice}
                  </label>
                  <input
                    type="text"
                    name="postOffice"
                    value={formData.postOffice}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.block}
                  </label>
                  <input
                    type="text"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.district} *
                  </label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.state} *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.mobile} *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.amount} *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.receiptModal.amountWords}
                  </label>
                  <input
                    type="text"
                    name="amountWords"
                    value={formData.amountWords}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm"
                  />
                </div>
              </div>

              {/* Administrative note from WhatsApp */}
              <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <span className="font-bold text-yellow-900">
                  {lang === 'hi' ? 'महत्वपूर्ण प्रशासनिक सूचना:' : 'Administrative Notice:'}
                </span>{' '}
                {lang === 'hi'
                  ? 'विवरण भरकर आप रसीद प्राप्त कर सकते हैं। ट्रस्ट नियमावली अनुसार एडमिन की स्वीकृति मिलने के उपरांत ही विधिवत सदस्यता व परिचय पत्र जारी किया जाएगा।'
                  : 'You can generate your verified receipt now. Official membership ID & trust calendar will be dispatched after admin approval pursuant to trust bylaws.'}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 flex items-center justify-center"
                >
                  {t.receiptModal.close}
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center"
                >
                  {t.receiptModal.generateBtn}
                </button>
              </div>
            </form>
          ) : (
            /* Official Receipt Display (Print Ready) */
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-green-50 border border-green-200 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-green-900 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-trust-green" />
                  <span>
                    {lang === 'hi'
                      ? 'आधिकारिक डिजिटल रसीद सफलतापूर्वक सृजित हो गई है।'
                      : 'Official Digital Receipt generated successfully.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setGenerated(false)}
                    className="text-xs font-semibold text-primary underline px-2 py-1"
                  >
                    {lang === 'hi' ? 'विवरण बदलें' : 'Edit Details'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'इमेज (PNG)' : 'Download Image'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'PDF डाउनलोड' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Exact Physical Receipt Canvas Box */}
              <div
                id="printable-receipt"
                ref={receiptRef}
                className="relative bg-[#FFF8EF] border-2 sm:border-4 border-[#C65D13] rounded-xl p-3.5 sm:p-7 shadow-lg overflow-hidden text-[#382719] font-sans"
                style={{
                  backgroundImage: 'radial-gradient(#E9B44C 0.6px, transparent 0.6px)',
                  backgroundSize: '24px 24px'
                }}
              >
                {/* Subtle India Map Watermark in Background */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center"
                  style={{
                    backgroundImage: 'url(/images/gallery/receipt_samarpan_nidhi.jpg)',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover'
                  }}
                />

                {/* Trust Name Header */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0 bg-[#C65D13] rounded-lg p-1 text-white flex items-center justify-center font-bold text-base sm:text-2xl drop-shadow">
                    ॐ
                  </div>
                  <div className="text-center flex-1 px-1 min-w-0">
                    <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold text-[#C65D13] font-hindi-heading leading-tight tracking-tight">
                      राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
                    </h2>
                    <p className="text-[10px] sm:text-xs text-[#454545] font-medium">
                      मुख्य कार्यालय: शिवाजीनगर सेक्टर-2 (बागरानी) रूस्तमपुर, गोरखपुर, उ.प्र. - 273016
                    </p>
                    <p className="text-[9px] sm:text-[11px] text-[#454545]">
                      सम्पर्क एवं सहयोग कार्यस्थल: साकेतनगर (मधुर शहनाई लान के सामने) रूस्तमपुर, गोरखपुर
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0 bg-[#C65D13] rounded-lg p-1 text-white flex items-center justify-center font-bold text-base sm:text-2xl drop-shadow">
                    ॐ
                  </div>
                </div>

                {/* Motto Deep Saffron Strip */}
                <div className="bg-[#C65D13] text-white text-center py-1 px-2 rounded-md font-bold text-[11px] sm:text-sm mb-4">
                  हमारा लक्ष्य — वैदिक 16 संस्कारों का संरक्षण एवं जनकल्याणकारी सेवा कार्य
                </div>

                {/* Receipt Title & Meta */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E9B44C]/40 pb-2 mb-4 gap-2">
                  <div>
                    <span className="text-[11px] sm:text-xs text-[#454545] block">क्र.म. / Receipt No:</span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#C65D13]">{receiptNo}</span>
                  </div>
                  <div className="text-left sm:text-center">
                    <h3 className="text-sm sm:text-lg font-black text-[#382719] underline decoration-[#C65D13] decoration-2 underline-offset-4">
                      {receiptType === 'samarpan' ? 'सनातन संरक्षण — समर्पण निधि' : 'सनातन संस्थान — सदस्यता निधि'}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] sm:text-xs text-[#454545] block">दिनांक / Date:</span>
                    <span className="font-semibold text-xs sm:text-sm">{currentDate}</span>
                  </div>
                </div>

                {/* Receipt Body Fields */}
                <div className="space-y-3 text-xs sm:text-sm text-[#454545] leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="border-b border-dotted border-gray-400 pb-1">
                      <span className="font-semibold text-[#382719]">नाम / Name: </span>
                      <span className="font-bold text-[#382719]">{formData.name}</span>
                    </div>
                    <div className="border-b border-dotted border-gray-400 pb-1">
                      <span className="font-semibold text-[#382719]">मो० न० / Mobile: </span>
                      <span className="font-bold text-[#382719]">{formData.mobile}</span>
                    </div>
                  </div>

                  <div className="border-b border-dotted border-gray-400 pb-1">
                    <span className="font-semibold text-[#382719]">पिता / पति का नाम / Father's Name: </span>
                    <span className="font-bold text-[#382719]">{formData.fatherHusbandName}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="border-b border-dotted border-gray-400 pb-1">
                      <span className="font-semibold text-[#382719]">पता / ग्राम / मोहल्ला: </span>
                      <span>{formData.address}</span>
                    </div>
                    <div className="border-b border-dotted border-gray-400 pb-1">
                      <span className="font-semibold text-[#382719]">विकास खण्ड / Block: </span>
                      <span>{formData.block || 'सदर'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="border-b border-dotted border-gray-400 pb-1">
                      <span className="font-semibold text-[#382719]">जिला / District: </span>
                      <span>{formData.district}</span>
                    </div>
                    <div className="border-b border-dotted border-gray-400 pb-1">
                      <span className="font-semibold text-[#382719]">प्रदेश / State: </span>
                      <span>{formData.state}</span>
                    </div>
                  </div>

                  <div className="border-b border-dotted border-gray-400 pb-1">
                    <span className="font-semibold text-[#382719]">
                      {receiptType === 'samarpan' ? 'से समर्पण निधि' : 'से सदस्यता निधि'} (रूपया शब्दों में):{' '}
                    </span>
                    <span className="font-bold text-[#C65D13]">{formData.amountWords}</span>
                    <span className="text-[#454545]"> {receiptType === 'samarpan' ? 'सहर्ष प्राप्त किया।' : 'सह धन्यवाद प्राप्त किया।'}</span>
                  </div>
                </div>

                {/* Amount Box, Bank Info & QR Code Footer */}
                <div className="mt-6 pt-4 border-t-2 border-[#E9B44C]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Amount Box */}
                  <div className="flex items-center gap-2">
                    <div className="bg-[#C65D13] text-white px-3 py-2 rounded font-bold text-lg">
                      ₹
                    </div>
                    <div className="border-2 border-[#C65D13] bg-white px-4 py-2 rounded font-extrabold text-xl text-[#C65D13] tracking-wide">
                      {formData.amount}/-
                    </div>
                  </div>

                  {/* Bank of India Account Info */}
                  <div className="text-left">
                    <p className="font-bold text-xs text-secondary">
                      बैंक ऑफ़ इण्डिया (Bank of India)
                    </p>
                    <p className="font-mono text-xs font-bold text-[#382719]">
                      खाता सं.: 135820110000012
                    </p>
                    <p className="text-[10px] text-[#454545] break-all">
                      UPI: boim-135883270012@boi
                    </p>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="text-left sm:text-right">
                    <div className="font-serif italic font-bold text-sm text-secondary">
                      बजरंगी दूबे
                    </div>
                    <div className="text-[11px] font-bold text-[#382719] border-t border-gray-400 pt-0.5 mt-0.5">
                      राष्ट्रीय महामंत्री / प्रबन्धक
                    </div>
                    <div className="text-[10px] text-[#454545]">
                      हस्ताक्षर प्राप्तकर्ता (Authorized Signatory)
                    </div>
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[10px] text-[#454545]">
                  {t.receiptModal.downloadNotice} • संपर्क: 9794590044, 9026734887
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-[#454545] hover:bg-gray-50 flex items-center justify-center"
                >
                  {t.receiptModal.close}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isExporting}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md flex-1 sm:flex-none disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'इमेज डाउनलोड' : 'Download Image'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md flex-1 sm:flex-none disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'PDF डाउनलोड' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Off-screen Canonical 800px Export Receipt (prevents mobile viewport cropping) */}
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
          id="printable-receipt-canonical"
          style={{
            width: '800px',
            minWidth: '800px',
            maxWidth: '800px',
            boxSizing: 'border-box',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            backgroundImage: 'radial-gradient(#E9B44C 0.6px, transparent 0.6px)',
            backgroundSize: '24px 24px',
          }}
          className="relative bg-[#FFF8EF] border-4 border-[#C65D13] rounded-xl p-7 shadow-none overflow-hidden text-[#382719]"
        >
          {/* Subtle India Map Watermark in Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center"
            style={{
              backgroundImage: 'url(/images/gallery/receipt_samarpan_nidhi.jpg)',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover'
            }}
          />

          {/* Trust Name Header */}
          <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
            <div className="w-12 h-12 flex-shrink-0 bg-[#C65D13] rounded-lg p-1 text-white flex items-center justify-center font-bold text-2xl drop-shadow">
              ॐ
            </div>
            <div className="text-center flex-1 px-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-[#C65D13] font-hindi-heading leading-tight tracking-tight">
                राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
              </h2>
              <p className="text-xs text-[#454545] font-medium">
                मुख्य कार्यालय: शिवाजीनगर सेक्टर-2 (बागरानी) रूस्तमपुर, गोरखपुर, उ.प्र. - 273016
              </p>
              <p className="text-[11px] text-[#454545]">
                सम्पर्क एवं सहयोग कार्यस्थल: साकेतनगर (मधुर शहनाई लान के सामने) रूस्तमपुर, गोरखपुर
              </p>
            </div>
            <div className="w-12 h-12 flex-shrink-0 bg-[#C65D13] rounded-lg p-1 text-white flex items-center justify-center font-bold text-2xl drop-shadow">
              ॐ
            </div>
          </div>

          {/* Motto Deep Saffron Strip */}
          <div className="bg-[#C65D13] text-white text-center py-1.5 px-2 rounded-md font-bold text-sm mb-4 relative z-10">
            हमारा लक्ष्य — वैदिक 16 संस्कारों का संरक्षण एवं जनकल्याणकारी सेवा कार्य
          </div>

          {/* Receipt Title & Meta */}
          <div className="flex items-center justify-between border-b border-[#E9B44C]/40 pb-2 mb-4 gap-2 relative z-10">
            <div>
              <span className="text-xs text-[#454545] block">क्र.म. / Receipt No:</span>
              <span className="font-mono font-bold text-sm text-[#C65D13]">{receiptNo}</span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-[#382719] underline decoration-[#C65D13] decoration-2 underline-offset-4">
                {receiptType === 'samarpan' ? 'सनातन संरक्षण — समर्पण निधि' : 'सनातन संस्थान — सदस्यता निधि'}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#454545] block">दिनांक / Date:</span>
              <span className="font-semibold text-sm">{currentDate}</span>
            </div>
          </div>

          {/* Receipt Body Fields */}
          <div className="space-y-3 text-sm text-[#454545] leading-relaxed relative z-10">
            <div className="grid grid-cols-2 gap-2">
              <div className="border-b border-dotted border-gray-400 pb-1">
                <span className="font-semibold text-[#382719]">नाम / Name: </span>
                <span className="font-bold text-[#382719]">{formData.name}</span>
              </div>
              <div className="border-b border-dotted border-gray-400 pb-1">
                <span className="font-semibold text-[#382719]">मो० न० / Mobile: </span>
                <span className="font-bold text-[#382719]">{formData.mobile}</span>
              </div>
            </div>

            <div className="border-b border-dotted border-gray-400 pb-1">
              <span className="font-semibold text-[#382719]">पिता / पति का नाम / Father's Name: </span>
              <span className="font-bold text-[#382719]">{formData.fatherHusbandName}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border-b border-dotted border-gray-400 pb-1">
                <span className="font-semibold text-[#382719]">पता / ग्राम / मोहल्ला: </span>
                <span>{formData.address}</span>
              </div>
              <div className="border-b border-dotted border-gray-400 pb-1">
                <span className="font-semibold text-[#382719]">विकास खण्ड / Block: </span>
                <span>{formData.block || 'सदर'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border-b border-dotted border-gray-400 pb-1">
                <span className="font-semibold text-[#382719]">जिला / District: </span>
                <span>{formData.district}</span>
              </div>
              <div className="border-b border-dotted border-gray-400 pb-1">
                <span className="font-semibold text-[#382719]">प्रदेश / State: </span>
                <span>{formData.state}</span>
              </div>
            </div>

            <div className="border-b border-dotted border-gray-400 pb-1">
              <span className="font-semibold text-[#382719]">
                {receiptType === 'samarpan' ? 'से समर्पण निधि' : 'से सदस्यता निधि'} (रूपया शब्दों में):{' '}
              </span>
              <span className="font-bold text-[#C65D13]">{formData.amountWords}</span>
              <span className="text-[#454545]"> {receiptType === 'samarpan' ? 'सहर्ष प्राप्त किया।' : 'सह धन्यवाद प्राप्त किया।'}</span>
            </div>
          </div>

          {/* Amount Box, Bank Info & Signatures Footer */}
          <div className="mt-6 pt-4 border-t-2 border-[#E9B44C]/40 flex items-center justify-between gap-4 relative z-10">
            {/* Amount Box */}
            <div className="flex items-center gap-2">
              <div className="bg-[#C65D13] text-white px-3 py-2 rounded font-bold text-lg">
                ₹
              </div>
              <div className="border-2 border-[#C65D13] bg-white px-4 py-2 rounded font-extrabold text-xl text-[#C65D13] tracking-wide">
                {formData.amount}/-
              </div>
            </div>

            {/* Bank of India Account Info */}
            <div className="text-left">
              <p className="font-bold text-xs text-secondary">
                बैंक ऑफ़ इण्डिया (Bank of India)
              </p>
              <p className="font-mono text-xs font-bold text-[#382719]">
                खाता सं.: 135820110000012
              </p>
              <p className="text-[10px] text-[#454545] break-all">
                UPI: boim-135883270012@boi
              </p>
            </div>

            {/* Signatures & Seal */}
            <div className="text-right">
              <div className="font-serif italic font-bold text-sm text-secondary">
                बजरंगी दूबे
              </div>
              <div className="text-[11px] font-bold text-[#382719] border-t border-gray-400 pt-0.5 mt-0.5">
                राष्ट्रीय महामंत्री / प्रबन्धक
              </div>
              <div className="text-[10px] text-[#454545]">
                हस्ताक्षर प्राप्तकर्ता (Authorized Signatory)
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[10px] text-[#454545] relative z-10">
            {t.receiptModal.downloadNotice} • संपर्क: 9794590044, 9026734887
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGeneratorModal;
