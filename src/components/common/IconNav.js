import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

/**
 * IconNav component for displaying navigation with Lucide icons
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Navigation items with name, href, and icon
 * @param {string} props.title - Optional section title
 * @param {string} props.className - Additional CSS classes
 */
const IconNav = ({ 
  items,
  title,
  className = '',
}) => {
  const location = useLocation();
  
  return (
    <div className={`icon-nav ${className}`}>
      {title && <h3 className="section-title">{title}</h3>}
      <ul className="nav-list">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <li key={item.name} className="nav-item">
              <Link
                to={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <item.icon size={18} />
                </span>
                <span className="nav-text">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

IconNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  className: PropTypes.string
};

export default IconNav;
