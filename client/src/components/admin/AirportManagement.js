import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TextField } from '@mui/material';

import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminEntityForm from '../../components/admin/AdminEntityForm';

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
        return dispatch(deleteAirport(id));
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

	const formFields = [
		{
			name: 'name',
			renderField: (props) => (
				<TextField
					label='Название аэропорта'
					value={props.value}
					onChange={(e) => props.onChange(e.target.value)}
					fullWidth={props.fullWidth}
				/>
			),
			fullWidth: true,
		},
		{
			name: 'iata_code',
			renderField: (props) => (
				<TextField
					label='Код IATA'
					value={props.value}
					onChange={(e) => props.onChange(e.target.value)}
					fullWidth={props.fullWidth}
				/>
			),
		},
		{
			name: 'icao_code',
			renderField: (props) => (
				<TextField
					label='Код ICAO'
					value={props.value}
					onChange={(e) => props.onChange(e.target.value)}
					fullWidth={props.fullWidth}
				/>
			),
		},
		{
			name: 'city',
			renderField: (props) => (
				<TextField
					label='Код города'
					value={props.value}
					onChange={(e) => props.onChange(e.target.value)}
					fullWidth={props.fullWidth}
				/>
			),
		},
		{
			name: 'country',
			renderField: (props) => (
				<TextField
					label='Код страны'
					value={props.value}
					onChange={(e) => props.onChange(e.target.value)}
					fullWidth={props.fullWidth}
				/>
			),
		},
	];

	const renderForm = ({ isEditing, currentItem, onClose, onSave }) => (
		<AdminEntityForm
			title='аэропорт'
			fields={formFields}
			initialData={currentItem}
			onSave={onSave}
			onClose={onClose}
			isEditing={isEditing}
		/>
	);

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
