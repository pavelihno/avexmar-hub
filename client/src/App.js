import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { AuthModalProvider } from './context/AuthModalContext';

import Home from './components/Home';
import AuthModal from './components/auth/AuthModal';

import theme from './theme';
import { auth } from './redux/actions/auth';

function App() {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(auth());
	}, [dispatch]);

	return (
		<ThemeProvider theme={theme}>
			<AuthModalProvider>
				<Routes>
					<Route path='/' element={<Home />} />
				</Routes>
				<AuthModal />
			</AuthModalProvider>
		</ThemeProvider>
	);
}

export default App;
