import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { AuthModalProvider } from './context/AuthModalContext';
import { ProfileModalProvider } from './context/ProfileModalContext';

import Home from './components/Home';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/profile/ProfileModal';

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
				<ProfileModalProvider>
					<Routes>
						<Route path='/' element={<Home />} />
					</Routes>
					<ProfileModal />
				</ProfileModalProvider>
				<AuthModal />
			</AuthModalProvider>
		</ThemeProvider>
	);
}

export default App;
