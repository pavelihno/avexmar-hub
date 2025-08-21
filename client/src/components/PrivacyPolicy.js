import React from 'react';

import ConsentDocPage from './ConsentDocPage';
import { UI_LABELS } from '../constants';

const PrivacyPolicy = () => <ConsentDocPage type='pd_policy' title={UI_LABELS.ABOUT.privacy_policy_agreement} />;

export default PrivacyPolicy;
