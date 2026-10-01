/** Tailwind CSS — configuração do front-end Angular (HU-02). */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f5f1',
        ink: '#221f1c',
        brand: {
          DEFAULT: '#2f4a3c',
          dark: '#263d31',
          soft: '#efeae1',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
