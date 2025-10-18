import React from 'react';

import ConsentDocPage from './ConsentDocPage';
import { UI_LABELS } from '../constants';

const PublicOffer = () => <ConsentDocPage type='public_offer' title={UI_LABELS.ABOUT.public_offer} />;

export default PublicOffer;
