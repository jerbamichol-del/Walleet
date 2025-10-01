
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Expense, CATEGORIES } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CurrencyEuroIcon } from './icons/CurrencyEuroIcon';
import { TagIcon } from './icons/TagIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import CustomSelect from './CustomSelect';
import { getCategoryStyle } from '../utils/categoryStyles';


interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id'> | Expense) => void;
  initialData?: Expense;
  prefilledData?: Partial<Omit<Expense, 'id'>>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, onSubmit, initialData, prefilledData }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description);
        setAmount(initialData.amount ? String(initialData.amount) : '');
        setCategory(initialData.category);
        setSubcategory(initialData.subcategory || '');
        setDate(initialData.date);
      } else if (prefilledData) {
        setDescription(prefilledData.description || '');
        setAmount(prefilledData.amount?.toString() || '');
        setCategory(prefilledData.category || '');
        setSubcategory(prefilledData.subcategory || '');
        setDate(prefilledData.date || new Date().toISOString().split('T')[0]);
      } else {
        resetForm();
      }
      
      const timer = setTimeout(() => {
        setIsAnimating(true);
        amountInputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);

    } else {
      setIsAnimating(false);
    }
  }, [initialData, prefilledData, isOpen]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('');
    setSubcategory('');
    setDate(new Date().toISOString().split('T')[0]);
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubcategory(''); // Reset subcategory when category changes
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const expenseData = {
      description,
      amount: parseFloat(amount),
      category: category || 'Altro',
      subcategory: subcategory || undefined,
      date,
    };
    if (initialData) {
      onSubmit({ ...expenseData, id: initialData.id });
    } else {
      onSubmit(expenseData);
    }
  };
  
  const availableSubcategories = category ? CATEGORIES[category as keyof typeof CATEGORIES] : [];

  const categoryOptions = Object.keys(CATEGORIES).map(cat => ({
    value: cat,
    label: getCategoryStyle(cat).label,
    Icon: getCategoryStyle(cat).Icon,
    color: getCategoryStyle(cat).color,
    bgColor: getCategoryStyle(cat).bgColor,
  }));
  
  const subcategoryOptions = availableSubcategories.map(subcat => ({
      value: subcat,
      label: subcat
  }));

  if (!isOpen) return null;

  const inputStyles = "block w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm";
  
  return (
    <div 
        className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out ${isAnimating ? 'opacity-100' : 'opacity-0'} bg-slate-900/60 backdrop-blur-sm`}
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Modifica Spesa' : 'Aggiungi Nuova Spesa'}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Chiudi"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descrizione <span className="text-slate-400 font-normal">(Opzionale)</span></label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DocumentTextIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputStyles}
                  placeholder="Es. Spesa al supermercato"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Importo (€)</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <CurrencyEuroIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    ref={amountInputRef}
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputStyles}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
              </div>

               <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <CalendarIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputStyles}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
               <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Categoria <span className="text-slate-400 font-normal">(Opzionale)</span></label>
                 <CustomSelect
                    options={categoryOptions}
                    selectedValue={category}
                    onSelect={handleCategoryChange}
                    placeholder="Seleziona categoria"
                    icon={<TagIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
                 />
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-slate-700 mb-1">Sottocategoria <span className="text-slate-400 font-normal">(Opzionale)</span></label>
                 <CustomSelect
                    options={subcategoryOptions}
                    selectedValue={subcategory}
                    onSelect={setSubcategory}
                    placeholder="Seleziona sottocategoria"
                    icon={<TagIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
                    disabled={!category || availableSubcategories.length === 0}
                 />
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              {initialData ? 'Salva Modifiche' : 'Aggiungi Spesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;