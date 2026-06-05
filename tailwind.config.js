/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#b026ff',
          blue: '#00f3ff',
          pink: '#ff00aa',
        },
        surface: {
          black: '#050508',
          dark: '#0a0a12',
          elevated: '#12121f',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(176, 38, 255, 0.4), 0 0 20px rgba(176, 38, 255, 0.2)'
          },
          '50%': { 
            boxShadow: '0 0 10px rgba(176, 38, 255, 0.6), 0 0 30px rgba(176, 38, 255, 0.3), 0 0 50px rgba(0, 243, 255, 0.1)'
          },
        },
      },
      boxShadow: {
        'neon': '0 0 5px rgba(176, 38, 255, 0.5), 0 0 20px rgba(176, 38, 255, 0.3)',
        'neon-blue': '0 0 5px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)',
        'neon-pink': '0 0 5px rgba(255, 0, 170, 0.5), 0 0 20px rgba(255, 0, 170, 0.3)',
      },
    },
  },
  plugins: [],
}