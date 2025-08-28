import React from 'react';
import { Link } from 'react-router-dom';
import { Checkbox, FormControl, FormControlLabel, FormHelperText, Typography } from '@mui/material';
import { UI_LABELS } from '../../constants/uiLabels';

export const PrivacyConsentCheckbox = ({ value, onChange, error, required = true, sx, disabled = false }) => (
	<FormControl required={required} error={!!error} sx={sx} disabled={disabled}>
		<FormControlLabel
			control={<Checkbox checked={!!value} onChange={(e) => onChange?.(e.target.checked)} />}
			label={
				<Typography variant='subtitle2' color='textSecondary'>
					{UI_LABELS.BOOKING.buyer_form.privacy_policy((text) => (
						<Link to='/privacy_policy' target='_blank'>
							{text}
						</Link>
					))}
				</Typography>
			}
		/>
		{error ? <FormHelperText>{error}</FormHelperText> : null}
	</FormControl>
);

export default PrivacyConsentCheckbox;
