import { set } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ruRU } from '@mui/x-date-pickers/locales';
import numeral from 'numeral';

export const dateLocale = ru;
export const datePickerLocaleText =
	ruRU.components.MuiLocalizationProvider.defaultProps.localeText;

export const DATE_FORMAT = 'dd.MM.yyyy';
export const DATE_API_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const TIME_MASK = '__:__';
export const DATETIME_FORMAT = 'dd.MM.yyyy HH:mm';
export const DATE_WEEKDAY_FORMAT = 'd MMM, EEEEEE';
export const DATE_YEAR_WEEKDAY_FORMAT = 'dd.MM.yyyy, EEEEEE';

export const TIME_DURATION_FORMAT = (hrs, mins) => `${hrs}ч ${mins}м`;

export const DEFAULT_TIME = set(new Date(), { hours: 0, minutes: 0 });

numeral.register('locale', 'ru', {
	delimiters: {
		thousands: '\u00A0',
		decimal: ',',
	},
});

numeral.locale('ru');

export const DEFAULT_NUMBER_FORMAT = '0,0[.]00';

export const DEFAULT_PHONE_NUMBER = '+7 (XXX) XXX-XX-XX';
export const DEFAULT_EMAIL = 'ivanov.ivan@example.com';

export const MAX_PASSENGERS = 9;
