import Base from '../Base';
import BookingProgress from './BookingProgress';
import { UI_LABELS } from '../../constants';

const Completion = () => (
	<Base maxWidth='lg'>
		<BookingProgress activeStep='completion' />
		<div>{UI_LABELS.BOOKING.step_placeholders.completion}</div>
	</Base>
);

export default Completion;
