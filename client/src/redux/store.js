import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { thunk } from 'redux-thunk';

import authReducer from './reducers/auth';
import airportReducer from './reducers/airport';
import airlineReducer from './reducers/airline';
import aircraftReducer from './reducers/aircraft';
import countryReducer from './reducers/country';
import routesReducer from './reducers/route';
import flightReducer from './reducers/flight';
import tariffsReducer from './reducers/tariff';
import flightTariffsReducer from './reducers/flightTariff';
import ticketsReducer from './reducers/ticket';
import discountReducer from './reducers/discount';
import feeReducer from './reducers/fee';
import userReducer from './reducers/user';
import bookingReducer from './reducers/booking';
import passengerReducer from './reducers/passenger';
import bookingPassengerReducer from './reducers/bookingPassenger';
import bookingFlightReducer from './reducers/bookingFlight';
import searchReducer from './reducers/search';
import timezoneReducer from './reducers/timezone';
import priceReducer from './reducers/price';
import bookingProcessReducer from './reducers/bookingProcess';
import paymentReducer from './reducers/payment';
import consentDocReducer from './reducers/consentDoc';
import consentEventReducer from './reducers/consentEvent';
import exportReducer from './reducers/export';
import bookingSearchReducer from './reducers/bookingSearch';
import carouselSlideReducer from './reducers/carouselSlide';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const middleware = [thunk];
const rootReducer = combineReducers({
	auth: authReducer,
	airports: airportReducer,
	airlines: airlineReducer,
	aircrafts: aircraftReducer,
	countries: countryReducer,
	routes: routesReducer,
	flights: flightReducer,
	tariffs: tariffsReducer,
	flightTariffs: flightTariffsReducer,
	tickets: ticketsReducer,
	discounts: discountReducer,
	fees: feeReducer,
	bookings: bookingReducer,
	passengers: passengerReducer,
	bookingPassengers: bookingPassengerReducer,
	bookingFlights: bookingFlightReducer,
	users: userReducer,
	timezones: timezoneReducer,
	search: searchReducer,
	bookingSearch: bookingSearchReducer,
	price: priceReducer,
	bookingProcess: bookingProcessReducer,
	payment: paymentReducer,
	consentDocs: consentDocReducer,
	consentEvents: consentEventReducer,
	exports: exportReducer,
	carouselSlides: carouselSlideReducer,
});

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(...middleware)));

export default store;
