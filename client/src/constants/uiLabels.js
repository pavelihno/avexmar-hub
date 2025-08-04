import { formatDate } from '../components/utils';

export const UI_LABELS = {
	APP_TITLE: 'АВЕКСМАР - Авиаперевозки',
	BUTTONS: {
		save: 'Сохранить',
		save_changes: 'Сохранить изменения',
		close: 'Закрыть',
		login: 'Войти',
		exit: 'Выйти',
		register: 'Зарегистрироваться',
		copy: 'Копировать',
		add: 'Добавить',
		edit: 'Редактировать',
		delete: 'Удалить',
		cancel: 'Отмена',
		back: 'Назад',
		delete_all: 'Удалить все',
		close: 'Закрыть',
		confirm: 'Подтвердить',
		send: 'Отправить',
		pagination: {
			rows_per_page: 'Записей на странице',
			displayed_rows: ({ from, to, count }) => {
				return `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`;
			},
		}
	},
	TITLES: {
		login: 'Вход',
		register: 'Регистрация',
		settings: 'Настройки',
		forgot_password: 'Восстановление пароля',
	},
	MESSAGES: {
		confirm_action: 'Подтвердите действие',
		confirm_delete: 'Вы уверены, что хотите удалить запись?',
		confirm_delete_all: 'Вы уверены, что хотите удалить все записи?',
		loading: 'Загрузка...',
		required_field: 'Это поле обязательно',
	},
	SUCCESS: {
		add: 'Запись успешно добавлена',
		upload: 'Файл успешно загружен',
		update: 'Запись успешно обновлена',
		delete: 'Запись успешно удалена',
		delete_all: 'Все записи успешно удалены',
		login: 'Вход выполнен успешно',
		register: 'Регистрация выполнена успешно',
		password_reset: 'Инструкция отправлена на электронную почту',
	},
	WARNINGS: {
		upload: 'Некоторые записи не были созданы. Подробнее в файле',
	},
	ERRORS: {
		unknown: 'Неизвестная ошибка',
		copy: 'Ошибка при копировании',
		save: 'Ошибка при сохранении',
		delete: 'Ошибка при удалении',
	},
	ABOUT: {
		company_name: 'АВЕКСМАР',
		contact_email: 'contact@avexmar.com',
		contact_phone: '+7 (123) 456-78-90',
		contact_address: 'г. Москва, ул. Примерная, д. 1',
		about_us: 'О нас',
		copied: 'Скопирован',
		contact_info: 'Контактная информация',
		address: 'Адрес',
		phone: 'Телефон',
		email: 'Электронная почта',
		email_address: 'Адрес электронной почты',
		legal_info: 'Правовая информация',
		privacy_policy_agreement: 'Согласие на обработку персональных данных',
		marketing_consent: 'Согласие на получение рекламной рассылки',
		all_rights_reserved: 'Все права защищены',
		company_description: 'Надежный партнер в сфере организации пассажирских и грузовых авиаперевозок с 1995 года',
		cards: [
			{
				title: 'Широкий спектр клиентов и партнёров в сфере воздушных перевозок',
				content:
					'Компания «АВЕКСМАР» является надежным партнером для старательских артелей, предприятий и организаций, таких как ОАО «Полиметалл», Морской порт Певек, ООО «Инкомнефтеремонт», ООО «Уранцветмет», ООО «Атомредметзолото», а также предприятий, связанных с ПАТЭС, обслуживаемых компаниями ООО «Запсибгидрострой», ООО «Ленмонтаж», ООО «Гидропромстрой», ООО «Плавстройотряд-34» и Нововоронежской АЭС',
				alt: 'партнеры',
				icon: 'business',
			},
			{
				title: 'Опытная компания с богатой историей',
				content:
					'Коллектив ООО «АВЕКСМАР» занимается организацией пассажирских и грузовых авиаперевозок с 1995 года. Компания имеет многолетний опыт организации воздушных перевозок пассажиров, проживающих или работающих на территории Чукотского автономного округа',
				alt: 'история',
				icon: 'history',
			},
			{
				title: 'Долгосрочное сотрудничество с ведущими авиакомпаниями',
				content:
					'Организация сотрудничала с такими авиакомпаниями, как «Внуковские авиалинии», «Красноярские авиалинии», «Авиаэнерго», «Кавминводыавиа», «Трансаэро», «ЮТэйр». С апреля 2017 года ООО «АВЕКСМАР» организует регулярные рейсы по маршруту Москва-Якутск-Певек-Якутск-Москва с авиакомпанией «Якутия». За это время было выполнено более 500 рейсов и перевезено более 55 000 пассажиров',
				alt: 'авиакомпании',
				icon: 'airplane',
			},
		],
	},
	ADMIN: {
		actions: 'Действия',
		panel: 'Панель администратора',
		filter: {
			show: 'Показать фильтры',
			hide: 'Скрыть фильтры',
			clear: 'Очистить',
			all: 'Все',
		},
		upload: {
			title: 'Загрузка файла',
			drag: 'Перетащите файл сюда или выберите',
			select: 'Выбрать файл',
		},
		modules: {
			airports: {
				title: 'Аэропорты',
				description: 'Управление аэропортами',
				management: 'Управление аэропортами',
				add_button: 'Добавить аэропорт',
				edit_button: 'Редактировать аэропорт',
				upload_button: 'Загрузить аэропорты',
				upload_template_button: 'Скачать шаблон загрузки',
			},
			airlines: {
				title: 'Авиакомпании',
				description: 'Управление авиакомпаниями',
				management: 'Управление авиакомпаниями',
				add_button: 'Добавить авиакомпанию',
				edit_button: 'Редактировать авиакомпанию',
				upload_button: 'Загрузить авиакомпании',
				upload_template_button: 'Скачать шаблон загрузки',
			},
			countries: {
				title: 'Страны',
				description: 'Управление странами',
				management: 'Управление странами',
				add_button: 'Добавить страну',
				edit_button: 'Редактировать страну',
				upload_button: 'Загрузить страны',
				upload_template_button: 'Скачать шаблон загрузки',
			},
			timezones: {
				title: 'Часовые пояса',
				description: 'Управление часовыми поясами',
				management: 'Управление часовыми поясами',
				add_button: 'Добавить часовой пояс',
				edit_button: 'Редактировать часовой пояс',
				upload_button: 'Загрузить часовые пояса',
				upload_template_button: 'Скачать шаблон загрузки',
			},
			routes: {
				title: 'Маршруты',
				description: 'Управление маршрутами',
				management: 'Управление маршрутами',
				add_button: 'Добавить маршрут',
				edit_button: 'Редактировать маршрут',
			},
			discounts: {
				title: 'Скидки',
				description: 'Управление скидками',
				management: 'Управление скидками',
				add_button: 'Добавить скидку',
				edit_button: 'Редактировать скидку',
			},
			flights: {
				title: 'Рейсы',
				description: 'Управление рейсами и тарифами',
				management: 'Управление рейсами',
				add_button: 'Добавить рейс',
				edit_button: 'Редактировать рейс',
				manage_tariffs: 'Изменить тарифы',
			},
			tariffs: {
				title: 'Тарифы',
				tariff: 'Тариф',
				seats: 'Мест',
				description: 'Управление тарифами рейсов',
				management: 'Управление тарифами',
				add_button: 'Добавить тариф',
				edit_button: 'Редактировать тариф',
				delete_button: 'Удалить тариф',
				manage_tariffs: 'Изменить тарифы',
				confirm_delete: 'Вы уверены, что хотите удалить тариф?',
			},
			bookings: {
				title: 'Бронирования',
				description: 'Управление бронированиями',
				management: 'Управление бронированиями',
				add_button: 'Добавить бронирование',
				edit_button: 'Редактировать бронирование',
			},
			tickets: {
				title: 'Билеты',
				description: 'Управление билетами',
				management: 'Управление билетами',
				add_button: 'Добавить билет',
				edit_button: 'Редактировать билет',
			},
			passengers: {
				title: 'Пассажиры',
				description: 'Управление пассажирами',
				management: 'Управление пассажирами',
				add_button: 'Добавить пассажира',
				edit_button: 'Редактировать пассажира',
			},
			users: {
				title: 'Пользователи',
				description: 'Управление пользователями',
				management: 'Управление пользователями',
				add_button: 'Добавить пользователя',
				edit_button: 'Редактировать пользователя',
			},
		},
	},
	AUTH: {
		old_password: 'Текущий пароль',
		new_password: 'Новый пароль',
		confirm_password: 'Подтвердите пароль',
		no_account: 'Нет аккаунта?',
		have_account: 'Уже есть аккаунт?',
		or: 'или',
		forgot_password: 'Забыли пароль?',
	},
	PROFILE: {
		profile: 'Профиль',
		settings: 'Настройки профиля',
		maintenance: 'Скоро здесь будет личный кабинет',
		change_password: 'Сменить пароль',
		password_changed: 'Пароль успешно изменен',
		passwords_dont_match: 'Пароли не совпадают',
	},
	HOME: {
		search: {
			from: 'Откуда',
			to: 'Куда',
			when: 'Когда',
			return: 'Обратно',
			when_from: 'Когда от',
			when_to: 'Когда до',
			return_from: 'Обратно от',
			return_to: 'Обратно до',
			passengers: 'Пассажиры',
			class: 'Эконом',
			seat_class_title: 'Класс обслуживания',
			show_schedule: 'Показать расписание',
			date_modes: {
				exact: 'Точные даты',
				flexible: 'Гибкие даты',
			},
			schedule_button: 'Расписание',
			button: 'Найти билеты',
			passenger_word: (count) =>
				count % 10 === 1 && count % 100 !== 11
					? 'пассажир'
					: count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)
					? 'пассажира'
					: 'пассажиров',
			passenger_categories: [
				{ key: 'adults', label: 'Взрослые', desc: '12 лет и старше' },
				{ key: 'children', label: 'Дети', desc: '2–11 лет' },
				{ key: 'infants', label: 'Младенцы', desc: 'до 2 лет' },
			],
			errors: {
				same_airport: 'Пункты отправления и назначения не могут совпадать',
				invalid_return: 'Дата возвращения не может быть раньше даты отправления',
			},
		},
	},
	BOOKING: {
		passenger_form: {
			type_labels: {
				ADULT: 'Взрослый, старше 12 лет',
				CHILD: 'Ребёнок, от 2 до 12 лет',
				INFANT: 'Малыш, до 2 лет',
			},
			genders: [
				{ value: 'MALE', label: 'Мужской' },
				{ value: 'FEMALE', label: 'Женский' },
				{ value: 'OTHER', label: 'Другой' },
			],
			add_passenger: 'Добавить пассажира',
		},
	},
	SCHEDULE: {
		title: 'Расписание рейсов',
		results: 'Результаты поиска',
		no_results: 'Рейсы не найдены',
		outbound: 'Выбранное направление',
		return: 'Обратное направление',
		filter: 'Фильтр',
		select: 'Выбрать',
		ask_return: 'Нужен ли обратный билет?',
		select_flights: 'Выбрать рейсы',
		from_to: (from, to) => {
			return `${from} → ${to}`;
		},
		price_from: 'от',
	},
	SEARCH: {
		results: 'Результаты поиска',
		no_results: 'Рейсы не найдены',
		from_to_date: (from, to, date_from, date_to) => {
			if (date_to) return `${from} ⇄ ${to}, ${formatDate(date_from, 'dd.MM')} - ${formatDate(date_to, 'dd.MM')}`;
			else return `${from} → ${to}, ${formatDate(date_from, 'dd.MM')}`;
		},
		flight_details: {
			select_flight: 'Выбрать билет',
			airline: 'Авиакомпания',
			from_to: 'Отправление - Прибытие',
			departure_arrival: 'Время отправления - Время прибытия',
			price: 'Цена',
		},
		sort: {
			label: 'Сортировка',
			price: 'По цене',
			arrival: 'По времени прибытия',
			departure: 'По времени отправления',
			duration: 'По времени в пути',
		},
		nearby_dates: 'Ближайшие даты',
		show_more: 'Показать еще билеты',
	},
};

export default UI_LABELS;
