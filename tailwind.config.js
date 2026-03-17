/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'tada-glow': 'tada 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 1em 0 rgba(74, 222, 128, 0.1)' },
          '50%': { boxShadow: '0 0 2em 0 rgba(74, 222, 128, 0.4)' },
        },
        'tada-glow': {
          '0%, 100%': { transform: 'scale3d(1, 1, 1)', boxShadow: '0 0 1em rgba(74, 222, 128, 0.2)' },
          '10%': { transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)' },
          '20%, 50%': { transform: 'scale3d(1.01, 1.01, 1.01) rotate3d(0, 0, 1, 3deg)', boxShadow: '0 0 2em rgba(74, 222, 128, 0.4)' },
          '30%': { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3.5deg)' },
          '40%': { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)' },
          '50%': { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)' },
          '70%': { transform: 'scale3d(1.05, 1.05, 1.05) rotate3d(0, 0, 1, -1deg)' },
          '100%': { transform: 'scale3d(1, 1, 1)' },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

