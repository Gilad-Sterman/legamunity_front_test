import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Play, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  History,
  Settings,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  simulateInterviewCompletion,
  simulateMultipleInterviews,
  updateDraftStage,
  fetchDraftHistory,
  fetchDrafts
} from '../../../store/slices/draftsSlice';

const DraftTesting = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.drafts);
  
  const [activeTest, setActiveTest] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [stageTransitionData, setStageTransitionData] = useState({
    draftId: 'draft-001',
    targetStage: 'under_review',
    reason: '',
    rejectionReason: ''
  });

  // Test scenarios
  const testScenarios = [
    {
      id: 'single-interview',
      title: 'Single Interview Completion',
      description: 'Test auto-draft creation from single interview completion',
      icon: Play,
      color: 'test--primary'
    },
    {
      id: 'multiple-interviews',
      title: 'Multiple Interview Completion',
      description: 'Test version management with multiple interviews',
      icon: Users,
      color: 'test--secondary'
    },
    {
      id: 'stage-approval',
      title: 'Draft Approval',
      description: 'Test admin approval workflow',
      icon: CheckCircle,
      color: 'test--success'
    },
    {
      id: 'stage-rejection',
      title: 'Draft Rejection',
      description: 'Test admin rejection with reason',
      icon: XCircle,
      color: 'test--danger'
    },
    {
      id: 'stage-review',
      title: 'Send to Review',
      description: 'Test moving draft to review stage',
      icon: Eye,
      color: 'test--warning'
    },
    {
      id: 'history-tracking',
      title: 'History Tracking',
      description: 'Test comprehensive audit trail',
      icon: History,
      color: 'test--info'
    }
  ];

  const stageOptions = [
    { value: 'under_review', label: 'Under Review', requiresReason: false },
    { value: 'pending_approval', label: 'Pending Approval', requiresReason: false },
    { value: 'approved', label: 'Approved', requiresReason: true },
    { value: 'rejected', label: 'Rejected', requiresReason: true },
    { value: 'in_progress', label: 'In Progress', requiresReason: false }
  ];

  const addTestResult = (result) => {
    const newResult = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...result
    };
    setTestResults(prev => [newResult, ...prev]);
    setShowResults(true);
  };

  const runTest = async (testId) => {
    setActiveTest(testId);
    
    try {
      let result;
      
      switch (testId) {
        case 'single-interview':
          result = await dispatch(simulateInterviewCompletion({
            sessionId: 'session_001',
            interviewId: 'interview_001'
          })).unwrap();
          
          addTestResult({
            testId,
            title: 'Single Interview Completion',
            success: true,
            message: 'Interview completed and draft created successfully',
            data: result
          });
          break;
          
        case 'multiple-interviews':
          result = await dispatch(simulateMultipleInterviews({
            sessionId: 'session_001'
          })).unwrap();
          
          addTestResult({
            testId,
            title: 'Multiple Interview Completion',
            success: true,
            message: `Completed ${result.results?.length || 0} interviews with version management`,
            data: result
          });
          break;
          
        case 'stage-approval':
          result = await dispatch(updateDraftStage({
            draftId: stageTransitionData.draftId,
            targetStage: 'approved',
            reason: stageTransitionData.reason || 'Excellent candidate, meets all requirements'
          })).unwrap();
          
          addTestResult({
            testId,
            title: 'Draft Approval',
            success: result.success,
            message: result.message,
            data: result
          });
          break;
          
        case 'stage-rejection':
          result = await dispatch(updateDraftStage({
            draftId: stageTransitionData.draftId,
            targetStage: 'rejected',
            rejectionReason: stageTransitionData.rejectionReason || 'Insufficient technical depth in responses, needs more detailed examples and better problem-solving approach'
          })).unwrap();
          
          addTestResult({
            testId,
            title: 'Draft Rejection',
            success: result.success,
            message: result.message,
            data: result
          });
          break;
          
        case 'stage-review':
          result = await dispatch(updateDraftStage({
            draftId: stageTransitionData.draftId,
            targetStage: 'under_review',
            reason: stageTransitionData.reason || 'Ready for admin review'
          })).unwrap();
          
          addTestResult({
            testId,
            title: 'Send to Review',
            success: result.success,
            message: result.message,
            data: result
          });
          break;
          
        case 'history-tracking':
          result = await dispatch(fetchDraftHistory({
            draftId: stageTransitionData.draftId,
            filters: {}
          })).unwrap();
          
          addTestResult({
            testId,
            title: 'History Tracking',
            success: true,
            message: `Retrieved ${result.history?.length || 0} history entries`,
            data: result
          });
          break;
          
        default:
          throw new Error(`Unknown test: ${testId}`);
      }
      
      // Refresh drafts list after test
      dispatch(fetchDrafts());
      
    } catch (error) {
      addTestResult({
        testId,
        title: testScenarios.find(t => t.id === testId)?.title || 'Unknown Test',
        success: false,
        message: error.message || 'Test failed',
        error: error
      });
    } finally {
      setActiveTest(null);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setShowResults(false);
  };

  return (
    <div className="draft-testing">
      <div className="draft-testing__header">
        <div className="draft-testing__title">
          <Settings className="draft-testing__icon" />
          <h2>{t('admin.draftTesting.title', 'Draft Flow Testing')}</h2>
        </div>
        <p className="draft-testing__description">
          {t('admin.draftTesting.description', 'Test the complete draft flow system including auto-creation, version management, and stage transitions.')}
        </p>
      </div>

      {/* Test Configuration */}
      <div className="draft-testing__config">
        <h3>{t('admin.draftTesting.configuration', 'Test Configuration')}</h3>
        <div className="draft-testing__config-grid">
          <div className="form-group">
            <label>{t('admin.draftTesting.draftId', 'Draft ID')}</label>
            <input
              type="text"
              value={stageTransitionData.draftId}
              onChange={(e) => setStageTransitionData(prev => ({
                ...prev,
                draftId: e.target.value
              }))}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>{t('admin.draftTesting.targetStage', 'Target Stage')}</label>
            <select
              value={stageTransitionData.targetStage}
              onChange={(e) => setStageTransitionData(prev => ({
                ...prev,
                targetStage: e.target.value
              }))}
              className="form-control"
            >
              {stageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>{t('admin.draftTesting.reason', 'Reason (for approval)')}</label>
            <input
              type="text"
              value={stageTransitionData.reason}
              onChange={(e) => setStageTransitionData(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              className="form-control"
              placeholder="Enter reason for approval/review..."
            />
          </div>
          
          <div className="form-group">
            <label>{t('admin.draftTesting.rejectionReason', 'Rejection Reason')}</label>
            <textarea
              value={stageTransitionData.rejectionReason}
              onChange={(e) => setStageTransitionData(prev => ({
                ...prev,
                rejectionReason: e.target.value
              }))}
              className="form-control"
              placeholder="Enter detailed rejection reason (minimum 10 characters)..."
              rows="2"
            />
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="draft-testing__scenarios">
        <h3>{t('admin.draftTesting.scenarios', 'Test Scenarios')}</h3>
        <div className="draft-testing__grid">
          {testScenarios.map(scenario => {
            const Icon = scenario.icon;
            const isActive = activeTest === scenario.id;
            
            return (
              <div
                key={scenario.id}
                className={`draft-testing__card ${scenario.color} ${isActive ? 'draft-testing__card--active' : ''}`}
              >
                <div className="draft-testing__card-header">
                  <Icon className="draft-testing__card-icon" />
                  <h4>{scenario.title}</h4>
                </div>
                <p className="draft-testing__card-description">
                  {scenario.description}
                </p>
                <button
                  onClick={() => runTest(scenario.id)}
                  disabled={loading || isActive}
                  className="btn btn--primary draft-testing__card-button"
                >
                  {isActive ? (
                    <>
                      <RefreshCw className="btn__icon btn__icon--spinning" />
                      {t('admin.draftTesting.running', 'Running...')}
                    </>
                  ) : (
                    <>
                      <Play className="btn__icon" />
                      {t('admin.draftTesting.runTest', 'Run Test')}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="draft-testing__results">
          <div className="draft-testing__results-header">
            <h3>{t('admin.draftTesting.results', 'Test Results')}</h3>
            <div className="draft-testing__results-actions">
              <button
                onClick={() => setShowResults(!showResults)}
                className="btn btn--secondary btn--small"
              >
                {showResults ? <ChevronUp /> : <ChevronDown />}
                {showResults ? t('common.hide', 'Hide') : t('common.show', 'Show')}
              </button>
              <button
                onClick={clearResults}
                className="btn btn--danger btn--small"
              >
                {t('common.clear', 'Clear')}
              </button>
            </div>
          </div>
          
          {showResults && (
            <div className="draft-testing__results-list">
              {testResults.map(result => (
                <div
                  key={result.id}
                  className={`draft-testing__result ${result.success ? 'draft-testing__result--success' : 'draft-testing__result--error'}`}
                >
                  <div className="draft-testing__result-header">
                    {result.success ? (
                      <CheckCircle className="draft-testing__result-icon draft-testing__result-icon--success" />
                    ) : (
                      <XCircle className="draft-testing__result-icon draft-testing__result-icon--error" />
                    )}
                    <div className="draft-testing__result-info">
                      <h4>{result.title}</h4>
                      <p>{result.message}</p>
                      <small>{new Date(result.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                  
                  {result.data && (
                    <details className="draft-testing__result-details">
                      <summary>{t('admin.draftTesting.viewDetails', 'View Details')}</summary>
                      <pre className="draft-testing__result-data">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert--danger">
          <AlertTriangle className="alert__icon" />
          <div className="alert__content">
            <h4>{t('common.error', 'Error')}</h4>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftTesting;
