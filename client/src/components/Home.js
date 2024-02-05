import React from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Base from './Base';


const Home = () => {
    const dispatch = useDispatch();

    return (<Base />);
};

export default Home;