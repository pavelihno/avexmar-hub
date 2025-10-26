export const VALIDATION_MESSAGES = {
	GENERAL: {
		INVALID_DATE: 'Неверный формат даты',
		INVALID_TIME: 'Неверный формат времени',
		INVALID_DATETIME: 'Неверный формат даты и времени',
	},

	AUTH: {
		code: {
			REQUIRED: 'Код обязателен',
		},
	},

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

	FEE: {
		name: {
			REQUIRED: 'Наименование сбора обязательно',
		},
		amount: {
			REQUIRED: 'Сумма обязательна',
		},
		application: {
			REQUIRED: 'Применение сбора обязательно',
		},
		application_term: {
			REQUIRED: 'Срок применения сбора обязателен',
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
			REQUIRED: 'Код города обязателен',
		},
		city_name: {
			REQUIRED: 'Название города обязательно',
		},
		country_id: {
			REQUIRED: 'Страна обязательна',
		},
	},

	ROUTE: {
		origin_airport_id: {
			REQUIRED: 'Аэропорт отправления обязателен',
		},
		destination_airport_id: {
			REQUIRED: 'Аэропорт прибытия обязателен',
		},
	},

	USER: {
		email: {
			REQUIRED: 'Электронная почта обязательна',
			INVALID: 'Введите корректную электронную почту',
		},
		password: {
			REQUIRED: 'Пароль обязателен',
			MIN_LENGTH: 'Пароль должен содержать минимум 6 символов',
			WEAK: 'Пароль слишком простой. Усложните комбинацию',
		},
		password2: {
			REQUIRED: 'Подтверждение пароля обязательно',
			MATCH: 'Пароли не совпадают',
		},
	},

	TIMEZONE: {
		name: {
			REQUIRED: 'Часовой пояс обязателен',
		},
	},

	CONSENT_DOC: {
		type: {
			REQUIRED: 'Тип документа обязателен',
		},
		content: {
			REQUIRED: 'Содержание обязательно',
		},
	},
	CONSENT_EVENT: {
		type: {
			REQUIRED: 'Тип события обязателен',
		},
		booking_id: {
			REQUIRED: 'ID бронирования обязателен',
		},
		doc_id: {
			REQUIRED: 'ID документа обязателен',
		},
		action: {
			REQUIRED: 'Действие обязательно',
		},
	},

	CAROUSEL_SLIDE: {
		title: {
			REQUIRED: 'Заголовок обязателен',
		},
		route_id: {
			REQUIRED: 'Выберите маршрут',
		},
		alt: {
			REQUIRED: 'Альтернативный текст обязателен',
		},
		image: {
			REQUIRED: 'Загрузите изображение слайда',
		},
	},

	PASSENGER: {
		first_name: {
			REQUIRED: 'Введите имя',
		},
		last_name: {
			REQUIRED: 'Введите фамилию',
		},
		gender: {
			REQUIRED: 'Выберите пол',
		},
		birth_date: {
			REQUIRED: 'Введите дату рождения',
			FUTURE: 'Дата рождения не может быть в будущем',
			ADULT: 'Возраст взрослого должен быть более 12 лет',
			CHILD: 'Возраст ребёнка должен быть 2–12 лет',
			INFANT: 'Возраст младенца должен быть менее 2 лет',
			INFANT_SEAT: 'Возраст младенца должен быть менее 2 лет',
		},
		document_type: {
			REQUIRED: 'Выберите тип документа',
		},
		document_number: {
			REQUIRED: 'Введите номер документа',
		},
		document_expiry_date: {
			REQUIRED: 'Срок действия обязателен',
			EXPIRED: 'Срок действия документа истек',
			AFTER_FLIGHT: 'Срок действия должен быть позже даты вылета',
		},
		citizenship_id: {
			REQUIRED: 'Выберите гражданство',
		},
		name_language: {
			CYRILLIC: 'Используйте кириллицу',
			LATIN: 'Используйте латиницу',
		},
	},

	BOOKING: {
		email_address: {
			REQUIRED: 'Введите электронную почту',
			INVALID: 'Введите корректную электронную почту',
		},
		phone_number: {
			REQUIRED: 'Введите номер телефона',
			INVALID: 'Введите корректный номер телефона',
		},
		passenger: {
			DUPLICATE: 'Пассажиры не должны повторяться',
		},
		consent: {
			REQUIRED: 'Необходимо согласие на обработку персональных данных',
		},
	},

	AIRLINE: {
		iata_code: {
			REQUIRED: 'Код IATA обязателен',
			LENGTH: 'Код IATA должен содержать 2 символа',
		},
		icao_code: {
			REQUIRED: 'Код ICAO обязателен',
			LENGTH: 'Код ICAO должен содержать 3 символа',
		},
		name: {
			REQUIRED: 'Название авиакомпании обязательно',
		},
		country_id: {
			REQUIRED: 'Страна обязательна',
		},
	},

	AIRCRAFT: {
		type: {
			REQUIRED: 'Тип воздушного судна обязателен',
		},
	},

	COUNTRY: {
		name: {
			REQUIRED: 'Название обязательно',
		},
		code_a2: {
			REQUIRED: 'Код A2 обязателен',
			LENGTH: 'Код A2 должен содержать 2 символа',
		},
		code_a3: {
			REQUIRED: 'Код A3 обязателен',
			LENGTH: 'Код A3 должен содержать 3 символа',
		},
	},

	FLIGHT: {
		flight_number: {
			REQUIRED: 'Номер рейса обязателен',
		},
		airline_id: {
			REQUIRED: 'Авиакомпания обязательна',
		},
		route_id: {
			REQUIRED: 'Маршрут рейса обязателен',
		},
		scheduled_departure: {
			REQUIRED: 'Дата отправления обязательна',
		},
		scheduled_departure_time: {
			REQUIRED: 'Время отправления обязательно',
		},
		scheduled_arrival: {
			REQUIRED: 'Дата прибытия обязательна',
		},
		scheduled_arrival_time: {
			REQUIRED: 'Время прибытия обязательно',
		},
		status: {
			REQUIRED: 'Статус рейса обязателен',
		},
		aircraft_id: {
			REQUIRED: 'Воздушное судно обязательно',
		},
	},

	TARIFF: {
		seat_class: {
			REQUIRED: 'Класс места обязателен',
		},
		seats_number: {
			REQUIRED: 'Количество мест обязательно',
		},
		available_seats: {
			REQUIRED: 'Количество свободных мест обязательно',
		},
		currency: {
			REQUIRED: 'Валюта обязательна',
		},
		price: {
			REQUIRED: 'Цена обязательна',
		},
		title: {
			REQUIRED: 'Наименование тарифа обязательно',
		},
		conditions: {
			REQUIRED: 'Условия применения тарифа обязательны',
		},
		tariff: {
			REQUIRED: 'Тариф обязателен',
		},
		hand_luggage: {
			REQUIRED: 'Ручная кладь обязательна',
		},
		baggage: {
			REQUIRED: 'Багаж обязателен',
		},
	},

	SEARCH: {
		from: {
			REQUIRED: 'Укажите аэропорт отправления',
		},
		to: {
			REQUIRED: 'Укажите аэропорт прибытия',
			SAME_AIRPORT: 'Аэропорты не должны совпадать',
		},
		when: {
			REQUIRED: 'Укажите дату отправления',
			TODAY: 'Дата отправления должна быть не раньше сегодня',
		},
		return: {
			INVALID: 'Дата возвращения должна быть позже даты отправления',
			TODAY: 'Дата возвращения должна быть не раньше сегодня',
		},
		passengers: {
			REQUIRED: 'Укажите пассажиров',
		},
	},
};

export default VALIDATION_MESSAGES;
