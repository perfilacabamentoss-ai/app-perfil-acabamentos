
import React, { useState, useMemo, useEffect } from 'react';
import { 
  HardHat, 
  Plus, 
  Search, 
  DollarSign, 
  X, 
  Save, 
  Trash2, 
  Briefcase,
  User,
  Calculator,
  ChevronRight,
  Pencil,
  MapPin,
  Clock
} from 'lucide-react';
import { Contractor, View } from '../types';
import ConfirmModal from './ConfirmModal';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../App';

const Empreiteiros: React.FC<{ readOnly?: boolean; onNavigate?: (view: View) => void }> = ({ readOnly, onNavigate }) => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const contractorsCollectionRef = collection(db, 'contractors');
    const q = query(contractorsCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contractorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contractor[];
      setContractors(contractorsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contractors');
      setIsLoading(false);
    });

    const worksUnsubscribe = onSnapshot(collection(db, 'works'), (snapshot) => {
      const worksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorks(worksData);
    });

    return () => {
      unsubscribe();
      worksUnsubscribe();
    };
  }, []);

  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string; type: 'single' | 'all' | 'advance'; advanceId?: string }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'single'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workFilter, setWorkFilter] = useState(() => {
    return localStorage.getItem('perfil_contractor_work_filter') || 'all';
  });

  // Save work filter to localStorage
  React.useEffect(() => {
    localStorage.setItem('perfil_contractor_work_filter', workFilter);
  }, [workFilter]);

  // Form State
  const [formData, setFormData] = useState<Partial<Contractor>>({
    name: '',
    service: '',
    laborCost: 0,
    totalContractValue: 0,
    advances: [],
    status: 'Ativo',
    currentWork: workFilter !== 'all' ? workFilter : '',
    classification: 'B'
  });

  // Update formData when workFilter changes if we are adding a new one
  React.useEffect(() => {
    if (!editingId && isAdding) {
      setFormData(prev => ({
        ...prev,
        currentWork: workFilter !== 'all' ? workFilter : prev.currentWork
      }));
    }
  }, [workFilter, isAdding, editingId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.service || (formData.laborCost ?? 0) <= 0) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      if (editingId) {
        const contractorRef = doc(db, 'contractors', editingId);
        await updateDoc(contractorRef, { ...formData });
      } else {
        const newContractor: Contractor = {
          id: '', // Firestore will generate ID
          name: formData.name!,
          service: formData.service!,
          laborCost: formData.laborCost!,
          totalContractValue: formData.totalContractValue || formData.laborCost!,
          advances: [],
          status: 'Ativo',
          startDate: new Date().toLocaleDateString('pt-BR'),
          currentWork: formData.currentWork!,
          classification: formData.classification as any || 'B'
        };
        await addDoc(collection(db, 'contractors'), newContractor);
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', service: '', laborCost: 0, totalContractValue: 0, advances: [], classification: 'B' });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'contractors');
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setFormData({
      name: contractor.name,
      service: contractor.service,
      laborCost: contractor.laborCost,
      totalContractValue: contractor.totalContractValue || contractor.laborCost,
      advances: contractor.advances || [],
      status: contractor.status,
      currentWork: contractor.currentWork,
      classification: contractor.classification
    });
    setEditingId(contractor.id);
    setIsAdding(true);
  };

  const handleAddAdvance = async (contractorId: string, value: number, description: string) => {
    if (value <= 0) return;
    
    const newAdvance = {
      id: Math.random().toString(36).substr(2, 9),
      value,
      date: new Date().toLocaleDateString('pt-BR'),
      description
    };

    try {
      const contractorRef = doc(db, 'contractors', contractorId);
      const contractor = contractors.find(c => c.id === contractorId);
      if (contractor) {
        await updateDoc(contractorRef, {
          advances: [...(contractor.advances || []), newAdvance]
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `contractors/${contractorId}`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name, type: 'single' });
  };

  const handleClearAll = () => {
    setConfirmDelete({ isOpen: true, id: 'all', name: 'TODOS os empreiteiros', type: 'all' });
  };

  const handleDeleteAdvance = (contractorId: string, advanceId: string, contractorName: string) => {
    setConfirmDelete({ isOpen: true, id: contractorId, name: `o adiantamento de ${contractorName}`, type: 'advance', advanceId });
  };

  const executeDelete = async () => {
    try {
      if (confirmDelete.type === 'all') {
        const batch = writeBatch(db);
        const snapshot = await getDocs(collection(db, 'contractors'));
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } else if (confirmDelete.type === 'advance') {
        const contractorRef = doc(db, 'contractors', confirmDelete.id);
        const contractor = contractors.find(c => c.id === confirmDelete.id);
        if (contractor) {
          await updateDoc(contractorRef, {
            advances: (contractor.advances || []).filter(a => a.id !== confirmDelete.advanceId)
          });
        }
      } else {
        await deleteDoc(doc(db, 'contractors', confirmDelete.id));
      }
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contractors/${confirmDelete.id || 'all'}`);
    }
  };

  const uniqueWorks = useMemo(() => {
    const collabWorks = contractors.map(c => c.currentWork);
    const registeredWorks = works.map(w => w.name);
    return Array.from(new Set([...collabWorks, ...registeredWorks])).filter(Boolean);
  }, [contractors, works]);

  const filteredContractors = contractors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWork = workFilter === 'all' || c.currentWork === workFilter;
    return matchesSearch && matchesWork;
  });

  const totalInvestment = useMemo(() => 
    contractors.reduce((acc, curr) => acc + curr.laborCost, 0), 
    [contractors]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Empreiteiros</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão de mão de obra terceirizada e custos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.PRODUCAO)}
              className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              Empreita/Serviços
            </button>
          )}
          {!readOnly && (
            <>
              <button 
                onClick={handleClearAll}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all border border-rose-100"
              >
                <Trash2 size={20} />
                Limpar Tudo
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
              >
                <Plus size={20} />
                Cadastrar Empreiteiro
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <HardHat size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total de Equipes</p>
            <h3 className="text-3xl font-black text-slate-900">{contractors.length.toString().padStart(2, '0')}</h3>
          </div>
        </div>
        <div className="bg-[#0b1222] p-6 rounded-2xl shadow-xl flex items-center gap-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Calculator size={80} />
          </div>
          <div className="p-4 bg-blue-600 text-white rounded-2xl relative z-10">
            <DollarSign size={32} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Total em Mão de Obra</p>
            <h3 className="text-3xl font-black">R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou serviço..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={workFilter}
            onChange={e => setWorkFilter(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="all">Todas as Obras</option>
            {uniqueWorks.map(work => (
              <option key={work} value={work}>{work}</option>
            ))}
          </select>
          {(searchTerm || workFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setWorkFilter('all');
              }}
              className="px-4 py-3 text-rose-500 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContractors.length > 0 ? (
          filteredContractors.map(c => (
            <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{c.name}</h3>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{c.service}</span>
                    {c.classification && (
                      <span className={`ml-2 px-2 py-0.5 rounded text-[9px] font-black ${
                        c.classification === 'A' ? 'bg-amber-100 text-amber-600' :
                        c.classification === 'B' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        NÍVEL {c.classification}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{c.currentWork}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Geral da Empreitada</p>
                      <p className="text-2xl font-black text-blue-600">R$ {(c.totalContractValue || c.laborCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Início</span>
                      <span className="text-xs font-bold text-slate-700">{c.startDate}</span>
                    </div>
                  </div>

                  {/* Advances Section */}
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} className="text-amber-500" /> Adiantamentos
                      </h4>
                      <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">
                        Total: R$ {(c.advances || []).reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {(c.advances || []).length > 0 ? (
                      <div className="space-y-2">
                        {c.advances.map(advance => (
                          <div key={advance.id} className="flex items-center justify-between text-[10px] font-bold text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                            <div className="flex flex-col">
                              <span>{advance.date}</span>
                              {advance.description && <span className="text-[8px] text-slate-400 uppercase">{advance.description}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-rose-500">R$ {advance.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              {!readOnly && (
                                <button onClick={() => handleDeleteAdvance(c.id, advance.id, c.name)} className="text-slate-300 hover:text-rose-500">
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9px] text-slate-400 font-medium italic">Nenhum adiantamento registrado.</p>
                    )}

                    {!readOnly && (
                      <button 
                        onClick={() => {
                          const val = prompt("Valor do adiantamento:");
                          const desc = prompt("Descrição (opcional):");
                          if (val) handleAddAdvance(c.id, Number(val), desc || '');
                        }}
                        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all"
                      >
                        + Novo Adiantamento
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <HardHat size={64} className="text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Nenhum empreiteiro registrado</h2>
            <p className="text-slate-400 text-sm mt-1">Clique no botão superior para cadastrar sua mão de obra.</p>
          </div>
        )}
      </div>

      {/* Cadastro Drawer */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => {
            setIsAdding(false);
            setEditingId(null);
            setFormData({ name: '', service: '', laborCost: 0, classification: 'B' });
          }} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-8 border-b bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {editingId ? 'Editar Contrato' : 'Novo Contrato'}
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Cadastro de Empreiteiro</p>
              </div>
              <button onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', service: '', laborCost: 0 });
              }} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nome do Empreiteiro / Equipe</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Ex: Marmoraria Central"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Serviço a ser Executado</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ex: Instalação de Rodapés"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    value={formData.service}
                    onChange={e => setFormData({...formData, service: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Obra Atual / Inicial</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 appearance-none"
                    value={formData.currentWork}
                    onChange={e => setFormData({...formData, currentWork: e.target.value})}
                  >
                    <option value="">Selecione uma obra...</option>
                    {uniqueWorks.map(work => (
                      <option key={work} value={work}>{work}</option>
                    ))}
                    <option value="Outra">Outra (Não listada)</option>
                  </select>
                </div>
                {formData.currentWork === 'Outra' && (
                  <input 
                    type="text" 
                    placeholder="Digite o nome da obra..."
                    className="w-full mt-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    onChange={e => setFormData({...formData, currentWork: e.target.value})}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Classificação / Nível</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({...formData, classification: level as any})}
                      className={`flex-1 py-3 rounded-xl font-black text-xs transition-all border-2 ${
                        formData.classification === level 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-blue-200'
                      }`}
                    >
                      NÍVEL {level}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 font-medium mt-1">
                  A: Alta Experiência | B: Intermediário | C: Iniciante
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Valor Geral da Empreitada (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  <input 
                    type="number" 
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-slate-800 focus:ring-2 focus:ring-blue-500"
                    value={formData.totalContractValue || formData.laborCost || ''}
                    onChange={e => setFormData({...formData, totalContractValue: Number(e.target.value), laborCost: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-100 rounded-3xl text-center">
                <Calculator size={32} className="mx-auto text-blue-400 mb-2" />
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                  Os valores cadastrados serão somados automaticamente no dashboard financeiro do administrador.
                </p>
              </div>
            </form>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-4">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ name: '', service: '', laborCost: 0 });
                }} 
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingId ? 'Atualizar Contrato' : 'Salvar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={confirmDelete.type === 'all' ? "Excluir Tudo" : confirmDelete.type === 'advance' ? "Excluir Adiantamento" : "Excluir Empreiteiro"}
        message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default Empreiteiros;
