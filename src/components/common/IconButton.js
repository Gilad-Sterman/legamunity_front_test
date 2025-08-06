import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

/**
 * IconButton component for consistent icon button styling throughout the app
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Lucide icon component
 * @param {string} props.text - Button text
 * @param {string} props.variant - Button variant (primary, secondary, success, etc.)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.iconRight - Whether to place the icon on the right side
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional props to pass to the button element
 */
const IconButton = ({
  icon: Icon,
  text,
  variant = 'primary',
  size = 'md',
  iconRight = false,
  onClick,
  className = '',
  ...rest
}) => {
  // Get current language direction from Redux store
  const { direction } = useSelector(state => state.language);
  // Determine icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 20;
      default: return 16;
    }
  };

  // Adjust icon position based on language direction
  const shouldReverseIcon = direction === 'rtl' ? !iconRight : iconRight;

  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {!shouldReverseIcon && Icon && (
        <Icon size={getIconSize()} />
      )}
      {text}
      {shouldReverseIcon && Icon && (
        <Icon size={getIconSize()} />
      )}
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.elementType,
  text: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.string,
  iconRight: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default IconButton;
