import { createSlice } from '@reduxjs/toolkit';

import {
        fetchFees,
        fetchFee,
        createFee,
        updateFee,
        deleteFee,
} from '../actions/fee';
import { addCrudCases } from '../utils';

const initialState = {
        fees: [],
        fee: null,
        isLoading: false,
        errors: null,
};

const feeSlice = createSlice({
        name: 'fees',
        initialState,
        reducers: {},
        extraReducers: (builder) => {
                addCrudCases(
                        builder,
                        {
                                fetchAll: fetchFees,
                                fetchOne: fetchFee,
                                create: createFee,
                                update: updateFee,
                                remove: deleteFee,
                        },
                        'fees',
                        'fee',
                );
        },
});

export default feeSlice.reducer;
