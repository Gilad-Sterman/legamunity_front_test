import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Calendar, User, Hash } from 'lucide-react';

const StoryViewModal = ({ isOpen, onClose, story }) => {
  const { t } = useTranslation();

  if (!isOpen || !story) return null;

  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable', 'N/A');
    return new Date(dateString).toLocaleDateString();
  };

  const formatWordCount = (count) => {
    if (!count) return '0';
    return count.toLocaleString();
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal--large story-view-modal">
        <div className="modal__header">
          <h2>
            <FileText size={20} />
            {t('admin.sessions.sessionDrafts.storyDetails', 'Full Life Story')}
          </h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal__content">
          <div className="story-view">
            {/* Story Header */}
            <div className="story-view__header">
              <h3 className="story-view__title">{story.title || t('admin.sessions.untitledStory', 'Untitled Story')}</h3>
              <div className="story-view__version">
                v{story.version}
              </div>
            </div>

            {/* Story Metadata */}
            <div className="story-view__meta">
              <div className="story-meta-grid">
                <div className="meta-item">
                  <Calendar size={16} />
                  <div>
                    <span className="meta-label">{t('admin.sessions.sessionDrafts.generatedOn', 'Generated On')}</span>
                    <span className="meta-value">{formatDate(story.created_at)}</span>
                  </div>
                </div>
                
                <div className="meta-item">
                  <Hash size={16} />
                  <div>
                    <span className="meta-label">{t('admin.sessions.sessionDrafts.wordCount', 'Word Count')}</span>
                    <span className="meta-value">{formatWordCount(story.content?.totalWords)}</span>
                  </div>
                </div>
                
                <div className="meta-item">
                  <User size={16} />
                  <div>
                    <span className="meta-label">{t('admin.sessions.sessionDrafts.sourceDrafts', 'Source Drafts')}</span>
                    <span className="meta-value">{story.source_metadata?.approvedDrafts || story.metadata?.sourceDrafts || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story Content */}
            <div className="story-view__content">
              {story.content?.summary && (
                <div className="story-section">
                  <h4>{t('admin.sessions.sessionDrafts.storySummary', 'Summary')}</h4>
                  <p>{story.content.summary}</p>
                </div>
              )}

              {story.content?.sections && story.content.sections.length > 0 && (
                <div className="story-section">
                  <h4>{t('admin.sessions.sessionDrafts.storyContent', 'Story Content')}</h4>
                  <div className="story-sections">
                    {story.content.sections.map((section, index) => (
                      <div key={index} className="story-subsection">
                        <h5>{section.title}</h5>
                        <p>{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {story.content?.keyThemes && story.content.keyThemes.length > 0 && (
                <div className="story-section">
                  <h4>{t('admin.sessions.sessionDrafts.keyThemes', 'Key Themes')}</h4>
                  <ul className="story-themes">
                    {story.content.keyThemes.map((theme, index) => (
                      <li key={index}>{theme}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Generation Metadata */}
            {(story.processing_time || story.ai_model || story.generation_stats) && (
              <div className="story-view__generation-info">
                <h4>{t('admin.sessions.sessionDrafts.generationDetails', 'Generation Details')}</h4>
                <div className="generation-meta">
                  {(story.processing_time || story.generation_stats?.processingTime) && (
                    <div className="meta-item">
                      <span className="meta-label">{t('admin.sessions.sessionDrafts.processingTime', 'Processing Time')}</span>
                      <span className="meta-value">{story.processing_time || story.generation_stats?.processingTime}ms</span>
                    </div>
                  )}
                  {(story.ai_model || story.generation_stats?.aiModel) && (
                    <div className="meta-item">
                      <span className="meta-label">{t('admin.sessions.sessionDrafts.aiModel', 'AI Model')}</span>
                      <span className="meta-value">{story.ai_model || story.generation_stats?.aiModel}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewModal;
