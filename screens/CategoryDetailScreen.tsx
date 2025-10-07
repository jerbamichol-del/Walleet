import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Expense } from '../types';
import { formatCurrency } from '../components/icons/formatters';
import ExpenseList from '../components/ExpenseList';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { getCategoryStyle } from '../utils/categoryStyles';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#d0ed57'];

interface CategoryDetailScreenProps {
  expenses: Expense[];
  onNavigateBack: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      {/* All details centered */}
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#1e293b" className="text-base font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={fill} className="text-xl font-extrabold">
        {formatCurrency(payload.value)}
      </text>
      <text x={cx} y={cy + 32} textAnchor="middle" fill="#64748b" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
      
      {/* The active sector slice with a pop-out effect */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
      />
    </g>
  );
};


const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({ expenses, onNavigateBack, onEditExpense, onDeleteExpense }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const categoryData = useMemo(() => {
    // Filter out expenses with invalid amounts to prevent chart errors.
    const validExpenses = expenses.filter(e => e.amount != null && !isNaN(Number(e.amount)));

    const categoryTotals = validExpenses.reduce((acc: Record<string, number>, expense) => {
      const category = expense.category || 'Altro';
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {});
    
    return Object.entries(categoryTotals)
        // FIX: Explicitly cast `value` to a number to ensure type safety during the sort operation.
        // This resolves a TypeScript error if the type of `value` is not correctly inferred as a number.
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value);
  }, [expenses]);
  
  const activePieIndex = hoveredIndex ?? selectedIndex;
  const selectedCategoryName = selectedIndex !== null ? categoryData[selectedIndex]?.name : null;

  const filteredExpenses = useMemo(() => {
    if (!selectedCategoryName) return [];
    return expenses.filter(e => e.category === selectedCategoryName)
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateB - dateA;
        });
  }, [expenses, selectedCategoryName]);

  return (
    <div className="animate-fade-in-up">
        <div className="mb-6 flex items-center gap-4">
            <button
                onClick={onNavigateBack}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
                aria-label="Torna alla dashboard"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Dettaglio Spese per Categoria</h1>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-slate-700 mb-2 text-center">Spese per Categoria</h3>
            {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={102}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        activeIndex={activePieIndex ?? undefined}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={(_, index) => setSelectedIndex(prev => prev === index ? null : index)}
                    >
                        {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    </PieChart>
                </ResponsiveContainer>
            ) : <p className="text-center text-slate-500 py-16">Nessun dato da visualizzare.</p>}

            {categoryData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-3">
                    {categoryData.map((entry, index) => {
                        const style = getCategoryStyle(entry.name);
                        const isActive = index === selectedIndex;
                        return (
                        <button
                            key={`item-${index}`}
                            onClick={() => setSelectedIndex(isActive ? null : index)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={`flex items-center gap-3 p-2 rounded-full text-left transition-all duration-200 transform hover:shadow-md ${
                                isActive ? 'bg-indigo-100 ring-2 ring-indigo-300' : 'bg-slate-100'
                            }`}
                        >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${style.bgColor}`}>
                                <style.Icon className={`w-4 h-4 ${style.color}`} />
                            </span>
                            <div className="min-w-0 pr-2">
                                <p className={`font-semibold text-sm truncate ${isActive ? 'text-indigo-800' : 'text-slate-700'}`}>{style.label}</p>
                            </div>
                        </button>
                        );
                    })}
                    </div>
                </div>
            )}
        </div>
        
        {selectedCategoryName && (
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-slate-700 mb-4">Spese per: {selectedCategoryName}</h3>
                {filteredExpenses.length > 0 ? (
                    <ExpenseList 
                        expenses={filteredExpenses} 
                        onEdit={onEditExpense}
                        onDelete={onDeleteExpense}
                    />
                ): (
                    <p className="text-center text-slate-500 py-10">Nessuna spesa trovata per questa categoria.</p>
                )}
            </div>
        )}
    </div>
  );
};

export default CategoryDetailScreen;