import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { thunk } from 'redux-thunk';

import authReducer from './reducers/auth';
import airportReducer from './reducers/airport';
import routesReducer from './reducers/route';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const middleware = [thunk];
const rootReducer = combineReducers({
	auth: authReducer,
	airports: airportReducer,
	routes: routesReducer,
});

const store = createStore(
	rootReducer,
	composeEnhancers(applyMiddleware(...middleware))
);

export default store;
