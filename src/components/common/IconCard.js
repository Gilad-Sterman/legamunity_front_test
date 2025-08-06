import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

/**
 * IconCard component for displaying information with an icon
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Lucide icon component
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Card value
 * @param {string} props.color - Icon color variant (primary, secondary, success, etc.)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional props to pass to the div element
 */
const IconCard = ({ 
  icon: Icon, 
  title, 
  value, 
  color = 'primary',
  className = '',
  ...rest 
}) => {
  // Get language direction from Redux store
  const { direction } = useSelector(state => state.language);
  return (
    <div className={`stat-card ${className} ${direction}`} {...rest}>
      <div className={`stat-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
};

IconCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
  className: PropTypes.string
};

export default IconCard;
