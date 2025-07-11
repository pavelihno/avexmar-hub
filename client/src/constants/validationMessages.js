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
			REQUIRED: 'IATA код обязателен',
			LENGTH: 'IATA код должен содержать 3 символа',
		},
		icao_code: {
			LENGTH: 'ICAO код должен содержать 4 символа',
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
};

export default VALIDATION_MESSAGES;