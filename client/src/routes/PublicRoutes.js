import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import ResetPasswordEntry from '../components/auth/ResetPasswordEntry';

const PublicRoutes = () => [
        { path: '/', element: <Home /> },
        { path: '/about', element: <About /> },
        { path: '/reset_password', element: <ResetPasswordEntry /> },
];

export default PublicRoutes;
