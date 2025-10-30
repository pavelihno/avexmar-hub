import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';

import {
	fetchUsers,
	createUser,
	updateUser,
	deleteUser,
	deleteAllUsers,
	deleteFilteredUsers,
} from '../../../redux/actions/user';
import { createAdminManager } from '../utils';
import { FIELD_TYPES } from '../../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../../constants';

const UserManagement = () => {
	const dispatch = useDispatch();
	const { users, isLoading, errors } = useSelector((state) => state.users);

	useEffect(() => {
		dispatch(fetchUsers());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		email: {
			key: 'email',
			apiKey: 'email',
			label: FIELD_LABELS.USER.email,
			type: FIELD_TYPES.EMAIL,
			validate: (value) => (!value ? VALIDATION_MESSAGES.USER.email.REQUIRED : null),
		},
		role: {
			key: 'role',
			apiKey: 'role',
			label: FIELD_LABELS.USER.role,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('USER_ROLE'),
			formatter: (value) => ENUM_LABELS.USER_ROLE[value] || value,
		},
		isActive: {
			key: 'isActive',
			apiKey: 'is_active',
			label: FIELD_LABELS.USER.is_active,
			type: FIELD_TYPES.BOOLEAN,
			formatter: (value) => ENUM_LABELS.BOOLEAN[value] || value,
		},
		isLocked: {
			key: 'isLocked',
			apiKey: 'is_locked',
			label: FIELD_LABELS.USER.is_locked,
			type: FIELD_TYPES.BOOLEAN,
			formatter: (value) => ENUM_LABELS.BOOLEAN[value] || value,
		},
		failedLoginAttempts: {
			key: 'failedLoginAttempts',
			apiKey: 'failed_login_attempts',
			label: FIELD_LABELS.USER.failed_login_attempts,
			type: FIELD_TYPES.NUMBER,
			excludeFromForm: true,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.users.add_button,
		editButtonText: (item) => UI_LABELS.ADMIN.modules.users.edit_button,
	});

	const handleAddUser = (data) => dispatch(createUser(adminManager.toApiFormat(data))).unwrap();
	const handleEditUser = (data) => {
		const updated = { ...data };
		if (updated.isLocked === false) {
			updated.failedLoginAttempts = 0;
		}
		return dispatch(updateUser(adminManager.toApiFormat(updated))).unwrap();
	};
	const handleDeleteUser = (id) => dispatch(deleteUser(id)).unwrap();

	const handleDeleteAllUsers = async () => {
		await dispatch(deleteAllUsers()).unwrap();
		dispatch(fetchUsers());
	};
	const handleDeleteFilteredUsers = async (ids) => {
		if (!ids?.length) return;
		await dispatch(deleteFilteredUsers(ids)).unwrap();
		dispatch(fetchUsers());
	};

	const formattedUsers = users.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.users.management}
			data={formattedUsers}
			columns={adminManager.columns}
			onAdd={handleAddUser}
			onEdit={handleEditUser}
			onDelete={handleDeleteUser}
			onDeleteAll={handleDeleteAllUsers}
			onDeleteFiltered={handleDeleteFilteredUsers}
			renderForm={adminManager.renderForm}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default UserManagement;
