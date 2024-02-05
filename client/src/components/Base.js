import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';

import theme from '../theme';


const Base = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return (
        <ThemeProvider theme={theme}>
            <Container>
                {children}
            </Container>
        </ThemeProvider>
    );
};

export default Base;
