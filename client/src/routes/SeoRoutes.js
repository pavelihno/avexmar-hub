import React from 'react';
import StaticSchedulePage from '../components/seo/StaticSchedulePage';

const SeoRoutes = () => [
	{
		path: '/schedule/:originCode/:destCode',
		element: <StaticSchedulePage />,
	},
];

export default SeoRoutes;
