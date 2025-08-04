import { alpha } from '@mui/material/styles';
import palette from './palette';

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
          color: ${palette.text.primary};
          background-color: ${palette.background.default};
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
                                backgroundColor: palette.primary.main,
                                '&:hover': {
                                        backgroundColor: palette.primary.dark,
                                },
                        },
                        containedSecondary: {
                                backgroundColor: palette.secondary.main,
                                '&:hover': {
                                        backgroundColor: palette.secondary.dark,
                                },
                        },
                        outlinedPrimary: {
                                borderColor: palette.primary.main,
                                '&:hover': {
                                        backgroundColor: palette.action.hover,
                                },
                        },
                },
        },

	// Card styles
	MuiCard: {
		styleOverrides: {
			root: {
				borderRadius: '0.75rem', // --radius-md
                                boxShadow: `0 2px 6px ${alpha(palette.black, 0.08)}`, // shadow-elev1
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
					'&.MuiInputBase-multiline': {
						height: 'auto',
					},
					'& fieldset': {
                                                borderColor: palette.grey[300],
                                        },
                                        '&:hover fieldset': {
                                                borderColor: palette.action.focus,
                                        },
                                        '&.Mui-focused fieldset': {
                                                borderColor: palette.primary.main,
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
                                                color: palette.primary.main,
                                        },
			},
		},
	},

	// Paper styles (for sections)
	MuiPaper: {
		styleOverrides: {
			root: {
				'&.section-bg': {
                                        backgroundColor: palette.background.section, // gray-100
                                        borderRadius: '0.75rem', // radius-md
				},
			},
		},
	},
};

export default components;
