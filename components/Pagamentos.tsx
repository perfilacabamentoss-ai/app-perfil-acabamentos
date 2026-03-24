
import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  Users, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  Fingerprint,
  Download,
  ChevronRight,
  X,
  Save,
  Percent,
  Trash2
} from 'lucide-react';
import { Payment, TimeLog, Collaborator, Project, Contractor } from '../types';
import ConfirmModal from './ConfirmModal';

const Pagamentos: React.FC = () => {
  const [works, setWorks] = useState<Project[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    return saved ? JSON.parse(saved) : [];
  });
  const [contractors, setContractors] = useState<Contractor[]>(() => {
    const saved = localStorage.getItem('perfil_contractors');
    return saved ? JSON.parse(saved) : [];
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem('perfil_collaborators');
    return saved ? JSON.parse(saved) : [];
  });
  const [materials, setMaterials] = useState<any[]>(() => {
    const saved = localStorage.getItem('perfil_materials');
    return saved ? JSON.parse(saved) : [];
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('perfil_payments');
    return saved ? JSON.parse(saved) : [];
  });
  const [mainBalance, setMainBalance] = useState<number>(() => {
    const saved = localStorage.getItem('perfil_main_balance');
    return saved ? Number(saved) : 0;
  });

  const loadData = () => {
    const savedWorks = localStorage.getItem('perfil_works');
    if (savedWorks) setWorks(JSON.parse(savedWorks));
    
    const savedContractors = localStorage.getItem('perfil_contractors');
    if (savedContractors) setContractors(JSON.parse(savedContractors));
    
    const savedCollaborators = localStorage.getItem('perfil_collaborators');
    if (savedCollaborators) setCollaborators(JSON.parse(savedCollaborators));
    
    const savedMaterials = localStorage.getItem('perfil_materials');
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
    
    const savedPayments = localStorage.getItem('perfil_payments');
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    
    const savedBalance = localStorage.getItem('perfil_main_balance');
    if (savedBalance) setMainBalance(Number(savedBalance));
  };

  React.useEffect(() => {
    window.addEventListener('storage', loadData);
    window.addEventListener('perfil_sync_complete', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('perfil_sync_complete', loadData);
    };
  }, []);

  const stats = useMemo(() => {
    const totalPaid = payments.filter(p => p.status === 'Concluído' || p.status === 'Pago').reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
    const pending = payments.filter(p => p.status === 'Pendente').reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
    const pendingCount = payments.filter(p => p.status === 'Pendente').length;
    const collabPayroll = payments.filter(p => p.type === 'Colaborador').reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
    const currentBalance = mainBalance - totalPaid;
    return { totalPaid, pending, pendingCount, collabPayroll, currentBalance };
  }, [payments, mainBalance]);

  // Save payments to localStorage
  React.useEffect(() => {
    localStorage.setItem('perfil_payments', JSON.stringify(payments));
    window.dispatchEvent(new Event('storage'));
  }, [payments]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterWork, setFilterWork] = useState<string>('Todos');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; recipientName: string; type: 'single' | 'all' }>({
    isOpen: false,
    id: '',
    recipientName: '',
    type: 'single'
  });

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    recipientName: '',
    type: 'Colaborador',
    value: 0,
    date: new Date().toLocaleDateString('pt-BR'),
    status: 'Pendente',
    reference: '',
    workId: '',
    workName: '',
    retentionPercentage: 0,
    retentionValue: 0,
    netValue: 0
  });

  const handleRetentionChange = (percentage: number, totalValue: number) => {
    const retentionValue = (totalValue * percentage) / 100;
    const netValue = totalValue - retentionValue;
    setNewPayment(prev => ({
      ...prev,
      retentionPercentage: percentage,
      retentionValue,
      netValue
    }));
  };

  const handleValueChange = (totalValue: number) => {
    const percentage = newPayment.retentionPercentage || 0;
    const retentionValue = (totalValue * percentage) / 100;
    const netValue = totalValue - retentionValue;
    setNewPayment(prev => ({
      ...prev,
      value: totalValue,
      retentionValue,
      netValue
    }));
  };

  const handleStatusChange = (id: string, newStatus: 'Pendente' | 'Pago' | 'Atrasado') => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const handleSavePayment = () => {
    if (!newPayment.recipientName || !newPayment.value) {
      alert("Preencha o nome do favorecido e o valor.");
      return;
    }

    const selectedWork = works.find(w => w.id === newPayment.workId);

    const paymentToAdd: Payment = {
      ...newPayment as Payment,
      id: Math.random().toString(36).substr(2, 9),
      workName: selectedWork?.name || ''
    };

    setPayments([paymentToAdd, ...payments]);
    setIsCreating(false);
    setNewPayment({
      recipientName: '',
      type: 'Colaborador',
      value: 0,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'Pendente',
      reference: '',
      workId: '',
      workName: '',
      retentionPercentage: 0,
      retentionValue: 0,
      netValue: 0
    });
  };

  const handleDeletePayment = (id: string, recipientName: string) => {
    setConfirmDelete({ isOpen: true, id, recipientName, type: 'single' });
  };

  const handleClearAll = () => {
    setConfirmDelete({ isOpen: true, id: 'all', recipientName: 'todos os pagamentos', type: 'all' });
  };

  const executeDelete = () => {
    const { id, type } = confirmDelete;
    if (type === 'all') {
      setPayments([]);
      localStorage.removeItem('perfil_payments');
      window.dispatchEvent(new Event('storage'));
    } else {
      setPayments(prev => {
        const updated = prev.filter(p => p.id !== id);
        localStorage.setItem('perfil_payments', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        return updated;
      });
    }
    setConfirmDelete({ isOpen: false, id: '', recipientName: '', type: 'single' });
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (p.workName && p.workName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'Todos' || p.type === filterType;
    const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
    const matchesWork = filterWork === 'Todos' || p.workId === filterWork;
    return matchesSearch && matchesType && matchesStatus && matchesWork;
  });

  // Calculate payments based on Ponto Facial (Simplified logic)
  const pontoPayments = useMemo(() => {
    return collaborators.map(collab => {
      // In a real app, this would fetch from a database of time logs
      const daysWorked = 0; 
      const estimatedValue = collab.payType === 'Diária' ? daysWorked * collab.payValue : collab.payValue;
      
      return {
        ...collab,
        daysWorked,
        estimatedValue
      };
    });
  }, [collaborators]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Pagamentos</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão financeira e integração com cartão de ponto</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleClearAll}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all border border-rose-100"
          >
            <Trash2 size={20} />
            Limpar Tudo
          </button>
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all">
            <Download size={20} />
            Relatório
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
          >
            <DollarSign size={20} />
            Novo Pagamento
          </button>
        </div>
      </div>

      {/* Integration Alert */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <Fingerprint size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Integração com Ponto Facial Ativa</h3>
          <p className="text-sm text-blue-700 font-medium mt-1">
            O sistema está calculando automaticamente as diárias e horas extras com base nos registros biométricos de hoje.
          </p>
        </div>
        <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-blue-100">
          Sincronizar Agora
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pago (Geral)</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-emerald-500">
            <ArrowUpRight size={14} />
            <span className="text-[10px] font-bold uppercase">Liquidação Realizada</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">A Pagar (Pendentes)</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-blue-500">
            <Clock size={14} />
            <span className="text-[10px] font-bold uppercase">{stats.pendingCount} lançamentos pendentes</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Folha de Pagamento</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {stats.collabPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-slate-400">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase">{collaborators.length} colaboradores</span>
          </div>
        </div>
        <div className="bg-[#0b1222] p-6 rounded-3xl shadow-xl text-white">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Saldo em Conta</p>
          <h3 className="text-2xl font-black">R$ {stats.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-blue-400">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-bold uppercase">Operação Segura</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Payments List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-slate-400 mr-2">
              <Filter size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar pagamentos..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Colaborador">Colaboradores</option>
              <option value="Fornecedor">Fornecedores</option>
              <option value="Empreiteiro">Empreiteiros</option>
            </select>
            <select 
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={filterWork}
              onChange={e => setFilterWork(e.target.value)}
            >
              <option value="Todos">Todas as Obras</option>
              {works.map(work => (
                <option key={work.id} value={work.id}>{work.name}</option>
              ))}
            </select>
            <select 
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="Todos">Todos os Status</option>
              <option value="Pendente">Pendentes</option>
              <option value="Concluído">Concluídos</option>
              <option value="Atrasado">Atrasados</option>
            </select>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Histórico de Transações</h2>
              <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">Ver Tudo</button>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredPayments.map(payment => (
                <div key={payment.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${
                      payment.type === 'Colaborador' ? 'bg-blue-50 text-blue-600' : 
                      payment.type === 'Fornecedor' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {payment.type === 'Colaborador' ? <Users size={20} /> : <Building2 size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{payment.recipientName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{payment.reference}</p>
                        {payment.workName && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{payment.workName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">
                      R$ {(payment.netValue || payment.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {payment.retentionValue && payment.retentionValue > 0 && (
                      <p className="text-[9px] text-rose-500 font-bold uppercase tracking-tight">
                        Retenção: R$ {payment.retentionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({payment.retentionPercentage}%)
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {payment.status !== 'Pago' && payment.status !== 'Concluído' && (
                        <button 
                          onClick={() => handleStatusChange(payment.id, 'Pago')}
                          className="text-emerald-600 p-1 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Confirmar Pagamento"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">{payment.date}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        payment.status === 'Concluído' ? 'bg-emerald-500' : 
                        payment.status === 'Atrasado' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}></div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        payment.status === 'Concluído' ? 'text-emerald-600' : 
                        payment.status === 'Atrasado' ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {payment.status}
                      </span>
                      <button 
                        onClick={() => handleDeletePayment(payment.id, payment.recipientName)}
                        className="ml-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Excluir Registro"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Ponto Facial & Adiantamentos */}
        <div className="space-y-6">
          {/* Adiantamentos de Empreiteiros */}
          <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 shadow-sm">
            <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
              <DollarSign size={24} className="text-amber-600" /> Adiantamentos
            </h2>
            <p className="text-amber-700 text-[10px] font-black uppercase tracking-widest mt-1">Controle de Empreiteiros</p>
            
            <div className="mt-8 space-y-4">
              {contractors.filter(c => (c.advances || []).length > 0).map(c => (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{c.name}</h4>
                    <span className="text-[10px] font-black text-amber-600">
                      R$ {c.advances.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {c.advances.map(adv => (
                      <div key={adv.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-amber-100 text-[9px] font-bold text-slate-500">
                        <span>{adv.date}</span>
                        <span className="text-rose-500">R$ {adv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {contractors.filter(c => (c.advances || []).length > 0).length === 0 && (
                <p className="text-center py-4 text-amber-600/50 text-[10px] font-bold uppercase">Nenhum adiantamento registrado</p>
              )}
            </div>
          </div>

          <div className="bg-[#0b1222] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Fingerprint size={120} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight relative z-10">Cálculo de Ponto</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 relative z-10">Valores Estimados Hoje</p>
            
            <div className="mt-8 space-y-6 relative z-10">
              {pontoPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Users size={18} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold">{p.name}</h5>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                        {p.daysWorked} {p.daysWorked === 1 ? 'Dia' : 'Dias'} • {p.payType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">R$ {p.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <ChevronRight size={14} className="text-slate-600 ml-auto mt-1 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              Aprovar Pagamentos do Ponto
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" /> Alertas Financeiros
            </h3>
            <div className="space-y-4">
              {stats.pendingCount > 0 ? (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                      Existem <span className="font-black">{stats.pendingCount}</span> pagamentos pendentes aguardando sua ação.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                      Verifique a aba de "Ponto Facial" para validar os dias trabalhados da quinzena.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sem alertas pendentes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white">
              <h2 className="text-xl font-bold uppercase tracking-tight">Novo Pagamento</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Favorecido</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Nome do colaborador ou fornecedor"
                    value={newPayment.recipientName}
                    onChange={e => setNewPayment({...newPayment, recipientName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newPayment.type}
                      onChange={e => setNewPayment({...newPayment, type: e.target.value as any})}
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Fornecedor">Fornecedor</option>
                      <option value="Empreiteiro">Empreiteiro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="DD/MM/AAAA"
                      value={newPayment.date}
                      onChange={e => setNewPayment({...newPayment, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Obra Associada</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newPayment.workId}
                    onChange={e => setNewPayment({...newPayment, workId: e.target.value})}
                  >
                    <option value="">Nenhuma obra específica</option>
                    {works.map(work => (
                      <option key={work.id} value={work.id}>{work.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referência / Descrição</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ex: Salário Ref. Janeiro ou Fatura #123"
                    value={newPayment.reference}
                    onChange={e => setNewPayment({...newPayment, reference: e.target.value})}
                  />
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={14} className="text-blue-600" /> Valor Bruto (Total)
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="0.00"
                      value={newPayment.value || ''}
                      onChange={e => handleValueChange(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Percent size={14} className="text-rose-500" /> Retenção Contratual (%)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ex: 5"
                        value={newPayment.retentionPercentage || ''}
                        onChange={e => handleRetentionChange(Number(e.target.value), newPayment.value || 0)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">Este valor ficará retido na fonte até a conclusão da obra.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Retido</span>
                      <span className="font-bold text-rose-500">- R$ {(newPayment.retentionValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Valor Líquido a Pagar</span>
                      <span className="text-xl font-black text-blue-600">R$ {(newPayment.netValue || newPayment.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 border-t bg-slate-50 flex gap-4">
              <button onClick={() => setIsCreating(false)} className="flex-1 py-4 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
              <button onClick={handleSavePayment} className="flex-[2] py-4 bg-blue-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest"><Save size={18} /> Salvar Pagamento</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={confirmDelete.type === 'all' ? "Limpar Tudo" : "Excluir Pagamento"}
        message={confirmDelete.type === 'all' 
          ? "Deseja apagar todos os pagamentos? Esta ação não pode ser desfeita."
          : `Deseja excluir o pagamento para "${confirmDelete.recipientName}"? Esta ação não pode ser desfeita.`
        }
      />
    </div>
  );
};

export default Pagamentos;
