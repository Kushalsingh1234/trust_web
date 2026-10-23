import jsPDF from 'jspdf';

/**
 * Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
 * Official Client-side Receipt & Member Card PDF Generator
 */

// Convert integer amount to Indian English words
export const numberToIndianWords = (amount) => {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (n) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  };

  const convertThreeDigits = (n) => {
    let str = '';
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
    }
    const rem = n % 100;
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str.trim();
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundredAndBelow = rem;

  if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundredAndBelow > 0) words += convertThreeDigits(hundredAndBelow);

  return `${words.trim()} Rupees Only`;
};

import html2canvas from 'html2canvas';

// Convert integer amount to formal Hindi words
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

/**
 * Generate and download the authentic traditional trust donation/membership receipt PDF
 */
export const generateReceiptPDF = async (receiptData = {}, settings = {}) => {
  const data = receiptData || {};
  const receiptNumber = data.receiptNumber || data.receiptNo || (data.id ? `RSSSST-2026-${data.id.slice(0, 4).toUpperCase()}` : 'RSSSST-2026-2864');
  const name = data.donorName || data.fullName || data.name || data.payerName || '—';
  let rawMobile = data.phone || data.donorPhone || data.mobile || data.payerMobile || '';
  let mobile = '—';
  if (rawMobile) {
    const digits = String(rawMobile).replace(/\D/g, '');
    if (digits.length === 10) mobile = digits;
    else if (digits.length === 12 && digits.startsWith('91')) mobile = digits.slice(2);
    else if (digits.length > 0) mobile = String(rawMobile);
  }

  const fatherHusbandName = (data.fatherHusbandName || data.fatherName || '').trim() || '—';
  const address = (data.address || data.location || data.cityDistrict || '').trim() || '—';
  const block = (data.block || '').trim() || '—';
  const district = (data.district || '').replace(/\s*\([^\)]*\)/g, '').trim() || 'गोरखपुर';
  const state = (data.state || '').replace(/\s*\([^\)]*\)/g, '').trim() || 'उत्तर प्रदेश';
  const amount = Number(data.verifiedAmount ?? data.amount ?? data.claimedAmount ?? 0);
  const amountWords = data.amountWords || numberToHindiWords(amount);
  const isMembership = data.purpose === 'membership_fee' || Boolean(data.category);
  const isPublicDonor = Boolean(data.isPublicDonor) || (!isMembership && (!data.fatherHusbandName || data.fatherHusbandName === '—') && (!data.address || data.address === '—') && !data.memberId);
  const heading = isPublicDonor ? 'सनातन संरक्षण — ई-समर्पण रसीद' : (isMembership ? 'सनातन संस्थान — सदस्यता निधि' : 'सनातन संरक्षण — समर्पण निधि');
  const closingText = isMembership ? 'सह धन्यवाद प्राप्त किया।' : 'सहर्ष प्राप्त किया।';
  const purposeTitle = data.purposeTitle || (data.purpose === 'cow_service' ? 'गौ सेवा एवं पोषण प्रकल्प' :
    data.purpose === 'sanskar_camps' ? '१६ वैदिक संस्कार जागरण शिविर' :
    data.purpose === 'medical_aid' ? 'निर्धन चिकित्सा एवं औषधि सहयोग' :
    data.purpose === 'labor_welfare' ? 'श्रमिक कल्याण एवं दुर्घटना सहायता' : 'सामान्य सनातन धर्मार्थ समर्पण निधि');
  const utrNumber = data.paymentId || data.utrNumber || 'UPI-VERIFIED';

  let dateStr = '';
  try {
    const raw = data.date || data.approvedAt || data.issuedAt || data.createdAt;
    if (raw?.toDate) {
      const d = raw.toDate();
      dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } else if (raw?.seconds) {
      const d = new Date(raw.seconds * 1000);
      dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } else if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }
    }
  } catch {}
  if (!dateStr) {
    const d = new Date();
    dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '820px';
    container.style.zIndex = '-9999';
    container.style.backgroundColor = '#FFFDF8';
    container.style.fontFamily = "'Noto Sans Devanagari', 'Tiro Devanagari Hindi', sans-serif";

    container.innerHTML = `
      <div style="background-color: #FFFDF8; border: 4px solid #C65D13; border-radius: 16px; padding: 24px; position: relative; color: #382719; box-sizing: border-box; background-image: radial-gradient(#E9B44C 0.5px, transparent 0.5px); background-size: 24px 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="width: 52px; height: 52px; background-color: #C65D13; border-radius: 12px; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 30px; font-family: serif;">
            ॐ
          </div>
          <div style="text-align: center; flex: 1; padding: 0 8px;">
            <div style="font-size: 24px; font-weight: 900; color: #C65D13; line-height: 1.2;">
              राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
            </div>
            <div style="font-size: 11px; color: #382719; font-weight: 500; margin-top: 2px;">
              मुख्य कार्यालय: शिवाजीनगर सेक्टर-2 (बागरानी) रूस्तमपुर, गोरखपुर, उ.प्र. - 273016
            </div>
            <div style="font-size: 10px; color: #382719; font-weight: 500;">
              सम्पर्क एवं सहयोग कार्यस्थल: साकेतनगर (मधुर शहनाई लान के सामने) रूस्तमपुर, गोरखपुर
            </div>
          </div>
          <div style="width: 52px; height: 52px; background-color: #C65D13; border-radius: 12px; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 30px; font-family: serif;">
            ॐ
          </div>
        </div>

        <div style="background-color: #C65D13; color: #ffffff; text-align: center; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 13px; margin: 10px 0 12px 0;">
          हमारा लक्ष्य — वैदिक 16 संस्कारों का संरक्षण एवं जनकल्याणकारी सेवा कार्य
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(233, 180, 76, 0.5); padding-bottom: 8px; margin-bottom: 14px;">
          <div>
            <div style="font-size: 11px; color: #555555;">क्र.म. / Receipt No:</div>
            <div style="font-family: monospace; font-weight: 900; font-size: 14px; color: #C65D13;">${receiptNumber}</div>
          </div>
          <div style="font-size: 18px; font-weight: 900; color: #2B1B10; text-decoration: underline; text-underline-offset: 6px;">
            ${heading}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #555555;">दिनांक / Date:</div>
            <div style="font-weight: bold; font-size: 13px; color: #2B1B10; font-family: monospace;">${dateStr}</div>
          </div>
        </div>

        ${isPublicDonor ? `
        <div style="background-color: #FFF8EF; border: 2px solid rgba(198, 93, 19, 0.3); border-radius: 12px; padding: 14px 16px; margin: 12px 0;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dashed rgba(198, 93, 19, 0.3); padding-bottom: 8px; margin-bottom: 8px;">
            <div>
              <span style="font-size: 11px; color: #777777; font-weight: bold; text-transform: uppercase;">दानदाता का नाम / Donor Name:</span>
              <div style="font-size: 17px; font-weight: 800; color: #2B1B10; margin-top: 2px;">श्री / श्रीमती ${name}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; color: #777777; font-weight: bold; text-transform: uppercase;">व्हाट्सएप / मो० नं० / Mobile:</span>
              <div style="font-size: 15px; font-weight: 800; color: #2B1B10; font-family: monospace; margin-top: 2px;">${mobile !== '—' ? '+91 ' + mobile : '—'}</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dashed rgba(198, 93, 19, 0.3); padding-bottom: 8px; margin-bottom: 8px;">
            <div>
              <span style="font-size: 11px; color: #777777; font-weight: bold; text-transform: uppercase;">समर्पण प्रयोजन / Contribution Purpose:</span>
              <div style="font-size: 13px; font-weight: 800; color: #C65D13; margin-top: 2px;">${purposeTitle}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; color: #777777; font-weight: bold; text-transform: uppercase;">यूटीआर / संदर्भ संख्या / UTR No.:</span>
              <div style="font-size: 13px; font-weight: 800; color: #2B1B10; font-family: monospace; margin-top: 2px;">${utrNumber}</div>
            </div>
          </div>

          <div style="padding-top: 2px;">
            <span style="font-size: 11px; color: #777777; font-weight: bold; text-transform: uppercase;">समर्पण राशि (शब्दों में) / Amount in Words:</span>
            <div style="font-size: 14px; font-weight: 900; color: #C65D13; text-decoration: underline; margin-top: 2px;">${amountWords}</div>
          </div>
        </div>

        <div style="background-color: #FFF4E5; border-left: 4px solid #C65D13; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #382719; line-height: 1.5; margin-bottom: 12px;">
          🙏 <strong>संस्थान की ओर से साधुवाद:</strong> आपके द्वारा सनातन संस्कृति के संवर्धन, गौ-सेवा व जनकल्याण हेतु समर्पित यह सहयोग सहर्ष प्राप्त किया गया। प्रभु श्रीराम का आशीर्वाद आप व आपके परिवार पर सदैव बना रहे।
        </div>
        ` : `
        <div style="font-size: 13px; color: #454545; line-height: 1.8;">
          <div style="display: flex; gap: 16px; margin-bottom: 8px;">
            <div style="flex: 7; border-bottom: 1px dotted #888888; padding-bottom: 3px;">
              <span style="font-weight: bold; color: #2B1B10;">नाम / Name:</span> <span style="font-weight: 800; color: #2B1B10;">${name}</span>
            </div>
            <div style="flex: 5; border-bottom: 1px dotted #888888; padding-bottom: 3px;">
              <span style="font-weight: bold; color: #2B1B10;">मो० न० / Mobile:</span> <span style="font-weight: bold; color: #2B1B10; font-family: monospace;">${mobile}</span>
            </div>
          </div>

          <div style="border-bottom: 1px dotted #888888; padding-bottom: 3px; margin-bottom: 8px;">
            <span style="font-weight: bold; color: #2B1B10;">पिता / पति का नाम / Father's Name:</span> <span style="font-weight: bold; color: #2B1B10;">${fatherHusbandName}</span>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 8px;">
            <div style="flex: 7; border-bottom: 1px dotted #888888; padding-bottom: 3px;">
              <span style="font-weight: bold; color: #2B1B10;">पता / ग्राम / मोहल्ला:</span> <span style="color: #2B1B10;">${address}</span>
            </div>
            <div style="flex: 5; border-bottom: 1px dotted #888888; padding-bottom: 3px;">
              <span style="font-weight: bold; color: #2B1B10;">विकास खण्ड / Block:</span> <span style="color: #2B1B10;">${block}</span>
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 8px;">
            <div style="flex: 7; border-bottom: 1px dotted #888888; padding-bottom: 3px;">
              <span style="font-weight: bold; color: #2B1B10;">जिला / District:</span> <span style="color: #2B1B10;">${district}</span>
            </div>
            <div style="flex: 5; border-bottom: 1px dotted #888888; padding-bottom: 3px;">
              <span style="font-weight: bold; color: #2B1B10;">प्रदेश / State:</span> <span style="color: #2B1B10;">${state}</span>
            </div>
          </div>

          <div style="border-bottom: 1px dotted #888888; padding-bottom: 4px; margin-bottom: 12px;">
            <span style="font-weight: bold; color: #2B1B10;">${isMembership ? 'से सदस्यता निधि' : 'से समर्पण निधि'} (रूपया शब्दों में):</span>
            <span style="font-weight: 900; color: #C65D13; text-decoration: underline;">${amountWords}</span>
            <span style="color: #382719;"> ${closingText}</span>
          </div>
        </div>
        `}

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 2px solid rgba(233, 180, 76, 0.5); padding-top: 12px; margin-top: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center;">
              <div style="background-color: #C65D13; color: #ffffff; padding: 6px 12px; border-top-left-radius: 8px; border-bottom-left-radius: 8px; font-weight: bold; font-size: 20px;">
                ₹
              </div>
              <div style="border: 2px solid #C65D13; border-left: none; background-color: #ffffff; padding: 6px 16px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; font-weight: 900; font-size: 22px; color: #C65D13; font-family: monospace;">
                ${amount}/-
              </div>
            </div>
          </div>

          <div style="text-align: left; line-height: 1.3;">
            <div style="font-weight: bold; font-size: 13px; color: #C65D13;">बैंक ऑफ़ इण्डिया (Bank of India)</div>
            <div style="font-weight: bold; font-size: 13px; color: #2B1B10; font-family: monospace;">खाता सं. : 135820110000012</div>
            <div style="font-size: 11px; color: #555555; font-family: monospace;">UPI: boim-135883270012@boi</div>
          </div>

          <div style="text-align: right; line-height: 1.3;">
            <div style="font-family: serif; font-style: italic; font-weight: 900; font-size: 18px; color: #C65D13;">बजरंगी दूबे</div>
            <div style="font-weight: bold; font-size: 11px; color: #2B1B10; border-top: 1px solid #888888; padding-top: 2px; margin-top: 2px;">राष्ट्रीय महामंत्री / प्रबन्धक</div>
            <div style="font-size: 10px; color: #666666;">हस्ताक्षर प्राप्तकर्ता (Authorized Signatory)</div>
          </div>
        </div>

        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 10px; color: #666666;">
          Receipt generated with Trust Watermark, Bank of India Verification & General Secretary Endorsement. • संपर्क: 9794590044, 9026734887
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container.firstElementChild, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFDF8',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yOffset = Math.max(margin, (pdfHeight - imgHeight) / 2);

      pdf.addImage(imgData, 'JPEG', margin, yOffset, imgWidth, imgHeight);
      const filename = `${receiptNumber}.pdf`;
      pdf.save(filename);
      return filename;
    } finally {
      document.body.removeChild(container);
    }
  }
};

/**
 * Generate client-side printable Member ID Card PDF
 */
export const generateMemberCardPDF = ({
  fullName = 'Member Name',
  username = 'user',
  memberId = 'TRUST-M-0001',
  phone = '',
  memberSince = new Date(),
  trustName = 'Rashtriya Sanatan Sanskar Seva Sansthan'
}) => {
  // Standard ID-1 Card Size: 85.6mm x 54mm (landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54]
  });

  let sinceYear = '2026';
  try {
    if (memberSince?.toDate) sinceYear = memberSince.toDate().getFullYear();
    else if (memberSince?.seconds) sinceYear = new Date(memberSince.seconds * 1000).getFullYear();
    else if (memberSince) sinceYear = new Date(memberSince).getFullYear();
  } catch {}

  // Card Background
  doc.setFillColor(255, 253, 249);
  doc.rect(0, 0, 85.6, 54, 'F');

  // Outer Gold Border
  doc.setDrawColor(233, 180, 76);
  doc.setLineWidth(0.8);
  doc.rect(1.5, 1.5, 82.6, 51, 'S');

  // Header Strip
  doc.setFillColor(56, 39, 25);
  doc.rect(1.5, 1.5, 82.6, 12, 'F');

  doc.setFillColor(232, 117, 22);
  doc.rect(1.5, 13.5, 82.6, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 248, 239);
  doc.text(trustName.toUpperCase(), 42.8, 6.5, { align: 'center' });

  doc.setFontSize(5.5);
  doc.setTextColor(233, 180, 76);
  doc.text('OFFICIAL VERIFIED MEMBER IDENTITY CARD', 42.8, 10.5, { align: 'center' });

  // Avatar / Shield Circle
  doc.setFillColor(232, 117, 22);
  doc.circle(13, 24, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(fullName.charAt(0).toUpperCase() || 'M', 13, 27.5, { align: 'center' });

  // Member Badge Ribbon
  doc.setFillColor(16, 185, 129); // Green verified
  doc.roundedRect(24, 16.5, 30, 4.5, 1, 1, 'F');
  doc.setFontSize(5.5);
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFIED MEMBER', 39, 19.8, { align: 'center' });

  // Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(56, 39, 25);
  doc.text(fullName.length > 22 ? fullName.slice(0, 22) + '...' : fullName, 24, 25.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(232, 117, 22);
  doc.text(`ID: ${memberId}`, 24, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Username: @${username}`, 24, 34);
  if (phone) doc.text(`Mobile: ${phone}`, 24, 38);
  doc.text(`Member Since: ${sinceYear} • Gorakhpur, UP`, 24, 42);

  // Footer bar
  doc.setFillColor(56, 39, 25);
  doc.rect(1.5, 46, 82.6, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(233, 180, 76);
  doc.text('SANATAN SANSKAR SEVA SANSTHAN • 16 VEDIC SANSKARS & SHRAMIK KALYAN', 42.8, 50, { align: 'center' });

  const safeFilename = `MemberCard_${memberId}.pdf`;
  doc.save(safeFilename);
  return safeFilename;
};
