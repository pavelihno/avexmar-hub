import { createSlice } from '@reduxjs/toolkit';
import { calculatePrice } from '../actions/price';
import { handlePending, handleRejected } from '../utils';

const initialState = {
    cache: {},
    current: null,
    isLoading: false,
    errors: null,
};

const priceSlice = createSlice({
    name: 'price',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(calculatePrice.pending, handlePending)
            .addCase(calculatePrice.rejected, handleRejected)
            .addCase(calculatePrice.fulfilled, (state, action) => {
                const { key, data } = action.payload;
                state.cache[key] = data;
                state.current = data;
                state.isLoading = false;
            });
    },
});

export default priceSlice.reducer;
