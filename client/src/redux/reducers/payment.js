import { createSlice } from '@reduxjs/toolkit';
import {
        createPayment,
        fetchPayment,
        fetchPayments,
        fetchPaymentById,
        createPaymentAdmin,
        updatePayment,
        deletePayment,
} from '../actions/payment';
import { handlePending, handleRejected, addCrudCases } from '../utils';

const initialState = {
        payments: [],
        payment: null,
        current: null,
        isLoading: false,
        errors: null,
};

const paymentSlice = createSlice({
        name: 'payment',
        initialState,
        reducers: {},
        extraReducers: (builder) => {
                addCrudCases(
                        builder,
                        {
                                fetchAll: fetchPayments,
                                fetchOne: fetchPaymentById,
                                create: createPaymentAdmin,
                                update: updatePayment,
                                remove: deletePayment,
                        },
                        'payments',
                        'payment'
                );

                builder
                        .addCase(createPayment.pending, handlePending)
                        .addCase(createPayment.rejected, handleRejected)
                        .addCase(createPayment.fulfilled, (state, action) => {
                                state.current = action.payload;
                                state.isLoading = false;
                        })
                        .addCase(fetchPayment.pending, handlePending)
                        .addCase(fetchPayment.rejected, handleRejected)
                        .addCase(fetchPayment.fulfilled, (state, action) => {
                                state.current = action.payload;
                                state.isLoading = false;
                        });
        },
});

export default paymentSlice.reducer;
