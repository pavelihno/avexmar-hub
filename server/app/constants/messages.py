class ModelMessages:
    LIST_OF_IDS_REQUIRED = 'List of ids is required'
    IDS_MUST_BE_INTEGERS = 'Ids must be integers'

class AuthMessages:
    EMAIL_PASSWORD_REQUIRED = 'Email and password are required'
    USER_ALREADY_EXISTS = 'User already exists'
    ACTIVATION_INSTRUCTIONS_SENT = 'Activation instructions sent'
    INVALID_EMAIL_OR_PASSWORD = 'Invalid email or password'
    ACCOUNT_LOCKED = 'Account is locked due to too many failed login attempts'
    TWO_FACTOR_REQUIRED = 'Two-factor authentication required'
    USER_NOT_FOUND = 'User not found'
    VERIFICATION_CODE_SENT = 'Verification code sent'
    INVALID_REQUEST = 'Invalid request'
    INVALID_CODE = 'Invalid code'
    EMAIL_REQUIRED = 'Email is required'
    PASSWORD_RESET_INSTRUCTIONS_SENT = 'Password reset instructions sent'
    INVALID_OR_EXPIRED_TOKEN = 'Invalid or expired token'
    ACCOUNT_ALREADY_ACTIVATED = 'Account already activated'
    ACCOUNT_ACTIVATED = 'Account activated'


class BookingMessages:
    FORBIDDEN = 'Forbidden'
    BOOKING_DETAILS_REQUIRED = 'booking_number, first_name and last_name required'
    BOOKING_NOT_FOUND = 'booking not found'
    BOOKING_FOUND = 'booking found'


class UserMessages:
    USER_NOT_CREATED = 'User not created'
    CONSENT_REQUIRED = 'Consent required'
    USER_NOT_FOUND = AuthMessages.USER_NOT_FOUND
    FORBIDDEN = BookingMessages.FORBIDDEN
    INVALID_PASSWORD = 'Invalid password'
    INVALID_OR_EXPIRED_CODE = 'Invalid or expired code'
    VERIFICATION_CODE_SENT = AuthMessages.VERIFICATION_CODE_SENT


class ConsentMessages:
    INVALID_TYPE = 'invalid type'


class FileMessages:
    NO_FILE_PROVIDED = 'No file provided'
    INVALID_FILE_TYPE = 'Invalid file type'
    FILE_REQUIRED = 'file is required'
    INVALID_PATH = 'Invalid path'
    FILE_NOT_FOUND = 'File not found'
    IMPORT_COMPLETED = 'Import completed successfully'


class PassengerMessages:
    FLIGHT_AND_DATE_REQUIRED = 'flight_id and date are required'
    FLIGHT_DATE_MISMATCH = 'Flight date mismatch'


class ExportMessages:
    PUBLIC_ID_REQUIRED = 'public_id required'


class DevMessages:
    INVALID_TABLE_NAME = 'Invalid table name'


class ErrorMessages:
    FAILED_TO_SEND_EMAIL = 'Failed to send email'
    INTERNAL_SERVER_ERROR = 'Internal server error'
    AUTHENTICATION_FAILED = 'Authentication failed'
    ACCESS_DENIED = 'Access denied'
    OPERATION_NOT_PERMITTED = 'Operation not permitted'


class DateTimeMessages:
    @staticmethod
    def does_not_match_formats(value, formats) -> str:
        return f"'{value}' does not match any of {list(formats)}"

    @staticmethod
    def invalid_iso_format(value) -> str:
        return f"'{value}' does not match ISO 8601 format"

    @staticmethod
    def unsupported_type(kind: str, value_type) -> str:
        return f'Unsupported {kind} type {value_type}'


class XlsxMessages:
    @staticmethod
    def missing_required_fields(field_names) -> str:
        formatted = ', '.join(field_names)
        return f'Missing required fields: {formatted}'


