import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
	FIELD_TYPES,
	createFormFields,
	disabledPassengerChange,
	formatDate,
	getTotalPassengers,
	handlePassengerChange,
	parseDate,
} from '../utils';
import { DATE_API_FORMAT, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';
import { fetchSearchAirports } from '../../redux/actions/search';

const seatClassOptions = getEnumOptions('SEAT_CLASS');
const STORAGE_KEY = 'lastSearchParams';

export default function useSearchForm({ initialParams = {}, loadLocalStorage = false } = {}) {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const { airports, airportsLoading } = useSelector((state) => state.search);

	let storedParams = {};
	if (loadLocalStorage) {
		try {
			storedParams = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
		} catch (e) {
			storedParams = {};
		}
	}

	const combinedParams = { ...storedParams, ...initialParams };

	const [formValues, setFormValues] = useState({
		from: combinedParams.from || '',
		to: combinedParams.to || '',
		departDate: parseDate(combinedParams.when),
		returnDate: parseDate(combinedParams.return),
		departFrom: parseDate(combinedParams.when_from),
		departTo: parseDate(combinedParams.when_to),
		returnFrom: parseDate(combinedParams.return_from),
		returnTo: parseDate(combinedParams.return_to),
	});
	const [passengers, setPassengers] = useState({
		adults: parseInt(combinedParams.adults) || 1,
		children: parseInt(combinedParams.children) || 0,
		infants: parseInt(combinedParams.infants) || 0,
		infants_seat: parseInt(combinedParams.infants_seat) || 0,
	});
	const [dateMode, setDateMode] = useState(combinedParams.date_mode || 'exact');
	const [seatClass, setSeatClass] = useState(combinedParams.class || seatClassOptions[0].value);
	const [showPassengers, setShowPassengers] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});

	const passengersRef = useRef(null);
	const departToRef = useRef(null);
	const returnFromRef = useRef(null);
	const returnToRef = useRef(null);
	const airportOptions = useMemo(
		() => airports.map((a) => ({ value: a.iata_code, label: `${a.city_name} (${a.iata_code})` })),
		[airports]
	);

	// Sync when initialParams change
	useEffect(() => {
		if (
			initialParams.from ||
			initialParams.to ||
			initialParams.date_mode ||
			initialParams.when ||
			initialParams.return ||
			initialParams.when_from ||
			initialParams.when_to ||
			initialParams.return_from ||
			initialParams.return_to
		) {
			setFormValues((prev) => ({
				...prev,
				from: initialParams.from || prev.from,
				to: initialParams.to || prev.to,
				dateMode: initialParams.date_mode || prev.dateMode,
				departDate: initialParams.when ? parseDate(initialParams.when) : prev.departDate,
				returnDate: initialParams.return ? parseDate(initialParams.return) : prev.returnDate,
				departFrom: initialParams.when_from ? parseDate(initialParams.when_from) : prev.departFrom,
				departTo: initialParams.when_to ? parseDate(initialParams.when_to) : prev.departTo,
				returnFrom: initialParams.return_from ? parseDate(initialParams.return_from) : prev.returnFrom,
				returnTo: initialParams.return_to ? parseDate(initialParams.return_to) : prev.returnTo,
			}));
		}
	}, [initialParams]);

	useEffect(() => {
		dispatch(fetchSearchAirports());
	}, [dispatch]);

	useEffect(() => {
		if (!airportOptions.length) return;
		const isFromValid = airportOptions.some((o) => o.value === formValues.from);
		const isToValid = airportOptions.some((o) => o.value === formValues.to);
		if (!isFromValid || !isToValid) {
			setFormValues((prev) => ({
				...prev,
				from: isFromValid ? prev.from : '',
				to: isToValid ? prev.to : '',
			}));
		}
	}, [airportOptions]);

	useEffect(() => {
		const handleClick = (e) => {
			if (passengersRef.current && !passengersRef.current.contains(e.target)) {
				setShowPassengers(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	useEffect(() => {
		if (!seatClassOptions.find((o) => o.value === seatClass)) {
			setSeatClass(seatClassOptions[0].value);
		}
	}, [seatClassOptions, seatClass]);

	const swapAirports = () => {
		setFormValues((prev) => ({ ...prev, from: prev.to, to: prev.from }));
	};

	const totalPassengers = getTotalPassengers(passengers);
	const passengerWord = UI_LABELS.SEARCH.form.passenger_word(totalPassengers);
	const seatClassLabel = seatClassOptions.find((o) => o.value === seatClass)?.label;

	const formFields = useMemo(() => {
		const fields = {
			from: { key: 'from', label: UI_LABELS.SEARCH.form.from, type: FIELD_TYPES.SELECT, options: airportOptions },
			to: { key: 'to', label: UI_LABELS.SEARCH.form.to, type: FIELD_TYPES.SELECT, options: airportOptions },
			departDate: { key: 'departDate', label: UI_LABELS.SEARCH.form.when, type: FIELD_TYPES.DATE },
			returnDate: { key: 'returnDate', label: UI_LABELS.SEARCH.form.return, type: FIELD_TYPES.DATE },
			departFrom: { key: 'departFrom', label: UI_LABELS.SEARCH.form.when_from, type: FIELD_TYPES.DATE },
			departTo: { key: 'departTo', label: UI_LABELS.SEARCH.form.when_to, type: FIELD_TYPES.DATE },
			returnFrom: { key: 'returnFrom', label: UI_LABELS.SEARCH.form.return_from, type: FIELD_TYPES.DATE },
			returnTo: { key: 'returnTo', label: UI_LABELS.SEARCH.form.return_to, type: FIELD_TYPES.DATE },
		};
		const arr = createFormFields(fields);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, [airportOptions]);

	const saveToLocalStorage = () => {
		const isExact = dateMode === 'exact';
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				from: formValues.from,
				to: formValues.to,
				date_mode: dateMode,
				when: isExact ? formatDate(formValues.departDate, DATE_API_FORMAT) : null,
				return: isExact ? formatDate(formValues.returnDate, DATE_API_FORMAT) : null,
				when_from: !isExact ? formatDate(formValues.departFrom, DATE_API_FORMAT) : null,
				when_to: !isExact ? formatDate(formValues.departTo, DATE_API_FORMAT) : null,
				return_from: !isExact ? formatDate(formValues.returnFrom, DATE_API_FORMAT) : null,
				return_to: !isExact ? formatDate(formValues.returnTo, DATE_API_FORMAT) : null,
				adults: passengers.adults,
				children: passengers.children,
				infants: passengers.infants,
				infants_seat: passengers.infants_seat,
				class: seatClass,
			})
		);
	};

	const validateForm = () => {
		const errors = {};
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (!formValues.from) errors.from = VALIDATION_MESSAGES.SEARCH.from.REQUIRED;
		if (!formValues.to) errors.to = VALIDATION_MESSAGES.SEARCH.to.REQUIRED;
		if (formValues.from && formValues.to && formValues.from === formValues.to) {
			errors.to = VALIDATION_MESSAGES.SEARCH.to.SAME_AIRPORT;
		}

		if (dateMode === 'exact') {
			if (!formValues.departDate) {
				errors.departDate = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			} else if (formValues.departDate < today) {
				errors.departDate = VALIDATION_MESSAGES.SEARCH.when.TODAY;
			}
			if (formValues.returnDate) {
				if (formValues.departDate && formValues.returnDate < formValues.departDate) {
					errors.returnDate = VALIDATION_MESSAGES.SEARCH.return.INVALID;
				} else if (formValues.returnDate < today) {
					errors.returnDate = VALIDATION_MESSAGES.SEARCH.return.TODAY;
				}
			}
		} else {
			const { departFrom, departTo, returnFrom, returnTo } = formValues;
			if (!departFrom) {
				errors.departFrom = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			} else if (departFrom < today) {
				errors.departFrom = VALIDATION_MESSAGES.SEARCH.when.TODAY;
			}
			if (!departTo) {
				errors.departTo = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			} else if (departTo < departFrom || departTo < today) {
				errors.departTo = VALIDATION_MESSAGES.SEARCH.return.INVALID;
			}
			if (returnFrom || returnTo) {
				if (!(returnFrom && returnTo)) {
					if (!returnFrom) errors.returnFrom = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
					if (!returnTo) errors.returnTo = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
				} else if (
					returnTo < returnFrom ||
					(departTo && returnFrom < departTo) ||
					returnFrom < today ||
					returnTo < today
				) {
					errors.returnFrom = VALIDATION_MESSAGES.SEARCH.return.INVALID;
				}
			}
		}
		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validateForm()) return;
		const params = new URLSearchParams();
		params.set('from', formValues.from);
		params.set('to', formValues.to);
		params.set('date_mode', dateMode);
		if (dateMode === 'exact') {
			params.set('when', formatDate(formValues.departDate, DATE_API_FORMAT));
			if (formValues.returnDate) params.set('return', formatDate(formValues.returnDate, DATE_API_FORMAT));
		} else {
			const { departFrom, departTo, returnFrom, returnTo } = formValues;
			params.set('when_from', formatDate(departFrom, DATE_API_FORMAT));
			params.set('when_to', formatDate(departTo, DATE_API_FORMAT));
			if (returnFrom && returnTo) {
				params.set('return_from', formatDate(returnFrom, DATE_API_FORMAT));
				params.set('return_to', formatDate(returnTo, DATE_API_FORMAT));
			}
		}
		params.set('adults', passengers.adults);
		params.set('children', passengers.children);
		params.set('infants', passengers.infants);
		params.set('infants_seat', passengers.infants_seat);
		params.set('class', seatClass);
		try {
			saveToLocalStorage();
		} catch (e) {
			console.error('Failed to save search params', e);
		}
		navigate(`/search?${params.toString()}`);
	};

	const isScheduleClickOpen = useMemo(
		() => !!formValues.from && !!formValues.to && formValues.from !== formValues.to,
		[formValues]
	);

	const onScheduleClick = () => {
		if (!isScheduleClickOpen) return;
		setValidationErrors({});
		const { from, to } = formValues;
		const params = new URLSearchParams();
		params.set('from', from);
		params.set('to', to);
		try {
			saveToLocalStorage();
		} catch (e) {
			console.error('Failed to save search params', e);
		}
		navigate(`/schedule?${params.toString()}`);
	};

	const fromValue = airportOptions.some((o) => o.value === formValues.from) ? formValues.from : '';
	const toValue = airportOptions.some((o) => o.value === formValues.to) ? formValues.to : '';

	return {
		// state
		formValues,
		setFormValues,
		passengers,
		setPassengers,
		dateMode,
		setDateMode,
		seatClass,
		setSeatClass,
		showPassengers,
		setShowPassengers,
		validationErrors,
		setValidationErrors,

		// refs
		passengersRef,
		departToRef,
		returnFromRef,
		returnToRef,

		// derived
		airportOptions,
		airportsLoading,
		seatClassOptions,
		totalPassengers,
		passengerWord,
		seatClassLabel,
		formFields,
		fromValue,
		toValue,
		isScheduleClickOpen,

		// actions
		handleSubmit,
		onScheduleClick,
		swapAirports,

		// helpers
		disabledPassengerChange,
		handlePassengerChange,
	};
}
