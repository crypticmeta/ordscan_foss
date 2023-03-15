import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { ordinalSlice, orderbookSlice } from './reducers';
import thunk from 'redux-thunk';
import { persistReducer, persistStore } from 'redux-persist';
import storageSession from 'reduxjs-toolkit-persist/lib/storage/session'
const persistConfig = {
    key: 'root', 
    storage:storageSession,
}
const rootReducer = combineReducers({
    ordinal: ordinalSlice,
    orderbook: orderbookSlice
})
const persistedReducer = persistReducer(persistConfig, rootReducer)
export const store = configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: [thunk]
});
export const persistor = persistStore(store)
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch