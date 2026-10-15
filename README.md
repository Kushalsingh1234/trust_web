# Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
### राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)

A production-ready, fully responsive, bilingual (English + Hindi) web platform for **Rashtriya Sanatan Sanskar Seva Sansthan (Trust)**, Gorakhpur, Uttar Pradesh.

---

## 🏛️ Project Overview

- **Trust Name**: Rashtriya Sanatan Sanskar Seva Sansthan (Trust) | राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
- **Mission**: Preserving 16 Vedic Sanskars, scriptural wisdom, and public welfare in India
- **Headquarters**: Shivaji Nagar Sector-2 (Bagrani), Mahuisugharpur, Rustampur, Gorakhpur - 273016, UP
- **Branch Office**: Saket Nagar (In front of Madhur Shehnai Lawn), Rustampur, Gorakhpur, UP
- **Bank of India Account**: `135820110000012`
- **UPI ID**: `boim-135883270012@boi`

---

## 🚀 Tech Stack

- **Framework**: React 18 + Vite 5 (Ultra-fast static SPA, zero SSR latency)
- **Styling**: Tailwind CSS 3 + Dedicated Brand Palette (Saffron Orange `#E87516`, Deep Saffron `#C65D13`, Warm Ivory `#FFF8EF`, Pure White `#FFFFFF`, Golden Yellow `#E9B44C`, Deep Brown `#382719`, Charcoal `#454545`, Dark Brown `#302319`)
- **Typography**: Google Fonts (*Poppins*, *Inter*, *Noto Sans Devanagari*, *Tiro Devanagari Hindi*, *Noto Serif Devanagari*)
- **Animations**: Framer Motion + Canvas Confetti
- **Icons**: Lucide React
- **Hosting Ready**: Vercel, Netlify, Cloudflare Pages, GitHub Pages

---

## 📂 Folder Structure

```text
trust_web/
├── index.html                   # SEO tags, Google Fonts, JSON-LD schema
├── package.json                 # Project dependencies and build scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Theme colors, fonts, shadows, and radii
├── vite.config.js               # Vite bundler configuration
├── public/
│   ├── favicon.svg              # Authentic sacred sunburst & Om favicon
│   └── images/
│       ├── avatars/             # Extracted portrait photos & logos
│       │   ├── bajrangi_dubey.jpg
│       │   ├── kn_sharma.jpg
│       │   ├── logo_rsssst.jpg
│       │   ├── logo_om.jpg
│       │   └── upi_qr_clean.png
│       └── gallery/             # 15 Authentic photos & WebP versions
│           ├── shramik_camp_collage.webp
│           ├── community_gathering_azad_chowk.webp
│           ├── campaign_banner_office.webp
│           ├── trust_manifesto_advisor.webp
│           ├── sanskars_chart.webp
│           ├── receipt_samarpan_nidhi.webp
│           ├── receipt_sadasyata_nidhi.webp
│           ├── official_letterhead.webp
│           ├── bms_labor_awareness_white.webp
│           └── bms_labor_awareness_yellow.webp
└── src/
    ├── main.jsx                 # React root renderer
    ├── App.jsx                  # Main application orchestrator
    ├── index.css                # Base Tailwind, Devanagari line-heights, print rules
    ├── context/
    │   └── LanguageContext.jsx  # Bilingual switcher, localStorage persistence, html lang
    ├── i18n/
    │   ├── en.json              # Complete English dictionary (No hardcoded strings)
    │   └── hi.json              # Complete, natural Hindi dictionary (शुद्ध पर सरल हिंदी)
    ├── components/
    │   ├── Navbar.jsx           # Sticky glassmorphic navbar with mobile language toggle
    │   ├── TrustLogo.jsx        # SVG scalable authentic sunburst & Om emblem
    │   ├── ReceiptGeneratorModal.jsx # Live print-ready receipt generator (Samarpan & Sadasyata)
    │   ├── ImageLightboxModal.jsx    # Fullscreen gallery image inspector
    │   └── FloatingWhatsApp.jsx # Direct WhatsApp messenger button (+91 9794590044)
    └── sections/
        ├── Hero.jsx             # Hero with mission, badges, and action buttons
        ├── About.jsx            # Vision, story, and leadership quotes
        ├── Sanskars.jsx         # 16 Vedic Sanskars categorized by life phase
        ├── Guidelines.jsx       # 12 Family Guidelines (हमारा आग्रह)
        ├── Programs.jsx         # 6 Service pillars & BOCW labor schemes
        ├── Impact.jsx           # Animated field metrics counters
        ├── Gallery.jsx          # Filterable photo grid with lightbox
        ├── Trustees.jsx         # Official team cards with direct calling links
        ├── HowYouCanHelp.jsx    # 4 Pathways of participation
        ├── Donate.jsx           # BOI account, UPI QR, 80G disclosure, receipt trigger
        ├── Transparency.jsx     # Institutional governance & audit cards
        ├── NewsEvents.jsx       # Ground camps and weekly study circles
        ├── Contact.jsx          # Dual office directory & WhatsApp inquiry form
        └── Footer.jsx           # Quick links, legal statement, and language switch
```

