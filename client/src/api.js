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

export const downloadTemplate = async (endpoint, filename) => {
	const res = await serverApi.get(`/${endpoint}/template`, {
		responseType: 'blob',
	});
	const url = window.URL.createObjectURL(new Blob([res.data]));
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
};

export const uploadFile = async (endpoint, file) => {
	const formData = new FormData();
	formData.append('file', file);
	const res = await serverApi.post(`/${endpoint}/upload`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return res.data;
};
