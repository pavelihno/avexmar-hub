export const VALIDATION_MESSAGES = {
	GENERAL: {
		INVALID_DATE: 'Неверный формат даты',
		INVALID_TIME: 'Неверный формат времени',
		INVALID_DATETIME: 'Неверный формат даты и времени',
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

	TIMEZONE: {
		name: {
			REQUIRED: 'Часовой пояс обязателен',
		},
	},

	PASSENGER: {
		first_name: {
			REQUIRED: 'Имя обязательно',
		},
		last_name: {
			REQUIRED: 'Фамилия обязательна',
		},
		birth_date: {
			REQUIRED: 'Укажите дату рождения',
			ADULT: 'Пассажир должен быть старше 12 лет',
			CHILD: 'Возраст ребёнка 2–12 лет',
			INFANT: 'Возраст малыша должен быть менее 2 лет',
		},
		document_type: {
			REQUIRED: 'Тип документа обязателен',
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
		passenger: {
			EXISTS: 'Пассажир с таким именем и датой рождения уже есть в бронировании',
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
		},
		return: {
			INVALID: 'Дата возвращения не может быть раньше даты отправления',
		},
		passengers: {
			REQUIRED: 'Укажите пассажиров',
		},
	},
};

export default VALIDATION_MESSAGES;
