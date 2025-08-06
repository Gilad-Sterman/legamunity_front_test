import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorAlert = ({ message, onClose, className = '' }) => {
  return (
    <div className={`error-alert ${className}`}>
      <div className="error-alert__content">
        <AlertCircle className="error-alert__icon" size={20} />
        <span className="error-alert__message">{message}</span>
      </div>
      {onClose && (
        <button 
          className="error-alert__close"
          onClick={onClose}
          aria-label="Close error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
