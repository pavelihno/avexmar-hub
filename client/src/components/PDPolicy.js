import React from 'react';

import ConsentDocPage from './ConsentDocPage';
import { UI_LABELS } from '../constants';

const PDPolicy = () => <ConsentDocPage type='pd_policy' title={UI_LABELS.ABOUT.pd_policy} />;

export default PDPolicy;
