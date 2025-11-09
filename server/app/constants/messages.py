class ModelMessages:
    LIST_OF_IDS_REQUIRED = 'Требуется список идентификаторов'
    IDS_MUST_BE_INTEGERS = 'Идентификаторы должны быть целыми числами'
    MUST_BE_UNIQUE = 'должно быть уникальным'

    @staticmethod
    def not_found(model_name: str) -> str:
        return f'{model_name} не найден'


class AuthMessages:
    EMAIL_PASSWORD_REQUIRED = 'Требуется электронная почта и пароль'
    USER_ALREADY_EXISTS = 'Пользователь уже существует'
    ACTIVATION_INSTRUCTIONS_SENT = 'Инструкции по активации отправлены'
    INVALID_EMAIL_OR_PASSWORD = 'Неверный электронная почта или пароль'
    ACCOUNT_LOCKED = 'Аккаунт заблокирован из-за слишком большого количества неудачных попыток входа'
    TWO_FACTOR_REQUIRED = 'Требуется двухфакторная аутентификация'
    USER_NOT_FOUND = 'Пользователь не найден'
    VERIFICATION_CODE_SENT = 'Код подтверждения отправлен'
    INVALID_REQUEST = 'Неверный запрос'
    INVALID_CODE = 'Неверный код'
    EMAIL_REQUIRED = 'Требуется электронная почта'
    PASSWORD_RESET_INSTRUCTIONS_SENT = 'Инструкции по сбросу пароля отправлены'
    INVALID_OR_EXPIRED_TOKEN = 'Недействительный или просроченный токен'
    ACCOUNT_ALREADY_ACTIVATED = 'Аккаунт уже активирован'
    ACCOUNT_ACTIVATED = 'Аккаунт активирован'


class BookingMessages:
    FORBIDDEN = 'Запрещено'
    BOOKING_DETAILS_REQUIRED = 'Требуются номер бронирования, фамилия и имя'
    BOOKING_NOT_FOUND = 'Бронирование не найдено'
    BOOKING_FOUND = 'Бронирование найдено'

    @staticmethod
    def illegal_transition(from_status: str, to_status: str) -> str:
        return f'Недопустимый переход статуса: {from_status} -> {to_status}'


class UserMessages:
    USER_NOT_CREATED = 'Пользователь не создан'
    CONSENT_REQUIRED = 'Требуется согласие'
    INVALID_PASSWORD = 'Неверный пароль'
    INVALID_OR_EXPIRED_CODE = 'Недействительный или просроченный код'
    PASSENGER_ALREADY_EXISTS = 'Пассажир с такими данными уже существует'


class ConsentMessages:
    INVALID_TYPE = 'Неверный тип'


class PassengerMessages:
    FLIGHT_REQUIRED = 'Требуется указать рейс'


class CountryMessages:
    INVALID_COUNTRY_CODE = 'Неверный код страны'


class AirlineMessages:
    INVALID_AIRLINE_CODE = 'Неверный код авиакомпании'


class AircraftMessages:
    INVALID_SEAT_NUMBER = 'Некорректное значение количества мест'
    SEATS_MUST_BE_NON_NEGATIVE = 'Количество мест должно быть неотрицательным'


class AirportMessages:
    INVALID_AIRPORT_CODE = 'Неверный код аэропорта'
    INVALID_ORIGIN_AIRPORT_CODE = 'Неверный код аэропорта отправления'
    INVALID_DESTINATION_AIRPORT_CODE = 'Неверный код аэропорта прибытия'


class RouteMessages:
    ROUTE_NOT_FOUND = 'Маршрут не найден'


class SearchMessages:
    UNKNOWN_ORIGIN_OR_DESTINATION = 'Неизвестный аэропорт отправления или назначения'
    ORIGIN_AND_DESTINATION_REQUIRED = 'Требуются аэропорт отправления и назначения'


class FlightMessages:
    FLIGHT_NUMBER_ALREADY_EXISTS = 'Рейс с таким номером уже существует для данной авиакомпании и маршрута'

    @staticmethod
    def incomplete_tariff_data(seat_class, seats_number, tariff_number) -> str:
        return f'Неполные данные тарифа: Класс обслуживания `{seat_class}`, Количество мест `{seats_number}`, Номер тарифа `{tariff_number}`'

    @staticmethod
    def duplicate_tariff(seat_class, seats_number, tariff_number) -> str:
        return f'Дублирующийся тариф: Класс обслуживания `{seat_class}`, Количество мест `{seats_number}`, Номер тарифа `{tariff_number}`'

    @staticmethod
    def invalid_tariff_number_or_class(seat_class, seats_number, tariff_number) -> str:
        return f'Недействительный номер тарифа или класс: Класс обслуживания `{seat_class}`, Количество мест `{seats_number}`, Номер тарифа `{tariff_number}`'


