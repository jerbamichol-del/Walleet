import React, { useState, useMemo, useEffect } from 'react';
import { Expense } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getQueuedImages, deleteImageFromQueue, OfflineImage } from './utils/db';
import { parseExpensesFromImage } from './utils/ai';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CategoryFilter from './components/CategoryFilter';
import ExpenseList from './components/ExpenseList';
import ExpenseForm from './components/ExpenseForm';
import ImageParserModal from './components/ImageParserModal';
import VoiceInputModal from './components/VoiceInputModal';
import FloatingActionButton from './components/FloatingActionButton';
import ConfirmationModal from './components/ConfirmationModal';
import Toast from './components/Toast';
import PendingImages from './components/PendingImages';
import MultipleExpensesModal from './components/MultipleExpensesModal';
import CategoryDetailScreen from './screens/CategoryDetailScreen';

interface AppProps {
  onLogout: () => void;
}

const App: React.FC<AppProps> = ({ onLogout }) => {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [view, setView] = useState<'dashboard' | 'categories'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImageParserOpen, setIsImageParserOpen] = useState(false);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const [isMultiExpenseModalOpen, setIsMultiExpenseModalOpen] = useState(false);
  const [imageParserSource, setImageParserSource] = useState<'camera' | 'screenshot'>('screenshot');
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [prefilledData, setPrefilledData] = useState<Partial<Omit<Expense, 'id'>> | undefined>(undefined);
  const [parsedExpenses, setParsedExpenses] = useState<Partial<Omit<Expense, 'id'>>[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const isOnline = useOnlineStatus();
  const [queuedImages, setQueuedImages] = useState<OfflineImage[]>([]);
  const [syncingImageId, setSyncingImageId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'info' | 'success' | 'error'} | null>(null);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (!event.state || event.state.view === 'dashboard') {
            setView('dashboard');
        } else {
            setView(event.state.view);
        }
    };
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ view: 'dashboard' }, '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateToCategories = () => {
    window.history.pushState({ view: 'categories' }, '');
    setView('categories');
  };

  const handleNavigateBack = () => {
    window.history.back();
  };


  const loadQueuedImages = async () => {
    try {
      const images = await getQueuedImages();
      setQueuedImages(images);
    } catch (error) {
      console.error("Failed to load queued images:", error);
    }
  };

  const handleAnalyzeQueuedImage = async (image: OfflineImage) => {
    if (!isOnline || syncingImageId) return;

    setSyncingImageId(image.id);
    try {
        const parsedDataArray = await parseExpensesFromImage(image.base64Image, image.mimeType);
        
        const validExpenses = parsedDataArray.filter(d => d.amount && d.amount > 0);

        if (validExpenses.length > 0) {
            const newExpenses: Expense[] = validExpenses.map(parsedData => ({
                id: crypto.randomUUID(),
                description: parsedData.description || `Spesa da immagine`,
                amount: parsedData.amount!,
                date: parsedData.date || new Date().toISOString().split('T')[0],
                category: parsedData.category || 'Altro',
                subcategory: parsedData.subcategory,
            }));
            setExpenses(prev => [...prev, ...newExpenses]);
            setToast({ message: `${newExpenses.length} spes${newExpenses.length > 1 ? 'e' : 'a'} da immagine aggiunt${newExpenses.length > 1 ? 'e' : 'a'}!`, type: 'success' });
        } else {
            setToast({ message: "Importo non riconosciuto dall'immagine in coda.", type: 'info' });
        }
        await deleteImageFromQueue(image.id);
    } catch (error) {
        console.error(`Failed to process image ${image.id}:`, error);
        setToast({ message: 'Impossibile analizzare l\'immagine. Riprova.', type: 'info' });
    } finally {
        setSyncingImageId(null);
        await loadQueuedImages(); // Refresh the list
    }
  };

  const handleDeleteQueuedImage = async (id: string) => {
    if (syncingImageId) return;
    try {
        await deleteImageFromQueue(id);
        await loadQueuedImages();
        setToast({ message: 'Immagine rimossa dalla coda.', type: 'info' });
    } catch (error) {
        console.error(`Failed to delete image ${id}:`, error);
        setToast({ message: 'Impossibile rimuovere l\'immagine.', type: 'info' });
    }
  }

  useEffect(() => {
    loadQueuedImages();
  }, []);


  const handleAddOrUpdateExpense = (expenseData: Omit<Expense, 'id'> | Expense) => {
    if ('id' in expenseData) {
      // Update
      setExpenses(prev => prev.map(e => e.id === expenseData.id ? expenseData : e));
    } else {
      // Add
      const newExpense: Expense = {
        ...(expenseData as Omit<Expense, 'id'>),
        id: crypto.randomUUID(),
      };
      setExpenses(prev => [...prev, newExpense]);
    }
    closeForm();
  };

  const handleDeleteExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setExpenseToDelete(expense);
    }
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      setExpenses(prev => prev.filter(expense => expense.id !== expenseToDelete.id));
      setExpenseToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setExpenseToDelete(null);
  };

  const openFormToEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setPrefilledData(undefined);
    setIsFormOpen(true);
  };
  
  const openNewForm = () => {
    setEditingExpense(undefined);
    setPrefilledData(undefined);
    setIsFormOpen(true);
  }

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExpense(undefined);
    setPrefilledData(undefined);
  };

  const handleImageParsed = (data: Partial<Omit<Expense, 'id'>>[]) => {
    setIsImageParserOpen(false);
    
    const validExpenses = data.filter(d => d.amount && d.amount > 0);

    if (validExpenses.length === 0) {
        setToast({ message: "Nessuna spesa valida trovata. Prova con un'altra immagine o aggiungi la spesa manualmente.", type: 'info' });
    } else if (validExpenses.length === 1) {
        setPrefilledData(validExpenses[0]);
        setIsFormOpen(true);
    } else {
        setParsedExpenses(validExpenses);
        setIsMultiExpenseModalOpen(true);
    }
  };

  const handleImageQueued = () => {
    loadQueuedImages();
    setToast({ message: "Immagine salvata! Analizzala quando torni online.", type: 'info' });
    setIsImageParserOpen(false);
  };

  const handleVoiceParsed = (data: Partial<Omit<Expense, 'id'>>) => {
    setPrefilledData(data);
    setIsVoiceInputOpen(false);
    setIsFormOpen(true);
  };

  const handleConfirmMultipleExpenses = (expensesToAdd: Omit<Expense, 'id'>[]) => {
    const newExpenses: Expense[] = expensesToAdd.map(expenseData => ({
      ...(expenseData as Omit<Expense, 'id'>),
      id: crypto.randomUUID(),
    }));
    setExpenses(prev => [...prev, ...newExpenses]);
    setIsMultiExpenseModalOpen(false);
    setToast({ 
        message: `${newExpenses.length} spes${newExpenses.length !== 1 ? 'e' : 'a'} aggiunt${newExpenses.length !== 1 ? 'e' : 'a'}!`, 
        type: 'success' 
    });
  };


  const openImageParser = (source: 'camera' | 'screenshot') => {
    setImageParserSource(source);
    setIsImageParserOpen(true);
  };
  
  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') {
      return expenses;
    }
    return expenses.filter(expense => expense.category === selectedCategory);
  }, [expenses, selectedCategory]);

  // Sort expenses by date descending
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      // Treat invalid dates as older than any valid date
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });
  }, [filteredExpenses]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header 
        pendingSyncs={queuedImages.length}
        isOnline={isOnline}
        onLogout={onLogout}
      />

      <main className="container mx-auto p-4 md:p-8">
        {view === 'dashboard' ? (
          <div className="space-y-8">
            <Dashboard expenses={expenses} onNavigateToCategories={handleNavigateToCategories} />
            
            <PendingImages
              images={queuedImages}
              onAnalyze={handleAnalyzeQueuedImage}
              onDelete={handleDeleteQueuedImage}
              isOnline={isOnline}
              syncingImageId={syncingImageId}
            />
            
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
              {sortedExpenses.length > 0 ? (
                <ExpenseList expenses={sortedExpenses} onEdit={openFormToEdit} onDelete={handleDeleteExpense} />
              ) : (
                <p className="text-center text-slate-500 py-10">Nessuna spesa trovata. Prova a cambiare i filtri o ad aggiungerne una nuova.</p>
              )}
            </div>
          </div>
        ) : (
            <CategoryDetailScreen 
                expenses={expenses} 
                onNavigateBack={handleNavigateBack}
                onEditExpense={openFormToEdit}
                onDeleteExpense={handleDeleteExpense}
            />
        )}
      </main>

      {view === 'dashboard' && (
        <FloatingActionButton
          onAdd={openNewForm}
          onVoice={() => setIsVoiceInputOpen(true)}
          onCamera={() => openImageParser('camera')}
          onUpload={() => openImageParser('screenshot')}
        />
      )}

      {isFormOpen && (
          <ExpenseForm 
            isOpen={isFormOpen} 
            onClose={closeForm} 
            onSubmit={handleAddOrUpdateExpense}
            initialData={editingExpense}
            prefilledData={prefilledData}
          />
      )}

      {isImageParserOpen && (
        <ImageParserModal
            isOpen={isImageParserOpen}
            onClose={() => setIsImageParserOpen(false)}
            onParsed={handleImageParsed}
            onQueued={handleImageQueued}
            source={imageParserSource}
        />
      )}

      {isVoiceInputOpen && (
        <VoiceInputModal
            isOpen={isVoiceInputOpen}
            onClose={() => setIsVoiceInputOpen(false)}
            onParsed={handleVoiceParsed}
        />
      )}

       {isMultiExpenseModalOpen && (
        <MultipleExpensesModal
            isOpen={isMultiExpenseModalOpen}
            onClose={() => setIsMultiExpenseModalOpen(false)}
            expenses={parsedExpenses}
            onConfirm={handleConfirmMultipleExpenses}
        />
     )}

      {expenseToDelete && (
        <ConfirmationModal
          isOpen={!!expenseToDelete}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Elimina Spesa"
          message={
            <>
              Sei sicuro di voler eliminare la spesa "<strong>{expenseToDelete.description || 'Senza descrizione'}</strong>"? 
              Questa azione non può essere annullata.
            </>
          }
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;