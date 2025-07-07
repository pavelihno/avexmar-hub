import axios from 'axios';

/*
    Interaction with the server side
*/
export const serverUrl = `http://${process.env.REACT_APP_SERVER_URL}`;

export const serverApi = axios.create({
	baseURL: serverUrl,
	headers: {
		'Content-Type': 'application/json',
	},
});

serverApi.interceptors.request.use((config) => {
	const token = window.localStorage.getItem('token');
	if (token) {
		config.headers['Authorization'] = `Bearer ${token}`;
	}
	return config;
});

export const setAuthToken = (token) => {
	if (token) {
		window.localStorage.setItem('token', token);
	} else {
		window.localStorage.removeItem('token');
	}
};
