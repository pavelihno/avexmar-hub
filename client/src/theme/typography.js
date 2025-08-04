import palette from './palette';

const typography = {
	fontFamily: ['PTRootUI', 'Roboto', 'Arial', 'sans-serif'].join(','),
	fontSize: 16,
	fontWeightRegular: 400,
	fontWeightMedium: 500,
	fontWeightSemiBold: 600,
	fontWeightBold: 700,
	h1: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 700,
		fontSize: '2.5rem', // 40px
		lineHeight: 1.2,
                color: palette.indigo.main, // indigo
		marginBottom: '1rem',
	},
	h2: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 700,
		fontSize: '2rem', // 32px
		lineHeight: 1.25,
                color: palette.indigo.main, // indigo
		marginBottom: '0.75rem',
	},
	h3: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 600,
		fontSize: '1.5rem', // 24px
		lineHeight: 1.3,
                color: palette.indigo.main, // indigo
		marginBottom: '0.5rem',
	},
	h4: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 600,
		fontSize: '1.25rem', // 20px
		lineHeight: 1.4,
                color: palette.indigo.main, // indigo
		marginBottom: '0.5rem',
	},
	body1: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 400,
		fontSize: '1rem', // 16px
		lineHeight: 1.5,
                color: palette.text.primary, // gray-700
	},
	body2: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 400,
		fontSize: '0.875rem', // 14px
		lineHeight: 1.43,
                color: palette.text.primary, // gray-700
	},
	button: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 500,
		fontSize: '0.875rem', // 14px
		textTransform: 'none',
	},
	subtitle1: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 500,
		fontSize: '1rem', // 16px
		lineHeight: 1.5,
	},
	subtitle2: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 500,
		fontSize: '0.875rem', // 14px
		lineHeight: 1.57,
	},
	caption: {
		fontFamily: 'PTRootUI, sans-serif',
		fontWeight: 400,
		fontSize: '0.75rem', // 12px
		lineHeight: 1.66,
	},
};

export default typography;
