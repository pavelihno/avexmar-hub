import { createSlice } from '@reduxjs/toolkit';
import { createPayment, fetchPayment } from '../actions/payment';
import { handlePending, handleRejected } from '../utils';

const initialState = {
        current: null,
        isLoading: false,
        errors: null,
};

const paymentSlice = createSlice({
        name: 'payment',
        initialState,
        reducers: {},
        extraReducers: (builder) => {
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
