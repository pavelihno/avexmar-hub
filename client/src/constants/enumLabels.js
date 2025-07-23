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
		pending_payment: 'Ожидает оплаты',
		confirmed: 'Подтверждено',
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
		foreign_passport: 'Паспорт иностранного гражданина',
		international_passport: 'Загранпаспорт',
		birth_certificate: 'Свидетельство о рождении',
	},
	CURRENCY: {
		rub: 'РУБ',
	},
	SEAT_CLASS: {
		economy: 'Эконом',
		business: 'Бизнес',
	},
	PAYMENT_STATUS: {
		pending: 'В ожидании',
		paid: 'Оплачено',
		refunded: 'Возвращено',
		failed: 'Ошибка',
	},
	PAYMENT_METHOD: {
		card: 'Банковская карта',
		cash: 'Наличные',
	},
};

export const getEnumOptions = (enumType) => {
	return Object.entries(ENUM_LABELS[enumType]).map(([value, label]) => ({
		value,
		label,
	}));
};

export default ENUM_LABELS;
