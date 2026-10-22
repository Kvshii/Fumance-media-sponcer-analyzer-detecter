/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#070A12',
          900: '#0C111D',
          850: '#111827',
          800: '#1F293D',
          700: '#334155',
        },
        brand: {
          indigo: '#6366F1',
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          emerald: '#10B981',
          crimson: '#F43F5E',
          ytRed: '#FF0000',
        },
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(12, 17, 29, 0.9) 100%)',
        'glow-gradient': 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)',
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.35)',
        'glow-red': '0 0 25px -5px rgba(244, 63, 94, 0.4)',
        'card-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 20px 0 rgba(99, 102, 241, 0.25)',
      }
    },
  },
  plugins: [],
}
