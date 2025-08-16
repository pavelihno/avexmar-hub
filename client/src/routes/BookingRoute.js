import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { BookingAccessContext } from '../context/BookingAccessContext';
import { fetchBookingAccess } from '../redux/actions/bookingProcess';

const BookingRoute = ({ page, children }) => {
	const { publicId } = useParams();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const accessiblePages = useSelector((state) => state.bookingProcess.current?.accessiblePages) || [];
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		dispatch(fetchBookingAccess(publicId))
			.unwrap()
			.catch(() => {
				navigate('/', { replace: true });
			})
			.finally(() => setChecked(true));
	}, [dispatch, publicId, navigate]);

	useEffect(() => {
		if (!checked) return; // дождёмся окончания первого эффекта
		if (accessiblePages.length === 0) {
			navigate('/', { replace: true });
			return;
		}

		if (!accessiblePages.includes(page)) {
			const last = accessiblePages[accessiblePages.length - 1];
			navigate(last ? `/booking/${publicId}/${last}` : '/', { replace: true });
			return;
		}
	}, [accessiblePages, page, navigate, publicId, checked]);

	if (!checked) return null;

	return <BookingAccessContext.Provider value={{ accessiblePages }}>{children}</BookingAccessContext.Provider>;
};

export default BookingRoute;
