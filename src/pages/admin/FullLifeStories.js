import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { saveAs } from 'file-saver';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  BookOpen,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  StickyNote,
  ChevronUp,
  Hash,
  Clock,
  Eye,
  Save,
  Mic,
  FileText
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import websocketService from '../../services/websocketService';

const FullLifeStories = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [lifeStories, setLifeStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedStory, setExpandedStory] = useState(null);
  const [expandedContent, setExpandedContent] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [regenerationProcessing, setRegenerationProcessing] = useState(null);

  // Load life stories on component mount
  useEffect(() => {
    fetchLifeStories();
  }, []);

  // Handle URL parameters for story highlighting
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    const sessionId = searchParams.get('sessionId');

    if (storyId && lifeStories.length > 0) {
      // Find the story by ID or by session ID if storyId is not found
      let targetStory = lifeStories.find(story => story.id === storyId);

      // If no story found by ID but sessionId is provided, try to find by sessionId
      if (!targetStory && sessionId) {
        targetStory = lifeStories.find(story => story.sessionId === sessionId);
      }

      if (targetStory) {
        // Expand the story automatically
        setExpandedStory(targetStory.id);

        // Scroll to the story after a short delay to ensure DOM is ready
        setTimeout(() => {
          const storyElement = document.querySelector(`[data-story-id="${targetStory.id}"]`);
          if (storyElement) {
            // Scroll with offset to keep header visible
            storyElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
            // Add offset to account for header height
            window.scrollBy(0, -100);
            // Add a highlight effect
            storyElement.classList.add('story-highlighted');
            setTimeout(() => {
              storyElement.classList.remove('story-highlighted');
            }, 5000);
          }
        }, 300); // Increased timeout to ensure DOM is fully rendered with the new collapsible UI

        // Clear the URL parameters after handling them
        setSearchParams({});
      }
    }
  }, [lifeStories, searchParams, setSearchParams]);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Listen for draft regeneration started
    const handleStoryGenerationStarted = (data) => {
      console.log('🔄 Regeneration started for story:', data);
    };

    // Listen for draft generation complete (includes regeneration)
    const handleStoryGenerationComplete = async (data) => {
      console.log('✅ Story Generation completed event received:', data);

      // Short delay to ensure modal is visible before closing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh the life stories list
      await fetchLifeStories();
      setActionLoading(prev => ({ ...prev, [data.storyId]: null }));
      setRegenerationProcessing(null);
    };

    // Add WebSocket listeners
    if (websocketService.socket) {
      websocketService.socket.on('full-life-story-generation-started', handleStoryGenerationStarted);
      websocketService.socket.on('full-life-story-generation-complete', handleStoryGenerationComplete);
    }

    // Cleanup on unmount or when modal closes
    return () => {
      if (websocketService.socket) {
        websocketService.socket.off('full-life-story-generation-started', handleStoryGenerationStarted);
        websocketService.socket.off('full-life-story-generation-complete', handleStoryGenerationComplete);
      }
    };
  }, []);

  const fetchLifeStories = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/full-life-stories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch life stories');
      }

      const data = await response.json();


      if (data.success) {
        // Transform the data to match our frontend structure
        const transformedStories = data.data.map(story => {
          // Check if this story is actually rejected (stored in review_notes)
          const isRejected = story.review_notes && story.review_notes.includes('Rejected -');
          const actualStatus = isRejected ? 'rejected' : story.status;

          // Handle both old structured format and new string format
          const isNewFormat = typeof story.content === 'string';
          const contentData = isNewFormat ? {} : story.content || {};

          // Extract word count from metadata or calculate from content
          const wordCount = story.total_words ||
            story.metadata?.wordCount ||
            (isNewFormat && story.content ? story.content.split(/\s+/).length : 0) ||
            0;

          // Extract chapters from markdown headers and their content if new format
          const extractChaptersFromMarkdown = (text) => {
            if (!text || typeof text !== 'string') return [];


            // Use the simplest possible approach that works reliably
            const chapters = [];

            try {
              // Replace Windows line endings with Unix line endings for consistency
              const normalizedText = text.replace(/\r\n/g, '\n');

              // Split the text by ## headers - this gives us an array where:
              // parts[0] = content before first header (if any)
              // parts[1] = first chapter title + content
              // parts[2] = second chapter title + content, etc.
              const parts = normalizedText.split(/^##\s+/m);

              // Skip the first part (content before any headers)
              for (let i = 1; i < parts.length; i++) {
                const part = parts[i];

                // Find the first line break to separate title from content
                const firstLineBreakIndex = part.indexOf('\n');

                if (firstLineBreakIndex !== -1) {
                  const title = part.substring(0, firstLineBreakIndex).trim();
                  const rawContent = part.substring(firstLineBreakIndex + 1).trim();

                  // Process subtitles (### headers) within the chapter content
                  const subtitles = [];
                  const contentWithoutSubtitles = rawContent.replace(/^###\s+(.+?)$(\n|$)/gm, (match, subtitleText) => {
                    subtitles.push(subtitleText.trim());
                    return '§§§SUBTITLE§§§' + subtitleText.trim() + '§§§SUBTITLE§§§\n'; // Placeholder to identify subtitle positions
                  });

                  // Split content by subtitle placeholders to get content sections
                  const contentSections = [];
                  if (subtitles.length > 0) {
                    const contentParts = contentWithoutSubtitles.split('§§§SUBTITLE§§§');

                    // First part is content before any subtitle
                    let currentContent = contentParts[0];

                    // Process each subtitle and its content
                    for (let j = 1; j < contentParts.length; j += 2) {
                      if (j + 1 < contentParts.length) {
                        const subtitle = contentParts[j];
                        const sectionContent = contentParts[j + 1];

                        // Add previous content if any
                        if (currentContent.trim()) {
                          contentSections.push({
                            type: 'content',
                            text: currentContent.trim()
                          });
                        }

                        // Add subtitle
                        contentSections.push({
                          type: 'subtitle',
                          text: subtitle
                        });

                        // Set current content to this section's content
                        currentContent = sectionContent;
                      }
                    }

                    // Add the last section's content if any
                    if (currentContent.trim()) {
                      contentSections.push({
                        type: 'content',
                        text: currentContent.trim()
                      });
                    }
                  } else {
                    // No subtitles, just add the raw content
                    contentSections.push({
                      type: 'content',
                      text: rawContent
                    });
                  }

                  chapters.push({
                    title,
                    content: rawContent,
                    subtitles,
                    contentSections
                  });

                } else {
                  // If there's no line break, the entire part is the title
                  chapters.push({
                    title: part.trim(),
                    content: '',
                    subtitles: [],
                    contentSections: []
                  });

                }
              }

            } catch (error) {
              console.error('Error extracting chapters:', error);
            }

            return chapters;
          };

          // Extract summary from first paragraph if new format
          const extractSummaryFromMarkdown = (text) => {
            if (!text || typeof text !== 'string') return '';
            const paragraphs = text.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
            return paragraphs[0] ? paragraphs[0].substring(0, 300) + '...' : '';
          };

          return {
            id: story.id,
            title: (() => {
              // Try to extract title from content.fullText first line if it's a markdown header
              if (story.content?.fullText) {
                const firstLine = story.content.fullText.split('\n')[0].trim();
                if (firstLine.startsWith('# ')) {
                  return firstLine.substring(2).trim();
                }
              }
              // Fallback to story.title if available and not generic
              if (story.title && story.title !== 'Generated Life Story') {
                return story.title;
              }
              // Final fallback
              return `${story.sessions?.client_name || 'Untitled'} - Life Story`;
            })(),
            subtitle: story.subtitle,
            sessionId: story.session_id,
            participantName: story.sessions?.client_name || 'Unknown',
            clientAge: story.sessions?.client_age || null,
            status: actualStatus, // Use the detected status (rejected or original)
            version: story.version,
            isCurrentVersion: story.is_current_version,
            createdAt: story.generated_at || story.created_at,
            updatedAt: story.updated_at,
            generatedBy: story.generated_by,
            aiModel: story.ai_model,
            wordCount: wordCount,
            totalPages: story.total_pages || Math.ceil(wordCount / 250) || 0, // Estimate pages
            estimatedReadingTime: story.estimated_reading_time || Math.ceil(wordCount / 200) || 0, // Estimate reading time
            chapterCount: isNewFormat ? extractChaptersFromMarkdown(story.content).length : (contentData.chapters?.length || 0),
            processingTime: story.processing_time || story.metadata?.processingTime || 0,
            // Session statistics for indicators - get from sourceMetadata
            sessionStats: {
              totalInterviews: story.source_metadata?.totalInterviews || story.sourceMetadata?.totalInterviews || 0,
              completedInterviews: story.source_metadata?.totalInterviews || story.sourceMetadata?.totalInterviews || 0,
              totalDrafts: story.source_metadata?.approvedDrafts || story.sourceMetadata?.approvedDrafts || 0,
              approvedDrafts: story.source_metadata?.approvedDrafts || story.sourceMetadata?.approvedDrafts || 0
            },
            content: {
              // For new format (string content), extract structured data
              summary: isNewFormat ? extractSummaryFromMarkdown(story.content) : (contentData.summary || contentData.introduction?.summary || story.subtitle || ''),
              // Store extracted chapters in a variable for debugging
              chapters: (() => {
                if (isNewFormat) {
                  const extractedChapters = extractChaptersFromMarkdown(story.content);

                  return extractedChapters;
                } else {
                  return contentData.chapters || [];
                }
              })(),
              keyMoments: isNewFormat ? [] : (contentData.key_moments || contentData.keyMoments || []),
              timeline: isNewFormat ? [] : (contentData.timeline || []),
              introduction: isNewFormat ? null : (contentData.introduction || null),
              appendices: isNewFormat ? null : (contentData.appendices || null),
              // Keep the raw content for display
              fullText: isNewFormat ? story.content : (contentData.fullText || '')
            },
            generationStats: story.generation_stats || {},
            sourceMetadata: story.source_metadata || {},
            // Parse notes from review_notes field (format: [timestamp] author: text)
            notes: story.review_notes ? story.review_notes.split('\n\n').map((noteText, index) => {
              const match = noteText.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/s);
              if (match) {
                return {
                  id: index + 1,
                  text: match[3].trim(),
                  createdAt: match[1],
                  author: match[2].trim()
                };
              } else {
                // Fallback for notes without proper format
                return {
                  id: index + 1,
                  text: noteText.trim(),
                  createdAt: story.reviewed_at,
                  author: story.reviewed_by || 'Unknown'
                };
              }
            }).filter(note => note.text) : [],
            reviewedAt: story.reviewed_at,
            reviewedBy: story.reviewed_by,
            approvalMetadata: story.status === 'approved' ? {
              approvedBy: story.reviewed_by,
              approvedAt: story.reviewed_at,
              reason: story.review_notes
            } : null,
            rejectionMetadata: isRejected ? {
              rejectedBy: story.reviewed_by,
              rejectedAt: story.reviewed_at,
              reason: story.review_notes
            } : null
          };
        });

        setLifeStories(transformedStories);
      } else {
        throw new Error(data.error || 'Failed to fetch life stories');
      }
    } catch (err) {
      console.error('Error fetching life stories:', err);
      setError(err.message);
      // Set empty array on error instead of mock data
      setLifeStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort life stories
  const filteredAndSortedStories = useMemo(() => {
    let filtered = lifeStories;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.participantName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(story => story.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [lifeStories, searchQuery, statusFilter, sortBy, sortOrder]);

  // Handle actions
  const handleApprove = async (storyId) => {
    setActionLoading(prev => ({ ...prev, [storyId]: 'approving' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'approved',
          reason: 'Approved for publication'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve life story');
      }

      const data = await response.json();

      if (data.success) {
        // Refresh the life stories list
        await fetchLifeStories();
      } else {
        throw new Error(data.error || 'Failed to approve life story');
      }
    } catch (err) {
      console.error('Error approving life story:', err);
      setError('Failed to approve life story');
    } finally {
      setActionLoading(prev => ({ ...prev, [storyId]: null }));
    }
  };

  const handleReject = async (storyId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || !reason.trim()) {
      return; // User cancelled or didn't provide a reason
    }

    setActionLoading(prev => ({ ...prev, [storyId]: 'rejecting' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'rejected',
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject life story');
      }

      const data = await response.json();

      if (data.success) {
        // Refresh the life stories list
        await fetchLifeStories();
      } else {
        throw new Error(data.error || 'Failed to reject life story');
      }
    } catch (err) {
      console.error('Error rejecting life story:', err);
      setError('Failed to reject life story');
    }
  };

  const exportToWord = async (story) => {
    try {
      setActionLoading(prev => ({ ...prev, [story.id]: 'exporting' }));

      // Create document sections array to hold all content
      const sections = [];

      // Main section with title and summary
      const mainSection = {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: story.title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 }
          }),

          // Participant name
          new Paragraph({
            children: [
              new TextRun({ text: t('admin.lifeStories.participantName', 'Participant Name') + ': ', bold: true }),
              new TextRun(story.participantName)
            ],
            spacing: { after: 200 }
          }),

          // Summary
          new Paragraph({
            text: t('admin.lifeStories.summary', 'Summary'),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: story.content.summary,
            spacing: { after: 400 }
          }),
        ]
      };

      sections.push(mainSection);

      // Add chapters
      if (story.content.chapters && story.content.chapters.length > 0) {
        story.content.chapters.forEach((chapter, index) => {
          const chapterChildren = [
            // Chapter title
            new Paragraph({
              text: `${index + 1}. ${chapter.title}`,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            })
          ];

          // Chapter content
          if (chapter.contentSections && chapter.contentSections.length > 0) {
            chapter.contentSections.forEach(section => {
              if (section.type === 'subtitle') {
                chapterChildren.push(
                  new Paragraph({
                    text: section.text,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 200 }
                  })
                );
              } else {
                chapterChildren.push(
                  new Paragraph({
                    text: section.text,
                    spacing: { after: 200 }
                  })
                );
              }
            });
          } else if (chapter.content) {
            chapterChildren.push(
              new Paragraph({
                text: chapter.content,
                spacing: { after: 200 }
              })
            );
          }

          // Add chapter section
          sections.push({
            properties: {},
            children: chapterChildren
          });
        });
      } else if (story.content.fullText) {
        // If no chapters, add full text to main section
        mainSection.children.push(
          new Paragraph({
            text: story.content.fullText,
            spacing: { after: 200 }
          })
        );
      }

      // Add timeline if available
      if (story.content.timeline && story.content.timeline.length > 0) {
        const timelineChildren = [
          new Paragraph({
            text: t('admin.lifeStories.timeline', 'Timeline'),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          })
        ];

        story.content.timeline.forEach(item => {
          timelineChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${item.year}: `, bold: true }),
                new TextRun(item.event)
              ],
              spacing: { after: 100 }
            })
          );
        });

        // Add timeline section
        sections.push({
          properties: {},
          children: timelineChildren
        });
      }

      // Add key moments if available
      if (story.content.keyMoments && story.content.keyMoments.length > 0) {
        const keyMomentsChildren = [
          new Paragraph({
            text: t('admin.lifeStories.keyMoments', 'Key Moments'),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          })
        ];

        story.content.keyMoments.forEach(moment => {
          keyMomentsChildren.push(
            new Paragraph({
              text: `• ${moment}`,
              spacing: { after: 100 }
            })
          );
        });

        // Add key moments section
        sections.push({
          properties: {},
          children: keyMomentsChildren
        });
      }

      // Create the document with all sections
      const doc = new Document({
        sections: sections
      });

      // Generate the document
      const buffer = await Packer.toBlob(doc);

      // Save the document
      const fileName = `${story.participantName.replace(/\s+/g, '_')}_life_story.docx`;
      saveAs(buffer, fileName);

      // Show success message
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          message: t('admin.lifeStories.exportSuccess', 'Life story exported successfully'),
          duration: 3000
        }
      });
    } catch (error) {
      console.error('Error exporting to Word:', error);
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          message: t('admin.lifeStories.exportError', 'Failed to export life story'),
          duration: 3000
        }
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [story.id]: null }));
    }
  };

  const handleRegenerate = async (storyId, regenerateNotes) => {
    const isSure = window.confirm(t('admin.lifeStories.regenerateConfirm', 'Are you sure you want to regenerate this life story? - The previous life story will be deleted, version handling will be implemented in phase 2'));
    if (!isSure) return;
    // Start regeneration processing modal
    setRegenerationProcessing(storyId);
    setActionLoading(prev => ({ ...prev, [storyId]: 'regenerating' }));

    try {

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regenerationType: 'notes_based',
          includeAllNotes: true,
          notes: regenerateNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate life story');
      }

      const data = await response.json();

      // if (data.success) {
      //   // Short delay to ensure modal is visible before closing
      //   await new Promise(resolve => setTimeout(resolve, 500));

      //   // Refresh the life stories list
      //   await fetchLifeStories();
      // } else {
      //   throw new Error(data.error || 'Failed to regenerate life story');
      // }
    } catch (err) {
      console.error('Error regenerating life story:', err);
      setError('Failed to regenerate life story');
    }
  };

  // Check if regenerate should be available (only if there are notes added after generation)
  const shouldShowRegenerate = (story) => {
    if (story.status === 'approved' || story.status === 'rejected') {
      return false; // Don't allow regenerate for finalized stories
    }

    if (!story.notes || story.notes.length === 0) {
      return false; // No notes, no need to regenerate
    }

    // Check if any notes were added after the story was generated
    const storyGeneratedAt = new Date(story.createdAt);

    // Filter out regeneration notes (notes that mention "Regenerated from version")
    const userNotes = story.notes.filter(note =>
      !note.text.includes('Regenerated from version')
    );

    if (userNotes.length === 0) {
      return false; // Only regeneration notes exist, no user feedback
    }

    // Check if any user notes were added after the story was generated
    const hasNewUserNotes = userNotes.some(note => {
      const noteCreatedAt = new Date(note.createdAt);
      return noteCreatedAt > storyGeneratedAt;
    });

    return hasNewUserNotes;
  };


  const handleAddNote = async (storyId) => {
    if (!notesText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: notesText.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();

      if (data.success) {
        // Add the new note to the local state
        const newNote = data.data.note;
        setLifeStories(prev => prev.map(story =>
          story.id === storyId
            ? {
              ...story,
              notes: [...story.notes, newNote]
            }
            : story
        ));

        setNotesText('');
        setEditingNotes(null);
      } else {
        throw new Error(data.error || 'Failed to add note');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_approval: { color: 'warning', icon: Clock, text: t('common.pendingApproval', 'Pending Approval') },
      approved: { color: 'success', icon: CheckCircle, text: t('common.approved', 'Approved') },
      rejected: { color: 'danger', icon: XCircle, text: t('common.rejected', 'Rejected') },
      regenerating: { color: 'info', icon: RefreshCw, text: t('common.regenerating', 'Regenerating') }
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    const Icon = config.icon;

    return (
      <span className={`status-badge status-badge--${config.color}`}>
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page__content">
          <div className="loading-container">
            <LoadingSpinner size="large" />
            <p>{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page full-life-stories-page">
      <header className="admin-page__header">
        <div className="admin-page__header-content">
          <div className="admin-page__title-section">
            <h1 className="admin-page__title">
              {t('admin.lifeStories.title', 'Full Life Stories')}
            </h1>
            <p className="admin-page__subtitle">
              {t('admin.lifeStories.subtitle', 'Manage and review complete life story narratives')}
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="admin-page__toolbar">
          <div className="search-bar">
            <div className="search-bar__input">
              <Search className="search-bar__icon" size={20} />
              <input
                type="text"
                placeholder={t('admin.lifeStories.searchPlaceholder', 'Search by name or title...')}
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
              {t('admin.lifeStories.filters', 'Filters')}
              <ChevronDown
                size={16}
                className={`chevron ${showFilters ? 'chevron--up' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-panel__content">
              <div className="filter-group">
                <label className="filter-label">{t('admin.lifeStories.status', 'Status')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('common.all', 'All')}</option>
                  <option value="generated">{t('common.awaitingApproval', 'Awaiting Approval')}</option>
                  <option value="approved">{t('common.approved', 'Approved')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{t('admin.lifeStories.sortBy', 'Sort By')}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="createdAt">{t('common.dateCreated', 'Date Created')}</option>
                  <option value="updatedAt">{t('common.dateUpdated', 'Date Updated')}</option>
                  <option value="participantName">{t('common.participantName', 'Participant Name')}</option>
                  <option value="wordCount">{t('common.wordCount', 'Word Count')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{t('common.order', 'Order')}</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="filter-select"
                >
                  <option value="desc">{t('common.descending', 'Descending')}</option>
                  <option value="asc">{t('common.ascending', 'Ascending')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="admin-page__content">
        {error && (
          <ErrorAlert
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Statistics Cards */}
        {/* <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__value">{lifeStories.length}</div>
            <div className="stat-card__label">{t('admin.lifeStories.totalStories', 'Total Stories')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{lifeStories.filter(s => s.status === 'generated').length}</div>
            <div className="stat-card__label">{t('admin.lifeStories.generatedStories', 'Generated')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{lifeStories.filter(s => s.status === 'approved').length}</div>
            <div className="stat-card__label">{t('admin.lifeStories.approvedStories', 'Approved')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">
              {Math.round(lifeStories.reduce((sum, story) => sum + story.wordCount, 0) / lifeStories.length) || 0}
            </div>
            <div className="stat-card__label">{t('admin.lifeStories.avgWordCount', 'Avg Word Count')}</div>
          </div>
        </div>*/}

        {/* Life Stories List */}
        <div className="life-stories-list">
          {filteredAndSortedStories.length === 0 ? (
            <div className="empty-state">
              <BookOpen className="empty-state__icon" size={64} />
              <h3 className="empty-state__title">{t('admin.lifeStories.noStories', 'No Life Stories Found')}</h3>
              <p className="empty-state__description">
                {t('admin.lifeStories.noStoriesDesc', 'Life stories will appear here once they are generated from approved drafts.')}
              </p>
            </div>
          ) : (
            filteredAndSortedStories.map(story => (
              <div
                key={story.id}
                className={`life-story-card ${expandedStory === story.id ? 'life-story-card--expanded' : ''}`}
                data-story-id={story.id}
              >
                {/* Story Header - Always visible */}
                <div
                  className="life-story-card__header"
                  onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
                >
                  <div className="life-story-card__header-left">
                    <div className="life-story-card__meta-compact">
                      <h3 className="life-story-card__title">{story.title}</h3>
                      <span className="meta-item" onClick={() => navigate(`/admin/sessions?sessionId=${story.sessionId}`)}>
                        <User size={14} />
                        {t('admin.lifeStories.participantName', 'Participant Name')}: {story.participantName}
                      </span>
                      {/* <span className="meta-item">
                        <Calendar size={14} />
                        {formatDate(story.createdAt).split(',')[0]}
                      </span> */}
                    </div>
                  </div>
                  <div className="life-story-card__header-right">
                    <div className="life-story-card__status">
                      {getStatusBadge(story.status)}
                    </div>
                    <button className="btn btn--icon">
                      <ChevronDown size={20} data-lucide="chevron-down" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content - Only visible when expanded */}
                {expandedStory === story.id && (
                  <div className="life-story-card__expanded-container">
                    {/* Detailed Meta Information */}
                    <div className="life-story-card__detailed-meta">
                      <div className="meta-row">
                        <span className="meta-item">
                          <Calendar size={14} />
                          {formatDate(story.createdAt)}
                        </span>
                        <span className="meta-item">
                          <Hash size={14} />
                          {t('admin.lifeStories.version', 'Version')} {story.version}
                        </span>
                        <span className="meta-item">
                          <BookOpen size={14} />
                          {story.wordCount.toLocaleString()} {t('admin.lifeStories.words', 'Words')}, {story.chapterCount} {t('admin.lifeStories.chapters', 'Chapters')}
                        </span>
                      </div>

                      {/* Story summary */}
                      <div className="story-summary">
                        <h4>{t('admin.lifeStories.summary', 'Summary')}</h4>
                        <p>{story.content.summary}</p>
                      </div>

                      {story.status === 'approved' && (
                        <button
                          className="btn btn--primary btn--sm"
                          style={{ marginTop: '1rem' }}
                          onClick={() => exportToWord(story)}
                          disabled={actionLoading[story.id] === 'exporting'}
                        >
                          {actionLoading[story.id] === 'exporting' ? (
                            <RefreshCw size={16} className="spin" />
                          ) : (
                            <FileText size={16} />
                          )}
                          {t('admin.lifeStories.exportAsWord', 'Export as Word')}
                        </button>
                      )}
                    </div>

                    {/* Content Toggle Button */}
                    <div className="life-story-card__content-toggle">
                      <button
                        className="btn btn--secondary btn--sm content-toggle-btn"
                        onClick={() => setExpandedContent(expandedContent === story.id ? null : story.id)}
                      >
                        <Eye size={16} />
                        {expandedContent === story.id
                          ? t('admin.lifeStories.hideContent', 'Hide Full Content')
                          : t('admin.lifeStories.showContent', 'Show Full Content')}
                        {expandedContent === story.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* Expandable Content and Notes Section */}
                    {expandedContent === story.id && (
                      <div className="life-story-card__content-expanded">
                        {/* Two-panel layout for content and notes */}
                        <div className="life-story-card__content-container">
                          {/* Left panel - Story content */}
                          <div className="life-story-card__content-panel">
                            <div className="content-panel__header">
                              <h4>{t('admin.lifeStories.fullStory', 'Full Life Story')}</h4>
                            </div>
                            <div className="content-panel__body" onClick={() => console.log(story)}>

                              {/* Full text content */}
                              {!story.content.chapters && story.content.fullText && (
                                <div className="full-story-content">
                                  <h5>{t('admin.lifeStories.content', 'Content')}</h5>
                                  <div className="story-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                    {story.content.fullText}
                                  </div>
                                </div>
                              )}

                              {/* Show chapters with full content */}
                              {story.content.chapters && story.content.chapters.length > 0 && (
                                <div className="chapters-preview">
                                  <h5>{t('admin.lifeStories.chapters', 'Chapters')}</h5>
                                  {story.content.chapters.map((chapter, index) => (
                                    <div key={index} className="chapter-preview" style={{ marginBottom: '2rem', borderBottom: index < story.content.chapters.length - 1 ? '1px solid #eaeaea' : 'none', paddingBottom: '1.5rem' }}>
                                      <h6 className="chapter-title" style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                                        {index + 1}. {chapter.title}
                                      </h6>

                                      {/* Display content sections and subtitles if available */}
                                      {chapter.contentSections && chapter.contentSections.length > 0 ? (
                                        <div className="chapter-sections">
                                          {chapter.contentSections.map((section, sectionIndex) => (
                                            <div key={sectionIndex} className={`chapter-section ${section.type}`}>
                                              {section.type === 'subtitle' ? (
                                                <h6 className="chapter-subtitle" style={{
                                                  fontSize: '1.1rem',
                                                  fontWeight: '600',
                                                  marginTop: '1.5rem',
                                                  marginBottom: '0.75rem',
                                                  color: '#444',
                                                  borderBottom: '1px solid #eee',
                                                  paddingBottom: '0.5rem'
                                                }}>
                                                  {section.text}
                                                </h6>
                                              ) : (
                                                <div className="chapter-content" style={{
                                                  whiteSpace: 'pre-wrap',
                                                  lineHeight: '1.6',
                                                  fontSize: '1rem',
                                                  color: '#444',
                                                  padding: '0.5rem 0',
                                                  textAlign: 'justify'
                                                }}>
                                                  {section.text}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : chapter.content ? (
                                        <div className="chapter-content" style={{
                                          whiteSpace: 'pre-wrap',
                                          lineHeight: '1.6',
                                          fontSize: '1rem',
                                          color: '#444',
                                          padding: '0.5rem 0',
                                          textAlign: 'justify'
                                        }}>
                                          {chapter.content}
                                        </div>
                                      ) : (
                                        <p className="no-content" style={{ fontStyle: 'italic', color: '#888' }}>{t('admin.lifeStories.noChapterContent', 'No content available for this chapter')}</p>
                                      )}

                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Timeline */}
                              {story.content.timeline && story.content.timeline.length > 0 && (
                                <div className="timeline-preview">
                                  <h5>{t('admin.lifeStories.timeline', 'Timeline')}</h5>
                                  <div className="timeline-items">
                                    {story.content.timeline.map((item, index) => (
                                      <div key={index} className="timeline-item">
                                        <strong>{item.year}</strong>: {item.event}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Key Moments */}
                              {story.content.keyMoments && story.content.keyMoments.length > 0 && (
                                <div className="key-moments">
                                  <h5>{t('admin.lifeStories.keyMoments', 'Key Moments')}</h5>
                                  <ul>
                                    {story.content.keyMoments.map((moment, index) => (
                                      <li key={index}>{moment}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Notes panel - position depends on language direction */}
                          <div className="life-story-card__notes-panel">
                            <div className="notes-panel__header">
                              <h4>
                                <StickyNote size={16} />
                                {t('admin.lifeStories.notesForRegeneration', 'Notes for regeneration')} ({story.notes.length})
                              </h4>
                            </div>
                            <div className="notes-panel__body">
                              {story.notes.length > 0 ? (
                                <div className="existing-notes">
                                  {story.notes.map(note => (
                                    <div key={note.id} className="note-item">
                                      <div className="note-content">{note.text}</div>
                                      <div className="note-meta">
                                        {note.author} - {formatDate(note.createdAt)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="no-notes">
                                  {t('admin.lifeStories.noNotes', 'No notes yet. Add the first note below.')}
                                </div>
                              )}

                              {story.status !== 'approved' && <div className="add-note">
                                <textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder={t('admin.lifeStories.addNotePlaceholder', 'Add a note about this life story...')}
                                  className="note-textarea"
                                  rows={3}
                                />
                                <div className="note-actions">
                                  <button
                                    className="btn btn--primary btn--sm"
                                    onClick={() => handleAddNote(story.id)}
                                    disabled={!notesText.trim()}
                                  >
                                    <Save size={16} />
                                    {t('admin.lifeStories.addNote', 'Add Note')}
                                  </button>
                                  <button
                                    className="btn btn--secondary btn--sm"
                                    onClick={() => setNotesText('')}
                                  >
                                    {t('common.clear', 'Clear')}
                                  </button>
                                </div>

                              </div>}
                            </div>
                            {shouldShowRegenerate(story) && (
                              <button
                                className="btn btn--regenerate btn--sm"
                                onClick={() => handleRegenerate(story.id, story.notes)}
                                disabled={actionLoading[story.id] === 'regenerating'}
                              >
                                {actionLoading[story.id] === 'regenerating' ? (
                                  <RefreshCw size={16} className="spin" />
                                ) : (
                                  <RefreshCw size={16} />
                                )}
                                {t('admin.sessions.lifeStories.regenerate', 'Regenerate')}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Moved to the end */}
                        <div className="life-story-card__actions">
                          {story.status === 'approved' && (
                            <button
                              className="btn btn--primary btn--sm"
                              onClick={() => exportToWord(story)}
                              disabled={actionLoading[story.id] === 'exporting'}
                            >
                              {actionLoading[story.id] === 'exporting' ? (
                                <RefreshCw size={16} className="spin" />
                              ) : (
                                <FileText size={16} />
                              )}
                              {t('admin.lifeStories.exportAsWord', 'Export as Word')}
                            </button>
                          )}
                          {story.status === 'generated' && (
                            <>
                              <button
                                className="btn btn--success btn--sm"
                                onClick={() => handleApprove(story.id)}
                                disabled={actionLoading[story.id] === 'approving'}
                              >
                                {actionLoading[story.id] === 'approving' ? (
                                  <RefreshCw size={16} className="spin" />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                                {t('common.approve', 'Approve')}
                              </button>

                              <button className="btn btn--icon" onClick={() => setExpandedContent(null)}>
                                <ChevronUp size={20} data-lucide="chevron-up" />
                              </button>
                              {/* <button
                                className="btn btn--danger btn--sm"
                                onClick={() => handleReject(story.id)}
                                disabled={actionLoading[story.id] === 'rejecting'}
                              >
                                {actionLoading[story.id] === 'rejecting' ? (
                                  <RefreshCw size={16} className="spin" />
                                ) : (
                                  <XCircle size={16} />
                                )}
                                {t('common.reject', 'Reject')}
                              </button> */}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Regeneration Processing Modal */}
        {regenerationProcessing && (
          <div className="regeneration-processing-overlay">
            <div className="regeneration-processing-modal">
              <div className="regeneration-processing-content">
                <div className="regeneration-processing-header">
                  <h3>{t('admin.lifeStories.regeneration.title', 'Regenerating Life Story')}</h3>
                  <p>{t('admin.lifeStories.regeneration.subtitle', 'Creating new version with your feedback...')}</p>
                  <RefreshCw className="regeneration-processing-icon spin" size={32} />
                </div>

                {/* <div className="regeneration-processing-loader">
                  <div className="loader-container">
                    <LoadingSpinner size="medium" />
                  </div>
                </div> */}

                <div className="regeneration-processing-footer">
                  <p className="regeneration-processing-note">
                    {t('admin.lifeStories.regeneration.note', 'This process may take a few minutes. Please do not close this window.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullLifeStories;
