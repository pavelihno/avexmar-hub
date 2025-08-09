
const steps = ['Поиск', 'Пассажиры', 'Проверка', 'Оплата'];

const BookingProgress = () => {
	return (
		<Stepper activeStep={1} alternativeLabel sx={{ mb: 3 }}>
			{steps.map((label) => (
				<Step key={label}>
					<StepLabel>{label}</StepLabel>
				</Step>
			))}
		</Stepper>
	);
};

export default BookingProgress;