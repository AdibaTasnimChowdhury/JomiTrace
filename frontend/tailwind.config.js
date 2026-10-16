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
          DEFAULT: '#F7F5EF',
          muted: '#EFECE2',
          light: '#FBF9F5',
        },
        slate: {
          charcoal: '#0F172A',
          deep: '#1E293B',
          muted: '#64748B',
          border: '#CBD5E1',
          subtle: '#E2E8F0',
        },
        teal: {
          brand: '#245E58',
          hover: '#1D4B46',
          subtle: '#E6F0EE',
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
    },
  },
  plugins: [],
};
