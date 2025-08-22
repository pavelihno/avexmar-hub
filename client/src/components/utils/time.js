import { useEffect, useState } from 'react';

export const toExpiryMs = (isoLike) => {
	if (!isoLike) return NaN;
	let s = String(isoLike).trim();
	// Trim fractional seconds to 3 digits (milliseconds)
	s = s.replace(/\.(\d{3})\d+$/, '.$1');
	// If there's no timezone info, assume UTC
	if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) s += 'Z';
	const t = Date.parse(s);
	return Number.isNaN(t) ? NaN : t;
};

export const useExpiryCountdown = (expiresAt) => {
	const [timeLeft, setTimeLeft] = useState('');
	useEffect(() => {
		const targetMs = toExpiryMs(expiresAt);
		if (!isFinite(targetMs)) {
			setTimeLeft('');
			return;
		}
		let timer = null;
		const render = () => {
			const now = Date.now();
			let diff = targetMs - now;
			if (diff <= 0) {
				setTimeLeft('00:00');
				return;
			}
			const hours = Math.floor(diff / 3600000);
			const minutes = hours > 0 ? Math.floor((diff % 3600000) / 60000) : Math.floor(diff / 60000);
			const seconds = Math.floor((diff % 60000) / 1000);
			const formatted =
				hours > 0
					? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
					: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
			setTimeLeft(formatted);
			const nextIn = 1000 - (now % 1000);
			timer = setTimeout(render, nextIn);
		};
		render();
		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [expiresAt]);
	return timeLeft;
};
