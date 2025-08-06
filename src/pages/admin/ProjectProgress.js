import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Users, 
  Code, 
  Database,
  Zap,
  AlertCircle,
  Award,
  Rocket,
  Activity,
  DollarSign,
  Timer,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle
} from 'lucide-react';

const ProjectProgress = () => {
  const { t } = useTranslation();

  // Mock project data - in real app this would come from API/Redux
  const projectData = {
    projectHealth: 'excellent', // excellent, good, warning, critical
    overallProgress: 65,

    timelineStatus: 'on-track', // ahead, on-track, delayed, critical
    
    // Key Performance Indicators
    kpis: {
      featuresCompleted: { value: 10, total: 15, trend: 'up' },
      codeQuality: { value: 98, trend: 'up' },
      testCoverage: { value: 93, trend: 'up' }
    },
    
    // Current sprint/phase info
    currentSprint: {
      name: 'Sprint 6: AI Integration & Draft Management',
      progress: 45,
      daysRemaining: 5,
      totalDays: 10,
      velocity: 'high'
    },
    
    // Critical path items
    criticalPath: [
      { task: 'Connect Real AI Processing (OpenAI/Claude API)', status: 'in-progress', priority: 'high', dueDate: '2025-08-08' },
      { task: 'Upload Front & Backend to GitHub', status: 'pending', priority: 'high', dueDate: '2025-08-09' },
      { task: 'Deploy to Render for Testing', status: 'pending', priority: 'high', dueDate: '2025-08-10' },
      { task: 'Integrate AI Content Generation Pipeline', status: 'pending', priority: 'medium', dueDate: '2025-08-12' },
      { task: 'Implement Draft Stage Management & Approval Workflow', status: 'pending', priority: 'medium', dueDate: '2025-08-13' },
      { task: 'Test File Upload & AI Processing Pipeline End-to-End', status: 'pending', priority: 'medium', dueDate: '2025-08-14' },
      { task: 'Performance Testing with Real AI APIs', status: 'pending', priority: 'medium', dueDate: '2025-08-15' },
      { task: 'End-to-End Integration Testing', status: 'pending', priority: 'high', dueDate: '2025-08-16' },
      { task: 'Complete Stage 1 Deliverables', status: 'pending', priority: 'high', dueDate: '2025-08-17' }
    ],
    
    // Recent achievements
    recentWins: [
      { title: 'Sessions Page Filters & Search Implemented', date: '2025-08-06', impact: 'high' },
      { title: 'Pagination Display Fixed for Filtered Results', date: '2025-08-06', impact: 'medium' },
      { title: 'Firebase Dependencies Removed', date: '2025-07-31', impact: 'medium' },
      { title: 'File Upload with AI Processing Pipeline', date: '2025-07-30', impact: 'high' },
      { title: 'Interview Management System Complete', date: '2025-07-30', impact: 'high' },
      { title: 'Interview Management Functionality Fixed', date: '2025-07-30', impact: 'medium' },
      { title: 'Stage Transition Validation & History Tracking', date: '2025-07-29', impact: 'high' },
      { title: 'Supabase Integration Complete', date: '2025-07-29', impact: 'high' },
      { title: 'Session/Interview Bug Fixes', date: '2025-07-28', impact: 'high' },
      { title: 'Enhanced Version Management & Content Aggregation', date: '2025-07-28', impact: 'medium' },
      { title: 'Draft Review UI Complete', date: '2025-07-27', impact: 'high' },
      { title: 'Stage Validation Service', date: '2025-07-27', impact: 'high' },
      { title: 'Advanced Content Aggregation', date: '2025-07-27', impact: 'medium' },
      { title: 'History Tracking System', date: '2025-07-27', impact: 'high' },
      { title: 'Draft Flow Architecture', date: '2025-07-27', impact: 'high' },
      { title: 'Complete Sessions Management System', date: '2025-01-24', impact: 'high' },
      { title: 'Enhanced Scheduling Page', date: '2025-01-22', impact: 'medium' },
      { title: 'Full CRUD operations for sessions', date: '2025-01-20', impact: 'high' },
      { title: 'Create Session Modal with form validation', date: '2025-01-18', impact: 'medium' },
      { title: 'Redux integration with state management', date: '2025-01-15', impact: 'high' }
    ],
    
    // Risk indicators
    risks: [
      { item: 'Database migration complexity', level: 'high', mitigation: 'Comprehensive testing plan and rollback strategy prepared' },
      { item: 'API endpoint performance with real data', level: 'medium', mitigation: 'Load testing scheduled before production deployment' },
      { item: 'File processing pipeline scalability', level: 'medium', mitigation: 'Implementing queue system and monitoring' },
      { item: 'Data consistency during transition', level: 'low', mitigation: 'Staged rollout with data validation checks' }
    ],
    

    
    // Timeline
    timeline: {
      startDate: '2025-08-06',
      currentDate: '2025-08-06',
      estimatedCompletion: '2025-08-17',
      originalCompletion: '2025-08-17',
      daysElapsed: 1,
      totalDays: 10,
      daysRemaining: 10
    },
    
    // Team performance
    team: {
      velocity: 85, // story points per sprint
      productivity: 'high',
      satisfaction: 4.6,
      availableHours: 160,
      utilizedHours: 142
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'primary';
    if (progress >= 40) return 'warning';
    return 'danger';
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'warning': return 'warning';
      case 'critical': return 'danger';
      default: return 'primary';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ArrowUp size={16} className="trend-icon trend-icon--up" />;
      case 'down': return <ArrowDown size={16} className="trend-icon trend-icon--down" />;
      case 'stable': return <Minus size={16} className="trend-icon trend-icon--stable" />;
      default: return null;
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="header-content">
          <div className="header-main">
            <h1 className="admin-page__title">{t('projectProgress.title')}</h1>
            <p className="admin-page__subtitle">{t('projectProgress.subtitle')}</p>
          </div>
          <div className="project-health">
            <div className={`health-indicator health-indicator--${projectData.projectHealth}`}>
              <Award size={20} />
              <span>{t(`projectProgress.health.${projectData.projectHealth}`)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-page__content">
        <div className="project-progress">
          {/* Executive Summary Cards */}
          <div className="project-progress__overview">
            <div className="progress-card progress-card--featured">
              <div className="progress-card__icon">
                <Rocket size={28} />
              </div>
              <div className="progress-card__content">
                <h3>{t('projectProgress.overview.overallProgress')}</h3>
                <div className="progress-display">
                  <div className="progress-bar progress-bar--large">
                    <div 
                      className={`progress-bar__fill progress-bar__fill--${getProgressColor(projectData.overallProgress)}`}
                      style={{ width: `${projectData.overallProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-percentage progress-percentage--large">{projectData.overallProgress}%</span>
                </div>
                <p className="progress-meta">{projectData.kpis.featuresCompleted.value} of {projectData.kpis.featuresCompleted.total} features completed</p>
              </div>
            </div>



            <div className="progress-card">
              <div className="progress-card__icon">
                <Timer size={24} />
              </div>
              <div className="progress-card__content">
                <h3>{t('projectProgress.timeline.title')}</h3>
                <div className="timeline-display">
                  <span className="timeline-status timeline-status--on-track">
                    {projectData.timeline.daysRemaining} {t('projectProgress.timeline.daysRemaining')}
                  </span>
                </div>
                <p className="progress-meta">
                  {projectData.timeline.daysElapsed} of {projectData.timeline.totalDays} days completed
                </p>
              </div>
            </div>


          </div>

          {/* Current Sprint & KPIs */}
          <div className="project-progress__section">
            <div className="section-grid">
              <div className="section-column">
                <h2 className="section-title">
                  <Zap className="section-icon" size={20} />
                  {t('projectProgress.currentSprint.title')}
                </h2>
                <div className="sprint-card">
                  <div className="sprint-header">
                    <h3 className="sprint-name">{projectData.currentSprint.name}</h3>
                    <span className={`velocity-badge velocity-badge--${projectData.currentSprint.velocity}`}>
                      {t(`projectProgress.velocity.${projectData.currentSprint.velocity}`)}
                    </span>
                  </div>
                  <div className="sprint-progress">
                    <div className="progress-bar progress-bar--medium">
                      <div 
                        className="progress-bar__fill progress-bar__fill--primary"
                        style={{ width: `${projectData.currentSprint.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-percentage">{projectData.currentSprint.progress}%</span>
                  </div>
                  <div className="sprint-meta">
                    <span className="days-remaining">
                      <Clock size={14} />
                      {projectData.currentSprint.daysRemaining} {t('projectProgress.daysRemaining')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="section-column">
                <h2 className="section-title">
                  <Activity className="section-icon" size={20} />
                  {t('projectProgress.kpis.title')}
                </h2>
                <div className="kpi-grid">
                  <div className="kpi-item">
                    <div className="kpi-header">
                      <span className="kpi-label">{t('projectProgress.kpis.codeQuality')}</span>
                      {getTrendIcon(projectData.kpis.codeQuality.trend)}
                    </div>
                    <div className="kpi-value">{projectData.kpis.codeQuality.value}%</div>
                  </div>
                  <div className="kpi-item">
                    <div className="kpi-header">
                      <span className="kpi-label">{t('projectProgress.kpis.testCoverage')}</span>
                      {getTrendIcon(projectData.kpis.testCoverage.trend)}
                    </div>
                    <div className="kpi-value">{projectData.kpis.testCoverage.value}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Path & Recent Wins */}
          <div className="project-progress__section">
            <div className="section-grid">
              <div className="section-column">
                <h2 className="section-title">
                  <AlertCircle className="section-icon" size={20} />
                  {t('projectProgress.criticalPath.title')}
                </h2>
                <div className="critical-path-list">
                  {projectData.criticalPath.map((item, index) => (
                    <div key={index} className="critical-item">
                      <div className="critical-item__header">
                        <span className="critical-item__task">{item.task}</span>
                        <span className={`priority-badge priority-badge--${item.priority}`}>
                          {t(`projectProgress.priority.${item.priority}`)}
                        </span>
                      </div>
                      <div className="critical-item__meta">
                        <span className={`status-badge status-badge--${item.status}`}>
                          {t(`projectProgress.status.${item.status}`)}
                        </span>
                        <span className="due-date">
                          <Calendar size={12} />
                          {item.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-column">
                <h2 className="section-title">
                  <Award className="section-icon" size={20} />
                  {t('projectProgress.recentWins.title')}
                </h2>
                <div className="wins-list">
                  {projectData.recentWins.map((win, index) => (
                    <div key={index} className="win-item">
                      <CheckCircle className="win-item__icon" size={16} />
                      <span className="win-item__text">
                        {typeof win === 'string' ? win : `${win.title} (${win.date})`}
                        {win.impact && typeof win !== 'string' && (
                          <span className={`impact-badge impact-badge--${win.impact}`}>
                            {win.impact}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Management */}
          <div className="project-progress__section">
            <h2 className="section-title">
              <AlertTriangle className="section-icon" size={20} />
              {t('projectProgress.risks.title')}
            </h2>
            <div className="risks-grid">
              {projectData.risks.map((risk, index) => (
                <div key={index} className="risk-card">
                  <div className="risk-header">
                    <span className="risk-item">{risk.item}</span>
                    <span className={`risk-level risk-level--${risk.level}`}>
                      {t(`projectProgress.riskLevel.${risk.level}`)}
                    </span>
                  </div>
                  <div className="risk-mitigation">
                    <strong>{t('projectProgress.mitigation')}:</strong> {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Performance Summary */}
          <div className="project-progress__section">
            <h2 className="section-title">
              <Users className="section-icon" size={20} />
              {t('projectProgress.team.title')}
            </h2>
            <div className="team-summary">
              <div className="team-metrics">
                <div className="team-metric">
                  <div className="team-metric__icon">
                    <TrendingUp size={20} />
                  </div>
                  <div className="team-metric__content">
                    <span className="team-metric__label">{t('projectProgress.team.velocity')}</span>
                    <span className="team-metric__value">{projectData.team.velocity} {t('projectProgress.team.storyPoints')}</span>
                  </div>
                </div>
                <div className="team-metric">
                  <div className="team-metric__icon">
                    <Activity size={20} />
                  </div>
                  <div className="team-metric__content">
                    <span className="team-metric__label">{t('projectProgress.team.utilization')}</span>
                    <span className="team-metric__value">{Math.round((projectData.team.utilizedHours / projectData.team.availableHours) * 100)}%</span>
                  </div>
                </div>
                <div className="team-metric">
                  <div className="team-metric__icon">
                    <Star size={20} />
                  </div>
                  <div className="team-metric__content">
                    <span className="team-metric__label">{t('projectProgress.team.satisfaction')}</span>
                    <span className="team-metric__value">{projectData.team.satisfaction}/5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectProgress;
