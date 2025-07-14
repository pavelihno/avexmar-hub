import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { thunk } from 'redux-thunk';

import authReducer from './reducers/auth';
import airportReducer from './reducers/airport';
import routesReducer from './reducers/route';
import flightReducer from './reducers/flight';
import tariffsReducer from './reducers/tariff';
import ticketsReducer from './reducers/ticket';
import discountReducer from './reducers/discount';
import userReducer from './reducers/user';
import bookingReducer from './reducers/booking';
import passengerReducer from './reducers/passenger';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const middleware = [thunk];
const rootReducer = combineReducers({
	auth: authReducer,
	airports: airportReducer,
	routes: routesReducer,
	flights: flightReducer,
	tariffs: tariffsReducer,
	tickets: ticketsReducer,
	discounts: discountReducer,
	bookings: bookingReducer,
	passengers: passengerReducer,
	users: userReducer,
});

const store = createStore(
	rootReducer,
	composeEnhancers(applyMiddleware(...middleware))
);

export default store;
