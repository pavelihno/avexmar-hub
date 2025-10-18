import React from 'react';

import ConsentDocPage from './ConsentDocPage';
import { UI_LABELS } from '../constants/uiLabels';

const PDAgreement = () => <ConsentDocPage type='pd_agreement' title={UI_LABELS.ABOUT.pd_agreement} />;

export default PDAgreement;
