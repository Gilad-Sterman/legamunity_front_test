import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSliceSupabase';
import sessionsReducer from './slices/sessionsSliceSupabase';
import languageReducer from './slices/languageSlice';
import adminReducer from './slices/adminSlice';
import schedulingReducer from './slices/schedulingSlice';
import draftsReducer from './slices/draftsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sessions: sessionsReducer,
    language: languageReducer,
    admin: adminReducer,
    scheduling: schedulingReducer,
    drafts: draftsReducer,
    // Add more reducers here as we develop them
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
