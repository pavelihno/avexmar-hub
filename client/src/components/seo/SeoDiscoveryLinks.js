import { useEffect, useMemo, useState } from 'react';
import { serverApi } from '../../api';
import { SEO } from '../../constants/uiLabels';

const hiddenStyles = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: 0,
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	border: 0,
};

const listStyles = {
	listStyle: 'none',
	padding: 0,
	margin: 0,
};

function SeoDiscoveryLinks() {
	const [routes, setRoutes] = useState([]);

	useEffect(() => {
		const controller = new AbortController();

		const loadRoutes = async () => {
			try {
				const response = await serverApi.get('/seo/static-routes');
				setRoutes(Array.isArray(response?.data?.routes) ? response.data.routes : []);
			} catch (error) {
				setRoutes([]);
			}
		};

		loadRoutes();

		return () => {
			controller.abort();
		};
	}, []);

	const links = useMemo(() => {
		if (!routes.length) {
			return [];
		}

		return routes
			.map((route) => {
				const originCity = route?.origin?.city || route?.origin?.code;
				const destinationCity = route?.destination?.city || route?.destination?.code;
				const schedulePath = route?.schedule_path;

				if (!schedulePath) {
					return null;
				}

				return {
					id: `schedule-${route.origin?.code}-${route.destination?.code}`,
					href: schedulePath,
					text: SEO.discovery_links.schedule_text(originCity, destinationCity),
				};
			})
			.filter(Boolean);
	}, [routes]);

	if (!links.length) {
		return null;
	}

	return (
		<nav aria-hidden='true' style={hiddenStyles}>
			<ul style={listStyles}>
				{links.map((link) => (
					<li key={link.id}>
						<a href={link.href}>{link.text}</a>
					</li>
				))}
			</ul>
		</nav>
	);
}

export default SeoDiscoveryLinks;
