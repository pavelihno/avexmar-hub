export const mappingConfigs = {
	passenger: [
		['id', 'id'],
		['category', 'category'],
		['last_name', 'lastName'],
		['first_name', 'firstName'],
		['patronymic_name', 'patronymicName'],
		['gender', 'gender'],
		['birth_date', 'birthDate'],
		['document_type', 'documentType'],
		['document_number', 'documentNumber'],
		['document_expiry_date', 'documentExpiryDate'],
		['citizenship_id', 'citizenshipId'],
	],
	buyer: [
		['buyer_last_name', 'buyerLastName'],
		['buyer_first_name', 'buyerFirstName'],
		['email_address', 'emailAddress'],
		['phone_number', 'phoneNumber'],
		['consent', 'consent'],
	],
};

export function mapFromApi(src = {}, pairs = [], defaults = {}) {
	const result = {};
	for (const [apiKey, clientKey] of pairs) {
		let value = src ? src[apiKey] : undefined;
		if (value === undefined || value === null) value = defaults[clientKey] ?? '';
		result[clientKey] = value;
	}
	return result;
}

export function mapToApi(src = {}, pairs = []) {
	const out = {};
	for (const [apiKey, clientKey] of pairs) {
		const v = src[clientKey];
		if (v !== undefined) out[apiKey] = v;
	}
	return out;
}
