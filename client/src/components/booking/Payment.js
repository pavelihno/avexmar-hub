import Base from '../Base';
import BookingProgress from './BookingProgress';
import { UI_LABELS } from '../../constants';

const Payment = () => (
    <Base maxWidth='lg'>
        <BookingProgress activeStep='payment' />
        <div>{UI_LABELS.BOOKING.step_placeholders.payment}</div>
    </Base>
);

export default Payment;
