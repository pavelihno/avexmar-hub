import { createAsyncThunk } from '@reduxjs/toolkit';

import { serverApi, setAuthToken } from '../../api';
import { getErrorData } from '../utils';
import { setCurrentUser } from '../reducers/auth';

export const register = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
	try {
			const res = await serverApi.post('/register', { ...formData, email: formData.email.toLowerCase() });
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const activateAccount = createAsyncThunk('auth/activateAccount', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/activate', data);
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const login = createAsyncThunk('auth/login', async (formData, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/login', { ...formData, email: formData.email.toLowerCase() });
		const { token, user } = res.data;
		if (token) {
			setAuthToken(token);
			return user;
		}
		return rejectWithValue(res.data);
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const setupTwoFactor = createAsyncThunk('auth/setupTwoFactor', async (email, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/setup_2fa', { email: email.toLowerCase() });
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const verifyTwoFactor = createAsyncThunk('auth/verifyTwoFactor', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/verify_2fa', { ...data, email: data.email.toLowerCase() });
		const { token, user } = res.data;
		setAuthToken(token);
		return user;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const logout = createAsyncThunk('auth/logout', () => {
	setAuthToken(false);
	return null;
});

export const auth = createAsyncThunk('auth/verify', async (_, { rejectWithValue }) => {
	try {
		const res = await serverApi.get('/auth');
		return res.data;
	} catch (err) {
		setAuthToken(false);
		return rejectWithValue(getErrorData(err));
	}
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/forgot_password', data);
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/reset_password', data);
		const { token, user } = res.data;
		setAuthToken(token);
		return user;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});
