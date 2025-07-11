export const ENUM_LABELS = {
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
	DOCUMENT_TYPE: {
		passport: 'Паспорт РФ',
		foreign_passport: 'Паспорт иностранного гражданина',
		international_passport: 'Загранпаспорт',
		birth_certificate: 'Свидетельство о рождении',
	},
	CURRENCY: {
		rub: 'Рубль',
	},
	FLIGHT_STATUS: {
		scheduled: 'Запланирован',
		delayed: 'Задержан',
		departed: 'Вылетел',
		arrived: 'Прибыл',
		cancelled: 'Отменён',
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

export default ENUM_LABELS;