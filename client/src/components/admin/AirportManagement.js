import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
} from '@mui/material';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchAirports,
	createAirport,
	updateAirport,
	deleteAirport,
} from '../../redux/actions/airport';

const AirportManagement = () => {
	const dispatch = useDispatch();
	const { airports, isLoading, errors } = useSelector(
		(state) => state.airports
	);

	useEffect(() => {
		dispatch(fetchAirports());
	}, [dispatch]);

	const handleAddAirport = (airportData) => {
		const formattedData = {
			iata_code: airportData.iata_code,
			icao_code: airportData.icao_code,
			name: airportData.name,
			city_code: airportData.city,
			country_code: airportData.country,
		};

		dispatch(createAirport(formattedData));
	};

	const handleEditAirport = (airportData) => {
		const formattedData = {
			id: airportData.id,
			iata_code: airportData.iata_code,
			icao_code: airportData.icao_code,
			name: airportData.name,
			city_code: airportData.city,
			country_code: airportData.country,
		};

		dispatch(updateAirport(formattedData));
	};

	const handleDeleteAirport = (id) => {
		dispatch(deleteAirport(id));
	};

	const formattedAirports = airports.map((airport) => ({
		id: airport.id,
		iata_code: airport.iata_code,
		icao_code: airport.icao_code,
		name: airport.name,
		city: airport.city_code,
		country: airport.country_code,
	}));

	const columns = [
		{ field: 'name', header: 'Название аэропорта' },
		{ field: 'iata_code', header: 'Код IATA' },
		{ field: 'icao_code', header: 'Код ICAO' },
		{ field: 'city', header: 'Код города' },
		{ field: 'country', header: 'Код страны' },
	];

	const renderForm = ({ isEditing, currentItem, onClose, onSave }) => {
		const [formData, setFormData] = useState(
			isEditing
				? { ...currentItem }
				: {
						iata_code: '',
						icao_code: '',
						name: '',
						city: '',
						country: '',
				  }
		);

		const handleInputChange = (e) => {
			const { name, value } = e.target;
			setFormData({ ...formData, [name]: value });
		};

		const handleSubmit = () => {
			onSave(formData);
			onClose();
		};

		return (
			<>
				<DialogTitle>
					{isEditing ? 'Редактировать аэропорт' : 'Добавить аэропорт'}
				</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin='dense'
						name='iata_code'
						label='Код IATA'
						fullWidth
						value={formData.iata_code}
						onChange={handleInputChange}
					/>
					<TextField
						margin='dense'
						name='icao_code'
						label='Код ICAO'
						fullWidth
						value={formData.icao_code}
						onChange={handleInputChange}
					/>
					<TextField
						margin='dense'
						name='name'
						label='Название аэропорта'
						fullWidth
						value={formData.name}
						onChange={handleInputChange}
					/>
					<TextField
						margin='dense'
						name='city'
						label='Код города'
						fullWidth
						value={formData.city}
						onChange={handleInputChange}
					/>
					<TextField
						margin='dense'
						name='country'
						label='Код страны'
						fullWidth
						value={formData.country}
						onChange={handleInputChange}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>Отмена</Button>
					<Button onClick={handleSubmit}>Сохранить</Button>
				</DialogActions>
			</>
		);
	};

	return (
		<AdminDataTable
			title='Управление аэропортами'
			data={formattedAirports}
			columns={columns}
			onAdd={handleAddAirport}
			onEdit={handleEditAirport}
			onDelete={handleDeleteAirport}
			renderForm={renderForm}
			addButtonText='Добавить аэропорт'
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default AirportManagement;
