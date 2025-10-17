import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { BookingAccessContext } from '../context/BookingAccessContext';
import { fetchBookingAccess } from '../redux/actions/bookingProcess';

const BookingRoute = ({ page, children }) => {
	const { publicId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const accessiblePages = useSelector((state) => state.bookingProcess.current?.accessiblePages) || [];
	const [checked, setChecked] = useState(false);

	const accessToken = useMemo(() => new URLSearchParams(location.search).get('access_token'), [location.search]);

	useEffect(() => {
		dispatch(fetchBookingAccess({ publicId, accessToken }))
			.unwrap()
			.catch(() => {
				navigate('/', { replace: true });
			})
			.finally(() => setChecked(true));
	}, [dispatch, publicId, accessToken, navigate]);

	useEffect(() => {
		if (!checked) return;
		if (accessiblePages.length === 0) {
			navigate('/', { replace: true });
			return;
		}

		if (!accessiblePages.includes(page)) {
			const last = accessiblePages[accessiblePages.length - 1];
			const query = accessToken ? `?access_token=${accessToken}` : '';
			navigate(last ? `/booking/${publicId}/${last}${query}` : '/', { replace: true });
			return;
		}
	}, [accessiblePages, page, navigate, publicId, checked, accessToken]);

	if (!checked) return null;

	return <BookingAccessContext.Provider value={{ accessiblePages }}>{children}</BookingAccessContext.Provider>;
};

export default BookingRoute;
