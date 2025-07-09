const components = {
	MuiCssBaseline: {
		styleOverrides: `
        /* PT Root UI font faces - all weights */
        @font-face {
          font-family: 'PTRootUI';
          src: 
            url('/fonts/PTRootUI-Regular.woff2') format('woff2'),
            url('/fonts/PTRootUI-Regular.woff') format('woff');
          font-weight: 400;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PTRootUI';
          src: 
            url('/fonts/PTRootUI-Medium.woff2') format('woff2'),
            url('/fonts/PTRootUI-Medium.woff') format('woff');
          font-weight: 500;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PTRootUI';
          src: 
            url('/fonts/PTRootUI-Bold.woff2') format('woff2'),
            url('/fonts/PTRootUI-Bold.woff') format('woff');
          font-weight: 600;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PTRootUI';
          src: 
            url('/fonts/PTRootUI-Bold.woff2') format('woff2'),
            url('/fonts/PTRootUI-Bold.woff') format('woff');
          font-weight: 700;
          font-display: swap;
        }
        
        /* Base styles */
        html {
          font-size: 16px;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'PTRootUI', sans-serif;
          font-weight: 400;
          color: #525665;
          background-color: #FFFFFF;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Utility classes */
        .mono-nums {
          font-variant-numeric: tabular-nums;
        }
        
        .max-text-width {
          max-width: 640px;
        }
        
        /* Responsive classes */
        @media (max-width: 768px) {
          .card-responsive {
            flex-direction: column;
          }
          
          .form-responsive {
            grid-template-columns: 1fr;
          }
        }
      `,
	},

	// Button styles
	MuiButton: {
		styleOverrides: {
			root: {
				borderRadius: '0.75rem', // radius-md
				padding: '12px 24px',
				transition: '150ms ease-in-out',
				textTransform: 'none',
				boxShadow: 'none',
				height: '48px',
			},
			contained: {
				'&:hover': {
					boxShadow: 'none',
				},
			},
			containedPrimary: {
				backgroundColor: '#0084FF', // blue
				'&:hover': {
					backgroundColor: '#0066CC', // blue
				},
			},
			containedSecondary: {
				backgroundColor: '#7D71FF', // violet
				'&:hover': {
					backgroundColor: '#5F55CC', // darker violet
				},
			},
			outlinedPrimary: {
				borderColor: '#0084FF', // blue
				'&:hover': {
					backgroundColor: 'rgba(0, 132, 255, 0.08)',
				},
			},
		},
	},

	// Card styles
	MuiCard: {
		styleOverrides: {
			root: {
				borderRadius: '0.75rem', // --radius-md
				boxShadow: '0 2px 6px rgba(0,0,0,.08)', // shadow-elev1
				padding: '16px',
				transition: '150ms ease-in-out',
			},
		},
	},

	// Text field styles
	MuiTextField: {
		styleOverrides: {
			root: {
				'& .MuiOutlinedInput-root': {
					height: '48px',
					borderRadius: '0.75rem', // radius-md
					'& fieldset': {
						borderColor: '#E0E0E0',
					},
					'&:hover fieldset': {
						borderColor: 'rgba(0, 132, 255, 0.4)',
					},
					'&.Mui-focused fieldset': {
						borderColor: '#0084FF',
					},
				},
				'& .MuiInputBase-input': {
					padding: '14px 16px',
				},
				'& .MuiInputLabel-root': {
					fontFamily: 'PTRootUI, sans-serif',
				},
				'& .MuiInputAdornment-root': {
					'& .MuiSvgIcon-root': {
						fontSize: '20px',
					},
				},
			},
		},
	},

	// Icon styles
	MuiSvgIcon: {
		styleOverrides: {
			root: {
				strokeWidth: 1.5,
				'&.active': {
					color: '#0084FF', // blue
				},
			},
		},
	},

	// Paper styles (for sections)
	MuiPaper: {
		styleOverrides: {
			root: {
				'&.section-bg': {
					backgroundColor: '#F3F4F8', // gray-100
					borderRadius: '0.75rem', // radius-md
				},
			},
		},
	},
};

export default components;
