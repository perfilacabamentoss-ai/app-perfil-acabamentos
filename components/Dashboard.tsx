
import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Users, Truck, HardHat, Clock, PlusCircle, ChevronRight, ClipboardList, DollarSign, X, AlertCircle, ShieldCheck, Phone, TrendingUp, Filter, Zap, RefreshCw, UserPlus, Share2 } from 'lucide-react';
import { StatCardProps, Project, Collaborator, Supplier, Contractor, Invoice, Payment, Material, Client, TechnicalProject } from '../types';
import { clearAllSystemData } from '../utils/storage';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { dataSync } from '../src/services/dataSync';
import ConfirmModal from './ConfirmModal';

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, sublabel, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group h-full ${onClick ? 'hover:border-blue-200 dark:hover:border-blue-500 active:scale-[0.98]' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-700 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-black mt-1 text-slate-800 dark:text-white tracking-tight">
          {typeof value === 'number' ? value.toString().padStart(2, '0') : value}
        </h3>
      </div>
      <div className={`p-2 rounded-lg ${color} text-white shadow-lg transition-transform group-hover:scale-110`}>
        {icon}
      </div>
    </div>
    <p className="text-[9px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-wider leading-tight">{sublabel}</p>
  </div>
);

const LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEjRUQCeZnEJue8_9Hx-MgK6LIqJ2K1WFc9xgLwf_IZQ&s"; // New logo provided by user
const GOLDEN_HELMET_STYLE = { filter: "sepia(0.5) saturate(2) brightness(1.1)" }; // Adjusted filter

