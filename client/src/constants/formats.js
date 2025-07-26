import { set } from 'date-fns';
import { ru } from 'date-fns/locale';

export const dateLocale = ru;

export const DATE_FORMAT = 'dd.MM.yyyy';
export const TIME_FORMAT = 'HH:mm';
export const TIME_MASK = '__:__';
export const DATETIME_FORMAT = 'dd.MM.yyyy HH:mm';
export const DATE_WEEKDAY_FORMAT = 'd MMM EEE';

export const DEFAULT_TIME = set(new Date(), { hours: 0, minutes: 0 });

export const DEFAULT_PHONE_NUMBER = '+71234567890';
export const DEFAULT_EMAIL = 'ivanov.ivan@example.com';

export const MAX_PASSENGERS = 9;