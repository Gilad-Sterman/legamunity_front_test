import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  language: localStorage.getItem('language') || 'en', // Default to English if not set
  direction: localStorage.getItem('language') === 'he' ? 'rtl' : 'ltr',
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      const lang = action.payload;
      state.language = lang;
      state.direction = lang === 'he' ? 'rtl' : 'ltr';
      localStorage.setItem('language', lang);
      document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
