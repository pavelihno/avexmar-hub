import { Stepper, Step, StepLabel } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useParams } from 'react-router-dom';

import { UI_LABELS } from '../../constants';

const icons = {
        1: <GroupIcon />, // Passengers
        2: <FactCheckIcon />, // Confirmation
        3: <PaymentIcon />, // Payment
        4: <CheckCircleIcon />, // Completion
};

const StepIcon = (props) => {
        const { icon } = props;
        return icons[icon];
};

const BookingProgress = ({ activeStep }) => {
        const { publicId } = useParams();
        const navigate = useNavigate();

        const steps = UI_LABELS.BOOKING.progress_steps;
        const routes = [
                `/booking/${publicId}/passengers`,
                `/booking/${publicId}/confirmation`,
                `/booking/${publicId}/payment`,
                `/booking/${publicId}/completion`,
        ];

        const handleClick = (index) => {
                if (index < activeStep) {
                        navigate(routes[index]);
                }
        };

        return (
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                        {steps.map((label, index) => (
                                <Step
                                        key={label}
                                        onClick={() => handleClick(index)}
                                        sx={{ cursor: index < activeStep ? 'pointer' : 'default' }}
                                >
                                        <StepLabel StepIconComponent={StepIcon}>{label}</StepLabel>
                                </Step>
                        ))}
                </Stepper>
        );
};

export default BookingProgress;
