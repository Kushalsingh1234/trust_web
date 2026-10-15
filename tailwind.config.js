/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // User's Exact Color Theme Palette
        primary: {
          DEFAULT: '#E87516',       // Saffron Orange
          hover: '#C65D13',
          dark: '#C65D13',          // Deep Saffron
          darker: '#A94E0E',
          light: '#F49B49',
          surface: '#FFF8EF'
        },
        secondary: {
          DEFAULT: '#C65D13',       // Deep Saffron
          hover: '#A94E0E',
          dark: '#8C3F0A',
          light: '#E87516'
        },
        accent: {
          DEFAULT: '#E9B44C',       // Golden Yellow
          hover: '#DDA032',
          light: '#F8DC99',
          dark: '#C8932C'
        },
        heading: {
          DEFAULT: '#382719',       // Deep Brown
          dark: '#241911'
        },
        charcoal: {
          DEFAULT: '#454545',       // Charcoal Body Text
          muted: '#666666',
          light: '#888888'
        },
        body: '#454545',
        ivory: {
          DEFAULT: '#FFF8EF',       // Warm Ivory (Soft Background)
          warm: '#FFF8EF',
          soft: '#FDF4E5',
          border: '#FDE3BA'
        },
        softbg: '#FFF8EF',
        purewhite: '#FFFFFF',
        footer: {
          DEFAULT: '#302319',       // Dark Brown
          dark: '#241911',
          surface: '#3F2F23'
        },
        trust: {
          green: '#15803D',
          badge: '#DCFCE7',
          dark: '#166534'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
        'hindi-body': ['"Noto Sans Devanagari"', 'sans-serif'],
        'hindi-heading': ['"Tiro Devanagari Hindi"', '"Noto Serif Devanagari"', 'serif'],
      },
      lineHeight: {
        'hindi': '1.75',
        'hindi-loose': '1.85'
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(232, 117, 22, 0.08)',
        'card': '0 8px 30px -4px rgba(56, 39, 25, 0.06)',
        'card-hover': '0 16px 36px -6px rgba(232, 117, 22, 0.16)',
        'lift': '0 20px 35px -5px rgba(56, 39, 25, 0.12)',
        'saffron': '0 8px 25px -3px rgba(232, 117, 22, 0.38)',
        'saffron-glow': '0 10px 30px -3px rgba(232, 117, 22, 0.48)',
        'deep-saffron': '0 8px 25px -3px rgba(198, 93, 19, 0.35)',
        'accent-glow': '0 8px 25px -3px rgba(233, 180, 76, 0.4)'
      },
      borderRadius: {
        'card': '1.25rem', // 20px
        'pill': '9999px'
      }
    },
  },
  plugins: [],
}
