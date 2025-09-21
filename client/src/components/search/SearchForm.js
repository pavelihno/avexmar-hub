import React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DesktopSearchForm from './DesktopSearchForm';
import MobileSearchForm from './MobileSearchForm';

const SearchForm = ({ initialParams = {}, loadLocalStorage = false }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	return isMobile ? (
		<MobileSearchForm initialParams={initialParams} loadLocalStorage={loadLocalStorage} />
	) : (
		<DesktopSearchForm initialParams={initialParams} loadLocalStorage={loadLocalStorage} />
	);
};

export default SearchForm;
