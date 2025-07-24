import AdminEntityForm from './AdminEntityForm';
import { createFormFields } from '../utils';

/**
 * Create column configurations for AdminDataTable
 */
export const createTableColumns = (fields) => {
	return Object.values(fields)
		.filter((field) => field.key !== 'id' && !field.excludeFromTable)
		.map((field) => {
			const column = {
				field: field.key,
				header: field.label,
				formatter: field.formatter,
				render: field.renderField ? (item) => field.renderField(item) : null,
				type: field.type,
				options: field.options,
			};

			return column;
		});
};

/**
 * Generate a function to transform UI data to API format
 */
export const createToApiFormatter = (fields) => {
	return (uiData) => {
		const result = {};

		Object.values(fields).forEach((field) => {
			if (field.apiKey) {
				// Handle special transformations if needed
				if (field.toApi) {
					result[field.apiKey] = field.toApi(uiData[field.key]);
				} else {
					result[field.apiKey] = uiData[field.key];
				}
			}
		});

		// ID is handled specially since it's optional (not present for new items)
		if (uiData.id) {
			result.id = uiData.id;
		}

		return result;
	};
};

/**
 * Generate a function to transform API data to UI format
 */
export const createToUiFormatter = (fields) => {
	return (apiData) => {
		const result = { id: apiData.id };

		Object.values(fields).forEach((field) => {
			if (field.key !== 'id' && field.apiKey) {
				if (field.toUi) {
					result[field.key] = field.toUi(apiData[field.apiKey]);
				} else {
					result[field.key] = apiData[field.apiKey];
				}
			}
		});

		return result;
	};
};

/**
 * Create a complete set of admin management props
 */
export const createAdminManager = (fields, options = {}) => {
	const formFields = createFormFields(fields);
	const columns = createTableColumns(fields);
	const toApiFormat = createToApiFormatter(fields);
	const toUiFormat = createToUiFormatter(fields);

	return {
		fields,
		formFields,
		columns,
		toApiFormat,
		toUiFormat,
		renderForm: ({ isEditing, currentItem, onSave, onChange, onClose, externalUpdates }) => (
			<AdminEntityForm
				fields={formFields}
				initialData={currentItem}
				onSave={onSave}
				onChange={onChange}
				onClose={onClose}
				externalUpdates={externalUpdates}
				isEditing={isEditing}
				addButtonText={options.addButtonText(currentItem)}
				editButtonText={options.editButtonText(currentItem)}
			/>
		),
	};
};
