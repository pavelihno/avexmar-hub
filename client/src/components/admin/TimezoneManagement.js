import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';
import {
    fetchTimezones,
    createTimezone,
    updateTimezone,
    deleteTimezone,
} from '../../redux/actions/timezone';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

const TimezoneManagement = () => {
    const dispatch = useDispatch();
    const { timezones, isLoading, errors } = useSelector((state) => state.timezones);

    useEffect(() => {
        dispatch(fetchTimezones());
    }, [dispatch]);

    const FIELDS = {
        id: { key: 'id', apiKey: 'id' },
        name: {
            key: 'name',
            apiKey: 'name',
            label: FIELD_LABELS.TIMEZONE.name,
            type: FIELD_TYPES.TEXT,
            validate: (v) => (!v ? VALIDATION_MESSAGES.TIMEZONE.name.REQUIRED : null),
        },
    };

    const adminManager = createAdminManager(FIELDS, {
        addButtonText: () => UI_LABELS.ADMIN.modules.timezones.add_button,
        editButtonText: () => UI_LABELS.ADMIN.modules.timezones.edit_button,
    });

    const handleAdd = (data) => dispatch(createTimezone(adminManager.toApiFormat(data))).unwrap();
    const handleEdit = (data) => dispatch(updateTimezone(adminManager.toApiFormat(data))).unwrap();
    const handleDelete = (id) => dispatch(deleteTimezone(id)).unwrap();

    const formatted = timezones.map(adminManager.toUiFormat);

    return (
        <AdminDataTable
            title={UI_LABELS.ADMIN.modules.timezones.management}
            data={formatted}
            columns={adminManager.columns}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            renderForm={adminManager.renderForm}
            addButtonText={UI_LABELS.ADMIN.modules.timezones.add_button}
            isLoading={isLoading}
            error={errors}
        />
    );
};

export default TimezoneManagement;
