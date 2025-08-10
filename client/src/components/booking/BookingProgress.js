import { Stepper, Step, StepLabel, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useParams } from 'react-router-dom';

import { UI_LABELS } from '../../constants';

const stepKeys = ['passengers', 'confirmation', 'payment', 'completion'];

const iconMap = {
	passengers: GroupIcon,
	confirmation: FactCheckIcon,
	payment: PaymentIcon,
	completion: CheckCircleIcon,
};

const StepIcon = ({ icon, color }) => {
	const stepKey = stepKeys[icon - 1];
	const Icon = iconMap[stepKey];
	return Icon ? <Icon sx={{ color, fontSize: 24 }} /> : null;
};

const BookingProgress = ({ activeStep }) => {
	const { publicId } = useParams();
	const navigate = useNavigate();

	const routes = [
		`/booking/${publicId}/passengers`,
		`/booking/${publicId}/confirmation`,
		`/booking/${publicId}/payment`,
		`/booking/${publicId}/completion`,
	];

	const stepIndex = typeof activeStep === 'string' ? stepKeys.indexOf(activeStep) : activeStep;

	const handleClick = (index) => {
		if (index <= stepIndex) navigate(routes[index]);
	};

	return (
		<Stepper activeStep={stepIndex} alternativeLabel sx={{ mt: 2, mb: 3 }}>
			{stepKeys.map((key, index) => {
				const isCompleted = index < stepIndex;
				const isActive = index === stepIndex;

				let iconColor;
				if (isCompleted) {
					iconColor = 'success.main';
				} else if (isActive) {
					iconColor = 'primary.main';
				} else {
					iconColor = 'text.disabled';
				}

				return (
					<Step
						key={key}
						completed={isCompleted}
						onClick={() => handleClick(index)}
						sx={{
							cursor: index <= stepIndex ? 'pointer' : 'default',
							pointerEvents: index <= stepIndex ? 'auto' : 'none',
						}}
					>
						<StepLabel StepIconComponent={(props) => <StepIcon {...props} color={iconColor} />}>
							<Typography variant='subtitle2' sx={{ color: iconColor, fontWeight: isActive ? 600 : 400 }}>
								{UI_LABELS.BOOKING.progress_steps[key]}
							</Typography>
						</StepLabel>
					</Step>
				);
			})}
		</Stepper>
	);
};

export default BookingProgress;
