import { createSlice } from '@reduxjs/toolkit';
import {
        fetchConsentDocs,
        fetchConsentDoc,
        createConsentDoc,
        updateConsentDoc,
        deleteConsentDoc,
} from '../actions/consentDoc';
import { addCrudCases } from '../utils';

const initialState = {
        consentDocs: [],
        consentDoc: null,
        isLoading: false,
        errors: null,
};

const consentDocSlice = createSlice({
        name: 'consentDocs',
        initialState,
        reducers: {},
        extraReducers: (builder) => {
                addCrudCases(
                        builder,
                        {
                                fetchAll: fetchConsentDocs,
                                fetchOne: fetchConsentDoc,
                                create: createConsentDoc,
                                update: updateConsentDoc,
                                remove: deleteConsentDoc,
                        },
                        'consentDocs',
                        'consentDoc'
                );
        },
});

export default consentDocSlice.reducer;
