import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertCircle, Clock, HelpCircle } from 'lucide-react';
import { useSelector } from 'react-redux';

/**
 * IconBadge component for displaying status with appropriate icons
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Status text (completed, pending, active, etc.)
 * @param {string} props.className - Additional CSS classes
 */
const IconBadge = ({ 
  status,
  className = '',
  ...rest 
}) => {
  // Get current language direction from Redux store
  const { direction } = useSelector(state => state.language);
  // Determine icon based on status
  const getStatusIcon = () => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'success':
        return <CheckCircle size={14} />;
      case 'pending':
      case 'waiting':
        return <Clock size={14} />;
      case 'error':
      case 'rejected':
      case 'failed':
        return <AlertCircle size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  // Determine color class based on status
  const getStatusClass = () => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'success':
        return 'success';
      case 'pending':
      case 'waiting':
        return 'warning';
      case 'active':
        return 'primary';
      case 'error':
      case 'rejected':
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <span 
      className={`status-badge ${getStatusClass()} ${className}`}
      {...rest}
    >
      {direction === 'ltr' ? (
        <>
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{status}</span>
        </>
      ) : (
        <>
          <span className="status-text">{status}</span>
          <span className="status-icon">{getStatusIcon()}</span>
        </>
      )}
    </span>
  );
};

IconBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default IconBadge;
