import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Receipt, CheckCircle2, User, Phone, MapPin, CreditCard, Calendar, Loader2 } from 'lucide-react';
import { numberToHindiWords } from './OfficialReceiptModal';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const CustomReceiptModal = ({ isOpen, onClose, onReceiptGenerated }) => {
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    donorName: '',
    phone: '',
    fatherHusbandName: '',
    address: '',
    block: 'सदर',
    district: 'गोरखपुर',
    state: 'उत्तर प्रदेश',
    purpose: 'samarpan', // 'samarpan' or 'membership_fee'
    amount: '500',
    amountWords: 'पाँच सौ रुपये मात्र',
    paymentMode: 'UPI',
    paymentId: '',
    receiptNumber: `RSSSST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: (() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    })()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'amount') {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
          updated.amountWords = numberToHindiWords(num);
        } else {
          updated.amountWords = '';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.donorName.trim()) {
      setError(lang === 'hi' ? 'कृपया दानकर्ता / सदस्य का नाम दर्ज करें।' : 'Please enter donor / member name.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError(lang === 'hi' ? 'कृपया वैध राशि दर्ज करें।' : 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const numAmount = Number(formData.amount);
      const receiptData = {
        donorName: formData.donorName.trim(),
        fullName: formData.donorName.trim(),
        phone: formData.phone.trim(),
        mobile: formData.phone.trim(),
        donorPhone: formData.phone.trim(),
        fatherHusbandName: formData.fatherHusbandName.trim(),
        address: formData.address.trim(),
        block: formData.block.trim() || 'सदर',
        district: formData.district.trim() || 'गोरखपुर',
        state: formData.state.trim() || 'उत्तर प्रदेश',
        purpose: formData.purpose,
        amount: numAmount,
        verifiedAmount: numAmount,
        claimedAmount: numAmount,
        amountWords: formData.amountWords || numberToHindiWords(numAmount),
        paymentMode: formData.paymentMode,
        paymentId: formData.paymentId.trim() || `MANUAL-${Date.now().toString().slice(-6)}`,
        receiptNumber: formData.receiptNumber.trim() || `RSSSST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: formData.date,
        status: 'approved',
        isCustomReceipt: true,
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp()
      };

      // Save to donations collection in Firestore so it's a permanent record
      await addDoc(collection(db, 'donations'), receiptData);

      // Callback to parent to immediately view/download receipt in OfficialReceiptModal
      if (typeof onReceiptGenerated === 'function') {
        onReceiptGenerated(receiptData);
      }

      onClose();
    } catch (err) {
      console.error('Failed to create custom receipt in Firestore:', err);
      setError(lang === 'hi' ? 'रसीद सहेजने में त्रुटि आई: ' + err.message : 'Error saving receipt: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E9B44C]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#382719] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#E9B44C]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-hindi-heading text-white">
                {lang === 'hi' ? 'कस्टम रसीद बनाएं (Generate Custom Receipt)' : 'Generate Custom Receipt'}
              </h3>
              <p className="text-xs text-[#E9B44C]">
                {lang === 'hi' ? 'विवरण भरकर आधिकारिक रसीद सहेजें और डाउनलोड करें' : 'Fill details to save and generate official receipt'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-left flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Receipt Type Selector */}
          <div>
            <label className="block text-xs font-black text-[#382719] mb-1.5 uppercase tracking-wider">
              {lang === 'hi' ? 'रसीद का प्रकार *' : 'Receipt Type *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, purpose: 'samarpan' }))}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  formData.purpose === 'samarpan'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                }`}
              >
                <span>{lang === 'hi' ? 'समर्पण / दान निधि' : 'Donation (Samarpan)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, purpose: 'membership_fee' }))}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  formData.purpose === 'membership_fee'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                }`}
              >
                <span>{lang === 'hi' ? 'सदस्यता निधि' : 'Membership Fee'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Donor Name */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'दानकर्ता / सदस्य का नाम *' : 'Donor / Member Name *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="donorName"
                  value={formData.donorName}
                  onChange={handleInputChange}
                  placeholder={lang === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary font-medium"
                />
              </div>
            </div>

            {/* Mobile / Phone */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Father / Husband Name */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'पिता / पति का नाम' : "Father's / Husband's Name"}
              </label>
              <input
                type="text"
                name="fatherHusbandName"
                value={formData.fatherHusbandName}
                onChange={handleInputChange}
                placeholder={lang === 'hi' ? 'श्री ...' : "Father's Name"}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'ग्राम / मोहल्ला / पता' : 'Address / Village / Ward'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={lang === 'hi' ? 'पता' : 'Address'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary font-medium"
                />
              </div>
            </div>

            {/* Block & District */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'विकास खण्ड (Block)' : 'Block'}
              </label>
              <input
                type="text"
                name="block"
                value={formData.block}
                onChange={handleInputChange}
                placeholder="सदर"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'जिला (District)' : 'District'}
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                placeholder="गोरखपुर"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'राशि (₹ Amount) *' : 'Amount (₹) *'}
              </label>
              <div className="relative">
                <span className="font-bold text-gray-500 absolute left-3.5 top-2 text-sm">₹</span>
                <input
                  type="number"
                  name="amount"
                  min="1"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="500"
                  required
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold focus:outline-none focus:border-primary text-base"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode'}
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary font-medium"
              >
                <option value="UPI">UPI / ऑनलाइन QR</option>
                <option value="CASH">नकद (Cash)</option>
                <option value="BANK_TRANSFER">बैंक ट्रांसफर / NEFT / IMPS</option>
                <option value="CHEQUE">चेक / ड्राफ्ट</option>
              </select>
            </div>

            {/* Amount in words */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'राशि शब्दों में (In Hindi Words)' : 'Amount in Words'}
              </label>
              <input
                type="text"
                name="amountWords"
                value={formData.amountWords}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary font-medium text-[#B84A06]"
              />
            </div>

            {/* Receipt Number & Date */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'रसीद संख्या (Receipt No)' : 'Receipt Number'}
              </label>
              <input
                type="text"
                name="receiptNumber"
                value={formData.receiptNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'दिनांक (Date DD/MM/YYYY)' : 'Date'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  placeholder="DD/MM/YYYY"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Payment ID / UTR */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'लेन-देन संदर्भ / UTR नंबर (वैकल्पिक)' : 'UTR / Payment Reference (Optional)'}
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="paymentId"
                  value={formData.paymentId}
                  onChange={handleInputChange}
                  placeholder="UPI Ref / UTR / Cash Voucher"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'hi' ? 'सहेज रहे हैं...' : 'Generating...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'रसीद तैयार करें और डाउनलोड करें' : 'Generate & Download Receipt'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomReceiptModal;
