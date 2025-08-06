import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  X, 
  User, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Phone,
  Mail,
  Home,
  Heart,
  AlertCircle
} from 'lucide-react';
import './CreateSessionModal.scss';
import { createSession } from '../../../store/slices/sessionsSliceSupabase';

const CreateSessionModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { createLoading, error } = useSelector(state => state.sessions);

  // Form state for life story session
  const [formData, setFormData] = useState({
    // Section 1: Client Information (including primary contact)
    client_name: '',
    client_age: '',
    client_contact: {
      phone: '',
      email: '',
      address: ''
    },
    primary_contact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    
    // Section 2: Session Configuration (including accessibility)
    session_type: 'Life Story Creation',
    status: 'scheduled',
    priority_level: 'standard',
    preferred_language: 'English',
    story_preferences: {
      focus_areas: [],
      tone_preference: 'nostalgic',
      special_topics: '',
      target_length: 'medium',
      include_photos: true,
      family_tree_integration: true
    },
    accessibility_needs: '',
    special_requirements: '',
    notes: '',
    
    // Section 3: Interview Scheduling (optional)
    interview_scheduling: {
      enabled: false,
      day_of_week: 'monday',
      time: '10:00',
      duration: 90,
      location: 'client_home'
    }
  });

  const [formErrors, setFormErrors] = useState({});
  
  // Available focus areas for life stories
  const focusAreas = [
    'childhood',
    'family',
    'career',
    'education',
    'relationships',
    'achievements',
    'challenges',
    'travel',
    'hobbies',
    'community',
    'immigration_story',
    'military_service',
    'parenthood',
    'wisdom_lessons'
  ];
  
  // Available tone preferences
  const tonePreferences = [
    'nostalgic',
    'celebratory',
    'reflective',
    'inspiring',
    'humorous',
    'heartfelt'
  ];
  
  // Available priority levels
  const priorityLevels = [
    'standard',
    'urgent',
    'memorial'
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        // Section 1: Client Information (including primary contact)
        client_name: '',
        client_age: '',
        client_contact: {
          phone: '',
          email: '',
          address: ''
        },
        primary_contact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        
        // Section 2: Session Configuration (including accessibility)
        session_type: 'Life Story Creation',
        status: 'scheduled',
        priority_level: 'standard',
        preferred_language: 'English',
        story_preferences: {
          focus_areas: [],
          tone_preference: 'nostalgic',
          special_topics: '',
          target_length: 'medium',
          include_photos: true,
          family_tree_integration: true
        },
        accessibility_needs: '',
        special_requirements: '',
        notes: '',
        
        // Section 3: Interview Scheduling (optional)
        interview_scheduling: {
          enabled: false,
          day_of_week: 'monday',
          time: '10:00',
          duration: 90,
          location: 'client_home'
        },
        
        // Friends for interviews (kept for compatibility)
        friends: []
      });
      // setNewFriend({
      //   name: '',
      //   email: '',
      //   phone: '',
      //   relationship: '',
      //   role: 'friend_interviewer'
      // });
      setFormErrors({});
      // setShowAddFriend(false);
    }
  }, [isOpen]);

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  // Handle nested field changes (for client_contact, family_contact_details, story_preferences)
  const handleNestedFieldChange = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };
  
  // Handle deeply nested field changes (for family contacts)
  const handleDeepNestedFieldChange = (parentField, nestedField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [nestedField]: {
          ...prev[parentField][nestedField],
          [childField]: value
        }
      }
    }));
  };
  
  // Handle focus areas selection (multiple checkboxes)
  const handleFocusAreaChange = (area, checked) => {
    setFormData(prev => ({
      ...prev,
      story_preferences: {
        ...prev.story_preferences,
        focus_areas: checked 
          ? [...prev.story_preferences.focus_areas, area]
          : prev.story_preferences.focus_areas.filter(item => item !== area)
      }
    }));
  };



  // Validate form for life story session
  const validateForm = () => {
    const errors = {};

    // Section 1: Client information validation
    if (!formData.client_name.trim()) {
      errors.client_name = t('admin.sessions.validation.clientNameRequired', 'Client name is required');
    }

    if (!formData.client_age || formData.client_age < 1 || formData.client_age > 120) {
      errors.client_age = t('admin.sessions.validation.clientAgeRequired', 'Valid client age is required');
    }

    if (!formData.client_contact.email.trim()) {
      errors.client_email = t('admin.sessions.validation.clientEmailRequired', 'Client email is required');
    }

    // Primary contact validation (simplified)
    if (!formData.primary_contact.name.trim()) {
      errors.primary_contact_name = t('admin.sessions.validation.primaryContactRequired', 'Primary contact name is required');
    }

    if (!formData.primary_contact.phone.trim()) {
      errors.primary_contact_phone = t('admin.sessions.validation.primaryContactPhoneRequired', 'Primary contact phone is required');
    }

    // Section 2: Story preferences validation
    if (formData.story_preferences.focus_areas.length === 0) {
      errors.focus_areas = t('admin.sessions.validation.focusAreasRequired', 'At least one focus area is required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Create the session data with proper structure for life story sessions
      const hasSchedule = formData?.preferences?.interview_scheduling?.enabled || formData?.interview_scheduling?.enabled;

      const sessionData = {
        ...formData,
        // Add default interviews structure - 5 interviews named "1", "2", "3", "4", "5"
        interviews: [
          { 
            id: `interview_1_${Date.now()}`,
            name: t('admin.sessions.form.interview1', 'Interview 1'), 
            type: 'personal_background', 
            status: hasSchedule ? 'scheduled' : 'pending', 
            duration: 90,
            file_upload: null,
            notes: ''
          },
          { 
            id: `interview_2_${Date.now() + 1}`,
            name: t('admin.sessions.form.interview2', 'Interview 2'), 
            type: 'career_achievements', 
            status: hasSchedule ? 'scheduled' : 'pending', 
            duration: 90,
            file_upload: null,
            notes: ''
          },
          { 
            id: `interview_3_${Date.now() + 2}`,
            name: t('admin.sessions.form.interview3', 'Interview 3'), 
            type: 'relationships_family', 
            status: hasSchedule ? 'scheduled' : 'pending', 
            duration: 90,
            file_upload: null,
            notes: ''
          },
          { 
            id: `interview_4_${Date.now() + 3}`,
            name: t('admin.sessions.form.interview4', 'Interview 4'), 
            type: 'life_events_milestones', 
            status: hasSchedule ? 'scheduled' : 'pending', 
            duration: 90,
            file_upload: null,
            notes: ''
          },
          { 
            id: `interview_5_${Date.now() + 4}`,
            name: t('admin.sessions.form.interview5', 'Interview 5'), 
            type: 'wisdom_reflection', 
            status: hasSchedule ? 'scheduled' : 'pending', 
            duration: 90,
            file_upload: null,
            notes: ''
          }
        ],
        // Add metadata
        metadata: {
          story_completion_percentage: 0,
          estimated_completion_date: null,
          last_activity: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };
      
      // CLEANUP: Removed debug console.log statements
      
      await dispatch(createSession(sessionData)).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal create-session-modal ${isOpen ? 'modal--open' : ''}`} onClick={onClose}>
      <div className="modal__dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            <FileText size={24} />
            {t('admin.sessions.form.createSession', 'Create Life Story Session')}
          </h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__content">
          <form onSubmit={handleSubmit} className="create-session-form">
            {/* Section 1: Client Information (including primary contact) */}
            <div className="form-section">
              <h3 className="form-section__title">
                <User size={20} />
                {t('admin.sessions.form.clientInfo', 'Client Information')}
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.clientName', 'Client Name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => handleFieldChange('client_name', e.target.value)}
                    className={`form-input ${formErrors.client_name ? 'form-input--error' : ''}`}
                    placeholder={t('admin.sessions.form.clientNamePlaceholder', 'Enter client full name')}
                    required
                  />
                  {formErrors.client_name && (
                    <span className="form-error">{formErrors.client_name}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.clientAge', 'Client Age')} *
                  </label>
                  <input
                    type="number"
                    value={formData.client_age}
                    onChange={(e) => handleFieldChange('client_age', e.target.value)}
                    className={`form-input ${formErrors.client_age ? 'form-input--error' : ''}`}
                    placeholder="75"
                    min="1"
                    max="120"
                    required
                  />
                  {formErrors.client_age && (
                    <span className="form-error">{formErrors.client_age}</span>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} />
                    {t('admin.sessions.form.clientEmail', 'Client Email')} *
                  </label>
                  <input
                    type="email"
                    value={formData.client_contact.email}
                    onChange={(e) => handleNestedFieldChange('client_contact', 'email', e.target.value)}
                    className={`form-input ${formErrors.client_email ? 'form-input--error' : ''}`}
                    placeholder="client@example.com"
                    required
                  />
                  {formErrors.client_email && (
                    <span className="form-error">{formErrors.client_email}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <Phone size={16} />
                    {t('admin.sessions.form.clientPhone', 'Client Phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.client_contact.phone}
                    onChange={(e) => handleNestedFieldChange('client_contact', 'phone', e.target.value)}
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <Home size={16} />
                  {t('admin.sessions.form.clientAddress', 'Client Address')}
                </label>
                <textarea
                  value={formData.client_contact.address}
                  onChange={(e) => handleNestedFieldChange('client_contact', 'address', e.target.value)}
                  className="form-textarea"
                  placeholder={t('admin.sessions.form.clientAddressPlaceholder', 'Enter client address')}
                  rows={2}
                />
              </div>
              
              {/* Primary Contact */}
              <div className="form-subsection">
                <h4>{t('admin.sessions.form.primaryContact', 'Primary Contact')} *</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      {t('admin.sessions.form.contactName', 'Name')} *
                    </label>
                    <input
                      type="text"
                      value={formData.primary_contact.name}
                      onChange={(e) => handleNestedFieldChange('primary_contact', 'name', e.target.value)}
                      className={`form-input ${formErrors.primary_contact_name ? 'form-input--error' : ''}`}
                      placeholder={t('admin.sessions.form.contactNamePlaceholder', 'Enter contact name')}
                      required
                    />
                    {formErrors.primary_contact_name && (
                      <span className="form-error">{formErrors.primary_contact_name}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      {t('admin.sessions.form.relationship', 'Relationship')}
                    </label>
                    <select
                      value={formData.primary_contact.relationship}
                      onChange={(e) => handleNestedFieldChange('primary_contact', 'relationship', e.target.value)}
                      className="form-input"
                    >
                      <option value="">{t('admin.sessions.form.selectRelationship', 'Select relationship')}</option>
                      <option value="spouse">{t('admin.sessions.relationships.spouse', 'Spouse')}</option>
                      <option value="child">{t('admin.sessions.relationships.child', 'Child')}</option>
                      <option value="grandchild">{t('admin.sessions.relationships.grandchild', 'Grandchild')}</option>
                      <option value="sibling">{t('admin.sessions.relationships.sibling', 'Sibling')}</option>
                      <option value="other_family">{t('admin.sessions.relationships.otherFamily', 'Other Family')}</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <Phone size={16} />
                      {t('admin.sessions.form.contactPhone', 'Phone')} *
                    </label>
                    <input
                      type="tel"
                      value={formData.primary_contact.phone}
                      onChange={(e) => handleNestedFieldChange('primary_contact', 'phone', e.target.value)}
                      className={`form-input ${formErrors.primary_contact_phone ? 'form-input--error' : ''}`}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                    {formErrors.primary_contact_phone && (
                      <span className="form-error">{formErrors.primary_contact_phone}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <Mail size={16} />
                      {t('admin.sessions.form.contactEmail', 'Email')}
                    </label>
                    <input
                      type="email"
                      value={formData.primary_contact.email}
                      onChange={(e) => handleNestedFieldChange('primary_contact', 'email', e.target.value)}
                      className="form-input"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Session Configuration (including accessibility) */}
            <div className="form-section">
              <h3 className="form-section__title">
                <FileText size={20} />
                {t('admin.sessions.form.sessionConfig', 'Session Configuration')}
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.priority', 'Priority Level')}
                  </label>
                  <select
                    value={formData.priority_level}
                    onChange={(e) => handleFieldChange('priority_level', e.target.value)}
                    className="form-input"
                  >
                    {priorityLevels.map(priority => (
                      <option key={priority} value={priority}>
                        {t(`admin.sessions.priorities.${priority}`, priority)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.language', 'Preferred Language')}
                  </label>
                  <select
                    value={formData.preferred_language}
                    onChange={(e) => handleFieldChange('preferred_language', e.target.value)}
                    className="form-input"
                  >
                    <option value="English">English</option>
                    <option value="Hebrew">Hebrew</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Story Preferences */}
            <div className="form-section">
              <h3 className="form-section__title">
                <Heart size={20} />
                {t('admin.sessions.form.storyPreferences', 'Story Preferences')}
              </h3>
              
              <div className="form-group">
                <label className="form-label">
                  {t('admin.sessions.form.focusAreas', 'Focus Areas')} *
                </label>
                <div className="checkbox-grid">
                  {focusAreas.map(area => (
                    <label key={area} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.story_preferences.focus_areas.includes(area)}
                        onChange={(e) => handleFocusAreaChange(area, e.target.checked)}
                      />
                      <span>{t(`admin.sessions.focusAreas.${area}`, area.replace('_', ' '))}</span>
                    </label>
                  ))}
                </div>
                {formErrors.focus_areas && (
                  <span className="form-error">{formErrors.focus_areas}</span>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.tonePreference', 'Tone Preference')}
                  </label>
                  <select
                    value={formData.story_preferences.tone_preference}
                    onChange={(e) => handleNestedFieldChange('story_preferences', 'tone_preference', e.target.value)}
                    className="form-input"
                  >
                    {tonePreferences.map(tone => (
                      <option key={tone} value={tone}>
                        {t(`admin.sessions.tones.${tone}`, tone)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.targetLength', 'Target Length')}
                  </label>
                  <select
                    value={formData.story_preferences.target_length}
                    onChange={(e) => handleNestedFieldChange('story_preferences', 'target_length', e.target.value)}
                    className="form-input"
                  >
                    <option value="short">{t('admin.sessions.lengths.short', 'Short (10-20 pages)')}</option>
                    <option value="medium">{t('admin.sessions.lengths.medium', 'Medium (30-50 pages)')}</option>
                    <option value="long">{t('admin.sessions.lengths.long', 'Long (60+ pages)')}</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  {t('admin.sessions.form.specialTopics', 'Special Topics')}
                </label>
                <textarea
                  value={formData.story_preferences.special_topics}
                  onChange={(e) => handleNestedFieldChange('story_preferences', 'special_topics', e.target.value)}
                  className="form-textarea"
                  placeholder={t('admin.sessions.form.specialTopicsPlaceholder', 'Any specific topics or themes to focus on...')}
                  rows={2}
                />
              </div>
              
              {/* Accessibility & Special Requirements */}
              <div className="form-subsection">
                <h4>{t('admin.sessions.form.accessibilityRequirements', 'Accessibility & Special Requirements')}</h4>
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.accessibilityNeeds', 'Accessibility Needs')}
                  </label>
                  <textarea
                    value={formData.accessibility_needs}
                    onChange={(e) => handleFieldChange('accessibility_needs', e.target.value)}
                    className="form-textarea"
                    placeholder={t('admin.sessions.form.accessibilityPlaceholder', 'Hearing aids, wheelchair access, large print, etc.')}
                    rows={2}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    {t('admin.sessions.form.specialRequirements', 'Special Requirements')}
                  </label>
                  <textarea
                    value={formData.special_requirements}
                    onChange={(e) => handleFieldChange('special_requirements', e.target.value)}
                    className="form-textarea"
                    placeholder={t('admin.sessions.form.specialRequirementsPlaceholder', 'Medical considerations, comfort needs, etc.')}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Interview Scheduling (Optional) */}
            <div className="form-section">
              <div className="form-section__header">
                <h3 className="form-section__title">
                  <Calendar size={20} />
                  {t('admin.sessions.form.interviewScheduling', 'Interview Scheduling (Optional)')}
                </h3>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.interview_scheduling.enabled}
                    onChange={(e) => handleNestedFieldChange('interview_scheduling', 'enabled', e.target.checked)}
                  />
                  <span>{t('admin.sessions.form.enableScheduling', 'Set weekly recurring time for all interviews')}</span>
                </label>
              </div>
              
              {formData.interview_scheduling.enabled && (
                <div className="form-subsection">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        {t('admin.sessions.form.dayOfWeek', 'Day of Week')}
                      </label>
                      <select
                        value={formData.interview_scheduling.day_of_week}
                        onChange={(e) => handleNestedFieldChange('interview_scheduling', 'day_of_week', e.target.value)}
                        className="form-input"
                      >
                        <option value="">{t('admin.sessions.form.selectDay', 'Select day')}</option>
                        <option value="monday">{t('admin.sessions.days.monday', 'Monday')}</option>
                        <option value="tuesday">{t('admin.sessions.days.tuesday', 'Tuesday')}</option>
                        <option value="wednesday">{t('admin.sessions.days.wednesday', 'Wednesday')}</option>
                        <option value="thursday">{t('admin.sessions.days.thursday', 'Thursday')}</option>
                        <option value="friday">{t('admin.sessions.days.friday', 'Friday')}</option>
                        <option value="saturday">{t('admin.sessions.days.saturday', 'Saturday')}</option>
                        <option value="sunday">{t('admin.sessions.days.sunday', 'Sunday')}</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        {t('admin.sessions.form.startTime', 'Start Time')}
                      </label>
                      <input
                        type="time"
                        value={formData.interview_scheduling.start_time}
                        onChange={(e) => handleNestedFieldChange('interview_scheduling', 'start_time', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        {t('admin.sessions.form.duration', 'Duration (minutes)')}
                      </label>
                      <select
                        value={formData.interview_scheduling.duration}
                        onChange={(e) => handleNestedFieldChange('interview_scheduling', 'duration', parseInt(e.target.value))}
                        className="form-input"
                      >
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                        <option value={120}>120 minutes</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        {t('admin.sessions.form.location', 'Location')}
                      </label>
                      <select
                        value={formData.interview_scheduling.location}
                        onChange={(e) => handleNestedFieldChange('interview_scheduling', 'location', e.target.value)}
                        className="form-input"
                      >
                        <option value="">{t('admin.sessions.form.selectLocation', 'Select location')}</option>
                        <option value="client_home">{t('admin.sessions.locations.clientHome', 'Client Home')}</option>
                        <option value="video_call">{t('admin.sessions.locations.videoCall', 'Video Call')}</option>
                        <option value="phone_call">{t('admin.sessions.locations.phoneCall', 'Phone Call')}</option>
                        <option value="office">{t('admin.sessions.locations.office', 'Office')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>



            {/* Accessibility and Special Requirements */}
            <div className="form-section">
              <h3 className="form-section__title">
                <AlertCircle size={20} />
                {t('admin.sessions.form.accessibilityRequirements', 'Accessibility & Special Requirements')}
              </h3>
              
              <div className="form-group">
                <label className="form-label">
                  {t('admin.sessions.form.accessibilityNeeds', 'Accessibility Needs')}
                </label>
                <textarea
                  value={formData.accessibility_needs}
                  onChange={(e) => handleFieldChange('accessibility_needs', e.target.value)}
                  className="form-textarea"
                  placeholder={t('admin.sessions.form.accessibilityPlaceholder', 'e.g., Hearing aid user, wheelchair accessible, large print materials...')}
                  rows={2}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  {t('admin.sessions.form.specialRequirements', 'Special Requirements')}
                </label>
                <textarea
                  value={formData.special_requirements}
                  onChange={(e) => handleFieldChange('special_requirements', e.target.value)}
                  className="form-textarea"
                  placeholder={t('admin.sessions.form.specialRequirementsPlaceholder', 'e.g., Prefers morning sessions, needs breaks every 30 minutes...')}
                  rows={2}
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-section">
              <h3 className="form-section__title">
                <FileText size={20} />
                {t('admin.sessions.form.additionalNotes', 'Additional Notes')}
              </h3>
              
              <div className="form-group">
                <label className="form-label">
                  {t('admin.sessions.form.notes', 'Notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="form-textarea"
                  placeholder={t('admin.sessions.form.notesPlaceholder', 'Any additional information about this life story session...')}
                  rows={3}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="modal__footer">
          <div className="modal__actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={onClose}
              disabled={createLoading}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit}
              className="btn btn--primary"
              disabled={createLoading}
            >
              {createLoading ? (
                <span>{t('admin.sessions.creating', 'Creating...')}</span>
              ) : (
                <span>{t('admin.sessions.createSession', 'Create Life Story Session')}</span>
              )}
            </button>
          </div>
          
          {error && (
            <div className="modal__error">
              <span className="error-message">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSessionModal;
