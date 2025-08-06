import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Filter } from 'lucide-react';

const DraftFilters = ({ filters, onFilterChange, onClose }) => {
  const { t } = useTranslation();

  const handleStageChange = (stage) => {
    onFilterChange({ stage });
  };

  const handleProgressChange = (progress) => {
    onFilterChange({ progress });
  };

  const handleSortChange = (sortBy, sortOrder) => {
    onFilterChange({ sortBy, sortOrder });
  };

  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...filters.dateRange };
    newDateRange[field] = value;
    onFilterChange({ dateRange: newDateRange });
  };

  const clearDateRange = () => {
    onFilterChange({ dateRange: null });
  };

  return (
    <div className="draft-filters">
      <div className="draft-filters__header">
        <div className="draft-filters__title">
          <Filter size={20} />
          <h3>{t('common.filters')}</h3>
        </div>
        <button 
          className="draft-filters__close"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={20} />
        </button>
      </div>

      <div className="draft-filters__content">
        <div className="draft-filters__row">
          {/* Stage Filter */}
          <div className="filter-group">
            <label className="filter-group__label">
              {t('drafts.filters.stage')}
            </label>
            <div className="filter-group__options">
              {['all', 'first_draft', 'under_review', 'pending_approval', 'approved', 'rejected'].map(stage => (
                <button
                  key={stage}
                  className={`filter-option ${filters.stage === stage ? 'filter-option--active' : ''}`}
                  onClick={() => handleStageChange(stage)}
                >
                  {t(`drafts.stages.${stage}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Filter */}
          <div className="filter-group">
            <label className="filter-group__label">
              {t('drafts.filters.progress')}
            </label>
            <div className="filter-group__options">
              {['all', 'low', 'medium', 'high'].map(progress => (
                <button
                  key={progress}
                  className={`filter-option ${filters.progress === progress ? 'filter-option--active' : ''}`}
                  onClick={() => handleProgressChange(progress)}
                >
                  {t(`drafts.progress.${progress}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="draft-filters__row">
          {/* Date Range Filter */}
          <div className="filter-group">
            <label className="filter-group__label">
              <Calendar size={16} />
              {t('drafts.filters.dateRange')}
            </label>
            <div className="filter-group__date-inputs">
              <div className="date-input">
                <label htmlFor="startDate" className="date-input__label">
                  {t('common.from', 'From')}
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="date-input__field"
                />
              </div>
              <div className="date-input">
                <label htmlFor="endDate" className="date-input__label">
                  {t('common.to', 'To')}
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="date-input__field"
                />
              </div>
              {filters.dateRange && (
                <button 
                  className="btn btn--secondary btn--sm"
                  onClick={clearDateRange}
                >
                  {t('common.clear', 'Clear')}
                </button>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div className="filter-group">
            <label className="filter-group__label">
              {t('drafts.filters.sortBy')}
            </label>
            <div className="filter-group__sort">
              <select
                value={filters.sortBy || 'updatedAt'}
                onChange={(e) => handleSortChange(e.target.value, filters.sortOrder)}
                className="select"
              >
                <option value="updatedAt">{t('drafts.sortOptions.updatedAt')}</option>
                <option value="createdAt">{t('drafts.sortOptions.createdAt')}</option>
                <option value="progress">{t('drafts.sortOptions.progress')}</option>
                <option value="stage">{t('drafts.sortOptions.stage')}</option>
                <option value="title">{t('drafts.sortOptions.title')}</option>
              </select>
              
              <div className="sort-order">
                <button
                  className={`sort-order__btn ${filters.sortOrder === 'asc' ? 'sort-order__btn--active' : ''}`}
                  onClick={() => handleSortChange(filters.sortBy, 'asc')}
                  title={t('drafts.filters.ascending')}
                >
                  ↑
                </button>
                <button
                  className={`sort-order__btn ${filters.sortOrder === 'desc' ? 'sort-order__btn--active' : ''}`}
                  onClick={() => handleSortChange(filters.sortBy, 'desc')}
                  title={t('drafts.filters.descending')}
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftFilters;
