export const ENUM_LABELS = {
	BOOLEAN: {
		true: 'Да',
		false: 'Нет',
	},
	DISCOUNT_TYPE: {
		round_trip: 'Туда-обратно',
		infant: 'Младенец',
		child: 'Ребенок',
	},
	BOOKING_STATUS: {
		created: 'Создано',
		passengers_added: 'Пассажиры добавлены',
		confirmed: 'Подтверждено',
		payment_pending: 'Ожидает оплаты',
		payment_confirmed: 'Оплата подтверждена',
		payment_failed: 'Ошибка оплаты',
		completed: 'Завершено',

		expired: 'Истекло',
		cancelled: 'Отменено',
	},
	USER_ROLE: {
		admin: 'Администратор',
		standard: 'Стандартный пользователь',
	},
	GENDER: {
		м: 'Мужской',
		ж: 'Женский',
	},
	GENDER_SHORT: {
		м: 'М',
		ж: 'Ж',
	},
	DOCUMENT_TYPE: {
		passport: 'Паспорт РФ',
		international_passport: 'Загранпаспорт РФ',
		foreign_passport: 'Иностранный документ',
		birth_certificate: 'Свидетельство о рождении',
	},
	PASSENGER_CATEGORY: {
		adult: 'Взрослый',
		child: 'Ребёнок',
		infant: 'Младенец',
		infant_seat: 'Младенец с местом',
	},
	BOOKING_FLIGHT_PASSENGER_STATUS: {
		created: 'Пассажир создан',
		ticket_in_progress: 'Билет оформляется',
		ticketed: 'Билет оформлен',
		refund_in_progress: 'Возврат обрабатывается',
		refunded: 'Возврат выполнен',
		refund_rejected: 'Возврат отклонён',
	},
	CURRENCY: {
		rub: 'РУБ',
	},
	CURRENCY_SYMBOL: {
		rub: '₽',
	},
	SEAT_CLASS: {
		economy: 'Эконом',
		business: 'Бизнес',
	},
	PAYMENT_STATUS: {
		pending: 'Создан',
		waiting_for_capture: 'Ожидает подтверждения',
		succeeded: 'Успешно завершен',
		canceled: 'Отменён',
	},
	PAYMENT_METHOD: {
		yookassa: 'ЮKassa',
	},
	PAYMENT_TYPE: {
		payment: 'Платёж',
		invoice: 'Счёт',
		refund: 'Возврат',
	},
	FEE_APPLICATION: {
		service_fee: 'Сервисный сбор',
		ticket_refund: 'Возврат билета',
	},
	FEE_TERM: {
		none: 'Отсутствует',
		before_48h: 'Более чем за 48 часов до рейса',
		before_24h: 'Менее чем за 48 часов, но более чем за 24 часа до рейса',
		within_24h: 'Менее чем за 24 часа до рейса',
		after_departure: 'После вылета рейса',
	},
	CONSENT_DOC_TYPE: {
		public_offer: 'Публичная оферта',
		pd_policy: 'Политика обработки персональных данных',
		pd_agreement: 'Согласие на обработку персональных данных',
	},
	CONSENT_EVENT_TYPE: {
		public_offer_acceptance: 'Акцепт оферты',
		pd_agreement_acceptance: 'Согласие на обработку персональных данных',
	},
	CONSENT_ACTION: {
		agree: 'Согласие',
		withdraw: 'Отзыв',
	},
};

export const getEnumOptions = (enumType) => {
	return Object.entries(ENUM_LABELS[enumType]).map(([value, label]) => ({
		value,
		label,
	}));
};

export default ENUM_LABELS;
