import { useEffect } from 'react';
import { useTimer } from 'react-timer-hook';

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
	const targetMs = toExpiryMs(expiresAt);
	const expiry = isFinite(targetMs) ? new Date(targetMs) : new Date();
	const { seconds, minutes, hours, restart } = useTimer({
		expiryTimestamp: expiry,
		autoStart: isFinite(targetMs),
	});
	useEffect(() => {
		if (isFinite(targetMs)) {
			restart(new Date(targetMs), true);
		}
	}, [targetMs, restart]);
	if (!isFinite(targetMs)) return '';
	return hours > 0
		? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
		: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
