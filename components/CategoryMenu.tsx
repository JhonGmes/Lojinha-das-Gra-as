import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CATEGORIES } from '../constants';

const CategoryMenu: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  // If slug is undefined (home), active is "all"
  const activeId = slug || "all";

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide justify-start md:justify-center px-2">
      {CATEGORIES.map((c) => (
        <Link
          key={c.id}
          to={c.id === "all" ? "/" : `/category/${c.id}`}
          className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap transform hover:scale-105 ${
            activeId === c.id 
              ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30 ring-2 ring-brand-600 ring-offset-2" 
              : "bg-white text-gray-500 border border-gray-200 hover:border-brand-500 hover:text-brand-600"
          }`}
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
};

export default CategoryMenu;