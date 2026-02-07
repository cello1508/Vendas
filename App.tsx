import React, { useState, useEffect } from 'react';
import {
  Target,
  DollarSign,
  TrendingUp,
  Plus,
  Settings,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Trash2,
  Phone,
  Pencil,
  Paperclip,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Sale, MonthGoal, Insight, Call } from './types';
import { GoalHero } from './components/GoalHero';
import { MetricCard } from './components/MetricCard';
import { SalesChart } from './components/SalesChart';
import { Card } from './components/Card';
import { Modal } from './components/Modal';
import { generateSalesInsights } from './services/aiService';
import { supabase } from './services/supabase';

const DEFAULT_GOAL: MonthGoal = {
  id: '',
  revenue: 10000,
  count: 50
};

const App: React.FC = () => {
  // State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [sales, setSales] = useState<Sale[]>([]);
  const [allGoals, setAllGoals] = useState<MonthGoal[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Modal States
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const [isEditSaleOpen, setIsEditSaleOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Form States
  const [newSaleAmount, setNewSaleAmount] = useState('');
  const [newSaleDesc, setNewSaleDesc] = useState('');
  const [newSaleReceipt, setNewSaleReceipt] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Derived State
  const currentGoal = allGoals.find(g => g.id === currentMonth) || { ...DEFAULT_GOAL, id: currentMonth };
  const [tempGoals, setTempGoals] = useState<MonthGoal>(currentGoal);

  const filteredSales = sales.filter(s => {
    const d = new Date(s.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m === currentMonth;
  });

  // Update tempGoals when currentMonth changes
  useEffect(() => {
    setTempGoals(currentGoal);
  }, [currentMonth, allGoals]);

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, goalsRes, callsRes] = await Promise.all([
          supabase.from('sales').select('*').order('date', { ascending: false }),
          supabase.from('goals').select('*'),
          supabase.from('calls').select('*').order('date', { ascending: false })
        ]);

        if (salesRes.error) throw salesRes.error;
        if (goalsRes.error) throw goalsRes.error;
        if (callsRes.error) throw callsRes.error;

        setSales(salesRes.data || []);
        setAllGoals(goalsRes.data || []);
        setCalls(callsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Calculations
  const totalRevenue = filteredSales.reduce((acc, curr) => acc + (curr.status !== 'pending' ? curr.amount : 0), 0);
  const pendingRevenue = filteredSales.reduce((acc, curr) => acc + (curr.status === 'pending' ? curr.amount : 0), 0);

  const revenueProgress = (totalRevenue / (currentGoal.revenue || 1)) * 100;
  const remainingRevenue = Math.max(0, currentGoal.revenue - totalRevenue);

  const totalCount = filteredSales.length;
  const countProgress = (totalCount / (currentGoal.count || 1)) * 100;
  const remainingCount = Math.max(0, currentGoal.count - totalCount);

  const averageTicket = totalCount > 0 ? (filteredSales.reduce((acc, curr) => acc + curr.amount, 0) / totalCount) : 0;

  // Deadline Calculations (End of Month)
  const today = new Date();
  const [year, month] = currentMonth.split('-').map(Number);
  const lastDayOfMonth = new Date(year, month, 0); // Day 0 is last day of previous index, so month is 1-indexed in split but 0-indexed in Date ctor?
  // Actually: new Date(year, month, 0) gives last day of month-1 if month is 0-indexed.
  // split gives "02" -> 2. 
  // new Date(2026, 2, 0) -> Last day of Feb (since Mar is 2).
  // Wait, JS Month is 0-11. 
  // "02" is Feb. Feb is 1.
  // new Date(2026, 2, 0) -> March 0 -> Feb Last Day. Correct.

  const endOfMonth = new Date(year, month, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const diffTime = endOfMonth.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let dailyPace = 0;
  if (daysRemaining > 0) {
    // If looking at past month, daysRemaining might be negative or 0.
    // If looking at future, it's full month.
    // Logic only makes sense for current month.
    const isCurrentMonth = currentMonth === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    if (isCurrentMonth) {
      dailyPace = remainingRevenue / daysRemaining;
    }
  }

  // Navigation
  const changeMonth = (offset: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonth = (isoMonth: string) => {
    const [y, m] = isoMonth.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Handlers
  const handleAddCall = async () => {
    const call: Call = {
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('calls').insert([call]);
      if (error) throw error;
      setCalls(prev => [call, ...prev]);
    } catch (error) {
      console.error('Error adding call:', error);
    }
  };

  const handleDeleteCall = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta chamada?')) {
      try {
        const { error } = await supabase.from('calls').delete().eq('id', id);
        if (error) throw error;
        setCalls(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting call:', error);
      }
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSaleAmount) return;

    // Use current month context for new sale or just today?
    // Usually new sale is TODAY.
    // If user is viewing past month, should they be able to add sale to that month?
    // Let's assume add sale is always NOW, or user sets date.
    // The modal doesn't have date picker for new sale (it defaults to now).
    // Let's keep it NOW.

    // If I want to allow adding to current view month, I'd need date picker or assume 1st of month.
    // Safest is NOW. If user wants to backdate, they edit.

    const sale: Sale = {
      id: crypto.randomUUID(),
      amount: parseFloat(newSaleAmount),
      description: newSaleDesc || 'Venda sem descrição',
      date: new Date().toISOString(),
      status: isPending ? 'pending' : 'paid',
      receipt: newSaleReceipt
    };

    try {
      const { error } = await supabase.from('sales').insert([sale]);
      if (error) throw error;

      setSales([sale, ...sales]);
      setNewSaleAmount('');
      setNewSaleDesc('');
      setNewSaleReceipt('');
      setIsPending(false);
      setIsAddSaleOpen(false);
    } catch (error) {
      console.error('Error adding sale:', error);
      alert('Erro ao adicionar venda. Verifique se o banco de dados está configurado.');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) throw error;
        const newSales = sales.filter(sale => sale.id !== id);
        setSales(newSales);
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    try {
      const { error } = await supabase
        .from('sales')
        .update(editingSale)
        .eq('id', editingSale.id);

      if (error) throw error;

      setSales(sales.map(s => s.id === editingSale.id ? editingSale : s));
      setIsEditSaleOpen(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const handleUpdateGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...tempGoals, id: currentMonth };

      // Use upsert for simpler logic
      const { error } = await supabase
        .from('goals')
        .upsert(body, { onConflict: 'id' });

      if (error) throw error;

      const existing = allGoals.find(g => g.id === currentMonth);
      if (existing) {
        setAllGoals(allGoals.map(g => g.id === currentMonth ? body : g));
      } else {
        setAllGoals([...allGoals, body]);
      }
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Error updating goals:', error);
    }
  };

  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true);
    // Use filtered sales and current goal
    // Note: generateSalesInsights might expect 'Goals' interface which we changed to 'MonthGoal' compatible structure
    const results = await generateSalesInsights(filteredSales, currentGoal as any);
    setInsights(results);
    setIsLoadingInsights(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEdit && editingSale) {
          setEditingSale({ ...editingSale, receipt: base64String });
        } else {
          setNewSaleReceipt(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">MetaVendas Pro</h1>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight sm:hidden">MVP</h1>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-gray-100 rounded-full p-1 mx-2 sm:mx-4 shadow-inner">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white hover:text-blue-600 rounded-full transition-all shadow-sm text-gray-500">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 min-w-[100px] sm:min-w-[140px] text-center capitalize select-none">
              {formatMonth(currentMonth)}
            </span>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white hover:text-blue-600 rounded-full transition-all shadow-sm text-gray-500">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setTempGoals(currentGoal); setIsSettingsOpen(true); }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              title="Configurar Metas"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setIsAddSaleOpen(true)}
              className="bg-black text-white hover:bg-gray-800 transition-colors px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg shadow-gray-200"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nova Venda</span>
              <span className="sm:hidden">Venda</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

        {/* Hero Section */}
        <GoalHero
          current={totalRevenue}
          goal={currentGoal.revenue}
          deadline={endOfMonth.toISOString().split('T')[0]}
          daysRemaining={daysRemaining}
          dailyPace={dailyPace}
        />

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Vendas Realizadas"
            value={totalCount.toString()}
            goalValue={`${currentGoal.count} vendas`}
            remainingValue={`${remainingCount} vendas`}
            progress={countProgress}
            color="green"
            icon={<ShoppingBag size={24} />}
          />

          {/* Pending Sales Card */}
          <MetricCard
            title="Valores Pendentes"
            value={formatCurrency(pendingRevenue)}
            subValue="A receber"
            color="orange"
            icon={<DollarSign size={24} />}
          />

          <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-200 border-l-4 border-l-orange-500">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Chamadas Realizadas</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{calls.length}</h2>
                  {calls.length > 0 && (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      {((filteredSales.length / calls.length) * 100).toFixed(1)}% conv.
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                <Phone size={24} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <button
                onClick={handleAddCall}
                className="w-full bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Adicionar Chamada
              </button>
              <button
                onClick={() => setIsCallHistoryOpen(true)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 font-medium py-1 transition-colors flex items-center justify-center gap-1"
              >
                Ver Histórico
              </button>
            </div>
          </Card>
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(averageTicket)}
            subValue="Média por venda"
            color="purple"
            icon={<Target size={24} />}
          />
        </div>

        {/* Chart & Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2" title="Desempenho de Vendas">
            <SalesChart sales={filteredSales} />
          </Card>

          {/* AI Insights Panel */}
          <Card
            title="Insights Inteligentes"
            className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100"
            action={
              <button
                onClick={handleGenerateInsights}
                disabled={isLoadingInsights}
                className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isLoadingInsights ? 'Analisando...' : (
                  <>
                    <Sparkles size={14} />
                    <span>Gerar</span>
                  </>
                )}
              </button>
            }
          >
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Clique em gerar para analisar seus resultados com IA.</p>
                </div>
              ) : (
                insights.map((insight, idx) => (
                  <div key={idx} className="bg-white/60 p-3 rounded-xl border border-indigo-50 shadow-sm animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${insight.type === 'positive' ? 'bg-green-500' :
                        insight.type === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                      <h4 className="font-semibold text-gray-800 text-sm">{insight.title}</h4>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{insight.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card title="Histórico Recente">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Data</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Descrição</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Valor</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                ) : (
                  sales.slice(0, 10).map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span>{sale.description}</span>
                          {sale.receipt && (
                            <a
                              href={sale.receipt}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                              title="Ver comprovante"
                            >
                              <Paperclip size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                          {sale.status === 'pending' ? 'Pendente' : 'Pago'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-bold text-right group-hover:text-blue-600 transition-colors">
                        {formatCurrency(sale.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingSale(sale);
                              setIsEditSaleOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar venda"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir venda"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sales.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSalesHistoryOpen(true)}
                className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center justify-center gap-1 mx-auto"
              >
                Ver todo o histórico <ArrowRight size={14} />
              </button>
            </div>
          )}
        </Card>
      </main>

      {/* Modal: Add Sale */}
      <Modal
        isOpen={isAddSaleOpen}
        onClose={() => setIsAddSaleOpen(false)}
        title="Registrar Venda"
      >
        <form onSubmit={handleAddSale} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                required
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-semibold text-gray-900 placeholder-gray-300"
                placeholder="0,00"
                value={newSaleAmount}
                onChange={(e) => setNewSaleAmount(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="Ex: Consultoria, Produto X..."
              value={newSaleDesc}
              onChange={(e) => setNewSaleDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comprovante</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center justify-center bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-500 text-gray-500 px-4 py-3 rounded-xl transition-all w-full text-sm font-medium">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e)}
                />
                <div className="flex items-center gap-2">
                  {newSaleReceipt ? <FileText size={18} className="text-blue-600" /> : <Paperclip size={18} />}
                  {newSaleReceipt ? 'Comprovante anexado' : 'Anexar comprovante'}
                </div>
              </label>
              {newSaleReceipt && (
                <button
                  type="button"
                  onClick={() => setNewSaleReceipt('')}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="isPending"
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 transition-all cursor-pointer"
                checked={isPending}
                onChange={(e) => setIsPending(e.target.checked)}
              />
            </div>
            <label htmlFor="isPending" className="text-sm font-medium text-gray-700 select-none cursor-pointer flex-1">
              Marcar como Pagamento Pendente
              <span className="block text-xs text-gray-500 font-normal mt-0.5">O valor não será somado ao faturamento atual</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 mt-2"
          >
            Confirmar Venda
          </button>
        </form>
      </Modal>

      {/* Modal: Settings */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Configurar Metas"
      >
        <form onSubmit={handleUpdateGoals} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta de Faturamento (R$)</label>
            <input
              type="number"
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
              value={tempGoals.revenue}
              onChange={(e) => setTempGoals({ ...tempGoals, revenue: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta de Quantidade de Vendas</label>
            <input
              type="number"
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
              value={tempGoals.count}
              onChange={(e) => setTempGoals({ ...tempGoals, count: parseInt(e.target.value) || 0 })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 mt-2"
          >
            Salvar Metas
          </button>
        </form>
      </Modal>

      {/* Modal: Call History */}
      <Modal
        isOpen={isCallHistoryOpen}
        onClose={() => setIsCallHistoryOpen(false)}
        title="Histórico de Chamadas"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {calls.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhuma chamada registrada.</p>
          ) : (
            calls.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Chamada Realizada</p>
                    <p className="text-xs text-gray-500">
                      {new Date(call.date).toLocaleDateString('pt-BR')} às {new Date(call.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCall(call.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir chamada"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal: Sales History */}
      <Modal
        isOpen={isSalesHistoryOpen}
        onClose={() => setIsSalesHistoryOpen(false)}
        title="Histórico Completo de Vendas"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Data</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Descrição</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Valor</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    Nenhuma venda registrada.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{sale.description}</span>
                        {sale.receipt && (
                          <a
                            href={sale.receipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                            title="Ver comprovante"
                          >
                            <Paperclip size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {sale.status === 'pending' ? 'Pendente' : 'Pago'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-bold text-right group-hover:text-blue-600 transition-colors">
                      {formatCurrency(sale.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingSale(sale);
                            setIsEditSaleOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar venda"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir venda"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>



      {/* Modal: Edit Sale */}
      <Modal
        isOpen={isEditSaleOpen}
        onClose={() => { setIsEditSaleOpen(false); setEditingSale(null); }}
        title="Editar Venda"
      >
        {editingSale && (
          <form onSubmit={handleUpdateSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-semibold text-gray-900"
                  value={editingSale.amount}
                  onChange={(e) => setEditingSale({ ...editingSale, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input
                type="text"
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                value={editingSale.description}
                onChange={(e) => setEditingSale({ ...editingSale, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="datetime-local"
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                value={new Date(editingSale.date).toISOString().slice(0, 16)}
                onChange={(e) => setEditingSale({ ...editingSale, date: new Date(e.target.value).toISOString() })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comprovante</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center justify-center bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-500 text-gray-500 px-4 py-3 rounded-xl transition-all w-full text-sm font-medium">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, true)}
                  />
                  <div className="flex items-center gap-2">
                    {editingSale.receipt ? <FileText size={18} className="text-blue-600" /> : <Paperclip size={18} />}
                    {editingSale.receipt ? 'Alterar comprovante' : 'Anexar comprovante'}
                  </div>
                </label>
                {editingSale.receipt && (
                  <button
                    type="button"
                    onClick={() => setEditingSale({ ...editingSale, receipt: '' })}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remover comprovante"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="editIsPending"
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 transition-all cursor-pointer"
                  checked={editingSale.status === 'pending'}
                  onChange={(e) => setEditingSale({ ...editingSale, status: e.target.checked ? 'pending' : 'paid' })}
                />
              </div>
              <label htmlFor="editIsPending" className="text-sm font-medium text-gray-700 select-none cursor-pointer flex-1">
                Pagamento Pendente
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 mt-2"
            >
              Salvar Alterações
            </button>
          </form>
        )}
      </Modal>

    </div >
  );
};

export default App;
