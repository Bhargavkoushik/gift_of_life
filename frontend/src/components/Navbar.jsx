import { NavLink } from 'react-router-dom';

export default function Navbar({ title, subtitle, links = [] }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-name">{title}</span>
          {subtitle ? <span className="brand-meta">{subtitle}</span> : null}
        </div>

        <nav className="topbar-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}