import Base from '../Base';
import BookingProgress from './BookingProgress';
import { UI_LABELS } from '../../constants';

const Confirmation = () => (
	<Base maxWidth='lg'>
		<BookingProgress activeStep={1} />
		<div>{UI_LABELS.BOOKING.step_placeholders.confirmation}</div>
	</Base>
);

export default Confirmation;
