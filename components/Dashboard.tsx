import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Expense } from '../types';
import { formatCurrency, formatShortDate } from './icons/formatters';
import { getCategoryStyle } from '../utils/categoryStyles';

interface DashboardProps {
  expenses: Expense[];
  onNavigateToCategories: () => void;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
            <p className="font-bold">{`${data.name}`}</p>
            <p className="text-indigo-600">{`${formatCurrency(data.Spesa || data.value)}`}</p>
        </div>
        );
    }
    return null;
};

const Dashboard: React.FC<DashboardProps> = ({ expenses, onNavigateToCategories }) => {
  const { totalExpenses, dailyTotal, categoryData, monthlyData } = useMemo(() => {
    const validExpenses = expenses.filter(e => e.amount != null && !isNaN(Number(e.amount)));
    
    const total = validExpenses.reduce((acc, expense) => acc + Number(expense.amount), 0);
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const daily = validExpenses
        .filter(expense => expense.date === todayString)
        .reduce((acc, expense) => acc + Number(expense.amount), 0);
        
    const categoryTotals = validExpenses.reduce((acc: Record<string, number>, expense) => {
      const category = expense.category || 'Altro';
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const categoryChartData = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value);

    const monthlyTotals = validExpenses.reduce((acc: Record<string, {date: Date; value: number}>, expense) => {
        try {
            const date = new Date(expense.date);
            if (isNaN(date.getTime())) {
                console.warn(`Invalid date found for expense: ${expense.id}`, expense.date);
                return acc; 
            }
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthKey = monthStart.toISOString(); 

            if (!acc[monthKey]) {
                acc[monthKey] = {
                    date: monthStart,
                    value: 0,
                };
            }
            acc[monthKey].value += Number(expense.amount);
        } catch (e) {
            console.error(`Could not process date for expense ${expense.id}:`, e)
        }
        return acc;
    }, {} as Record<string, {date: Date; value: number}>);

    type MonthlyTotalItem = { date: Date; value: number };
    const monthlyChartData = Object.values(monthlyTotals)
        .sort((a: MonthlyTotalItem, b: MonthlyTotalItem) => b.date.getTime() - a.date.getTime())
        .map((item: MonthlyTotalItem) => ({
            name: formatShortDate(item.date),
            Spesa: item.value,
        }));


    return { 
        totalExpenses: total, 
        dailyTotal: daily,
        categoryData: categoryChartData, 
        monthlyData: monthlyChartData 
    };
  }, [expenses]);
  
  const topCategories = categoryData.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-semibold text-slate-500 mb-2">Spesa Totale</h3>
                <p className="text-4xl font-extrabold text-indigo-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200">
                <div>
                    <h4 className="text-sm font-medium text-slate-500">Oggi</h4>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(dailyTotal)}</p>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg flex flex-col">
            <h3 className="text-xl font-bold text-slate-700 mb-4">Riepilogo Categorie</h3>
            {topCategories.length > 0 ? (
                <div className="space-y-3 flex-grow">
                    {topCategories.map(cat => {
                        const style = getCategoryStyle(cat.name);
                        const percentage = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
                        return (
                            <div key={cat.name} className="flex items-center gap-3 text-sm">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor}`}>
                                    <style.Icon className={`w-5 h-5 ${style.color}`} />
                                </span>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-slate-700">{style.label}</span>
                                        <span className="font-bold text-slate-800">{formatCurrency(cat.value)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : <p className="text-center text-slate-500 flex-grow flex items-center justify-center">Nessuna spesa registrata.</p>}
             <button
                onClick={onNavigateToCategories}
                className="mt-6 w-full px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
             >
                Vedi Dettagli Categorie
            </button>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-slate-700 mb-4">Andamento Spese Mensili</h3>
             {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(Number(value))}/>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Spesa" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            ) : <p className="text-center text-slate-500 py-24">Nessun dato da visualizzare.</p>}
        </div>
    </div>
  );
};

export default Dashboard;