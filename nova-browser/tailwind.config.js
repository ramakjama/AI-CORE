/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Light Palette
        'nova-white': '#ffffff',
        'nova-snow': '#fafafa',
        'nova-pearl': '#f5f5f5',
        'nova-silver': '#e8e8e8',
        'nova-platinum': '#d0d0d0',
        'nova-steel': '#a0a0a0',
        'nova-graphite': '#707070',
        'nova-charcoal': '#404040',
        'nova-dark': '#202020',
        'nova-black': '#000000',
        // Tech Accents
        'nova-tech': '#6366f1',
        'nova-cyber': '#06b6d4',
        'nova-success': '#00c853',
        'nova-warning': '#ff9100',
        'nova-danger': '#ff1744',
        'nova-info': '#00b0ff',
      },
      fontFamily: {
        sans: ['SF Pro Display', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Monaco', 'monospace'],
      },
      animation: {
        'pulse-tech': 'pulse-tech 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'data-flow': 'data-flow-anim 8s linear infinite',
        'scan': 'scan-line 4s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'tech': '0 4px 30px rgba(0, 0, 0, 0.08)',
        'tech-hover': '0 8px 40px rgba(0, 0, 0, 0.12)',
        'glow-tech': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-cyber': '0 0 20px rgba(6, 182, 212, 0.15)',
        'glow-success': '0 0 20px rgba(0, 200, 83, 0.2)',
        'glow-danger': '0 0 20px rgba(255, 23, 68, 0.2)',
      },
    },
  },
  plugins: [],
}
