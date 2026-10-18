/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: {
          DEFAULT: '#F1F5F2',
          muted: '#E2EEE8',
          light: '#F8FAF9',
          dark: '#F1F5F2',
        },
        slate: {
          charcoal: '#0F172A',
          deep: '#1E293B',
          muted: '#64748B',
          border: '#D8E2DC',
          subtle: '#E6ECE8',
          50: '#F8FAFC',
          100: '#F1F5F9',
        },
        teal: {
          brand: '#173F3A',
          hover: '#0F332F',
          subtle: '#E2EEE8',
          surface: '#D4E5DD',
        },
        amber: {
          marker: '#D97706',
          text: '#92400E',
          surface: '#FEF3C7',
          border: '#FCD34D',
        },
        burgundy: {
          marker: '#991B1B',
          text: '#7F1D1D',
          surface: '#FEE2E2',
          border: '#FCA5A5',
        },
      },
      fontFamily: {
        sans: [
          'Geist',
          '"Noto Sans Bengali"',
          '"Hind Siliguri"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Geist Mono"',
          '"Noto Sans Bengali"',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
        bengali: [
          '"Noto Sans Bengali"',
          '"Hind Siliguri"',
          'sans-serif',
        ],
      },
      borderRadius: {
        'xs': '3px',
        'sm': '5px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0,0,0,0.04)',
        'xs': '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'sm': '0 2px 6px 0 rgba(0,0,0,0.08), 0 1px 3px -1px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
