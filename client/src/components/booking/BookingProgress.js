import { Stepper, Step, StepLabel } from '@mui/material';
import { UI_LABELS } from '../../constants';

const steps = UI_LABELS.BOOKING.progress_steps;

const BookingProgress = ({ activeStep }) => (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label) => (
            <Step key={label}>
                <StepLabel>{label}</StepLabel>
            </Step>
        ))}
    </Stepper>
);

export default BookingProgress;
