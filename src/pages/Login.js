import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Eye, EyeOff } from 'lucide-react';
import { login, register, clearError } from '../store/slices/authSliceSupabase';
import { setLanguage } from '../store/slices/languageSlice';
import '../styles/main.scss';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });
  const { loading, error, isAuthenticated, user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.language);
  const { t, i18n } = useTranslation();
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { email, password, displayName, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLanguage);
    dispatch(setLanguage(newLanguage));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
  };

  useEffect(() => {
    // Clear any previous errors when component mounts
    dispatch(clearError());
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      // Redirect admin users to admin dashboard, others to regular dashboard
      const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(redirectPath);
    }
  }, [dispatch, isAuthenticated, user, navigate]);

  const validateForm = () => {
    if (!isLogin && password !== confirmPassword) {
      dispatch({ 
        type: 'auth/register/rejected', 
        payload: t('register.passwordsDoNotMatch')
      });
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isLogin) {
      dispatch(login({ email, password }));
    } else {
      dispatch(register({ email, password, displayName }));
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{isLogin ? t('login.title') : t('register.title')}</h1>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <form className="login-form" onSubmit={onSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="display-name" className="form-label">
                {t('register.nameLabel')}
              </label>
              <input
                id="display-name"
                name="displayName"
                type="text"
                autoComplete="name"
                required={!isLogin}
                className="form-control"
                placeholder={t('register.namePlaceholder')}
                value={displayName}
                onChange={onChange}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email-address" className="form-label">
              {t('login.emailLabel')}
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-control"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={onChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('login.passwordLabel')}
            </label>
            <div className="password-input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="form-control"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={onChange}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">
                {t('register.confirmPasswordLabel')}
              </label>
              <div className="password-input-container">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required={!isLogin}
                  className="form-control"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={onChange}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block btn-login"
          >
            {loading 
              ? (isLogin ? t('login.signingIn') : t('register.registering'))
              : (isLogin ? t('login.signIn') : t('register.register'))}
          </button>
          
          <div className="auth-toggle">
            <p>
              {isLogin 
                ? t('login.noAccount') 
                : t('register.haveAccount')}
              <button 
                type="button"
                className="auth-toggle-btn"
                onClick={toggleAuthMode}
              >
                {isLogin ? t('login.registerNow') : t('register.loginNow')}
              </button>
            </p>
          </div>
        </form>
        <div className="login-language-selector">
          <button onClick={toggleLanguage} className="btn btn-secondary btn-sm language-btn">
            <Globe size={16} />
            <span>{language === 'en' ? t('languages.hebrew') : t('languages.english')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
