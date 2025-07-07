import { createTheme } from '@mui/material/styles';
import palette from './palette';
import typography from './typography';
import components from './components';

const theme = createTheme({
	palette,
	typography,
	components,
	shape: {
		borderRadius: 12, // radius-md (0.75rem)
	},
	spacing: 8,
	transitions: {
		duration: {
			shortest: 150,
			shorter: 150,
			short: 150,
			standard: 150,
		},
		easing: {
			easeInOut: 'ease-in-out',
		},
	},
	shadows: [
		'none',
		'0 2px 6px rgba(0,0,0,.08)', // shadow-elev1
	],
});

export default theme;
