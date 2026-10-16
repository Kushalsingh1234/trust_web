import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from './TrustLogo';
import { X, Printer, ShieldCheck, Download, Award, CheckCircle2 } from 'lucide-react';

export const OfficialReceiptModal = ({ isOpen, onClose, receipt }) => {
  const { lang } = useLanguage();
  const printAreaRef = useRef(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPurposeLabel = (purp) => {
    if (purp === 'membership_fee') return lang === 'hi' ? 'वार्षिक सदस्यता शुल्क (Annual Membership Fee)' : 'Annual Membership Fee';
    if (purp === 'samarpan') return lang === 'hi' ? 'ऐच्छिक समर्पण निधि (Voluntary Donation)' : 'Voluntary Donation (Samarpan)';
    if (purp === 'labor_welfare') return lang === 'hi' ? 'श्रमिक कल्याण एवं सहायता कोष (Labor Welfare Support)' : 'Labor Welfare Support Fund';
    if (purp === 'vedic_sanskar') return lang === 'hi' ? 'षोडश संस्कार आयोजन सहयोग (Vedic Sanskar Rites)' : 'Vedic Sanskar Rites Organization Support';
    return purp || (lang === 'hi' ? 'धार्मिक एवं सामाजिक जनकल्याण सहयोग' : 'Charitable & Cultural Contribution');
  };

  const formattedDate = receipt.issuedAt?.toDate
    ? receipt.issuedAt.toDate().toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-8">
        
        {/* Modal Top Bar (Hidden during print) */}
        <div className="bg-primary text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-trust-badge" />
            <span className="font-extrabold text-sm font-hindi-heading">
              {lang === 'hi' ? 'आधिकारिक सत्यापित दान रसीद' : 'Official Verified Donation Receipt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-primary hover:bg-[#FFF8EF] font-bold text-xs shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'प्रिंट रसीद' : 'Print Receipt'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div ref={printAreaRef} className="p-6 sm:p-8 text-left bg-[#FFFDF9] print:p-4 print:bg-white">
          <div className="border-4 border-double border-[#E9B44C] rounded-2xl p-6 relative overflow-hidden bg-white shadow-sm">
            
            {/* Watermark Om */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5">
              <span className="text-[180px] font-serif text-[#E9B44C]">ॐ</span>
            </div>

            {/* Header */}
            <div className="text-center border-b-2 border-[#E9B44C]/40 pb-4 relative z-10">
              <div className="flex justify-center mb-2">
                <TrustLogo className="w-14 h-14" showText={false} lang={lang} />
              </div>
              <span className="text-xs font-black text-secondary tracking-widest uppercase block">
                ॥ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ॥
              </span>
              <h1 className="text-lg sm:text-xl font-black text-[#382719] mt-1 font-hindi-heading">
                राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
              </h1>
              <p className="text-xs font-bold text-primary font-heading">
                RASHTRIYA SANATAN SANSKAR SEVA SANSTHAN (TRUST)
              </p>
              <p className="text-[10px] text-[#666666] mt-0.5">
                मुख्यालय: शिवाजी नगर सेक्टर-2, बगरानी, महुईसुघरपुर, रूस्तमपुर, गोरखपुर (उ.प्र.) 273016
              </p>
              <p className="text-[9px] text-[#888888]">
                Registered Under Indian Public Charitable Trust Act • Bank: Bank of India (A/c: 135820110000012)
              </p>
            </div>

            {/* Receipt Meta Bar */}
            <div className="flex flex-wrap items-center justify-between py-3 border-b border-[#E9B44C]/30 text-xs relative z-10">
              <div>
                <span className="text-[#666666]">रसीद संख्या (Receipt No): </span>
                <span className="font-mono font-black text-primary text-sm">{receipt.receiptNumber}</span>
              </div>
              <div>
                <span className="text-[#666666]">दिनांक (Date): </span>
                <span className="font-mono font-bold text-[#382719]">{formattedDate}</span>
              </div>
            </div>

            {/* Receipt Body Details */}
            <div className="py-4 space-y-3 text-xs sm:text-sm text-[#382719] relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-dashed border-gray-200 pb-2">
                <span className="text-[#666666] font-medium w-44 flex-shrink-0">भुगतानकर्ता का नाम / Received From:</span>
                <span className="font-extrabold text-[#382719]">{receipt.payerName}</span>
              </div>

              {receipt.payerMobile && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-dashed border-gray-200 pb-2">
                  <span className="text-[#666666] font-medium w-44 flex-shrink-0">मोबाइल नंबर / Mobile:</span>
                  <span className="font-mono font-bold text-[#382719]">{receipt.payerMobile}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-dashed border-gray-200 pb-2">
                <span className="text-[#666666] font-medium w-44 flex-shrink-0">सहयोग का उद्देश्य / Purpose:</span>
                <span className="font-bold text-secondary">{getPurposeLabel(receipt.purpose)}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-dashed border-gray-200 pb-2">
                <span className="text-[#666666] font-medium w-44 flex-shrink-0">भुगतान माध्यम / Method:</span>
                <span className="font-medium text-[#454545] uppercase">{receipt.paymentMethod || 'UPI / Bank Transfer'}</span>
              </div>

              {receipt.utrNumber && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-dashed border-gray-200 pb-2">
                  <span className="text-[#666666] font-medium w-44 flex-shrink-0">बैंक संदर्भ / UTR No:</span>
                  <span className="font-mono font-bold text-[#382719]">{receipt.utrNumber}</span>
                </div>
              )}

              {/* Amount Highlight Box */}
              <div className="p-3.5 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/60 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-[#666666] uppercase font-bold block">सत्यापित प्राप्त राशि (Verified Amount)</span>
                  <span className="font-black text-xl text-primary font-mono">
                    ₹ {Number(receipt.amount).toLocaleString('en-IN')}/-
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-trust-green bg-trust-badge/60 px-2.5 py-1 rounded-full border border-trust-green/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>सत्यापित भुगतान (Verified)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Disclaimers & Signatures */}
            <div className="mt-4 pt-4 border-t-2 border-[#E9B44C]/40 grid grid-cols-2 gap-4 items-end relative z-10 text-[10px] text-[#666666]">
              <div className="space-y-1">
                <p className="font-bold text-[#382719]">{lang === 'hi' ? 'वैधानिक सूचना:' : 'Official Notice:'}</p>
                <p>
                  {lang === 'hi'
                    ? '• यह रसीद बैंक द्वारा UTR पुष्टि उपरांत विधिवत जारी की गई है।'
                    : '• This receipt is officially issued upon administrative bank UTR verification.'}
                </p>
                <p>
                  {lang === 'hi'
                    ? '• संस्था को दिया गया प्रत्येक सहयोग सनातन धर्म एवं जनसेवा में प्रयुक्त होता है।'
                    : '• Every donation is devoted strictly to cultural preservation & public welfare.'}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block p-1 border border-primary/30 rounded bg-white text-[9px] font-mono text-primary font-bold mb-1">
                  OFFICIAL TRUST STAMP
                </div>
                <p className="font-black text-xs text-[#382719]">
                  {lang === 'hi' ? 'बजरंगी दूबे' : 'Bajrangi Dubey'}
                </p>
                <p className="text-[10px] text-[#666666]">
                  {lang === 'hi' ? 'महामंत्री / प्रबंधक (प्रबंधकारिणी)' : 'General Secretary / Manager (Council)'}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default OfficialReceiptModal;
