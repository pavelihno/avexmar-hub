import React from 'react';
import { Link } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Header = () => {
	return (
		<Box
			component='header'
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				py: 2,
				borderBottom: '1px solid #E0E0E0',
				mb: 3,
			}}
		>
			<Box
				component={Link}
				to='/'
				sx={{
					display: 'flex',
					alignItems: 'center',
				}}
			>
				<Box
					component='img'
					src='/images/logo/logo32.png'
					alt='Avexmar logo'
					sx={{ width: 32, height: 32, mr: 1 }}
				/>
				<Typography variant='h4' component='span'>
					АВЕКСМАР
				</Typography>
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<Link
					to='/login'
					style={{ textDecoration: 'none', color: 'inherit' }}
				>
					<Typography variant='body1'>Войти</Typography>
				</Link>
				<Link
					to='/register'
					style={{ textDecoration: 'none', color: 'inherit' }}
				>
					<Typography variant='body1'>Зарегистрироваться</Typography>
				</Link>
			</Box>
		</Box>
	);
};

export default Header;
