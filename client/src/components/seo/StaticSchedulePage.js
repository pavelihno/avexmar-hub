import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { serverApi } from '../../api';

const StaticSchedulePage = () => {
	const { originCode, destCode } = useParams();
	const [htmlContent, setHtmlContent] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchStaticPage = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await serverApi.get(`/seo/schedule/${originCode}/${destCode}`, {
					headers: {
						Accept: 'text/html',
					},
				});

				setHtmlContent(response.data);
			} catch (err) {
				console.error('Error fetching static schedule page:', err);
				setError(err.response?.status === 404 ? 'Route not found' : 'Failed to load page');
			} finally {
				setLoading(false);
			}
		};

		if (originCode && destCode) {
			fetchStaticPage();
		}
	}, [originCode, destCode]);

	if (loading) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
				<CircularProgress color='primary' size={60} />
			</Box>
		);
	}

	if (error) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
				<div>{error}</div>
			</Box>
		);
	}

	return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default StaticSchedulePage;
