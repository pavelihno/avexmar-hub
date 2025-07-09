import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
} from '../../redux/actions/route';
import { fetchAirports } from '../../redux/actions/airport';
import { FIELD_TYPES, createAdminManager } from './utils';

const RouteManagement = () => {
    const dispatch = useDispatch();
    const { routes, isLoading, errors } = useSelector((state) => state.routes);
    const { airports, isLoading: airportsLoading } = useSelector(
        (state) => state.airports
    );

    useEffect(() => {
        dispatch(fetchRoutes());
        dispatch(fetchAirports());
    }, [dispatch]);

    const getAirportOptions = () => {
        if (!airports || !Array.isArray(airports)) {
            return [];
        }
        return airports.map((airport) => ({
            value: airport.id,
            label: `${airport.name} (${airport.iata_code}) - ${airport.city_code}`,
        }));
    };

    const getAirportById = (id) => {
        if (!airports || !Array.isArray(airports)) {
            return null;
        }
        return airports.find((airport) => airport.id === id);
    };

    const airportOptions = useMemo(() => getAirportOptions(), [airports]);

    const FIELDS = {
        id: { key: 'id', apiKey: 'id' },
        flightNumber: {
            key: 'flightNumber',
            apiKey: 'flight_number',
            label: 'Номер рейса',
            type: FIELD_TYPES.TEXT,
            fullWidth: true,
            validate: (value) => (!value ? 'Номер рейса обязателен' : null),
        },
        originAirportId: {
            key: 'originAirportId',
            apiKey: 'origin_airport_id',
            label: 'Аэропорт отправления',
            type: FIELD_TYPES.SELECT,
            options: airportOptions,
            formatter: (value) => {
                const airport = getAirportById(value);
                return airport ? `${airport.iata_code}` : value;
            },
            validate: (value) =>
                !value ? 'Аэропорт отправления обязателен' : null,
        },
        destinationAirportId: {
            key: 'destinationAirportId',
            apiKey: 'destination_airport_id',
            label: 'Аэропорт прибытия',
            type: FIELD_TYPES.SELECT,
            options: airportOptions,
            formatter: (value) => {
                const airport = getAirportById(value);
                return airport ? `${airport.iata_code}` : value;
            },
            validate: (value) =>
                !value ? 'Аэропорт прибытия обязателен' : null,
        },
    };

    const adminManager = useMemo(
        () =>
            createAdminManager(FIELDS, {
                entityTitle: 'маршрут',
                renderOverrides: {
                    originAirportId: (item) => {
                        const airport = getAirportById(item.originAirportId);
                        return airport
                            ? `${airport.name} (${airport.iata_code})`
                            : '';
                    },
                    destinationAirportId: (item) => {
                        const airport = getAirportById(
                            item.destinationAirportId
                        );
                        return airport
                            ? `${airport.name} (${airport.iata_code})`
                            : '';
                    },
                },
            }),
        [FIELDS, getAirportById]
    );

    const handleAddRoute = (routeData) => {
        dispatch(createRoute(adminManager.toApiFormat(routeData)));
    };

    const handleEditRoute = (routeData) => {
        dispatch(updateRoute(adminManager.toApiFormat(routeData)));
    };

    const handleDeleteRoute = (id) => {
        return dispatch(deleteRoute(id));
    };

    const formattedRoutes = routes.map(adminManager.toUiFormat);

    return (
        <AdminDataTable
            title='Управление маршрутами'
            data={formattedRoutes}
            columns={adminManager.columns}
            onAdd={handleAddRoute}
            onEdit={handleEditRoute}
            onDelete={handleDeleteRoute}
            renderForm={adminManager.renderForm}
            addButtonText='Добавить маршрут'
            isLoading={isLoading || airportsLoading}
            error={errors}
        />
    );
};

export default RouteManagement;
