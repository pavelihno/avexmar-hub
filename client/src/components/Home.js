import React from 'react';
import Box from '@mui/material/Box';
import Base from './Base';
import SearchForm from './search/SearchForm';

const Home = () => {
        return (
                <Base>
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <SearchForm />
                        </Box>
                </Base>
        );
};

export default Home;
