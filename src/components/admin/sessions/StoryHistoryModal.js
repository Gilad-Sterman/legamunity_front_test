import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, FileText, Eye, Calendar, Hash, User } from 'lucide-react';

const StoryHistoryModal = ({ isOpen, onClose, stories, onViewStory }) => {
  const { t } = useTranslation();

  if (!isOpen || !stories) return null;

  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable', 'N/A');
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString();
  };

  const formatWordCount = (count) => {
    if (!count) return '0';
    return count.toLocaleString();
  };

  const getVersionBadgeClass = (index) => {
    if (index === 0) return 'version-badge--current';
    if (index === 1) return 'version-badge--previous';
    return 'version-badge--old';
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal--large story-history-modal">
        <div className="modal__header">
          <h2>
            <Clock size={20} />
            {t('admin.sessions.sessionDrafts.storyHistory', 'Story Generation History')}
          </h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal__content">
          <div className="story-history">
            <div className="story-history__info">
              <p>{t('admin.sessions.sessionDrafts.storyHistoryDescription', 'View all generated versions of the full life story for this session.')}</p>
              <div className="history-stats">
                <span className="stat-item">
                  <strong>{stories.length}</strong> {t('admin.sessions.sessionDrafts.totalVersions', 'versions generated')}
                </span>
              </div>
            </div>

            <div className="story-timeline">
              {stories.map((story, index) => (
                <div key={story.id} className="timeline-item">
                  <div className="timeline-marker">
                    <div className={`version-badge ${getVersionBadgeClass(index)}`}>
                      v{story.version}
                    </div>
                  </div>
                  
                  <div className="timeline-content">
                    <div className="story-card">
                      <div className="story-card__header">
                        <h4 className="story-card__title">
                          {story.title || t('admin.sessions.sessionDrafts.untitledStory', 'Untitled Story')}
                        </h4>
                        <div className="story-card__badges">
                          {index === 0 && (
                            <span className="badge badge--success">
                              {t('admin.sessions.sessionDrafts.current', 'Current')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="story-card__meta">
                        <div className="meta-grid">
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span>
                              {formatDate(story.created_at)}
                              <small>{formatTime(story.created_at)}</small>
                            </span>
                          </div>
                          
                          <div className="meta-item">
                            <Hash size={14} />
                            <span>
                              {formatWordCount(story.total_words || story.content?.totalWords)} {t('admin.sessions.sessionDrafts.words', 'words')}
                            </span>
                          </div>
                          
                          <div className="meta-item">
                            <User size={14} />
                            <span>
                              {story.source_metadata?.approvedDrafts || story.metadata?.sourceDrafts || 0} {t('admin.sessions.sessionDrafts.sourceDrafts', 'source drafts')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {story.content?.summary && (
                        <div className="story-card__summary">
                          <p>{story.content.summary.substring(0, 150)}...</p>
                        </div>
                      )}

                      <div className="story-card__actions">
                        <button 
                          className="btn btn--outline btn--sm"
                          onClick={() => onViewStory(story)}
                        >
                          <Eye size={16} />
                          {t('admin.sessions.sessionDrafts.viewStory', 'View Story')}
                        </button>
                        
                        {(story.processing_time || story.generation_stats?.processingTime) && (
                          <span className="processing-time">
                            {t('admin.sessions.sessionDrafts.generated', 'Generated')} in {story.processing_time || story.generation_stats?.processingTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {stories.length === 0 && (
              <div className="empty-state">
                <FileText size={48} />
                <h3>{t('admin.sessions.sessionDrafts.noStoriesGenerated', 'No Stories Generated')}</h3>
                <p>{t('admin.sessions.sessionDrafts.noStoriesDescription', 'No full life stories have been generated for this session yet.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryHistoryModal;
