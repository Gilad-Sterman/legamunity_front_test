import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Info,
  Play,
  X
} from 'lucide-react';
import migrationService from '../../../services/migrationService';

const MigrationPanel = ({ sessionId, sessionName, onClose }) => {
  const { t } = useTranslation();
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (sessionId) {
      loadMigrationStatus();
    }
  }, [sessionId]);

  const loadMigrationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await migrationService.getSessionMigrationStatus(sessionId);
      if (response.success) {
        setMigrationStatus(response.data);
      } else {
        setError('Failed to load migration status');
      }
    } catch (err) {
      setError('Error loading migration status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setMigrating(true);
      setError(null);
      setSuccess(null);
      
      const response = await migrationService.migrateSession(sessionId);
      
      if (response.success) {
        setSuccess(`Successfully migrated ${response.migratedCount} interviews`);
        await loadMigrationStatus(); // Refresh status
      } else {
        setError('Migration failed: ' + response.error);
      }
    } catch (err) {
      setError('Migration error: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setCleaning(true);
      setError(null);
      setSuccess(null);
      
      const response = await migrationService.cleanupSessionPreferences(sessionId);
      
      if (response.success) {
        setSuccess('Successfully cleaned up old interview data');
        await loadMigrationStatus(); // Refresh status
      } else {
        setError('Cleanup failed: ' + response.error);
      }
    } catch (err) {
      setError('Cleanup error: ' + err.message);
    } finally {
      setCleaning(false);
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <Database size={16} />;
    
    if (status.migrationCompleted) {
      return <CheckCircle size={16} className="text-success" />;
    } else if (status.migrationNeeded) {
      return <AlertTriangle size={16} className="text-warning" />;
    } else {
      return <Info size={16} className="text-info" />;
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Loading...';
    
    if (status.migrationCompleted && status.cleanupNeeded) {
      return 'Migrated (cleanup available)';
    } else if (status.migrationCompleted) {
      return 'Migration completed';
    } else if (status.migrationNeeded) {
      return 'Migration needed';
    } else {
      return 'No interviews found';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-muted';
    
    if (status.migrationCompleted && !status.cleanupNeeded) {
      return 'text-success';
    } else if (status.migrationCompleted && status.cleanupNeeded) {
      return 'text-info';
    } else if (status.migrationNeeded) {
      return 'text-warning';
    } else {
      return 'text-muted';
    }
  };

  return (
    <div className="migration-panel">
      <div className="migration-panel__header">
        <div className="migration-panel__title">
          <Database size={20} />
          <span>Interview Migration</span>
          <span className="migration-panel__session-name">- {sessionName}</span>
        </div>
        <button 
          onClick={onClose}
          className="migration-panel__close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="migration-panel__content">
        {loading ? (
          <div className="migration-panel__loading">
            <RefreshCw size={16} className="spinning" />
            <span>Loading migration status...</span>
          </div>
        ) : (
          <>
            {/* Status Overview */}
            <div className="migration-panel__status">
              <div className="migration-panel__status-item">
                <div className="migration-panel__status-icon">
                  {getStatusIcon(migrationStatus)}
                </div>
                <div className="migration-panel__status-info">
                  <span className="migration-panel__status-label">Status:</span>
                  <span className={`migration-panel__status-value ${getStatusColor(migrationStatus)}`}>
                    {getStatusText(migrationStatus)}
                  </span>
                </div>
              </div>

              {migrationStatus && (
                <>
                  <div className="migration-panel__status-item">
                    <span className="migration-panel__status-label">Interviews in table:</span>
                    <span className="migration-panel__status-value">
                      {migrationStatus.interviewsInTable}
                    </span>
                  </div>
                  <div className="migration-panel__status-item">
                    <span className="migration-panel__status-label">Interviews in preferences:</span>
                    <span className="migration-panel__status-value">
                      {migrationStatus.interviewsInPreferences}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Migration Flow Diagram */}
            <div className="migration-panel__flow">
              <div className="migration-panel__flow-step">
                <div className="migration-panel__flow-box">
                  <span>Session Preferences</span>
                  <small>{migrationStatus?.interviewsInPreferences || 0} interviews</small>
                </div>
                <ArrowRight size={16} />
                <div className="migration-panel__flow-box">
                  <span>Interviews Table</span>
                  <small>{migrationStatus?.interviewsInTable || 0} interviews</small>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="migration-panel__actions">
              {migrationStatus?.migrationNeeded && (
                <button
                  onClick={handleMigrate}
                  disabled={migrating}
                  className="btn btn--primary btn--sm"
                >
                  {migrating ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Migrate Interviews
                    </>
                  )}
                </button>
              )}

              {migrationStatus?.cleanupNeeded && (
                <button
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="btn btn--secondary btn--sm"
                >
                  {cleaning ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Cleanup Old Data
                    </>
                  )}
                </button>
              )}

              <button
                onClick={loadMigrationStatus}
                disabled={loading}
                className="btn btn--ghost btn--sm"
              >
                <RefreshCw size={16} />
                Refresh Status
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="migration-panel__message migration-panel__message--error">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="migration-panel__message migration-panel__message--success">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Info */}
            <div className="migration-panel__info">
              <Info size={14} />
              <div className="migration-panel__info-text">
                <p><strong>Migration Process:</strong></p>
                <ol>
                  <li>Interviews are copied from session preferences to the interviews table</li>
                  <li>Original data is preserved during migration</li>
                  <li>After successful migration, old data can be cleaned up</li>
                  <li>The process is safe and reversible</li>
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MigrationPanel;
