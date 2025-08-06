import React from 'react';
import PropTypes from 'prop-types';
import { User } from 'lucide-react';

/**
 * Avatar component for displaying user avatars with fallback to Lucide icons
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - User name for initials fallback
 * @param {string} props.src - Image source URL
 * @param {string} props.size - Avatar size (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 */
const Avatar = ({ 
  name,
  src,
  size = 'md',
  className = '',
  ...rest 
}) => {
  // Determine size class
  const sizeClass = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg'
  }[size] || 'avatar-md';
  
  // Get initials from name
  const getInitials = () => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get icon size based on avatar size
  const getIconSize = () => {
    switch(size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  return (
    <div 
      className={`avatar ${sizeClass} ${className}`}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name || 'User'} className="avatar-img" />
      ) : name ? (
        <span className="avatar-initials">{getInitials()}</span>
      ) : (
        <User size={getIconSize()} />
      )}
    </div>
  );
};

Avatar.propTypes = {
  name: PropTypes.string,
  src: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default Avatar;
