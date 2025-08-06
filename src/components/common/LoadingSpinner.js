import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'medium', className = '', text = '' }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'loading-spinner--small';
      case 'large':
        return 'loading-spinner--large';
      default:
        return 'loading-spinner--medium';
    }
  };

  return (
    <div className={`loading-spinner ${getSizeClass()} ${className}`}>
      <Loader2 className="loading-spinner__icon" />
      {text && <span className="loading-spinner__text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
