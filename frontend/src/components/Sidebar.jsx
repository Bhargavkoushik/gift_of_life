import { NavLink } from 'react-router-dom';

export default function Sidebar({ title, links = [] }) {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">{title}</h2>
      <nav className="sidebar-nav" aria-label={`${title} navigation`}>
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
    </aside>
  );
}