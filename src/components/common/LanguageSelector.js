import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../../store/slices/languageSlice';
import { Globe } from 'lucide-react';
import IconButton from './IconButton';

/**
 * Language selector component that allows switching between English and Hebrew
 * 
 * @returns {JSX.Element} The language selector component
 */
const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { language } = useSelector(state => state.language);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLanguage);
    dispatch(setLanguage(newLanguage));
  };

  return (
    <IconButton 
      icon={Globe} 
      text={language === 'en' ? t('languages.he') : t('languages.en')} 
      variant="secondary" 
      size="sm" 
      onClick={toggleLanguage}
    />
  );
};

export default LanguageSelector;
