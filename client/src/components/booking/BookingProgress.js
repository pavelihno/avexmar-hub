import { Stepper, Step, StepLabel } from '@mui/material';
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

const StepIcon = ({ icon, active, completed }) => {
	const stepKey = stepKeys[icon - 1];
	const Icon = iconMap[stepKey];

	let color;
	if (completed) {
		color = 'success.main';
	} else if (active) {
		color = 'primary.main';
	} else {
		color = 'text.disabled';
	}

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
				return (
					<Step
						key={key}
						completed={isCompleted}
						onClick={() => handleClick(index)}
						sx={{
							cursor: index <= stepIndex ? 'pointer' : 'default',
							pointerEvents: index <= stepIndex ? 'auto' : 'none',
							'& .MuiStepLabel-label': {
								color: isActive ? 'primary.main' : isCompleted ? 'text.primary' : 'text.disabled',
								fontWeight: isActive ? 600 : 400,
							},
							'& .MuiStepLabel-labelContainer': { gap: 0.1 },
						}}
					>
						<StepLabel StepIconComponent={StepIcon}>{UI_LABELS.BOOKING.progress_steps[key]}</StepLabel>
					</Step>
				);
			})}
		</Stepper>
	);
};

export default BookingProgress;
