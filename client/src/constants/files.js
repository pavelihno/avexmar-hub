export const FILE_NAMES = {
	AIRLINES_TEMPLATE: 'Шаблон авиакомпаний.xlsx',
	FLIGHTS_TEMPLATE: 'Шаблон рейсов.xlsx',
	TIMEZONES_TEMPLATE: 'Шаблон часовых поясов.xlsx',
	COUNTRIES_TEMPLATE: 'Шаблон стран.xlsx',
	AIRPORTS_TEMPLATE: 'Шаблон аэропортов.xlsx',
	UPLOAD_ERRORS: 'Ошибки загрузки.xlsx',
};

export const FILE_NAME_TEMPLATES = {
	BOOKING_PDF: (bookingNumber) => `Бронирование ${bookingNumber}.pdf`,
	FLIGHT_PASSENGERS_EXPORT: (flightNumber, date) => `Пассажиры рейса ${flightNumber || ''}_${date || ''}.xls`,
};
