import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { 
  fetchDrafts, 
  setFilters, 
  clearFilters, 
  setPagination,
  clearError 
} from '../../store/slices/draftsSlice';
import DraftCard from '../../components/admin/drafts/DraftCard';
import DraftFilters from '../../components/admin/drafts/DraftFilters';
import DraftReview from '../../components/admin/drafts/DraftReview';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import DraftTesting from '../../components/admin/drafts/DraftTesting';

const Drafts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { 
    items: drafts, 
    loading, 
    error, 
    filters, 
    pagination 
  } = useSelector(state => state.drafts);
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedDrafts, setSelectedDrafts] = useState([]);
  const [reviewingDraft, setReviewingDraft] = useState(null);

  // Load drafts on component mount and when filters change
  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    };
    dispatch(fetchDrafts(params));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  // Handle search input with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== filters.search) {
        dispatch(setFilters({ search: searchQuery }));
        dispatch(setPagination({ page: 1 })); // Reset to first page on search
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters.search, dispatch]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    dispatch(setPagination({ page: 1 })); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchQuery('');
    dispatch(setPagination({ page: 1 }));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  const handleSelectDraft = (draftId) => {
    setSelectedDrafts(prev => 
      prev.includes(draftId) 
        ? prev.filter(id => id !== draftId)
        : [...prev, draftId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDrafts.length === drafts.length) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(drafts.map(draft => draft.id));
    }
  };

  const handleReviewDraft = (draft) => {
    setReviewingDraft(draft);
  };

  const handleCloseReview = () => {
    setReviewingDraft(null);
  };

  const handleReviewUpdate = () => {
    // Refresh drafts after review action
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    };
    dispatch(fetchDrafts(params));
    setReviewingDraft(null);
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'first_draft':
        return <FileText className="stage-icon stage-icon--first" size={16} />;
      case 'under_review':
        return <Eye className="stage-icon stage-icon--review" size={16} />;
      case 'pending_approval':
        return <Clock className="stage-icon stage-icon--pending" size={16} />;
      case 'approved':
        return <CheckCircle className="stage-icon stage-icon--approved" size={16} />;
      case 'rejected':
        return <XCircle className="stage-icon stage-icon--rejected" size={16} />;
      default:
        return <AlertCircle className="stage-icon stage-icon--default" size={16} />;
    }
  };

  const getStageCount = (stage) => {
    if (stage === 'all') return drafts.length;
    return drafts.filter(draft => draft.stage === stage).length;
  };

  if (error) {
    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <h1 className="admin-page__title">{t('drafts.title')}</h1>
        </header>
        <div className="admin-page__content">
          <ErrorAlert 
            message={error} 
            onClose={() => dispatch(clearError())} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page drafts-page">
      <header className="admin-page__header">
        <div className="admin-page__header-content">
          <div className="admin-page__title-section">
            <h1 className="admin-page__title">{t('drafts.title')}</h1>
            <p className="admin-page__subtitle">{t('drafts.subtitle')}</p>
          </div>
          
          <div className="admin-page__actions">
            {selectedDrafts.length > 0 && (
              <div className="bulk-actions">
                <span className="bulk-actions__count">
                  {selectedDrafts.length} {t('common.selected', 'selected')}
                </span>
                <button className="btn btn--success btn--sm">
                  <CheckCircle size={16} />
                  {t('drafts.actions.bulkApprove')}
                </button>
                <button className="btn btn--danger btn--sm">
                  <XCircle size={16} />
                  {t('drafts.actions.bulkReject')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="admin-page__toolbar">
          <div className="search-bar">
            <div className="search-bar__input">
              <Search className="search-bar__icon" size={20} />
              <input
                type="text"
                placeholder={t('drafts.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-bar__field"
              />
            </div>
          </div>

          <div className="toolbar-actions">
            <button 
              className={`btn btn--secondary ${showFilters ? 'btn--active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              {t('common.filters', 'Filters')}
              <ChevronDown 
                size={16} 
                className={`chevron ${showFilters ? 'chevron--up' : ''}`} 
              />
            </button>
            
            <button className="btn btn--secondary" onClick={handleClearFilters}>
              {t('common.clearFilters')}
            </button>
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <DraftFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}
      </header>

      <div className="admin-page__content">
        {/* Stage Summary Cards */}
        <div className="stage-summary">
          {['all', 'first_draft', 'under_review', 'pending_approval', 'approved', 'rejected'].map(stage => (
            <div 
              key={stage}
              className={`stage-summary__card ${
                filters.stage === stage ? 'stage-summary__card--active' : ''
              }`}
              onClick={() => handleFilterChange({ stage })}
            >
              <div className="stage-summary__icon">
                {getStageIcon(stage)}
              </div>
              <div className="stage-summary__content">
                <div className="stage-summary__count">{getStageCount(stage)}</div>
                <div className="stage-summary__label">{t(`drafts.stages.${stage}`)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Drafts List */}
        <div className="drafts-list">
          {loading ? (
            <div className="drafts-list__loading">
              <LoadingSpinner size="large" />
              <p>{t('common.loading')}</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="drafts-list__empty">
              <FileText className="empty-icon" size={64} />
              <h3>{t('drafts.noDrafts')}</h3>
              <p>{t('drafts.noDraftsDesc')}</p>
            </div>
          ) : (
            <>
              {/* List Header */}
              <div className="drafts-list__header">
                {/* <DraftTesting /> */}
                <div className="drafts-list__header-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDrafts.length === drafts.length && drafts.length > 0}
                    onChange={handleSelectAll}
                    className="checkbox"
                  />
                </div>
                <div className="drafts-list__header-content">
                  <span>{t('common.showing', 'Showing')} {drafts.length} {t('common.of', 'of')} {pagination.total}</span>
                </div>
              </div>

              {/* Draft Cards */}
              <div className="drafts-list__items">
                {drafts.map(draft => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    isSelected={selectedDrafts.includes(draft.id)}
                    onSelect={() => handleSelectDraft(draft.id)}
                    onReview={handleReviewDraft}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="btn btn--secondary btn--sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    {t('common.previous')}
                  </button>
                  
                  <span className="pagination__info">
                    {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
                  </span>
                  
                  <button 
                    className="btn btn--secondary btn--sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Draft Review Modal */}
      {reviewingDraft && (
        <DraftReview
          draft={reviewingDraft}
          onClose={handleCloseReview}
          onUpdate={handleReviewUpdate}
        />
      )}
    </div>
  );
};

export default Drafts;
