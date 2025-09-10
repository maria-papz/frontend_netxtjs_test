import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		screens: {
  			portrait: {
  				raw: '(max-aspect-ratio: 1/1)'
  			},
  			halfLaptop: {
  				max: '1024px'
  			}
  		},
  		colors: {
  			primary: '#1D4ED8',
  			secondary: '#CF9031',
  			tertiary: '#879014'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			move: {
  				'0%': {
  					transform: 'translateX(-200px)'
  				},
  				'100%': {
  					transform: 'translateX(200px)'
  				}
  			},
  			sparkle: {
  				'0%, 100%': {
  					opacity: '0.75',
  					scale: '0.9'
  				},
  				'50%': {
  					opacity: '1',
  					scale: '1'
  				}
  			},
  			'spinner-leaf-fade': {
  				'0%, 100%': {
  					opacity: '0'
  				},
  				'50%': {
  					opacity: '1'
  				}
  			},
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
  		},
  		animation: {
        'gradient': 'gradient-shift 15s ease infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			move: 'move 5s linear infinite',
  			sparkle: 'sparkle 2s ease-in-out infinite',
  			'spinner-leaf-fade': 'spinner-leaf-fade 800ms linear infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
