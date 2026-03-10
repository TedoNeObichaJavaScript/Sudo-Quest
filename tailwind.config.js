export default {
  content: [
    "./public*.{html,js}",
    "./src*.js"
  ],
  theme: {
    extend: {
      colors: {
        'terminal-green': '#00ff41',
        'terminal-dark': '#0a0e27',
        'terminal-darker': '#050811',
        'terminal-border': '#1a2332',
        'terminal-glow': '#00ff41',
      },
      fontFamily: {
        'mono': ['Courier New', 'Courier', 'monospace'],
      },
      boxShadow: {
        'terminal': '0 0 10px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1)',
        'terminal-glow': '0 0 20px rgba(0, 255, 65, 0.5)',
      },
      animation: {
        'blink': 'blink 1s infinite',
        'scanline': 'scanline 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px rgba(0, 255, 65, 0.5)' },
          '100%': { textShadow: '0 0 20px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}