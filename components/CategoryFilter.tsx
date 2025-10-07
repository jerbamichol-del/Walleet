


import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { getCategoryStyle } from '../utils/categoryStyles';


interface CategoryFilterProps {
  selectedCategory: string | 'all';
  onSelectCategory: (category: string | 'all') => void;
}

const allCategories = ['all', ...Object.keys(CATEGORIES)];

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelectCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (category: string | 'all') => {
    onSelectCategory(category);
    setIsOpen(false);
  };

  const { Icon, label, color, bgColor } = getCategoryStyle(selectedCategory);

  return (
    <div className="mb-6 relative w-full md:w-72" ref={filterRef}>
      <h3 className="text-lg font-semibold text-slate-600 mb-3">Filtra per Categoria</h3>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-md flex items-center justify-center ${bgColor}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </span>
          <span className="text-slate-800">{label}</span>
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
          <ul className="py-1">
            {allCategories.map((category) => {
              const { Icon: CatIcon, label: catLabel, color: catColor, bgColor: catBgColor } = getCategoryStyle(category);
              const isSelected = selectedCategory === category;
              return (
                <li key={category}>
                  <button
                    onClick={() => handleSelect(category)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-indigo-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                     <span className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-white/20' : catBgColor}`}>
                        <CatIcon className={`w-4 h-4 ${isSelected ? 'text-white' : catColor}`} />
                    </span>
                    {catLabel}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;