class FlightTariffMessages:
    INVALID_AVAILABLE_SEATS = 'Некорректное значение свободных мест'
    AVAILABLE_SEATS_MUST_BE_NON_NEGATIVE = 'Количество свободных мест должно быть неотрицательным'
    INVALID_TOTAL_SEATS = 'Некорректное значение общего количества мест'
    TOTAL_SEATS_MUST_BE_NON_NEGATIVE = 'Общее количество мест должно быть неотрицательным'

    @staticmethod
    def seats_exceed_aircraft_capacity(seat_class, aircraft_type, capacity, requested):
        return (
            f'Общее количество мест ({requested}) для класса `{seat_class}` превышает вместимость '
            f'воздушного судна `{aircraft_type}` ({capacity})'
        )


class ExportMessages:
    PUBLIC_ID_REQUIRED = 'Требуется идентификатор бронирования'


class DevMessages:
    INVALID_TABLE_NAME = 'Неверное имя таблицы'


class FileMessages:
    NO_FILE_PROVIDED = 'Файл не предоставлен'
    INVALID_FILE_TYPE = 'Неверный тип файла'
    FILE_REQUIRED = 'Требуется файл'
    INVALID_PATH = 'Неверный путь'
    FILE_NOT_FOUND = 'Файл не найден'
    IMPORT_COMPLETED = 'Импорт успешно завершен'
    FILENAME_REQUIRED = 'Требуется указать имя файла'
    XLS_NOT_SUPPORTED = 'XLS файлы не поддерживаются'

    @staticmethod
    def unsupported_content_type(content_type) -> str:
        return f'Неподдерживаемый тип содержимого: {content_type}'


class ErrorMessages:
    FAILED_TO_SEND_EMAIL = 'Не удалось отправить письмо'
    INTERNAL_SERVER_ERROR = 'Внутренняя ошибка сервера'
    AUTHENTICATION_FAILED = 'Ошибка аутентификации'
    ACCESS_DENIED = 'Доступ запрещен'
    OPERATION_NOT_PERMITTED = 'Операция не разрешена'


class DateTimeMessages:
    @staticmethod
    def does_not_match_formats(value, formats) -> str:
        return f"'{value}' не соответствует ни одному из форматов {list(formats)}"

    @staticmethod
    def invalid_iso_format(value) -> str:
        return f"'{value}' не соответствует формату ISO 8601"

    @staticmethod
    def unsupported_type(kind: str, value_type) -> str:
        return f'Неподдерживаемый тип {kind}: {value_type}'


class XlsxMessages:
    REQUIRED_FIELD = 'ОБЯЗАТЕЛЬНОЕ ПОЛЕ'
    ALLOWED_VALUES = 'Допустимые значения'
    DATE_FORMAT_LABEL = 'Формат даты'
    DATE_FORMAT_EXAMPLE = 'например: 31.12.2025'
    TIME_FORMAT_LABEL = 'Формат времени'
    TIME_FORMAT_EXAMPLE = 'например: 14:30'
    NUMERIC_VALUE = 'Числовое значение'
    TEXT_VALUE = 'Текстовое значение'
    FIELD_COLUMN_HEADER = 'Поле'
    RULES_COLUMN_HEADER = 'Правила заполнения'
    DATA_SHEET_NAME = 'Загрузка данных'
    RULES_SHEET_NAME = 'Правила заполнения'

    @staticmethod
    def missing_required_fields(field_names) -> str:
        formatted = ', '.join(field_names)
        return f'Отсутствуют обязательные поля: {formatted}'

    @staticmethod
    def template_not_supported(model_name: str) -> str:
        return f'{model_name} не поддерживает генерацию XLSX шаблона'

    @staticmethod
    def upload_not_supported(model_name: str) -> str:
        return f'{model_name} не поддерживает загрузку из файла'


class TicketMessages:
    BOOKING_REQUIRED = 'Необходимо указать бронирование'
    PASSENGER_REQUIRED = 'Необходимо указать пассажира'
    FLIGHT_REQUIRED = 'Необходимо указать рейс'
    BOOKING_FLIGHT_PASSENGER_REQUIRED = 'Необходимо указать связь бронирование-рейс-пассажир'

    IMPORT_NO_HEADER = 'Не удалось найти таблицу пассажиров в файле'
    IMPORT_NO_PASSENGERS = 'В файле не найдено ни одного пассажира'
    IMPORT_FLIGHT_NOT_FOUND = 'Не удалось найти рейс по указанным данным'
    IMPORT_MULTIPLE_FLIGHTS_FOUND = 'Найдено несколько рейсов по указанным данным'
    IMPORT_BOOKINGS_NOT_FOUND = 'Не удалось найти бронирования по указанным пассажирам'
    IMPORT_PASSENGERS_NOT_MATCHED = 'Не удалось сопоставить пассажиров из файла с пассажирами в бронированиях'
    IMPORT_PASSENGERS_MULTIPLE_MATCHES = 'Найдено несколько бронирований по заданным пассажирам'

    IMPORT_PASSENGERS_PAYLOAD_REQUIRED = 'Список пассажиров обязателен для подтверждения импорта'
    IMPORT_TICKETS_DUPLICATE_NUMBER = 'Невозможно создать билет: номер уже используется'

    @staticmethod
    def import_summary(created: int, skipped: int) -> str:
        return f'Создано билетов: {created}. Пропущено: {skipped}.'
