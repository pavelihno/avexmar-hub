import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookingAccess } from '../redux/actions/bookingProcess';

const BookingRoute = ({ page, children }) => {
	const { publicId } = useParams();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const pages = useSelector((state) => state.bookingProcess.current?.accessiblePages);
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		dispatch(fetchBookingAccess(publicId))
			.unwrap()
			.catch(() => {
				navigate('/', { replace: true });
				setChecked(true);
			});
	}, [dispatch, publicId, navigate]);

	useEffect(() => {
		if (pages) {
			if (!pages.includes(page)) {
				const last = pages[pages.length - 1];
				if (last) {
					navigate(`/booking/${publicId}/${last}`, { replace: true });
				} else {
					navigate('/', { replace: true });
				}
			}
			setChecked(true);
		}
	}, [pages, page, navigate, publicId]);

	if (!checked) return null;

	return children;
};

export default BookingRoute;
