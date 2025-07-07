// Framer motion animations as specified in the style guide
export const pageTransition = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 8 },
	transition: {
		duration: 0.15,
		ease: [0.4, 0, 0.2, 1],
	},
};

export const hoverTransition = {
	duration: 0.15,
	ease: [0.4, 0, 0.2, 1],
};

export const focusTransition = {
	duration: 0.15,
	ease: [0.4, 0, 0.2, 1],
};

// For interactive elements
export const buttonHover = {
	scale: 1.02,
	transition: hoverTransition,
};

export const buttonTap = {
	scale: 0.98,
	transition: { duration: 0.1 },
};
