import React, { useState } from 'react';
import {
	Typography,
	Grid,
	Box,
	Container,
	Paper,
	Link,
	Avatar,
	IconButton,
	Tooltip,
	Snackbar,
} from '@mui/material';
import {
	LocationOn,
	Phone,
	Email,
	ArrowForward,
	ContentCopy,
} from '@mui/icons-material';
import Base from './Base';

const About = () => {
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');

	const cardsData = [
		{
			icon: 'images/icons/business.svg',
			alt: 'партнеры',
			title: 'Широкий спектр клиентов и партнёров в сфере воздушных перевозок',
			content:
				'Компания «АВЕКСМАР» является надежным партнером для старательских артелей, предприятий и организаций, таких как ОАО «Полиметалл», Морской порт Певек, ООО «Инкомнефтеремонт», ООО «Уранцветмет», ООО «Атомредметзолото», а также предприятий, связанных с ПАТЭС, обслуживаемых компаниями ООО «Запсибгидрострой», ООО «Ленмонтаж», ООО «Гидропромстрой», ООО «Плавстройотряд-34» и Нововоронежской АЭС',
		},
		{
			icon: 'images/icons/history.svg',
			alt: 'история',
			title: 'Опытная компания с богатой историей',
			content:
				'Коллектив ООО «АВЕКСМАР» занимается организацией пассажирских и грузовых авиаперевозок с 1995 года. Компания имеет многолетний опыт организации воздушных перевозок пассажиров, проживающих или работающих на территории Чукотского автономного округа',
		},
		{
			icon: 'images/icons/airplane.svg',
			alt: 'авиакомпании',
			title: 'Долгосрочное сотрудничество с ведущими авиакомпаниями',
			content:
				'Организация сотрудничала с такими авиакомпаниями, как «Внуковские авиалинии», «Красноярские авиалинии», «Авиаэнерго», «Кавминводыавиа», «Трансаэро», «ЮТэйр». С апреля 2017 года ООО «АВЕКСМАР» организует регулярные рейсы по маршруту Москва-Якутск-Певек-Якутск-Москва с авиакомпанией «Якутия». За это время было выполнено более 500 рейсов и перевезено более 55 000 пассажиров',
		},
	];

	const contactInfo = {
		address: process.env.REACT_APP_ADDRESS,
		phone: process.env.REACT_APP_CONTACT_PHONE,
		email: process.env.REACT_APP_CONTACT_EMAIL,
	};

	const companyName = process.env.REACT_APP_COMPANY_NAME;
	const foundingYear = process.env.REACT_APP_COMPANY_YEAR;

	const handleCopy = (text, type) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setSnackbarMessage(`${type} скопирован`);
				setSnackbarOpen(true);
			})
			.catch((err) => {
				console.error('Ошибка при копировании: ', err);
			});
	};

	const handleCloseSnackbar = () => {
		setSnackbarOpen(false);
	};

	return (
		<Base>
			<Container maxWidth='lg' sx={{ py: 4 }}>
				<Box mb={4} textAlign='center'>
					<Typography variant='h4' component='h1' gutterBottom>
						{companyName}
					</Typography>
					<Typography variant='subtitle1' color='text.secondary'>
						Надежный партнер в сфере организации пассажирских и
						грузовых авиаперевозок с {foundingYear} года
					</Typography>
				</Box>

				<Box mb={5}>
					{cardsData.map((card, index) => (
						<Paper
							key={index}
							elevation={1}
							sx={{
								mb: 2,
								overflow: 'hidden',
								transition: 'all 0.2s',
								'&:hover': { boxShadow: 3 },
							}}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Box
									sx={{
										p: 2,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										minWidth: { xs: 70, sm: 100 },
									}}
								>
									<Avatar
										src={card.icon}
										alt={card.alt}
										sx={{
											width: { xs: 40, sm: 60 },
											height: { xs: 40, sm: 60 },
											p: 1,
										}}
									/>
								</Box>
								<Box sx={{ p: 2, flexGrow: 1 }}>
									<Typography
										variant='h6'
										component='h3'
										gutterBottom
										sx={{
											fontWeight: 'medium',
											fontSize: {
												xs: '1rem',
												sm: '1.25rem',
											},
										}}
									>
										{card.title}
									</Typography>
									<Typography
										variant='body2'
										color='text.secondary'
										sx={{ overflow: 'hidden' }}
									>
										{card.content}
									</Typography>
								</Box>
							</Box>
						</Paper>
					))}
				</Box>

				<Box mb={4}>
					<Typography variant='h4' component='h2' gutterBottom>
						Контактная информация
					</Typography>
					<Paper elevation={1} sx={{ p: 2 }}>
						<Grid container alignItems='center'>
							<Grid
								item
								xs={12}
								md={4}
								sx={{
									display: 'flex',
									alignItems: 'center',
									py: 1,
								}}
							>
								<LocationOn color='primary' sx={{ mr: 2 }} />
								<Box sx={{ flexGrow: 1 }}>
									<Typography
										variant='subtitle2'
										color='text.secondary'
									>
										Адрес
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
										}}
									>
										<Typography
											variant='body2'
											sx={{ mr: 1 }}
										>
											{contactInfo.address}
										</Typography>
										<Tooltip title='Копировать'>
											<IconButton
												size='small'
												onClick={() =>
													handleCopy(
														contactInfo.address,
														'Адрес'
													)
												}
												aria-label='копировать адрес'
											>
												<ContentCopy
													fontSize='small'
													sx={{
														color: 'text.secondary',
													}}
												/>
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							</Grid>
							<Grid
								item
								xs={12}
								md={4}
								sx={{
									display: 'flex',
									alignItems: 'center',
									py: 1,
								}}
							>
								<Phone color='primary' sx={{ mr: 2 }} />
								<Box sx={{ flexGrow: 1 }}>
									<Typography
										variant='subtitle2'
										color='text.secondary'
									>
										Телефон
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
										}}
									>
										<Link
											href={`tel:${contactInfo.phone}`}
											variant='body2'
											sx={{
												mr: 1,
												textDecoration: 'none',
												color: 'text.primary',
												'&:hover': {
													textDecoration: 'underline',
													color: 'primary.main',
												},
											}}
										>
											{contactInfo.phone}
										</Link>
										<Tooltip title='Копировать'>
											<IconButton
												size='small'
												onClick={() =>
													handleCopy(
														contactInfo.phone,
														'Телефон'
													)
												}
												aria-label='копировать телефон'
											>
												<ContentCopy
													fontSize='small'
													sx={{
														color: 'text.secondary',
													}}
												/>
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							</Grid>
							<Grid
								item
								xs={12}
								md={4}
								sx={{
									display: 'flex',
									alignItems: 'center',
									py: 1,
								}}
							>
								<Email color='primary' sx={{ mr: 2 }} />
								<Box sx={{ flexGrow: 1 }}>
									<Typography
										variant='subtitle2'
										color='text.secondary'
									>
										Электронная почта
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
										}}
									>
										<Link
											href={`mailto:${contactInfo.email}`}
											variant='body2'
											sx={{
												mr: 1,
												textDecoration: 'none',
												color: 'text.primary',
												'&:hover': {
													textDecoration: 'underline',
													color: 'primary.main',
												},
											}}
										>
											{contactInfo.email}
										</Link>
										<Tooltip title='Копировать'>
											<IconButton
												size='small'
												onClick={() =>
													handleCopy(
														contactInfo.email,
														'Адрес электронной почты'
													)
												}
												aria-label='копировать адрес электронной почты'
											>
												<ContentCopy
													fontSize='small'
													sx={{
														color: 'text.secondary',
													}}
												/>
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							</Grid>
						</Grid>
					</Paper>
				</Box>

				<Box mb={4}>
					<Typography variant='h4' component='h2' gutterBottom>
						Правовая информация
					</Typography>
					<Paper elevation={1} sx={{ p: 2 }}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<Box
									component={Link}
									href='/privacy_policy'
									sx={{
										display: 'flex',
										alignItems: 'center',
										p: 1,
										borderRadius: 1,
										bgcolor: 'action.hover',
										textDecoration: 'none',
										color: 'text.primary',
										'&:hover': {
											bgcolor: 'action.selected',
										},
									}}
								>
									<ArrowForward
										fontSize='small'
										sx={{ mr: 1 }}
									/>
									<Typography variant='body2'>
										Согласие на обработку персональных
										данных
									</Typography>
								</Box>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Box
									component={Link}
									href='/marketing_consent'
									sx={{
										display: 'flex',
										alignItems: 'center',
										p: 1,
										borderRadius: 1,
										bgcolor: 'action.hover',
										textDecoration: 'none',
										color: 'text.primary',
										'&:hover': {
											bgcolor: 'action.selected',
										},
									}}
								>
									<ArrowForward
										fontSize='small'
										sx={{ mr: 1 }}
									/>
									<Typography variant='body2'>
										Согласие на получение рекламной рассылки
									</Typography>
								</Box>
							</Grid>
						</Grid>
					</Paper>
				</Box>

				<Snackbar
					open={snackbarOpen}
					autoHideDuration={2000}
					onClose={handleCloseSnackbar}
					message={snackbarMessage}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				/>
			</Container>
		</Base>
	);
};

export default About;
