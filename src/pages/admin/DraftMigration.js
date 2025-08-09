import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Database,
  Play,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';

const DraftMigration = () => {
  const { t } = useTranslation();
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [migrationResults, setMigrationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch migration status on component mount
  useEffect(() => {
    fetchMigrationStatus();
  }, []);

  const fetchMigrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/migration/draft-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch migration status');
      }

      setMigrationStatus(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching migration status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/migration/migrate-drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Migration failed');
      }

      setMigrationResults(data.data);
      // Refresh status after migration
      await fetchMigrationStatus();
      
    } catch (err) {
      console.error('Error running migration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="draft-migration">
      <div className="draft-migration__header">
        <button 
          className="draft-migration__back-button"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="draft-migration__title">
          <Database size={24} />
          Draft Migration
        </h1>
      </div>

      <div className="draft-migration__content">
        {/* Migration Status Card */}
        <div className="draft-migration__card">
          <h2 className="draft-migration__card-title">
            <Info size={20} />
            Migration Status
          </h2>
          
          {loading && !migrationStatus && (
            <div className="draft-migration__loading">
              <RefreshCw className="draft-migration__loading-icon" size={20} />
              Loading migration status...
            </div>
          )}

          {error && (
            <div className="draft-migration__error">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}

          {migrationStatus && (
            <div className="draft-migration__status">
              <div className="draft-migration__status-item">
                <span className="draft-migration__status-label">Interviews with Content:</span>
                <span className="draft-migration__status-value">{migrationStatus.interviews_with_content}</span>
              </div>
              <div className="draft-migration__status-item">
                <span className="draft-migration__status-label">Existing Drafts:</span>
                <span className="draft-migration__status-value">{migrationStatus.existing_drafts}</span>
              </div>
              <div className="draft-migration__status-item">
                <span className="draft-migration__status-label">Migration Needed:</span>
                <span className={`draft-migration__status-value ${migrationStatus.migration_needed ? 'draft-migration__status-value--warning' : 'draft-migration__status-value--success'}`}>
                  {migrationStatus.migration_needed ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="draft-migration__status-item">
                <span className="draft-migration__status-label">Sample AI Drafts Found:</span>
                <span className="draft-migration__status-value">{migrationStatus.sample_interviews_with_ai_drafts}/5</span>
              </div>
            </div>
          )}

          {migrationStatus && migrationStatus.sample_data && (
            <div className="draft-migration__sample">
              <h3>Sample Interview Data:</h3>
              <div className="draft-migration__sample-list">
                {migrationStatus.sample_data.map(sample => (
                  <div key={sample.id} className="draft-migration__sample-item">
                    <span className="draft-migration__sample-id">{sample.id.substring(0, 8)}...</span>
                    <span className="draft-migration__sample-session">Session: {sample.session_id.substring(0, 8)}...</span>
                    <span className={`draft-migration__sample-draft ${sample.has_ai_draft ? 'draft-migration__sample-draft--yes' : 'draft-migration__sample-draft--no'}`}>
                      {sample.has_ai_draft ? '✅ Has AI Draft' : '❌ No AI Draft'}
                    </span>
                    <span className="draft-migration__sample-status">{sample.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Migration Action Card */}
        <div className="draft-migration__card">
          <h2 className="draft-migration__card-title">
            <Play size={20} />
            Run Migration
          </h2>
          
          <p className="draft-migration__description">
            This will migrate all draft content from the interviews table to the dedicated drafts table. 
            Each interview with AI-generated draft content will create a new draft record.
          </p>

          <div className="draft-migration__actions">
            <button 
              className="draft-migration__button draft-migration__button--secondary"
              onClick={fetchMigrationStatus}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh Status
            </button>
            
            <button 
              className="draft-migration__button draft-migration__button--primary"
              onClick={runMigration}
              disabled={loading || (migrationStatus && !migrationStatus.migration_needed)}
            >
              {loading ? (
                <>
                  <RefreshCw className="draft-migration__button-loading" size={16} />
                  Running Migration...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Migration
                </>
              )}
            </button>
          </div>
        </div>

        {/* Migration Results Card */}
        {migrationResults && (
          <div className="draft-migration__card">
            <h2 className="draft-migration__card-title">
              <CheckCircle size={20} />
              Migration Results
            </h2>
            
            <div className="draft-migration__results">
              <div className="draft-migration__result-item">
                <span className="draft-migration__result-label">Total Interviews Processed:</span>
                <span className="draft-migration__result-value">{migrationResults.total_interviews_processed}</span>
              </div>
              <div className="draft-migration__result-item">
                <span className="draft-migration__result-label">Drafts Migrated:</span>
                <span className="draft-migration__result-value draft-migration__result-value--success">{migrationResults.drafts_migrated}</span>
              </div>
              <div className="draft-migration__result-item">
                <span className="draft-migration__result-label">Drafts Skipped:</span>
                <span className="draft-migration__result-value">{migrationResults.drafts_skipped}</span>
              </div>
              <div className="draft-migration__result-item">
                <span className="draft-migration__result-label">Errors:</span>
                <span className={`draft-migration__result-value ${migrationResults.errors > 0 ? 'draft-migration__result-value--error' : 'draft-migration__result-value--success'}`}>
                  {migrationResults.errors}
                </span>
              </div>
            </div>

            {migrationResults.error_details && migrationResults.error_details.length > 0 && (
              <div className="draft-migration__errors">
                <h3>Error Details:</h3>
                {migrationResults.error_details.map((error, index) => (
                  <div key={index} className="draft-migration__error-item">
                    <span className="draft-migration__error-id">Interview: {error.interview_id.substring(0, 8)}...</span>
                    <span className="draft-migration__error-message">{error.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftMigration;
