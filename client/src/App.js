import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

import theme from './theme';
import { auth } from './redux/actions/auth';

function App() {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(auth());
	}, [dispatch]);

	return (
		<ThemeProvider theme={theme}>
			<Routes>
				<Route path='/' element={<Home />} />
				<Route path='/login' element={<Login />} />
				<Route path='/register' element={<Register />} />
			</Routes>
		</ThemeProvider>
	);
}

export default App;
