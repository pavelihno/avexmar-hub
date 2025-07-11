export const VALIDATION_MESSAGES = {
	DISCOUNT: {
		discount_name: {
			REQUIRED: 'Название скидки обязательно',
		},
		discount_type: {
			REQUIRED: 'Тип скидки обязателен',
		},
		percentage_value: {
			REQUIRED: 'Процент скидки обязателен',
		},
	},
	AIRPORT: {
		name: {
			REQUIRED: 'Название аэропорта обязательно',
		},
		iata_code: {
			REQUIRED: 'Код IATA обязателен',
			LENGTH: 'Код IATA должен содержать 3 символа',
		},
		icao_code: {
			LENGTH: 'Код ICAO должен содержать 4 символа',
		},
		city_code: {
			REQUIRED: 'Город обязателен',
		},
	},
	ROUTE: {
		flight_number: {
			REQUIRED: 'Номер рейса обязателен',
		},
		origin_airport_id: {
			REQUIRED: 'Аэропорт отправления обязателен',
		},
		destination_airport_id: {
			REQUIRED: 'Аэропорт прибытия обязателен',
		},
	},
	USER: {
		email: {
			REQUIRED: 'Email обязателен',
			INVALID: 'Введите корректный email',
		},
		password: {
			REQUIRED: 'Пароль обязателен',
			MIN_LENGTH: 'Пароль должен содержать минимум 6 символов',
		},
		password2: {
			REQUIRED: 'Подтверждение пароля обязательно',
			MATCH: 'Пароли не совпадают',
		},
	},
	PASSENGER: {
		first_name: {
			REQUIRED: 'Имя обязательно',
		},
		last_name: {
			REQUIRED: 'Фамилия обязательна',
		},
		document_number: {
			REQUIRED: 'Номер документа обязателен',
		},
	},
	BOOKING: {
		email_address: {
			REQUIRED: 'Email обязателен',
			INVALID: 'Введите корректный email',
		},
		phone_number: {
			REQUIRED: 'Телефон обязателен',
			INVALID: 'Введите корректный номер телефона',
		},
	},
	FLIGHT: {
		route_id: {
			REQUIRED: 'Маршрут рейса обязателен',
		},
		scheduled_departure: {
			REQUIRED: 'Время отправления обязательно',
		},
		scheduled_arrival: {
			REQUIRED: 'Время прибытия обязательно',
		},
		status: {
			REQUIRED: 'Статус рейса обязателен',
		},
	},
	TARIFF: {
		seat_class: {
			REQUIRED: 'Класс места обязателен',
		},
		seats_number: {
			REQUIRED: 'Количество мест обязательно',
		},
		currency: {
			REQUIRED: 'Валюта обязательна',
		},
		price: {
			REQUIRED: 'Цена обязательна',
		},

	}
};

export default VALIDATION_MESSAGES;