import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.jpeg';

export default function Navbar({ title, subtitle, links = [], onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Gift of Life Logo" className="h-16 w-16 object-contain rounded-lg shrink-0" />
          <div className="brand">
            <span className="brand-name">{title}</span>
            {subtitle ? <span className="brand-meta">{subtitle}</span> : null}
          </div>
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
          {onLogout && (
            <button
              onClick={onLogout}
              className="nav-link bg-transparent border-none cursor-pointer text-left font-sans font-semibold hover:text-brand-red transition"
            >
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}