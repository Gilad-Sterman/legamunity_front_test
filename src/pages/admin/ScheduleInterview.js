import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, User, MapPin, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import {
  scheduleInterview,
  fetchUsers,
  fetchSessions,
  updateScheduleField,
  resetScheduleForm,
  clearError,
  clearSuccess
} from '../../store/slices/schedulingSlice';
import { fetchAdminUsers } from '../../store/slices/adminSlice';

const ScheduleInterview = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const {
    // users,
    sessions,
    scheduledSessions,
    currentSchedule,
    loading,
    sessionsLoading,
    error,
    success
  } = useSelector((state) => state.scheduling);
  const { users } = useSelector(state => state.admin);

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Fetch users and sessions when component mounts
    // dispatch(fetchUsers());
    dispatch(fetchSessions());
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  useEffect(() => {
    // Clear success message after 3 seconds
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleFieldChange = (field, value) => {
    dispatch(updateScheduleField({ field, value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate session selection for existing sessions
    if (currentSchedule.sessionType === 'existing' && !currentSchedule.sessionId) {
      errors.sessionId = t('scheduling.validation.sessionRequired');
    }

    // Validate user selection ONLY for new sessions
    if (currentSchedule.sessionType === 'new' && !currentSchedule.userId) {
      errors.userId = t('scheduling.validation.userRequired');
    }

    if (!currentSchedule.date) {
      errors.date = t('scheduling.validation.dateRequired');
    } else {
      const selectedDate = new Date(currentSchedule.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.date = t('scheduling.validation.pastDate');
      }
    }

    if (!currentSchedule.time) {
      errors.time = t('scheduling.validation.timeRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // CLEANUP: Removed debug console.log statement
    if (!validateForm()) {
      return;
    }

    let scheduleData;

    if (currentSchedule.sessionType === 'existing') {
      // Adding interview to existing session
      const selectedSession = sessions.find(session => session.id === currentSchedule.sessionId);

      scheduleData = {
        sessionId: currentSchedule.sessionId,
        sessionType: 'existing',
        interview: {
          type: currentSchedule.interviewType,
          scheduledAt: `${currentSchedule.date}T${currentSchedule.time}:00.000Z`,
          duration: currentSchedule.duration,
          location: currentSchedule.location,
          notes: currentSchedule.notes,
          interviewer: null, // Will be assigned later
          status: 'scheduled'
        }
      };
    } else {
      // Creating new life story session with interview
      const selectedUser = users.find(user => user.id === currentSchedule.userId);

      scheduleData = {
        sessionType: 'new',
        // Client Details (using selected user as client for now)
        client_name: selectedUser?.displayName || selectedUser?.email,
        client_age: 75, // Default age - in real app this would come from form
        client_contact: {
          phone: '+1-555-0123', // Default - in real app this would come from form
          email: selectedUser?.email,
          address: '' // Default - in real app this would come from form
        },
        family_contact_details: {
          primary_contact: {
            name: 'Family Contact', // Default - in real app this would come from form
            relationship: 'child',
            phone: '+1-555-0124',
            email: 'family@example.com'
          },
          emergency_contact: {
            name: 'Emergency Contact', // Default - in real app this would come from form
            relationship: 'child',
            phone: '+1-555-0125',
            email: 'emergency@example.com'
          }
        },
        preferred_language: 'english',
        special_requirements: '',
        accessibility_needs: [],
        
        // Session Configuration
        session_type: 'Life Story Creation',
        priority_level: 'standard',
        estimated_duration: '4-6 weeks',
        preferred_schedule: {
          days: ['monday', 'wednesday', 'friday'],
          times: ['10:00-12:00'],
          timezone: 'UTC'
        },
        
        // Story Preferences (defaults for now)
        story_preferences: {
          focus_areas: ['childhood', 'family', 'career'],
          tone_preference: 'conversational',
          special_topics_include: [],
          special_topics_exclude: [],
          target_length: 'medium',
          include_photos: true,
          family_tree_integration: false
        },
        
        status: 'scheduled',
        interviews: [{
          type: currentSchedule.interviewType,
          scheduledAt: `${currentSchedule.date}T${currentSchedule.time}:00.000Z`,
          duration: currentSchedule.duration,
          location: currentSchedule.location,
          notes: currentSchedule.notes,
          interviewer: null,
          status: 'scheduled'
        }],
        friends: [], // Keep friends field as requested
        notes: currentSchedule.notes
      };
    }

    dispatch(scheduleInterview(scheduleData));
  };

  const handleReset = () => {
    dispatch(resetScheduleForm());
    setValidationErrors({});
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">
          <Calendar className="admin-page__title-icon" />
          {t('scheduling.title')}
        </h1>
      </header>

      <div className="admin-page__content">
        {/* Success Message */}
        {success && (
          <div className="alert alert--success">
            <CheckCircle className="alert__icon" />
            <span>{t('scheduling.messages.success')}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert--error">
            <AlertCircle className="alert__icon" />
            <span>{error}</span>
            <button
              className="alert__close"
              onClick={() => dispatch(clearError())}
            >
              ×
            </button>
          </div>
        )}

        <div className="scheduling-form">
          <form onSubmit={handleSubmit} className="form">
            <div className="form__row">
              {/* Session Selection */}
              <div className="form__group">
                <label className="form__label">
                  <Calendar className="form__label-icon" />
                  {t('scheduling.form.sessionSelection')}
                </label>
                <select
                  className="form__select"
                  value={currentSchedule.sessionType}
                  onChange={(e) => handleFieldChange('sessionType', e.target.value)}
                  disabled={loading || sessionsLoading}
                >
                  <option value="existing">{t('scheduling.form.existingSession')}</option>
                  <option value="new">{t('scheduling.form.newSession')}</option>
                </select>
              </div>

              {/* Existing Session Selection - Only show if sessionType is 'existing' */}
              {currentSchedule.sessionType === 'existing' && (
                <div className="form__group">
                  <label className="form__label">
                    <FileText className="form__label-icon" />
                    {t('scheduling.form.selectSession')}
                  </label>
                  <select
                    className={`form__select ${validationErrors.sessionId ? 'form__select--error' : ''}`}
                    value={currentSchedule.sessionId}
                    onChange={(e) => handleFieldChange('sessionId', e.target.value)}
                    disabled={loading || sessionsLoading}
                  >
                    <option value="">{t('scheduling.form.selectSessionPlaceholder')}</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.client_name} - {t(`sessions.statuses.${session.status}`)} ({new Date(session.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {validationErrors.sessionId && (
                    <span className="form__error">{validationErrors.sessionId}</span>
                  )}
                  {sessionsLoading && (
                    <span className="form__loading">{t('common.loading')}</span>
                  )}
                </div>
              )}
            </div>

            <div className="form__row">
              {/* User Selection - Only show if sessionType is 'new' */}
              {currentSchedule.sessionType === 'new' && (
                <div className="form__group">
                  <label className="form__label">
                    <User className="form__label-icon" />
                    {t('scheduling.form.selectUser')}
                  </label>
                  <select
                    className={`form__select ${validationErrors.userId ? 'form__select--error' : ''}`}
                    value={currentSchedule.userId}
                    onChange={(e) => handleFieldChange('userId', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">{t('scheduling.form.selectUserPlaceholder')}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                  {validationErrors.userId && (
                    <span className="form__error">{validationErrors.userId}</span>
                  )}
                </div>
              )}

              {/* Interview Type */}
              <div className="form__group">
                <label className="form__label">
                  <FileText className="form__label-icon" />
                  {t('scheduling.form.interviewType')}
                </label>
                <select
                  className="form__select"
                  value={currentSchedule.interviewType}
                  onChange={(e) => handleFieldChange('interviewType', e.target.value)}
                  disabled={loading}
                >
                  <option value="personal_background">{t('scheduling.interviewTypes.personal_background')}</option>
                  <option value="career_achievements">{t('scheduling.interviewTypes.career_achievements')}</option>
                  <option value="relationships_family">{t('scheduling.interviewTypes.relationships_family')}</option>
                  <option value="life_events_milestones">{t('scheduling.interviewTypes.life_events_milestones')}</option>
                  <option value="wisdom_reflection">{t('scheduling.interviewTypes.wisdom_reflection')}</option>
                  <option value="friend">{t('scheduling.interviewTypes.friend')}</option>
                </select>
              </div>
            </div>

            <div className="form__row">
              {/* Date */}
              <div className="form__group">
                <label className="form__label">
                  <Calendar className="form__label-icon" />
                  {t('scheduling.form.date')}
                </label>
                <input
                  type="date"
                  className={`form__input ${validationErrors.date ? 'form__input--error' : ''}`}
                  value={currentSchedule.date}
                  min={getTodayDate()}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  disabled={loading}
                />
                {validationErrors.date && (
                  <span className="form__error">{validationErrors.date}</span>
                )}
              </div>

              {/* Time */}
              <div className="form__group">
                <label className="form__label">
                  <Clock className="form__label-icon" />
                  {t('scheduling.form.time')}
                </label>
                <input
                  type="time"
                  className={`form__input ${validationErrors.time ? 'form__input--error' : ''}`}
                  value={currentSchedule.time}
                  onChange={(e) => handleFieldChange('time', e.target.value)}
                  disabled={loading}
                />
                {validationErrors.time && (
                  <span className="form__error">{validationErrors.time}</span>
                )}
              </div>
            </div>

            <div className="form__row">
              {/* Duration */}
              <div className="form__group">
                <label className="form__label">
                  <Clock className="form__label-icon" />
                  {t('scheduling.form.duration')}
                </label>
                <select
                  className="form__select"
                  value={currentSchedule.duration}
                  onChange={(e) => handleFieldChange('duration', parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value={30}>{t('scheduling.durations.30')}</option>
                  <option value={45}>{t('scheduling.durations.45')}</option>
                  <option value={60}>{t('scheduling.durations.60')}</option>
                  <option value={90}>{t('scheduling.durations.90')}</option>
                  <option value={120}>{t('scheduling.durations.120')}</option>
                </select>
              </div>

              {/* Location */}
              <div className="form__group">
                <label className="form__label">
                  <MapPin className="form__label-icon" />
                  {t('scheduling.form.location')}
                </label>
                <select
                  className="form__select"
                  value={currentSchedule.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  disabled={loading}
                >
                  <option value="online">{t('scheduling.locations.online')}</option>
                  <option value="office">{t('scheduling.locations.office')}</option>
                  <option value="phone">{t('scheduling.locations.phone')}</option>
                </select>
              </div>
            </div>

            {/* Friend Interview Checkbox */}
            <div className="form__group form__group--full-width">
              <label className="form__checkbox-label">
                <input
                  type="checkbox"
                  className="form__checkbox"
                  checked={currentSchedule.friendInterview}
                  onChange={(e) => handleFieldChange('friendInterview', e.target.checked)}
                  disabled={loading}
                />
                <span className="form__checkbox-text">{t('scheduling.form.friendInterview')}</span>
              </label>
            </div>

            {/* Notes */}
            <div className="form__group form__group--full-width">
              <label className="form__label">
                <FileText className="form__label-icon" />
                {t('scheduling.form.notes')}
              </label>
              <textarea
                className="form__textarea"
                rows={3}
                placeholder={t('scheduling.form.notesPlaceholder')}
                value={currentSchedule.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* General Details Section */}
            <div className="general-details">
              <h3 className="general-details__title">{t('scheduling.generalDetails.title')}</h3>
              <div className="general-details__content">
                <div className="general-details__item">
                  <span className="general-details__label">{t('scheduling.generalDetails.phone')}:</span>
                  <span className="general-details__value">{t('scheduling.generalDetails.defaultPhone')}</span>
                </div>
                <div className="general-details__item">
                  <span className="general-details__label">{t('scheduling.generalDetails.email')}:</span>
                  <span className="general-details__value">{t('scheduling.generalDetails.defaultEmail')}</span>
                </div>
                <div className="general-details__item">
                  <span className="general-details__label">{t('scheduling.generalDetails.availability')}:</span>
                  <span className="general-details__value">{t('scheduling.generalDetails.defaultAvailability')}</span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleReset}
                disabled={loading}
              >
                {t('scheduling.actions.reset')}
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading || (currentSchedule.sessionType === 'new' && !currentSchedule.userId) || (currentSchedule.sessionType === 'existing' && !currentSchedule.sessionId)}
              >
                {loading ? t('scheduling.actions.scheduling') : t('scheduling.actions.schedule')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterview;
