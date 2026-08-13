export default function PlaceholderSection({ title, description, items = [] }) {
  return (
    <section className="placeholder-section">
      <h2 className="section-title">{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}

      {items.length > 0 ? (
        <ul className="placeholder-list">
          {items.map((item) => (
            <li key={item} className="placeholder-item">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}