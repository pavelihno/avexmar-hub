export const FILE_NAMES = {
	AIRLINES_TEMPLATE: 'Шаблон авиакомпаний.xlsx',
	FLIGHTS_TEMPLATE: 'Шаблон рейсов.xlsx',
	TIMEZONES_TEMPLATE: 'Шаблон часовых поясов.xlsx',
	COUNTRIES_TEMPLATE: 'Шаблон стран.xlsx',
	AIRPORTS_TEMPLATE: 'Шаблон аэропортов.xlsx',
	AIRLINES_DATA: 'Авиакомпании.xlsx',
	FLIGHTS_DATA: 'Рейсы.xlsx',
	TIMEZONES_DATA: 'Часовые пояса.xlsx',
	COUNTRIES_DATA: 'Страны.xlsx',
	AIRPORTS_DATA: 'Аэропорты.xlsx',
	UPLOAD_ERRORS: 'Ошибки загрузки.xlsx',
};

export const FILE_NAME_TEMPLATES = {
	BOOKING_PDF: (bookingNumber) => `Бронирование ${bookingNumber}.pdf`,
	ITINERARY_PDF: (bookingNumber, flightNumber, date) => `МК ${bookingNumber} ${flightNumber} ${date}.pdf`,
	FLIGHT_PASSENGERS_EXPORT: (flightNumber, date, timestamp) =>
		`Пассажиры рейса ${flightNumber || ''} ${date || ''}. ${timestamp}.xls`,
	PENDING_PASSENGERS_EXPORT: (fromDate, toDate, timestamp) => {
		const isAll = !fromDate && !toDate;
		return `Пассажиры без билетов. ${isAll ? 'Все' : `${`${fromDate}` || ''} ${toDate || ''}`}. ${timestamp}.zip`;
	},
};
