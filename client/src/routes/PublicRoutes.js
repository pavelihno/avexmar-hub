import React from 'react';

import Home from '../components/Home';
import About from '../components/About';

const PublicRoutes = () => [
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
];

export default PublicRoutes;
