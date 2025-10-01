
import React from 'react';
import { Expense } from '../types';
import { formatCurrency, formatDate } from './icons/formatters';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Data
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Descrizione
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Categoria
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Importo
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Azioni</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {(date => !isNaN(date.getTime()) ? formatDate(date) : 'Data non valida')(new Date(expense.date))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                {expense.description || <span className="text-slate-400 italic">Senza descrizione</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {expense.category}
                {expense.subcategory && <span className="block text-xs text-slate-400">{expense.subcategory}</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">{formatCurrency(Number(expense.amount) || 0)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-4">
                  <button onClick={() => onEdit(expense)} className="text-indigo-600 hover:text-indigo-900 transition-colors">
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDelete(expense.id)} className="text-red-600 hover:text-red-900 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseList;