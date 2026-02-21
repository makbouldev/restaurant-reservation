import MenuCard from '../components/MenuCard';
import { replaceParam } from '../i18n';

export default function MenuPage({ t, filteredMenu, categoryMeta, activeCategory, setActiveCategory, allKey }) {
  return (
    <section className="container py-5 reveal-on-scroll">
      <div className="menu-category-studio mb-4">
        <div className="menu-category-head">
          <p className="menu-category-overline">{t.app.menuNavOverline}</p>
          <h3 className="section-title m-0">{t.app.filterByCategory}</h3>
          <small>{replaceParam(t.app.platesShown, 'count', filteredMenu.length)}</small>
        </div>
        <div className="menu-category-rail" role="tablist" aria-label="Categories du menu">
          {categoryMeta.map((item, index) => (
            <button
              key={item.category}
              className={`menu-category-chip ${activeCategory === item.category ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(item.category)}
              role="tab"
              aria-selected={activeCategory === item.category}
            >
              <span className="menu-category-chip-dot" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.category === allKey ? t.common.all : item.category}</strong>
              <small>{item.count} plat(s)</small>
            </button>
          ))}
        </div>
      </div>
      <div className="row g-4 menu-grid-stage">
        {filteredMenu.map((item, index) => (
          <MenuCard key={item.id} item={item} t={t} revealIndex={index} />
        ))}
      </div>
    </section>
  );
}
