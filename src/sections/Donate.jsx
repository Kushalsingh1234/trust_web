import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Copy, Check, QrCode, ShieldCheck, Heart, AlertCircle, FileText, ArrowRight, Download } from 'lucide-react';

export const Donate = ({ onOpenReceiptModal, onOpenPaymentModal }) => {
  const { lang, t } = useLanguage();
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2500);
    } else {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  return (
    <section id="donate" className="py-12 sm:py-16 lg:py-24 bg-[#FFF8EF] relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.donate.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.donate.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.donate.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>

          {/* Quick Suggested Slabs (Swipeable on Mobile) */}
          <div className="mt-6 sm:mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:flex-wrap sm:justify-center sm:pb-0 px-1">
            {[
              { amount: '₹200', label: lang === 'hi' ? 'वार्षिक सदस्यता' : 'Annual Member' },
              { amount: '₹501', label: lang === 'hi' ? 'शुभ समर्पण' : 'Auspicious' },
              { amount: '₹1,100', label: lang === 'hi' ? 'संस्कार संकल्प' : 'Vedic Rites' },
              { amount: '₹2,100', label: lang === 'hi' ? 'श्रमिक सेवा' : 'Labor Support' },
              { amount: '₹5,100', label: lang === 'hi' ? 'शिविर सहयोग' : 'Camp Sponsor' },
            ].map((slab, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E9B44C]/40 shadow-sm text-xs font-black text-[#382719] hover:border-primary transition-all hover:bg-[#FFF8EF] whitespace-nowrap flex-shrink-0"
              >
                <span className="text-primary font-mono">{slab.amount}</span>
                <span className="text-[11px] text-secondary">({slab.label})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid: Left Bank Box + Right QR Code & Fund Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Verified Bank Details Box */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-8 shadow-card border border-[#E9B44C]/35 text-left space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-[#E9B44C]/25 pb-4 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 flex-shrink-0">
                  🏦
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base sm:text-lg text-[#382719] font-hindi-heading truncate">
                    {t.donate.bankTitle}
                  </h3>
                  <span className="text-[11px] sm:text-xs font-semibold text-trust-green flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{lang === 'hi' ? 'सत्यापित ट्रस्ट बैंक खाता' : 'Verified Public Trust Bank Account'}</span>
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono bg-[#FFF8EF] text-secondary px-2.5 py-1 rounded-full font-bold border border-[#E9B44C]/40 flex-shrink-0">
                Gorakhpur
              </span>
            </div>

            {/* Bank Spec Table */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/25 gap-1 sm:gap-2">
                <span className="text-[#454545] font-semibold">{t.donate.bankName}:</span>
                <span className="font-black text-[#382719]">{t.donate.bankNameVal}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/25 gap-1.5 sm:gap-2">
                <span className="text-primary font-bold">{t.donate.accNo}:</span>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="font-mono font-black text-sm sm:text-lg text-primary tracking-wider break-all">
                    {t.donate.accNoVal}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(t.donate.accNoVal, 'acc')}
                    className="p-1.5 rounded-lg bg-white border border-[#E9B44C]/40 hover:border-primary text-[#382719] hover:text-primary transition-all active:scale-95 shadow-sm flex-shrink-0"
                    title={t.donate.copyAcc}
                  >
                    {copiedAcc ? <Check className="w-4 h-4 text-trust-green" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/25 gap-1.5 sm:gap-2">
                <span className="text-[#454545] font-semibold">{t.donate.upiId}:</span>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="font-mono font-bold text-[#382719] text-xs sm:text-sm break-all">
                    {t.donate.upiIdVal}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(t.donate.upiIdVal, 'upi')}
                    className="p-1.5 rounded-lg bg-white border border-[#E9B44C]/40 hover:border-primary text-[#382719] hover:text-primary transition-all active:scale-95 shadow-sm flex-shrink-0"
                    title={t.donate.copyUpi}
                  >
                    {copiedUpi ? <Check className="w-4 h-4 text-trust-green" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/25 gap-1 sm:gap-2">
                <span className="text-[#454545] font-semibold">{t.donate.branch}:</span>
                <span className="font-bold text-[#382719] text-xs sm:text-sm">{t.donate.branchVal}</span>
              </div>
            </div>

            {/* Action Buttons inside Box */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary hover:bg-secondary text-white font-black text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-primary"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'hi' ? 'भुगतान UTR संदर्भ दर्ज करें (व्हाट्सएप पर रसीद हेतु)' : 'Submit Payment UTR (For WhatsApp Receipt)'}</span>
              </button>
            </div>

            {/* Public Accountability Statement */}
            <div className="p-4 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#382719] leading-relaxed font-medium">
                <span className="font-black block mb-0.5">{t.donate.accountabilityTitle}</span>
                <p className="text-[#454545]">{t.donate.accountabilityDesc}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentic QR Code & Fund Usage */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* UPI QR Display Card */}
            <div className="bg-white rounded-3xl p-6 shadow-card border border-[#E9B44C]/35 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF8EF] border border-[#E9B44C]/50 text-secondary text-xs font-bold mb-3 shadow-sm">
                <QrCode className="w-3.5 h-3.5 text-primary" />
                <span>{lang === 'hi' ? 'त्वरित स्कैन एवं भुगतान' : 'Instant Scan & Pay'}</span>
              </div>

              {/* QR Image Box */}
              <div className="mx-auto w-48 h-48 p-3 bg-white rounded-2xl border-2 border-dashed border-primary/40 shadow-inner flex items-center justify-center">
                <img
                  src="/images/avatars/upi_qr_clean.png"
                  alt="Bank of India UPI QR Code boim-135883270012@boi"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="font-mono font-black text-xs text-primary mt-3">
                boim-135883270012@boi
              </p>
              <p className="text-[11px] text-[#454545] font-medium mt-1">
                {t.donate.scanQr}
              </p>

              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#E9B44C]/20">
                <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">
                  Supported UPI: GPay • PhonePe • Paytm • BHIM
                </span>
              </div>
            </div>

            {/* Transparent Fund Utilization List */}
            <div className="bg-white rounded-3xl p-6 shadow-card border border-[#E9B44C]/35">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-primary" />
                <h4 className="font-black text-sm sm:text-base text-[#382719] font-hindi-heading">
                  {t.donate.fundUsageTitle}
                </h4>
              </div>

              <ul className="space-y-2.5 text-xs text-[#454545]">
                {t.donate.fundUsage.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                    <span className="leading-relaxed font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Donate;
