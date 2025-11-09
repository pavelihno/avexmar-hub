import { formatDate, formatTime, formatNumber } from '../components/utils';
import ENUM_LABELS from './enumLabels';

export const UI_LABELS = {
	APP_TITLE: 'АВЕКСМАР — Авиаперевозки',
	ABOUT: {
		company_name: 'АВЕКСМАР',
		full_name: 'Наименование организации',
		company_full_name: 'Общество с ограниченной ответственностью «АВЕКСМАР»',
		ogrn: 'ОГРН',
		ogrn_value: '1167746881279',
		inn: 'ИНН',
		inn_value: '9701049956',
		legal_address: 'Юридический адрес',
		legal_address_value: '105082, г. Москва, ул. Бакунинская, д. 69, стр. 1, помещение 1, офис 16',
		phone: 'Контактный телефон',
		contact_phone: '+7 495 363-59-11',
		email_address: 'Адрес электронной почты',
		contact_email: 'mail@avexmar.ru',
		company_description: 'Надежный партнер в сфере организации пассажирских и грузовых авиаперевозок с 1995 года',
		cards: [
			{
				title: 'Широкий спектр клиентов и партнёров в сфере воздушных перевозок',
				content:
					'Компания «АВЕКСМАР» — надёжный партнёр для старательских артелей и промышленных предприятий Чукотки. Среди наших клиентов и контрагентов: ОАО «Полиметалл», ООО «Шахтёр», АО «Морпорт Певек», ООО «Инкомнефтеремонт», ООО «Уранцветмет», ООО «Атомредметзолото». Мы также работаем с предприятиями, связанными с ПАТЭС, обслуживаемыми компаниями: ООО «Арктик Атом-Сервис», ООО «Запсибгидрострой», ООО «Ленмонтаж», ООО «Гидропромстрой», ООО «Плавстройотряд-34» и Нововоронежской АЭС.',
				alt: 'партнеры',
				icon: 'business',
			},
			{
				title: 'Опытная компания с богатой историей',
				content:
					'ООО «АВЕКСМАР» — команда профессионалов, организующая пассажирские и грузовые авиаперевозки с 1995 года. Мы обладаем большим опытом оказания авиационных услуг жителям и предприятиям Чукотского автономного округа.',
				alt: 'история',
				icon: 'history',
			},
			{
				title: 'Долгосрочное сотрудничество с ведущими авиакомпаниями',
				content:
					'За время своей деятельности ООО «АВЕКСМАР» сотрудничало с ведущими российскими авиаперевозчиками: «Внуковские авиалинии», «Красноярские авиалинии», «Авиаэнерго», «Кавминводыавиа», «Трансаэро», «ЮТэйр». С 2017 года компания совместно с авиакомпанией «Якутия» организует регулярные рейсы по маршруту Москва — Якутск — Певек — Якутск — Москва, обслуживая более 6 000 пассажиров ежегодно.',
				alt: 'авиакомпании',
				icon: 'airplane',
			},
		],
		about_us: 'О нас',
		company_details: 'Реквизиты компании',
		legal_info: 'Правовая информация',
		pd_policy: 'Политика обработки персональных данных',
		pd_agreement: 'Согласие на обработку персональных данных',
		public_offer: 'Публичная оферта',
		all_rights_reserved: 'Все права защищены',
		copied: 'Скопировано',
	},
	BUTTONS: {
		save: 'Сохранить',
		save_changes: 'Сохранить изменения',
		change_password: 'Сохранить новый пароль',
		show: 'Показать',
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
		delete_filtered: 'Удалить по фильтру',
		confirm: 'Подтвердить',
		send: 'Отправить',
		continue: 'Продолжить',
		download: 'Скачать',
		pagination: {
			rows_per_page: 'Записей на странице',
			displayed_rows: ({ from, to, count }) => {
				return `${from}—${to} из ${count !== -1 ? count : `более чем ${to}`}`;
			},
		},
	},
	TITLES: {
		login: 'Вход',
		register: 'Регистрация',
		profile: 'Личный кабинет',
		forgot_password: 'Восстановление пароля',
		activate_account: 'Активация аккаунта',
	},
	MESSAGES: {
		confirm_action: 'Подтвердите действие',
		confirm_delete: 'Вы уверены, что хотите удалить запись?',
		confirm_delete_all: 'Вы уверены, что хотите удалить все записи?',
		confirm_delete_filtered: 'Вы уверены, что хотите удалить записи, соответствующие фильтру?',
		loading: 'Загрузка...',
		required_field: 'Это поле обязательно',
	},
	SUCCESS: {
		add: 'Запись успешно добавлена',
		upload: 'Файл успешно загружен',
		update: 'Запись успешно обновлена',
		delete: 'Запись успешно удалена',
		delete_all: 'Все записи успешно удалены',
		delete_filtered: 'Отфильтрованные записи успешно удалены',
		login: 'Вход выполнен успешно',
		register: 'Инструкции по активации отправлены на электронную почту',
		account_activated: 'Аккаунт успешно активирован',
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
	DOC: {
		version: 'Версия',
		effective_from: 'Действует с',
		last_updated: 'Последнее обновление',
		not_available: '—',
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
		empty: {
			no_records: 'Нет записей',
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
			aircrafts: {
				title: 'Воздушные суда',
				description: 'Управление воздушными судами',
				management: 'Управление воздушными судами',
				add_button: 'Добавить воздушное судно',
				edit_button: 'Редактировать воздушное судно',
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
			fees: {
				title: 'Сборы',
				description: 'Управление сборами',
				management: 'Управление сборами',
				add_button: 'Добавить сбор',
				edit_button: 'Редактировать сбор',
			},
			tariffs: {
				title: 'Тарифы',
				tariff: 'Тариф',
				seats: 'Мест',
				free_seats: 'Свободно',
				total_seats: 'Всего',
				description: 'Управление тарифами рейсов',
				management: 'Управление тарифами',
				add_button: 'Добавить тариф',
				edit_button: 'Редактировать тариф',
				delete_button: 'Удалить тариф',
				manage_tariffs: 'Изменить тарифы',
				confirm_delete: 'Вы уверены, что хотите удалить тариф?',
			},
			flights: {
				title: 'Рейсы',
				description: 'Управление рейсами и тарифами',
				management: 'Управление рейсами',
				add_button: 'Добавить рейс',
				edit_button: 'Редактировать рейс',
				manage_tariffs: 'Изменить тарифы',
				upload_button: 'Загрузить рейсы',
				upload_template_button: 'Скачать шаблон загрузки',
			},
			bookings: {
				title: 'Бронирования',
				description: 'Управление бронированиями',
				management: 'Управление бронированиями',
				add_button: 'Добавить бронирование',
				edit_button: 'Редактировать бронирование',
			},
			payments: {
				title: 'Платежи',
				description: 'Управление платежами',
				management: 'Управление платежами',
				add_button: 'Добавить платеж',
				edit_button: 'Редактировать платеж',
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
			consentDocs: {
				title: 'Документы согласий',
				description: 'Управление документами согласий',
				management: 'Управление документами согласий',
				add_button: 'Добавить документ',
				edit_button: 'Редактировать документ',
			},
			consentEvents: {
				title: 'Пользовательские согласия',
				description: 'Управление событиями пользовательских согласий',
				management: 'Управление событиями пользовательских согласий',
				add_button: 'Добавить событие',
				edit_button: 'Редактировать событие',
			},
		},
		dashboard: {
			flightPassengers: {
				link: 'Список пассажиров по рейсу',
				title: 'Выгрузка пассажиров',
				description: 'Формирование списка пассажиров по рейсу',
				route: 'Маршрут',
				flight: 'Рейс',
				flightDate: 'Дата вылета',
				resetFilters: 'Сбросить фильтры',
				emptyState: 'По выбранным фильтрам рейсы не найдены',
				selectRoutePrompt: 'Выберите маршрут, чтобы увидеть рейсы',
				table: {
					flight: 'Рейс',
					date: 'Дата и время вылета',
					airline: 'Авиакомпания',
					select: 'Выбрать',
				},
			},
			tickets: {
				link: 'Загрузка билетов',
				title: 'Загрузка билетов',
				description: 'Загрузка выписанных билетов по бронированию',
				inputs: {
					spreadsheet: {
						label: 'Список пассажиров (XLS)',
					},
					pdf: {
						label: 'Маршрут-квитанция (PDF)',
					},
					select: 'Выбрать файл',
					replace: 'Заменить файл',
					replacePdf: 'Заменить PDF',
					selectPdf: 'Выбрать PDF',
					dragXls: 'Перетащите XLS файл',
					dragPdf: 'Перетащите PDF файл',
				},
				actions: {
					upload: 'Загрузить данные',
					analyze: 'Анализировать данные',
					confirm: 'Подтвердить импорт',
					confirming: 'Импорт...',
					reset: 'Очистить',
					cancel: 'Отмена',
					processing: 'Обработка...',
				},
				tooltips: {
					noAnalysis: 'Сначала проанализируйте файл',
					noPdf: 'Загрузите PDF маршрут-квитанцию',
					noReadyPassengers: 'Нет пассажиров, готовых к импорту',
				},
				messages: {
					success: 'Данные файла успешно разобраны',
					importSuccess: 'Билеты успешно импортированы',
					missingSpreadsheet: 'Выберите файл со списком пассажиров',
					missingPdf: 'Выберите PDF с маршрут-квитанцией',
					insufficientData: 'Недостаточно данных для импорта',
					noReadyPassengers: 'Нет пассажиров, готовых к импорту',
				},
				confirmSummary: {
					title: 'Результат импорта',
					created: 'Создано билетов',
					skipped: 'Пропущено',
				},
				results: {
					title: 'Результаты обработки',
					warnings: 'Предупреждения',
					parsedData: 'Данные из файла',
					flightInSystem: 'Рейс в системе',
					flightNotFound: 'Рейс не найден',
					flightNotFoundMessage: 'Рейс с указанным номером и датой не найден в системе',
					booking: 'Бронирование',
					bookingNotFound: 'Бронирование не найдено',
					bookingNotFoundMessage: 'Не удалось найти подходящее бронирование по данным пассажиров',
					passengers: 'Пассажиры из файла',
					noPassengers: 'Нет данных о пассажирах',
					fields: {
						flight: 'Рейс',
						date: 'Дата',
						route: 'Маршрут',
						passengerCount: 'Пассажиров',
						number: 'Номер',
						email: 'Email',
						status: 'Статус',
					},
					table: {
						order: '№',
						name: 'ФИО',
						document: 'Документ',
						birthDate: 'Дата рождения',
						ticketNumber: 'Номер билета',
						pnr: 'PNR',
						matched: 'Пассажир найден',
						matchedYes: 'Да',
						matchedNo: 'Нет',
						ticketed: 'Билет загружен',
						ticketedYes: 'Да',
						ticketedNo: 'Нет',
						unknownPassenger: 'Пассажир',
					},
				},
			},
			bookings: {
				link: 'Мониторинг бронирований',
				title: 'Мониторинг бронирований',
				description: 'Просмотр и управление бронированиями',
				emptyState: 'Бронирования не найдены. Попробуйте скорректировать фильтры.',
				emptyStateBeforeSearch: 'Нажмите «Показать», чтобы загрузить бронирования',
				emptyTableMessages: {
					flights: 'Нет данных о рейсах',
					passengers: 'Нет данных о пассажирах',
					payments: 'Нет данных о платежах',
				},
				filters: {
					title: 'Фильтры',
					toggleOpen: 'Показать фильтры',
					toggleClose: 'Скрыть фильтры',
					active: 'Фильтры применены',
					bookingNumber: 'Номер бронирования',
					route: 'Маршрут',
					flight: 'Рейс',
					buyer: 'Покупатель / контакт',
					bookingDate: 'Дата бронирования',
					reset: 'Очистить фильтры',
				},
				summary: {
					title: 'Сводка',
					total: 'Всего бронирований',
					statuses: 'Статусы',
					issues: 'Требуют внимания',
					emptyStatuses: 'Нет данных по статусам',
					emptyIssues: 'Нет критичных инцидентов',
				},
				sections: {
					buyer: 'Покупатель',
					flights: 'Рейсы',
					passengers: 'Пассажиры',
					payments: 'Платежи',
					statusHistory: 'История статусов',
					issues: 'Индикаторы',
					pricing: 'Стоимость',
				},
				table: {
					flights: {
						number: 'Номер',
						route: 'Маршрут',
						airline: 'Авиакомпания',
						departure: 'Вылет',
						arrival: 'Прилет',
						class: 'Класс',
						tariff: 'Тариф',
					},
					passengers: {
						name: 'ФИО',
						category: 'Категория',
						document: 'Документ',
						citizenship: 'Гражданство',
						birthDate: 'Дата рождения',
					},
					payments: {
						providerId: 'ID провайдера',
						status: 'Статус',
						type: 'Тип',
						method: 'Метод',
						amount: 'Сумма',
						paidAt: 'Оплачен',
						expiresAt: 'Истекает',
					},
				},
				pricing: {
					fare: 'Тариф',
					discounts: 'Скидки',
					fees: 'Сборы',
				},
				actions: {
					cancel: 'Отменить бронирование',
					download: 'Скачать PDF подтверждение',
				},
				issues: {
					pending_payment: 'Ожидает оплаты',
					failed_payment: 'Ошибка оплаты',
				},
				chips: {
					user: 'Пользователь',
					seats: 'Мест',
				},
				placeholders: {
					noBookingNumber: '—',
					noBuyer: 'Покупатель не указан',
					noFlights: 'Рейсы отсутствуют',
					noPassengers: 'Пассажиры не добавлены',
					noPayments: 'Платежи не найдены',
					noStatusHistory: 'История статусов отсутствует',
					noIssues: 'Замечаний нет',
					noPricing: 'Нет данных о стоимости',
				},
			},
		},
		carousel_slides: {
			title: 'Слайды карусели',
			description: 'Управление контентом главного слайдера и его порядком отображения',
			management: 'Управление слайдами карусели',
			add_button: 'Добавить слайд',
			edit_button: 'Редактировать слайд',
			preview_title: 'Предпросмотр карусели',
			image_hint: 'Старайтесь использовать изображения не менее 1600×900 px',
			activation_hint: 'Новый слайд создаётся неактивным. Активируйте его после предпросмотра',
			no_route_option: 'Без маршрута',
			is_active: (isActive) => (isActive ? 'Активен' : 'Скрыт'),
			move_up: 'Переместить вверх',
			move_down: 'Переместить вниз',
			replace_image: 'Заменить изображение',
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
		two_factor_prompt: (email) => {
			if (!email || email.length < 5) return `Введите код, отправленный на ${email}`;
			const [local, domain] = email.split('@');
			if (!domain) return `Введите код, отправленный на ${email}`;

			const maskedLocal =
				local.length > 4
					? `${local.slice(0, 2)}****${local.slice(-2)}`
					: `${local.slice(0, 1)}**${local.slice(-1)}`;

			return `Введите код, отправленный на ${maskedLocal}@${domain}`;
		},
		two_factor_code_label: 'Код',
	},
	PROFILE: {
		profile: 'Личный кабинет',
		to_profile: 'Перейти в личный кабинет',
		change_password: 'Сменить пароль',
		verification_code_sent: 'Код подтверждения отправлен на вашу электронную почту',
		user_info_changed: 'Личные данные успешно изменены',
		password_changed: 'Пароль успешно изменен',
		passwords_dont_match: 'Пароли не совпадают',
		user_info: 'Личные данные',
		email: 'Электронная почта',
		role: 'Роль',
		bookings: 'Мои бронирования',
		passengers: 'Пассажиры',
		no_passengers: 'Пассажиры отсутствуют',
		no_bookings: 'Бронирования отсутствуют',
		booking_number: 'Номер',
		status: 'Статус',
		route: 'Маршрут',
		open_link: 'Открыть бронирование',
		segmentBuilder: (f) => {
			if (!f) return { key: undefined, routeText: '', timeText: '' };
			const route = f.route || {};
			const o = route.origin_airport || {};
			const d = route.destination_airport || {};
			const from = `${o.city_name || ''}${o.iata_code ? ` (${o.iata_code})` : ''}`.trim();
			const to = `${d.city_name || ''}${d.iata_code ? ` (${d.iata_code})` : ''}`.trim();
			const depDate = formatDate(f.scheduled_departure, 'dd.MM.yyyy');
			const depTime = formatTime(f.scheduled_departure_time);
			const arrDate = formatDate(f.scheduled_arrival, 'dd.MM.yyyy');
			const arrTime = formatTime(f.scheduled_arrival_time);
			return {
				key: f.id,
				routeText: from && to ? `${from} → ${to}` : '',
				timeText:
					depDate || depTime || arrDate || arrTime
						? `${depDate} ${depTime || ''} — ${arrDate} ${arrTime || ''}`.trim()
						: '',
			};
		},
		last_name: 'Фамилия',
		first_name: 'Имя',
		birth_date: 'Дата рождения',
		gender: 'Пол',
		document: 'Документ',
		passenger_details: 'Данные пассажира',
		more_details: 'Подробнее',
		passenger_added: 'Пассажир успешно добавлен',
		personal_data: 'Личные данные',
	},
	HOME: {
		poster_carousel: {
			price_from: (price, currency) =>
				price != null
					? `от ${formatNumber(price)} ${currency ? ENUM_LABELS.CURRENCY_SYMBOL[currency] : ''}`
					: '',
			schedule_cta: (from, to) => `Расписание ${from} — ${to}`,
			empty: 'Слайды карусели пока не опубликованы',
			go_to_slide: (index) => `Перейти к слайду ${index}`,
		},
		recommendations: {
			default_filters: [
				{ key: 'popular', label: 'Популярные сейчас' },
				{ key: 'weekend', label: 'На выходные' },
				{ key: 'family', label: 'Для семьи' },
				{ key: 'culture', label: 'Город и культура' },
			],
			default_items: {
				popular: [
					{
						id: 'popular-istanbul',
						city: 'Стамбул',
						subtitle: 'Уикенд у Босфора',
						price: 'от 13 500 ₽',
						duration: '5 ч в пути',
						image: 'https://images.unsplash.com/photo-1473957722956-b8e1d4e1f2c4?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'popular-tbilisi',
						city: 'Тбилиси',
						subtitle: 'Вино, гастрономия и термальные бани',
						price: 'от 11 200 ₽',
						duration: '3 ч 20 мин',
						image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'popular-dubai',
						city: 'Дубай',
						subtitle: 'Шопинг и небоскребы',
						price: 'от 21 900 ₽',
						duration: '5 ч 40 мин',
						image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'popular-larnaca',
						city: 'Ларнака',
						subtitle: 'Мягкое море и солнце',
						price: 'от 17 800 ₽',
						duration: '4 ч 50 мин',
						image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
					},
				],
				weekend: [
					{
						id: 'weekend-kazan',
						city: 'Казань',
						subtitle: 'Волга, панорамы и гастрономия',
						price: 'от 4 900 ₽',
						duration: '1 ч 25 мин',
						image: 'https://images.unsplash.com/photo-1610429327123-9aa832895c0f?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'weekend-pskov',
						city: 'Псков',
						subtitle: 'История и неспешные прогулки',
						price: 'от 3 700 ₽',
						duration: '1 ч 40 мин',
						image: 'https://images.unsplash.com/photo-1600343156924-21c26c9540ce?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'weekend-murmansk',
						city: 'Мурманск',
						subtitle: 'Фьорды, китовые сафари и тундра',
						price: 'от 8 300 ₽',
						duration: '2 ч 10 мин',
						image: 'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e3?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'weekend-baku',
						city: 'Баку',
						subtitle: 'Современность и восточная атмосфера',
						price: 'от 9 600 ₽',
						duration: '2 ч 50 мин',
						image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
					},
				],
				family: [
					{
						id: 'family-sochi',
						city: 'Сочи',
						subtitle: 'Парки, море и джазовые вечера',
						price: 'от 6 400 ₽',
						duration: '2 ч 25 мин',
						image: 'https://images.unsplash.com/photo-1518552782250-3ca352ec62c5?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'family-minsk',
						city: 'Минск',
						subtitle: 'Парк развлечений и комфортные отели',
						price: 'от 5 500 ₽',
						duration: '1 ч 50 мин',
						image: 'https://images.unsplash.com/photo-1573481047955-5491d09d79dd?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'family-tivat',
						city: 'Тиват',
						subtitle: 'Адриатика и зеленые бухты',
						price: 'от 18 900 ₽',
						duration: '4 ч 10 мин',
						image: 'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'family-bishkek',
						city: 'Бишкек',
						subtitle: 'Горы, озера и этно-кэмпы',
						price: 'от 12 700 ₽',
						duration: '3 ч 45 мин',
						image: 'https://images.unsplash.com/photo-1572274408440-905f0f7c9cd5?auto=format&fit=crop&w=1200&q=80',
					},
				],
				culture: [
					{
						id: 'culture-rome',
						city: 'Рим',
						subtitle: 'Колизей, музеи и кофе на террасах',
						price: 'от 23 600 ₽',
						duration: '5 ч 20 мин',
						image: 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'culture-prague',
						city: 'Прага',
						subtitle: 'Готические улицы и джаз на барже',
						price: 'от 18 100 ₽',
						duration: '4 ч 40 мин',
						image: 'https://images.unsplash.com/photo-1499510030009-4395efbf22c1?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'culture-samara',
						city: 'Самара',
						subtitle: 'Волга, модерн и архитектурные прогулки',
						price: 'от 4 200 ₽',
						duration: '1 ч 50 мин',
						image: 'https://images.unsplash.com/photo-1514544250970-667a17d4d297?auto=format&fit=crop&w=1200&q=80',
					},
					{
						id: 'culture-yerevan',
						city: 'Ереван',
						subtitle: 'Винодельни, арт-кафе и горные виды',
						price: 'от 10 900 ₽',
						duration: '3 ч 05 мин',
						image: 'https://images.unsplash.com/photo-1613397645110-2a0473e14f28?auto=format&fit=crop&w=1200&q=80',
					},
				],
			},
		},
	},
	BOOKING: {
		progress_steps: {
			passengers: 'Пассажиры',
			confirmation: 'Подтверждение',
			payment: 'Оплата',
			completion: 'Завершение',
		},
		timer_tooltip: 'Время для завершения бронирования',
		step_placeholders: {
			confirmation: 'Шаг подтверждения',
			payment: 'Шаг оплаты',
			completion: 'Шаг завершения',
		},
		flight_details: {
			title: 'Детали рейса',
			from_to: (from, to) => {
				if (!from || !to) return '';
				return `${from} → ${to}`;
			},
			from_to_from: (from, to) => {
				if (!from || !to) return '';
				return `${from} → ${to} → ${from}`;
			},
		},
		buyer_form: {
			title: 'Покупатель',
			pd_agreement: (link) => <>Даю {link('согласие')} на обработку персональных данных</>,
			public_offer: (link) => (
				<>Нажимая «Продолжить», Вы принимаете условия {link('публичной оферты')} ООО «АВЕКСМАР»</>
			),
			summary: {
				total: 'Итого',
				passenger_word: (count) =>
					count % 10 === 1 && count % 100 !== 11
						? `${count} пассажир`
						: count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)
						? `${count} пассажира`
						: `${count} пассажиров`,
				tickets: 'Стоимость перевозки',
				fees: 'Сборы',
				discount: 'Скидка',
			},
		},
		confirmation: {
			passengers_title: 'Пассажиры',
			price_title: 'К оплате',
			buyer_title: 'Покупатель',
			passenger_columns: {
				name: 'Пассажир',
				birth_date: 'Дата рождения',
				gender: 'Пол',
				document: 'Документ',
			},
			price_details: {
				passenger_category: 'Категория пассажиров',
				quantity: 'Кол-во',
				unit_fare_price: 'Цена (ед.)',
				unit_discount: 'Скидка (ед.)',
				final_price: 'Итого',
			},
			payment_button: 'Перейти к оплате',
			invoice_button: 'Выставить счет',
			passenger_categories: {
				adults: 'Взрослые',
				children: 'Дети',
				infants: 'Младенцы',
				infants_seat: 'Младенцы с местом',
			},
		},
		passenger_form: {
			type_labels: {
				adult: 'Взрослый, старше 12 лет',
				child: 'Ребёнок, от 2 до 12 лет',
				infant: 'Младенец, до 2 лет',
				infant_seat: 'Младенец с местом, до 2 лет',
			},
			add_passenger: 'Добавить пассажира',
			last_name: 'Фамилия',
			first_name: 'Имя',
			patronymic_name: 'Отчество (при наличии)',
			name_hint: (requiresCyrillic) => `${requiresCyrillic ? 'Кириллицей' : 'Латиницей'}, как в документе`,
			login_hint: 'Войдите, чтобы выбрать сохранённых пассажиров',
			age_warning_tooltip:
				'Возраст проверяется при регистрации; при несоответствии — доплата до тарифа "Взрослый"',
		},
		payment_form: {
			title: (timeLeft) => `Оплатите бронирование: ${timeLeft}`,
			total: 'К оплате',
			payment_failed: 'Оплата не прошла',
			retry_payment: 'Повторить оплату',
			loading: 'Загрузка формы оплаты...',
			waiting: 'Ожидание токена оплаты...',
			load_error: 'Не удалось загрузить виджет оплаты',
			invoice_waiting: 'Счет отправлен клиенту. Ожидаем оплату...',
			processing_statuses: {
				pending: 'Обрабатываем платёж...',
				waiting_for_capture: 'Ожидаем подтверждения от платёжной системы...',
				default: 'Проверяем статус платежа...',
			},
		},
		completion: {
			download_pdf: 'Скачать PDF-подтверждение',
			title: 'Бронирование завершено',
			price_title: 'Оплачено',
			payment_details: 'Детали платежа',
			buyer: 'Покупатель',
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
		select_flights: 'Выбрать рейсы',
		from_to: (from, to) => {
			if (!from || !to) return '';
			return `${from} → ${to}`;
		},
		pagination: {
			rows_per_page: 'Рейсов на странице',
			displayed_rows: ({ from, to, count }) => {
				return `${from}—${to} из ${count !== -1 ? count : `более чем ${to}`}`;
			},
		},
	},
	SEARCH: {
		form: {
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
			button: 'Найти рейсы',
			passenger_word: (count) =>
				count % 10 === 1 && count % 100 !== 11
					? 'пассажир'
					: count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)
					? 'пассажира'
					: 'пассажиров',
			passenger_categories: [
				{ key: 'adults', label: 'Взрослые', desc: '12 лет и старше' },
				{ key: 'children', label: 'Дети', desc: '2–11 лет' },
				{
					key: 'infants',
					label: 'Младенцы без места',
					desc: 'до 2 лет',
				},
				{
					key: 'infants_seat',
					label: 'Младенцы с местом',
					desc: 'до 2 лет',
				},
			],
		},
		results: 'Результаты поиска',
		no_results: 'Рейсы не найдены',
		from_to_date: (from, to, date_from, date_to) => {
			if (!from || !to) return '';
			if (date_to) return `${from} ⇄ ${to}, ${formatDate(date_from, 'dd.MM')} — ${formatDate(date_to, 'dd.MM')}`;
			if (date_from) return `${from} → ${to}, ${formatDate(date_from, 'dd.MM')}`;
			else return `${from} → ${to}`;
		},
		flight_details: {
			select_tariff_title: 'Выберите тариф',
			select_tariff: 'Перейти к оформлению',
			airline: 'Авиакомпания',
			from_to: 'Отправление — Прибытие',
			departure_arrival: 'Время отправления — Время прибытия',
			departure: 'Вылет',
			arrival: 'Прилёт',
			final_price: 'Итоговая стоимость',
			price: 'Цена',
			flight_note: 'Примечание',
			price_from: (price, currency) =>
				`от ${formatNumber(price)} ${currency ? ENUM_LABELS.CURRENCY_SYMBOL[currency] : ''}`,
			price_exact: (price, currency) =>
				`${formatNumber(price)} ${currency ? ENUM_LABELS.CURRENCY_SYMBOL[currency] : ''}`,
			price_per_passenger: 'за 1 пассажира',
			seats_available: 'Свободных мест',
			seats_unavailable: 'Недостаточно свободных мест',
			tickets: 'Стоимость перевозки',
			fees: 'Сборы',
			tariff_information: 'Информация о тарифе',
			tariff_conditions: 'Условия применения тарифа',
			baggage: (weight) => `Багаж: ${weight} кг`,
			hand_luggage: (weight) => `Ручная кладь: ${weight} кг`,
		},
		sort: {
			label: 'Сортировка',
			price: 'Цена',
			arrival_time: 'Время прибытия',
			arrival_date: 'Дата прибытия',
			departure_time: 'Время отправления',
			departure_date: 'Дата отправления',
			duration: 'Время в пути',
		},
		nearby_dates: {
			title: (from, to) => `Ближайшие даты: ${from} → ${to}`,
			price_date: (date, price, currency) =>
				`${formatDate(date, 'dd.MM')} - ${formatNumber(price)} ${ENUM_LABELS.CURRENCY_SYMBOL[currency] || ''}`,
			no_outbound: 'Нет ближайших рейсов в выбранном направлении',
			no_return: 'Нет ближайших рейсов в обратном направлении',
		},
		show_more: 'Показать еще варианты',
	},
	BOOKING_SEARCH: {
		link: 'Найти бронирование',
		title: 'Найти бронирование',
		subtitle: 'Укажите номер бронирования и данные пассажира, чтобы найти завершенное бронирование',
		booking_number: 'Номер бронирования',
		first_name: 'Имя пассажира',
		last_name: 'Фамилия пассажира',
		button: 'Найти',
		hint_title: 'Где найти номер бронирования?',
		hint_text: 'Он указан в письме-подтверждении',
	},
	SEO: {
		discovery_links: {
			schedule_text: (from, to) => `Расписание ${from} — ${to}`,
		},
	},
};

export const APP_TITLE = UI_LABELS.APP_TITLE;
export const ABOUT = UI_LABELS.ABOUT;
export const BUTTONS = UI_LABELS.BUTTONS;
export const TITLES = UI_LABELS.TITLES;
export const MESSAGES = UI_LABELS.MESSAGES;
export const NAV = UI_LABELS.NAV;
export const AUTH = UI_LABELS.AUTH;
export const PROFILE = UI_LABELS.PROFILE;
export const BOOKING = UI_LABELS.BOOKING;
export const SUCCESS = UI_LABELS.SUCCESS;
export const ERRORS = UI_LABELS.ERRORS;
export const WARNINGS = UI_LABELS.WARNINGS;
export const DOC = UI_LABELS.DOC;
export const HOME = UI_LABELS.HOME;
export const SCHEDULE = UI_LABELS.SCHEDULE;
export const SEARCH = UI_LABELS.SEARCH;
export const BOOKING_SEARCH = UI_LABELS.BOOKING_SEARCH;
export const ADMIN = UI_LABELS.ADMIN;
export const SEO = UI_LABELS.SEO;

export default UI_LABELS;
