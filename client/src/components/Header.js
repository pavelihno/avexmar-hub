import React from 'react';
import { Link } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useAuthModal } from '../context/AuthModalContext';

const Header = () => {
	const { openLoginModal, openRegisterModal } = useAuthModal();

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
				<Box
					onClick={openLoginModal}
					sx={{
						cursor: 'pointer',
						textDecoration: 'none',
						color: 'inherit',
					}}
				>
					<Typography variant='body1'>Войти</Typography>
				</Box>
				<Box
					onClick={openRegisterModal}
					sx={{
						cursor: 'pointer',
						textDecoration: 'none',
						color: 'inherit',
					}}
				>
					<Typography variant='body1'>Зарегистрироваться</Typography>
				</Box>
			</Box>
		</Box>
	);
};

export default Header;
