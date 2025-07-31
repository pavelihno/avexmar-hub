import { createSlice } from '@reduxjs/toolkit';
import {
    fetchTimezones,
    fetchTimezone,
    createTimezone,
    updateTimezone,
    deleteTimezone,
} from '../actions/timezone';
import { addCrudCases } from '../utils';

const initialState = {
    timezones: [],
    timezone: null,
    isLoading: false,
    errors: null,
};

const timezoneSlice = createSlice({
    name: 'timezones',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        addCrudCases(
            builder,
            {
                fetchAll: fetchTimezones,
                fetchOne: fetchTimezone,
                create: createTimezone,
                update: updateTimezone,
                remove: deleteTimezone,
            },
            'timezones',
            'timezone'
        );
    },
});

export default timezoneSlice.reducer;
