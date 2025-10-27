import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRoutes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';

import { AuthModalProvider } from './context/AuthModalContext';

import AuthModal from './components/auth/AuthModal';

import AdminRoutes from './routes/AdminRoutes';
import PublicRoutes from './routes/PublicRoutes';
import SeoRoutes from './routes/SeoRoutes';

import { selectIsAuth } from './redux/reducers/auth';
import { auth } from './redux/actions/auth';
import theme from './theme';
import SeoDiscoveryLinks from './components/seo/SeoDiscoveryLinks';

function App() {
	const dispatch = useDispatch();
	const [isLoading, setIsLoading] = useState(true);

	const isAuth = useSelector(selectIsAuth);
	const currentUser = useSelector((state) => state.auth.currentUser);

	useEffect(() => {
		const initAuth = async () => {
			await dispatch(auth());
			setIsLoading(false);
		};

		initAuth();
	}, [dispatch]);

	const routes = [...PublicRoutes({ isAuth }), ...AdminRoutes({ currentUser }), ...SeoRoutes()];
	const routing = useRoutes(routes);

	// Show loading indicator while authenticating
	if (isLoading) {
		return (
			<ThemeProvider theme={theme}>
				<Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
					<CircularProgress color='primary' size={60} />
				</Box>
			</ThemeProvider>
		);
	}

	return (
		<ThemeProvider theme={theme}>
			<SeoDiscoveryLinks />
			<AuthModalProvider>
				{routing}
				<AuthModal />
			</AuthModalProvider>
		</ThemeProvider>
	);
}

export default App;
