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


class UserMessages:
    USER_NOT_CREATED = 'Пользователь не создан'
    CONSENT_REQUIRED = 'Требуется согласие'
    USER_NOT_FOUND = AuthMessages.USER_NOT_FOUND
    FORBIDDEN = BookingMessages.FORBIDDEN
    INVALID_PASSWORD = 'Неверный пароль'
    INVALID_OR_EXPIRED_CODE = 'Недействительный или просроченный код'
    VERIFICATION_CODE_SENT = AuthMessages.VERIFICATION_CODE_SENT


class ConsentMessages:
    INVALID_TYPE = 'Неверный тип'


class PassengerMessages:
    FLIGHT_REQUIRED = 'Требуются указать рейс'


class CountryMessages:
    INVALID_COUNTRY_CODE = 'Неверный код страны'


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
    @staticmethod
    def missing_required_fields(field_names) -> str:
        formatted = ', '.join(field_names)
        return f'Отсутствуют обязательные поля: {formatted}'
