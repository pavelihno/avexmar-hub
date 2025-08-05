import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Base from '../Base';
import PassengerForm from './PassengerForm';
import { MAX_PASSENGERS, UI_LABELS } from '../../constants';

const Cart = () => {
	const [passengers, setPassengers] = useState([{ id: uuidv4(), type: 'ADULT' }]);

	const handlePassengerChange = (index, field, value, next) => {
		setPassengers((prev) => prev.map((p, i) => (i === index ? next : p)));
	};

	const handleAddPassenger = () => {
		setPassengers((prev) => [...prev, { id: uuidv4(), type: 'ADULT' }]);
	};

	const handleRemovePassenger = (index) => {
		setPassengers((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<Base maxWidth='md'>
			{passengers.map((p, idx) => (
				<PassengerForm
					key={p.id}
					passenger={p}
					onChange={(f, v, next) => handlePassengerChange(idx, f, v, next)}
					onRemove={passengers.length > 1 ? () => handleRemovePassenger(idx) : undefined}
				/>
			))}
			{passengers.length < MAX_PASSENGERS && (
				<Button variant='outlined' startIcon={<AddCircleIcon />} onClick={handleAddPassenger}>
					{UI_LABELS.BOOKING.passenger_form.add_passenger}
				</Button>
			)}
		</Base>
	);
};

export default Cart;