interface DashboardProps {
  theme?: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ theme }) => {
  const [works, setWorks] = useState<Project[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem('perfil_collaborators');
    return saved ? JSON.parse(saved) : [];
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('perfil_suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  const [contractors, setContractors] = useState<Contractor[]>(() => {
    const saved = localStorage.getItem('perfil_contractors');
    return saved ? JSON.parse(saved) : [];
  });
  const [faturas, setFaturas] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('perfil_faturas');
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
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(mainBalance.toString());
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showFaturasModal, setShowFaturasModal] = useState(false);
  const [showContractorsModal, setShowContractorsModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [chartFilter, setChartFilter] = useState<'Ativas' | 'Inativas'>('Ativas');
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('perfil_materials');
    return saved ? JSON.parse(saved) : [];
  });
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('perfil_clientes');
    return saved ? JSON.parse(saved) : [];
  });
  const [projects, setProjects] = useState<TechnicalProject[]>(() => {
    const saved = localStorage.getItem('perfil_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [showMaterialEstimate, setShowMaterialEstimate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Dynamic data for the chart based on real projects with media
  const chartData = useMemo(() => {
    // Filter works that have at least one photo
    const worksWithMedia = works.filter(w => w.photos && w.photos.length > 0);
    
    // If no works with media, return empty or default state
    if (worksWithMedia.length === 0) {
      return [
        { name: 'Sem 1', planejado: 0, realizado: 0 },
        { name: 'Sem 2', planejado: 0, realizado: 0 },
        { name: 'Sem 3', planejado: 0, realizado: 0 },
        { name: 'Sem 4', planejado: 0, realizado: 0 },
      ];
    }

    // Calculate average progress of works with media
    const avgProgress = worksWithMedia.reduce((acc, w) => acc + w.progress, 0) / worksWithMedia.length;

    // Create a progression curve based on the average progress
    // This simulates the 7 weeks shown in the UI
    return [
      { name: 'Sem 1', planejado: 15, realizado: Math.min(avgProgress * 0.2, 15) },
      { name: 'Sem 2', planejado: 30, realizado: Math.min(avgProgress * 0.4, 30) },
      { name: 'Sem 3', planejado: 45, realizado: Math.min(avgProgress * 0.6, 45) },
      { name: 'Sem 4', planejado: 60, realizado: Math.min(avgProgress * 0.8, 60) },
      { name: 'Sem 5', planejado: 75, realizado: Math.min(avgProgress * 0.9, 75) },
      { name: 'Sem 6', planejado: 90, realizado: Math.min(avgProgress, 90) },
      { name: 'Sem 7', planejado: 100, realizado: avgProgress },
    ];
  }, [works]);

  const worksWithMediaCount = useMemo(() => 
    works.filter(w => w.photos && w.photos.length > 0).length
  , [works]);

  useEffect(() => {
    const loadData = () => {
      const savedWorks = localStorage.getItem('perfil_works');
      const savedCollabs = localStorage.getItem('perfil_collaborators');
      const savedSuppliers = localStorage.getItem('perfil_suppliers');
      const savedContractors = localStorage.getItem('perfil_contractors');
      const savedFaturas = localStorage.getItem('perfil_faturas');
      const savedPayments = localStorage.getItem('perfil_payments');
      const savedBalance = localStorage.getItem('perfil_main_balance');
      const savedMaterials = localStorage.getItem('perfil_materials');
      const savedClients = localStorage.getItem('perfil_clientes');
      const savedProjects = localStorage.getItem('perfil_projects');

      if (savedWorks) setWorks(JSON.parse(savedWorks));
      if (savedCollabs) setCollaborators(JSON.parse(savedCollabs));
      if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
      if (savedContractors) setContractors(JSON.parse(savedContractors));
      if (savedFaturas) setFaturas(JSON.parse(savedFaturas));
      if (savedPayments) setPayments(JSON.parse(savedPayments));
      if (savedBalance) setMainBalance(Number(savedBalance));
      if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
      if (savedClients) setClients(JSON.parse(savedClients));
      if (savedProjects) setProjects(JSON.parse(savedProjects));
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const [isSyncingState, setIsSyncingState] = useState(dataSync.isSyncing);
  const [isConnectedState, setIsConnectedState] = useState(dataSync.isConnected);

  useEffect(() => {
    dataSync.setOnSyncStateChange(setIsSyncingState);
    dataSync.setOnConnectionChange(setIsConnectedState);
  }, []);

  const handleMasterSync = async () => {
    try {
      await dataSync.forceSync();
      // Reload local state
      const savedWorks = localStorage.getItem('perfil_works');
      if (savedWorks) setWorks(JSON.parse(savedWorks));
      
      const savedBalance = localStorage.getItem('perfil_main_balance');
      if (savedBalance) setMainBalance(Number(savedBalance));
      
      const savedMaterials = localStorage.getItem('perfil_materials');
      if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
      
      alert('Sincronização mestre concluída! Os dados foram atualizados com a nuvem.');
    } catch (error) {
      alert('Erro ao sincronizar. Verifique sua conexão.');
    }
  };

  const handlePullFromCloud = async () => {
    setConfirmDelete({
      show: true,
      title: 'Puxar dados da Nuvem',
      message: 'Isso irá substituir seus dados locais pelos dados da nuvem. Todos os dados locais não sincronizados serão perdidos. Continuar?',
      onConfirm: async () => {
        try {
          await dataSync.clearLocalAndSync();
          window.location.reload();
        } catch (error) {
          alert('Erro ao puxar dados da nuvem.');
        }
      }
    });
  };

  const totalMaterialValue = useMemo(() => {
    return materials.reduce((acc, m) => acc + (Number(m.quantity) * Number(m.unitPrice)), 0);
  }, [materials]);

  const totalPaidMaterials = useMemo(() => {
    return payments
      .filter(p => (p.status === 'Pago' || p.status === 'Concluído') && p.reference.startsWith('Material:'))
      .reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('perfil_main_balance', mainBalance.toString());
  }, [mainBalance]);

  const totalPaid = useMemo(() => {
    return payments
      .filter(p => p.status === 'Pago' || p.status === 'Concluído')
      .reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
  }, [payments]);

  const totalLaborCost = useMemo(() => {
    return contractors.reduce((acc, curr) => acc + (curr.totalContractValue || curr.laborCost), 0);
  }, [contractors]);

  const totalCollaboratorCost = useMemo(() => {
    return collaborators.reduce((acc, c) => {
      let monthly = 0;
      if (c.payType === 'Mensal') monthly = c.payValue;
      else if (c.payType === 'Diária') monthly = c.payValue * 22;
      else if (c.payType === 'Semanal') monthly = c.payValue * 4.33;
      else if (c.payType === 'Quinzenal') monthly = c.payValue * 2;
      return acc + monthly;
    }, 0);
  }, [collaborators]);

  const totalPaidOthers = useMemo(() => {
    return payments
      .filter(p => (p.status === 'Pago' || p.status === 'Concluído') && p.type !== 'Empreiteiro')
      .reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
  }, [payments]);

  const currentBalance = mainBalance - totalLaborCost - totalCollaboratorCost - totalMaterialValue;

  const activeWorksCount = works.filter(w => w.status === 'Em andamento').length;
  const collaboratorsCount = collaborators.length;
  const suppliersCount = suppliers.length;
  const contractorsCount = contractors.length;

  const clientBalances = useMemo(() => {
    return clients.map(client => {
      // For now, we'll assume a default balance or use observations to find a balance if specified
      // In a real app, we'd have a specific field for this.
      const initialBalance = 100000; // Default for demo, or could be parsed from observations
      
      const clientMaterials = materials.filter(m => m.workName?.includes(client.name));
      const clientPayments = payments.filter(p => p.recipientName.includes(client.name) || p.workName?.includes(client.name));
      
      const materialsCost = clientMaterials.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
      const paymentsCost = clientPayments.reduce((acc, p) => acc + (p.netValue || p.value), 0);
      
      return {
        ...client,
        currentBalance: initialBalance - materialsCost - paymentsCost
      };
    });
  }, [clients, materials, payments]);

  const pendingInvoicesTotal = useMemo(() => {
    return faturas
      .filter(f => f.status === 'Pendente' || f.status === 'Atrasado')
      .reduce((acc, curr) => acc + curr.value, 0);
  }, [faturas]);

  const pendingInvoicesCount = faturas.filter(f => f.status === 'Pendente' || f.status === 'Atrasado').length;

  const pendingPaymentsTotal = useMemo(() => {
    return payments
      .filter(p => p.status === 'Pendente' || p.status === 'Atrasado')
      .filter(p => {
        if (p.type === 'Empreiteiro') {
          const ref = p.reference.toLowerCase();
          return ref.includes('medição') || ref.includes('medicao') || ref.includes('fatura');
        }
        return true;
      })
      .reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
  }, [payments]);

  const pendingPaymentsBreakdown = useMemo(() => {
    const pending = payments
      .filter(p => p.status === 'Pendente' || p.status === 'Atrasado')
      .filter(p => {
        if (p.type === 'Empreiteiro') {
          const ref = p.reference.toLowerCase();
          return ref.includes('medição') || ref.includes('medicao') || ref.includes('fatura');
        }
        return true;
      });
    const collab = pending.filter(p => p.type === 'Colaborador').reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
    const supplier = pending.filter(p => p.type === 'Fornecedor').reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
    const contractor = pending.filter(p => p.type === 'Empreiteiro').reduce((acc, curr) => acc + (curr.netValue || curr.value), 0);
    return { collab, supplier, contractor };
  }, [payments]);

  const [worksSearchTerm, setWorksSearchTerm] = useState('');

  const filteredDashboardWorks = useMemo(() => {
    if (!worksSearchTerm) return works.slice(0, 5);
    return works.filter(w => 
      w.name.toLowerCase().includes(worksSearchTerm.toLowerCase()) ||
      w.registrationNumber.toLowerCase().includes(worksSearchTerm.toLowerCase())
    ).slice(0, 5);
  }, [works, worksSearchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cloud Sync Diagnostic Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isSyncingState ? 'bg-blue-500 animate-pulse' : isConnectedState ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status da Nuvem</p>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              {isSyncingState ? 'Sincronizando dados...' : isConnectedState ? 'Conectado e Sincronizado' : 'Offline - Dados salvos localmente'}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 px-6 border-l border-slate-100 dark:border-slate-800 h-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">User Ativos</p>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">219</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePullFromCloud}
            className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Puxar da Nuvem
          </button>
          <button 
            onClick={handleMasterSync}
            disabled={isSyncingState}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncingState ? 'animate-spin' : ''} />
            Sincronização Mestre
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Bem-vindo à sua central de comando Perfil Acabamentos</p>
          </div>
        </div>

        {/* Saldo Principal Section */}
        <div 
          className="bg-white dark:bg-slate-900 px-6 py-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-end justify-center min-w-[240px] group relative hover:border-blue-200 dark:hover:border-blue-500 transition-all cursor-pointer"
          onClick={() => setShowMaterialEstimate(!showMaterialEstimate)}
        >
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Saldo Principal Disponível</p>
          
          {/* Floating Balloon / Popover */}
          {showMaterialEstimate && (
            <div className="absolute top-full right-0 mt-4 w-72 bg-[#0b1222] text-white p-5 rounded-2xl shadow-2xl z-[110] animate-in slide-in-from-top-2 duration-300 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Planejamento Financeiro</p>
                  <h4 className="text-sm font-black uppercase tracking-tight">Custos Mensais Estimados</h4>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Colaboradores</span>
                    <span className="text-xs font-black text-emerald-400">R$ {totalCollaboratorCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Materiais</span>
                    <span className="text-xs font-black text-emerald-400">R$ {totalMaterialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Empreiteiros</span>
                    <span className="text-xs font-black text-emerald-400">R$ {totalLaborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-t border-blue-500/30">
                  <span className="text-[11px] text-blue-400 font-black uppercase tracking-widest">Total Estimado</span>
                  <span className="text-base font-black text-white">
                    R$ {(totalCollaboratorCost + totalMaterialValue + totalLaborCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic bg-slate-900/50 p-2 rounded-lg border border-white/5">
                  *Estes valores são projeções baseadas nos cadastros ativos de equipes, contratos de empreiteiros e lista de materiais.
                </p>
              </div>
              <div className="absolute -top-2 right-8 w-4 h-4 bg-[#0b1222] rotate-45 border-l border-t border-white/10"></div>
            </div>
          )}

          {isEditingBalance ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-lg font-black text-blue-600">R$</span>
              <input 
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                onBlur={() => {
                  setMainBalance(Number(balanceInput) || 0);
                  setIsEditingBalance(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setMainBalance(Number(balanceInput) || 0);
                    setIsEditingBalance(false);
                  }
                  if (e.key === 'Escape') {
                    setIsEditingBalance(false);
                  }
                }}
                className="w-32 text-xl font-black text-slate-900 dark:text-white outline-none border-b-2 border-blue-500 bg-transparent text-right"
                autoFocus
              />
            </div>
          ) : (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setBalanceInput(mainBalance.toString());
                setIsEditingBalance(true);
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
              title="Clique para editar o saldo inicial"
            >
              <h2 className={`text-2xl font-black tracking-tight ${currentBalance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded text-slate-400 group-hover:text-blue-500 transition-colors">
                <PlusCircle size={14} />
              </div>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  await dataSync.forceSync();
                  window.location.reload();
                }}
                className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all ml-2"
                title="Sincronizar dados agora"
              >
                <RefreshCw size={12} className={dataSync.isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
            Base: R$ {mainBalance.toLocaleString('pt-BR')} | Colab: R$ {totalCollaboratorCost.toLocaleString('pt-BR')} | Mat: R$ {totalMaterialValue.toLocaleString('pt-BR')} | Empr: R$ {totalLaborCost.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <StatCard 
          label="Obras Ativas" 
          value={activeWorksCount} 
          sublabel={activeWorksCount > 0 ? `${activeWorksCount} canteiros em operação` : "Aguardando cadastro"} 
          icon={<Building2 size={20} />} 
          color="bg-blue-600"
        />
        <StatCard 
          label="EQUIPES TOTAL" 
          value={collaboratorsCount} 
          sublabel={collaboratorsCount > 0 ? `${collaboratorsCount} profissionais cadastrados` : "Base de dados vazia"} 
          icon={<Users size={20} />} 
          color="bg-emerald-500"
          onClick={() => setShowCollaboratorsModal(true)}
        />
        <StatCard 
          label="Faturas Pendentes" 
          value={`R$ ${pendingInvoicesTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
          sublabel={pendingInvoicesCount > 0 ? `${pendingInvoicesCount} faturas aguardando pagamento` : "Tudo em dia"} 
          icon={<ClipboardList size={20} />} 
          color="bg-rose-500"
          onClick={() => setShowFaturasModal(true)}
        />
        <StatCard 
          label="Pagamentos Pendentes" 
          value={`R$ ${pendingPaymentsTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
          sublabel={`Colab: R$ ${pendingPaymentsBreakdown.collab.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} | Forn: R$ ${pendingPaymentsBreakdown.supplier.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} | Empr: R$ ${pendingPaymentsBreakdown.contractor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
          icon={<DollarSign size={20} />} 
          color="bg-purple-600"
          onClick={() => setShowPendingModal(true)}
        />
        <StatCard 
          label="Empreiteiros" 
          value={contractorsCount} 
          sublabel={contractorsCount > 0 ? `Comprometido: R$ ${totalLaborCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : "Inativos no sistema"} 
          icon={<HardHat size={20} />} 
          color="bg-amber-500"
          onClick={() => setShowContractorsModal(true)}
        />

        {/* Client Balances Card */}
        {clientBalances.map(client => (
          <StatCard 
            key={client.id}
            label={`Saldo: ${client.name}`} 
            value={`R$ ${client.currentBalance.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
            sublabel={client.currentBalance < 20000 ? "Atenção: Saldo Baixo" : "Saldo em dia"} 
            icon={<DollarSign size={20} />} 
            color={client.currentBalance < 20000 ? "bg-rose-600" : "bg-emerald-600"}
          />
        ))}

        {/* Mini Gráfico de Etapas */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest">Progresso de Etapas</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Evolução Obra</h3>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800">
                  <TrendingUp size={8} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Real</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[120px] w-full mt-1 relative">
            <div className="absolute inset-0" style={{ minWidth: '0', minHeight: '120px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 110]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#0b1222', 
                      border: 'none', 
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="realizado" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={false}
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="planejado" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Realizado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Planejado</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {worksWithMediaCount} {worksWithMediaCount === 1 ? 'Obra com mídia' : 'Obras com mídia'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Works List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[300px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="text-blue-600 dark:text-blue-400" size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Obras Recentes</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Status em tempo real das construções</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar obras..."
                  className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-48 text-slate-800 dark:text-white"
                  value={worksSearchTerm}
                  onChange={(e) => setWorksSearchTerm(e.target.value)}
                />
              </div>
              {works.length > 5 && (
                <button className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline whitespace-nowrap">Ver Todas</button>
              )}
            </div>
          </div>
          
          {filteredDashboardWorks.length > 0 ? (
            <div className="space-y-4">
              {filteredDashboardWorks.map((obra) => (
                <div key={obra.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                      {projects.length > 0 ? (
                        <img 
                          src={LOGO_URL} 
                          alt="Logo Perfil" 
                          className="w-8 h-8 object-contain opacity-20"
                          style={GOLDEN_HELMET_STYLE}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Building2 size={20} className="text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{obra.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${obra.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{obra.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-xl">
              {projects.length > 0 && (
                <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-sm bg-amber-500 flex items-center justify-center">
                  <img 
                    src={LOGO_URL} 
                    alt="Logo Perfil" 
                    className="w-full h-full object-contain"
                    style={GOLDEN_HELMET_STYLE}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <p className="font-bold text-slate-400 uppercase text-sm tracking-widest">
                {worksSearchTerm ? 'Nenhuma obra encontrada' : 'Nenhuma obra cadastrada'}
              </p>
              <p className="text-slate-400 text-xs mt-2 max-w-[200px]">
                {worksSearchTerm 
                  ? 'Tente ajustar os termos da sua busca.' 
                  : 'Os dados aparecerão aqui assim que o administrador registrar a primeira obra.'}
              </p>
              {!worksSearchTerm && (
                <button className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-xs hover:underline">
                  <PlusCircle size={16} /> Começar Cadastro
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity - Mocked for now but could be linked to a log */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[300px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="text-orange-500" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">Atividade Recente</h2>
              <p className="text-[10px] text-slate-500">Histórico de ações no sistema</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Clock size={40} className="text-slate-200" />
            </div>
            <p className="font-bold text-slate-400 uppercase text-sm tracking-widest">Sem atividades</p>
            <p className="text-slate-400 text-xs mt-2">Aguardando as primeiras interações do administrador.</p>
          </div>
        </div>
      </div>

      {/* Invite Section for Admin */}
      <div className="bg-blue-600 p-6 rounded-xl text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex-shrink-0 bg-white/20 p-4 rounded-2xl backdrop-blur-md">
          <UserPlus size={32} />
        </div>
        <div className="relative z-10 flex-1">
          <h2 className="text-xl font-black tracking-tight uppercase">Convidar Novos Usuários</h2>
          <p className="text-blue-100 text-xs mt-1 font-bold uppercase tracking-widest">Link de Cadastro Direto para Clientes e Usuários Comuns</p>
          <div className="mt-4 flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
            <code className="text-[10px] font-mono opacity-80 truncate flex-1">{window.location.origin}?role=publico</code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}?role=publico`);
                alert('Link de cadastro copiado!');
              }}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
            >
              Copiar Link
            </button>
          </div>
        </div>
        <div className="relative z-10">
          <button 
            onClick={() => {
              const shareUrl = `${window.location.origin}?role=publico`;
              if (navigator.share) {
                navigator.share({
                  title: 'Perfil Acabamentos - Cadastro',
                  text: 'Cadastre-se no sistema da Perfil Acabamentos.',
                  url: shareUrl
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
                alert('Link de cadastro copiado!');
              }
            }}
            className="px-8 py-4 bg-[#0b1222] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3"
          >
            <Share2 size={16} />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Modal Equipes (Colaboradores) */}
      {showCollaboratorsModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowCollaboratorsModal(false)} 
          />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-10 duration-300 flex flex-col my-8">
            <div className="p-8 bg-emerald-500 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Equipe Interna</h2>
                  <p className="text-emerald-100 text-[10px] font-bold uppercase mt-2 tracking-widest">Detalhamento de profissionais e alocações</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCollaboratorsModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {collaborators.length > 0 ? (
                <div className="space-y-4">
                  {collaborators.map(collab => (
                    <div key={collab.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-600 border-2 border-white shadow-sm">
                          {collab.photo ? (
                            <img 
                              src={collab.photo} 
                              alt={collab.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Users size={20} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{collab.name}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                              collab.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {collab.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {collab.role} • {collab.currentWork || 'Sem obra alocada'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {collab.payType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <Users size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Nenhum colaborador cadastrado</h3>
                  <p className="text-slate-400 text-sm mt-2">Utilize o menu lateral para cadastrar sua equipe interna.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button 
                onClick={() => setShowCollaboratorsModal(false)}
                className="px-8 py-4 bg-[#0b1222] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Empreiteiros */}
      {showContractorsModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowContractorsModal(false)} 
          />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-10 duration-300 flex flex-col my-8">
            <div className="p-8 bg-amber-500 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <HardHat size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Equipes de Empreiteiros</h2>
                  <p className="text-amber-100 text-[10px] font-bold uppercase mt-2 tracking-widest">Detalhamento de contratos e serviços</p>
                </div>
              </div>
              <button 
                onClick={() => setShowContractorsModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {contractors.length > 0 ? (
                <div className="space-y-4">
                  {contractors.map(contractor => (
                    <div key={contractor.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:border-amber-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                          <HardHat size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{contractor.name}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                              contractor.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {contractor.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {contractor.service} • {contractor.currentWork}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor da Empreita</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">
                          R$ {(contractor.totalContractValue || contractor.laborCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <HardHat size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Nenhum empreiteiro cadastrado</h3>
                  <p className="text-slate-400 text-sm mt-2">Utilize o menu lateral para cadastrar suas equipes externas.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total em Mão de Obra</p>
                <p className="text-2xl font-black text-amber-600 tracking-tight">
                  R$ {contractors.reduce((acc, curr) => acc + (curr.totalContractValue || curr.laborCost), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button 
                onClick={() => setShowContractorsModal(false)}
                className="px-8 py-4 bg-[#0b1222] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invoices Modal */}
      {showFaturasModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowFaturasModal(false)} 
          />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-10 duration-300 flex flex-col my-8">
            <div className="p-8 bg-rose-500 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Faturas Pendentes</h2>
                  <p className="text-rose-100 text-[10px] font-bold uppercase mt-2 tracking-widest">Detalhamento de faturas de fornecedores</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFaturasModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {faturas.filter(f => f.status === 'Pendente' || f.status === 'Atrasado').length > 0 ? (
                <div className="space-y-4">
                  {faturas
                    .filter(f => f.status === 'Pendente' || f.status === 'Atrasado')
                    .sort((a, b) => (a.status === 'Atrasado' ? -1 : 1))
                    .map(fatura => (
                      <div key={fatura.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:border-rose-100 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${
                            fatura.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <Truck size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{fatura.supplierName}</h4>
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                fatura.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {fatura.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              {fatura.category} {fatura.product ? `• ${fatura.product}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900 tracking-tight">
                            R$ {fatura.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Venc: {fatura.dueDate}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <ClipboardList size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Nenhuma fatura pendente</h3>
                  <p className="text-slate-400 text-sm mt-2">Tudo em dia! Não há faturas aguardando pagamento no momento.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total em Aberto</p>
                <p className="text-2xl font-black text-rose-600 tracking-tight">
                  R$ {pendingInvoicesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button 
                onClick={() => setShowFaturasModal(false)}
                className="px-8 py-4 bg-[#0b1222] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowPendingModal(false)} 
          />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-10 duration-300 flex flex-col my-8">
            <div className="p-8 bg-purple-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Pagamentos Pendentes</h2>
                  <p className="text-purple-100 text-[10px] font-bold uppercase mt-2 tracking-widest">Detalhamento de débitos em aberto</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPendingModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {payments
                .filter(p => p.status === 'Pendente' || p.status === 'Atrasado')
                .filter(p => {
                  if (p.type === 'Empreiteiro') {
                    const ref = p.reference.toLowerCase();
                    return ref.includes('medição') || ref.includes('medicao') || ref.includes('fatura');
                  }
                  return true;
                }).length > 0 ? (
                <div className="space-y-4">
                  {payments
                    .filter(p => p.status === 'Pendente' || p.status === 'Atrasado')
                    .filter(p => {
                      if (p.type === 'Empreiteiro') {
                        const ref = p.reference.toLowerCase();
                        return ref.includes('medição') || ref.includes('medicao') || ref.includes('fatura');
                      }
                      return true;
                    })
                    .sort((a, b) => (a.status === 'Atrasado' ? -1 : 1))
                    .map(payment => (
                      <div key={payment.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:border-purple-100 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${
                            payment.type === 'Colaborador' ? 'bg-blue-100 text-blue-600' : 
                            payment.type === 'Fornecedor' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {payment.type === 'Colaborador' ? <Users size={20} /> : <Building2 size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{payment.recipientName}</h4>
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                payment.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {payment.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              {payment.reference} {payment.workName ? `• ${payment.workName}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900 tracking-tight">
                            R$ {(payment.netValue || payment.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{payment.date}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <DollarSign size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Nenhum pagamento pendente</h3>
                  <p className="text-slate-400 text-sm mt-2">Tudo em dia! Não há débitos aguardando pagamento no momento.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Consolidado</p>
                <p className="text-2xl font-black text-purple-600 tracking-tight">
                  R$ {pendingPaymentsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button 
                onClick={() => setShowPendingModal(false)}
                className="px-8 py-4 bg-[#0b1222] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ ...confirmDelete, show: false })}
        onConfirm={() => {
          confirmDelete.onConfirm();
          setConfirmDelete({ ...confirmDelete, show: false });
        }}
        title={confirmDelete.title}
        message={confirmDelete.message}
      />
    </div>
  );
};

export default Dashboard;
