import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'
export interface orderbookState {
    orderbook: any[];
    loading: boolean;
    lastUpdated: number;
}

const initialState: orderbookState = {
    orderbook: null,
    loading: false,
    lastUpdated: 0,
}
export const orderbookSlice = createSlice({
    name: 'orderbook',
    initialState,
    reducers: {
        setOrderbook: (state, action: PayloadAction<any[]>) => {
            state.loading = false;
            state.orderbook = action.payload;
            state.lastUpdated = new Date().valueOf()
        },
        setOrderbookLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    }
});

// this is for dispatch
export const { setOrderbook, setOrderbookLoading} = orderbookSlice.actions;

// this is for configureStore
export default orderbookSlice.reducer;