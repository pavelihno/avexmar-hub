import axios from 'axios';

export const serverApi = axios.create({
	baseURL: `http://${process.env.REACT_APP_SERVER_URL}`,
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
	window.URL.revokeObjectURL(url);
};

export const downloadData = async (endpoint, filename) => {
	const res = await serverApi.get(`/${endpoint}/download`, {
		responseType: 'blob',
	});
	const url = window.URL.createObjectURL(new Blob([res.data]));
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
};

export const uploadFile = async (endpoint, file) => {
	const formData = new FormData();
	formData.append('file', file);

	try {
		const res = await serverApi.post(`/${endpoint}/upload`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
			responseType: 'blob',
		});

		const contentType = res.headers['content-type'];

		if (contentType && contentType.includes('application/json')) {
			const text = await res.data.text();
			return { message: JSON.parse(text).message };
		}

		return { errorFile: res.data };
	} catch (error) {
		let message = error.message;

		if (error.response?.data) {
			try {
				const text = await error.response.data.text();
				try {
					message = JSON.parse(text).message;
				} catch {
					message = text;
				}
			} catch {}
		}

		throw new Error(message);
	}
};