---

## 🌐 How to Edit Text & Content

All textual content is strictly stored in two dictionaries:
- English: `src/i18n/en.json`
- Hindi: `src/i18n/hi.json`

To modify any heading, phone number, address, or translation:
1. Open `src/i18n/en.json` and update the relevant key.
2. Open `src/i18n/hi.json` and update the matching key in respectful Hindi.
3. Save the file; changes reflect immediately via Vite hot module reloading.

---

## 📸 How to Add New Photos

1. Add your new image file into `public/images/gallery/` (e.g. `event_photo.jpg`).
2. Register the photo in `src/i18n/en.json` and `src/i18n/hi.json` under `"gallery": { "items": [ ... ] }`:
```json
{
  "src": "/images/gallery/event_photo.jpg",
  "title": "Annual Satsang & Sanskar Sabha",
  "caption": "Devotees gathering at Saket Nagar, Rustampur.",
  "category": "events"
}
```

---

## 🖨️ Interactive Digital Receipt Generator

In compliance with the founder's directive from the uploaded notes:
> *"लोग अपना विवरण स्वयं भरे और ट्रस्ट बैंक खाते मे ऑन लाईन अपनी सदस्यता शुल्क एवं समर्पण निधि भेज कर अपनी रसीद स्वयं प्राप्त कर लेवें... इस प्रकार की दो रसीद बन जाये ताकि लोग इसके अनुसार विवरण भरके स्वयं अपनी रसीद काट लेवें 🙏"*

The website provides an **Interactive Receipt Generator Modal**:
- Supports **सनातन संरक्षण - समर्पण निधि** (Voluntary Donation) and **सनातन संस्थान - सदस्यता निधि** (Annual Membership ₹200).
- Users select their membership category (A: Needy seeking support, B: Affluent providing financial aid, C: Volunteers raising awareness).
- Live preview matches the printed physical receipts from the uploaded photos (featuring the Bank of India account, India watermark map, receipt serial number, QR code, and General Secretary's endorsement).
- Click **"Print / Save as PDF"** to print or export the receipt.

---

## 🚢 How to Deploy

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```
The optimized static bundle will be generated in `/dist`.

### Deploying to Vercel
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Click **Deploy**.

### Deploying to Netlify
1. Drag and drop the `dist` folder into [Netlify Drop](https://app.netlify.com/drop), or connect your Git repository.
2. Build command: `npm run build`.
3. Publish directory: `dist`.

---

## 📝 Placeholders to Fill When Available

The prompt requires using ONLY facts from photos/notes without inventing numbers or registration IDs. The following placeholders are marked across the site:
1. `[ADD TRUST REGISTRATION NO.]` — Registration Number from Gorakhpur Sub-Registrar Office.
2. `[ADD BOI IFSC CODE - GORAKHPUR BRANCH]` — IFSC code of the Bank of India branch for A/C `135820110000012`.
3. `[ADD TRUST OFFICIAL EMAIL]` — Official organizational email address.
4. `[ADD 80G APPROVAL NO. WHEN ISSUED]` — Currently noted as "In Process" per founder notes.
5. `[ADD AUDIT REPORT DOWNLOAD LINK]` — Annual financial audit report PDF.
6. `[ADD VERIFIED FIELD METRIC]` — Exact count of families assisted through camps.