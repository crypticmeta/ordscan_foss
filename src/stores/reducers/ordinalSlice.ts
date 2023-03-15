import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'
import { Inscription } from 'types';
export interface ordinalState {
    ordinal: Inscription;
    loading: boolean;
}

const initialState: ordinalState = {
    ordinal: null,
    loading: false,
}
export const ordinalSlice = createSlice({
    name: 'ordinal',
    initialState,
    reducers: {
        setOrdinal: (state, action: PayloadAction<Inscription>) => {
            state.loading = false;
            state.ordinal=action.payload;
        },
        setOrdinalLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = true;
        },
    }
});

// this is for dispatch
export const { setOrdinal } = ordinalSlice.actions;

// this is for configureStore
export default ordinalSlice.reducer;