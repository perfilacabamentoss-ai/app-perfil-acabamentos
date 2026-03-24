
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  DollarSign, 
  X, 
  Save, 
  Trash2, 
  Briefcase,
  User,
  Building2,
  Camera,
  Coins,
  MapPin,
  TrendingUp,
  CreditCard,
  Pencil,
  Key,
  Share2
} from 'lucide-react';
import { Collaborator } from '../types';
import ConfirmModal from './ConfirmModal';
import { generateCollaboratorToken } from '../utils/token';
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

const Colaboradores: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const collaboratorsCollectionRef = collection(db, 'collaborators');
    const q = query(collaboratorsCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const collaboratorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Collaborator[];
      setCollaborators(collaboratorsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'collaborators');
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
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string; type: 'single' | 'all' }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'single'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workFilter, setWorkFilter] = useState(() => {
    return localStorage.getItem('perfil_collab_work_filter') || 'all';
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [payTypeFilter, setPayTypeFilter] = useState('all');
  const [activeToken, setActiveToken] = useState<{id: string, token: string} | null>(null);

  // Update token every 30s if active
  React.useEffect(() => {
    if (!activeToken) return;
    const interval = setInterval(() => {
      setActiveToken({
        id: activeToken.id,
        token: generateCollaboratorToken(activeToken.id)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeToken]);

  // Save work filter to localStorage
  React.useEffect(() => {
    localStorage.setItem('perfil_collab_work_filter', workFilter);
  }, [workFilter]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Collaborator>>({
    name: '',
    role: '',
    payType: 'Mensal',
    payValue: 0,
    currentWork: workFilter !== 'all' ? workFilter : '',
    photo: '',
    status: 'Ativo',
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role || !formData.currentWork || (formData.payValue ?? 0) <= 0) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      if (editingId) {
        const collaboratorRef = doc(db, 'collaborators', editingId);
        await updateDoc(collaboratorRef, { ...formData });
      } else {
        const newCollab: Collaborator = {
          id: '', // Firestore will generate ID
          name: formData.name!,
          role: formData.role!,
          payType: formData.payType as any,
          payValue: formData.payValue!,
          currentWork: formData.currentWork!,
          photo: formData.photo,
          status: 'Ativo',
          classification: formData.classification as any || 'B',
          startDate: new Date().toLocaleDateString('pt-BR')
        };
        await addDoc(collection(db, 'collaborators'), newCollab);
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', role: '', payType: 'Mensal', payValue: 0, currentWork: '', photo: '', status: 'Ativo', classification: 'B' });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'collaborators');
    }
  };

  const handleEdit = (collab: Collaborator) => {
    setFormData({
      name: collab.name,
      role: collab.role,
      payType: collab.payType,
      payValue: collab.payValue,
      currentWork: collab.currentWork,
      photo: collab.photo,
      status: collab.status,
      classification: collab.classification
    });
    setEditingId(collab.id);
    setIsAdding(true);
  };

  const handleGenerateToken = (collab: Collaborator) => {
    const token = generateCollaboratorToken(collab.id);
    setActiveToken({ id: collab.id, token });
  };

  const handleShareToken = (collab: Collaborator, token: string) => {
    const appUrl = window.location.origin;
    const message = `Olá ${collab.name}, aqui está seu link de acesso exclusivo ao Portal do Colaborador Perfil.\n\nLink: ${appUrl}?role=colaborador\nSeu Token de Acesso (expira em 30s): *${token}*\n\nUse este token para validar seu acesso no círculo central do portal.`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name, type: 'single' });
  };

  const handleClearAll = () => {
    setConfirmDelete({ isOpen: true, id: 'all', name: 'TODOS os colaboradores', type: 'all' });
  };

  const executeDelete = async () => {
    try {
      if (confirmDelete.type === 'all') {
        const batch = writeBatch(db);
        const snapshot = await getDocs(collection(db, 'collaborators'));
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } else {
        await deleteDoc(doc(db, 'collaborators', confirmDelete.id));
      }
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `collaborators/${confirmDelete.id || 'all'}`);
    }
  };

  const uniqueWorks = useMemo(() => {
    const collabWorks = collaborators.map(c => c.currentWork);
    const registeredWorks = works.map(w => w.name);
    return Array.from(new Set([...collabWorks, ...registeredWorks])).filter(Boolean);
  }, [collaborators, works]);

  const filtered = collaborators.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWork = workFilter === 'all' || c.currentWork === workFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPayType = payTypeFilter === 'all' || c.payType === payTypeFilter;
    
    return matchesSearch && matchesWork && matchesStatus && matchesPayType;
  });

  const totalMonthlyCost = useMemo(() => {
    return collaborators.reduce((acc, curr) => {
      let value = 0;
      switch (curr.payType) {
        case 'Diária':
          value = curr.payValue * 22; // 22 dias úteis
          break;
        case 'Semanal':
          value = curr.payValue * 4.33; // Média de semanas no mês
          break;
        case 'Quinzenal':
          value = curr.payValue * 2;
          break;
        case 'Mensal':
        default:
          value = curr.payValue;
      }
      return acc + value;
    }, 0);
  }, [collaborators]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Colaboradores</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão de pessoal, funções e folha de pagamento</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
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
                Novo Colaborador
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EQUIPES TOTAL</p>
            <h3 className="text-3xl font-black text-slate-900">{collaborators.length.toString().padStart(2, '0')}</h3>
          </div>
        </div>
        <div className="bg-[#0b1222] p-6 rounded-3xl shadow-xl flex items-center gap-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <TrendingUp size={100} />
          </div>
          <div className="p-4 bg-blue-600 text-white rounded-2xl relative z-10">
            <CreditCard size={32} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Custo Mensal Estimado</p>
            <h3 className="text-3xl font-black">R$ {totalMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou função..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              value={workFilter}
              onChange={e => setWorkFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">Todas as Obras</option>
              {uniqueWorks.map(work => (
                <option key={work} value={work}>{work}</option>
              ))}
            </select>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Férias">Férias</option>
              <option value="Afastado">Afastado</option>
            </select>
            <select 
              value={payTypeFilter}
              onChange={e => setPayTypeFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">Todos os Pagamentos</option>
              <option value="Semanal">Semanal</option>
              <option value="Quinzenal">Quinzenal</option>
              <option value="Mensal">Mensal</option>
              <option value="Diária">Diária</option>
            </select>
            {(searchTerm || workFilter !== 'all' || statusFilter !== 'all' || payTypeFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setWorkFilter('all');
                  setStatusFilter('all');
                  setPayTypeFilter('all');
                }}
                className="px-4 py-3 text-rose-500 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collaborators Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map(c => (
            <div key={c.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                      {c.photo ? (
                        <img 
                          src={c.photo} 
                          alt={c.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <User size={40} />
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${c.status === 'Ativo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleGenerateToken(c)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Gerar Token de Acesso"
                      >
                        <Key size={18} />
                      </button>
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

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{c.name}</h3>
                  <div className="flex items-center gap-2">
                    <Briefcase size={12} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{c.role}</span>
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
                </div>

                <div className="mt-8 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Building2 size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alocado em</p>
                    <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{c.currentWork}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remuneração {c.payType}</p>
                    <p className="text-xl font-black text-blue-600">
                      R$ {c.payValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {c.status}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-8 rounded-full mb-6">
              <Users size={64} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Sua equipe está vazia</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Comece a cadastrar seus colaboradores para gerenciar funções e pagamentos.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Adicionar Primeiro Colaborador
            </button>
          </div>
        )}
      </div>

      {/* Token Modal */}
      {activeToken && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setActiveToken(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0b1222] text-white text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20">
                <Key size={32} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Token de Acesso</h2>
              <p className="text-blue-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Válido por 30 segundos</p>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="py-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <span className="text-4xl font-black text-slate-900 tracking-[0.2em] tabular-nums">
                  {activeToken.token}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Este token é exclusivo para {collaborators.find(c => c.id === activeToken.id)?.name} e se altera automaticamente.
              </p>
              <button 
                onClick={() => handleShareToken(collaborators.find(c => c.id === activeToken.id)!, activeToken.token)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
              >
                <Share2 size={18} />
                Enviar via WhatsApp
              </button>
              <button 
                onClick={() => setActiveToken(null)}
                className="w-full py-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Form */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => {
            setIsAdding(false);
            setEditingId(null);
            setFormData({ name: '', role: '', payType: 'Mensal', payValue: 0, currentWork: '', photo: '', status: 'Ativo', classification: 'B' });
          }} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-8 border-b bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">
                  {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-[0.2em]">Recursos Humanos</p>
              </div>
              <button onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', role: '', payType: 'Mensal', payValue: 0, currentWork: '', photo: '', status: 'Ativo' });
              }} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-all cursor-pointer relative overflow-hidden group"
                >
                  {formData.photo ? (
                    <>
                      <img 
                        src={formData.photo} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera size={24} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={32} />
                      <span className="text-[9px] font-black uppercase mt-2">Adicionar Foto</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Ex: Roberto Oliveira"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Função / Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ex: Pedreiro, Mestre de Obras..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obra Atual / Inicial</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 appearance-none"
                    value={formData.payType}
                    onChange={e => setFormData({...formData, payType: e.target.value as any})}
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Diária">Diária</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor (R$)</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    <input 
                      type="number" 
                      placeholder="0,00"
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                      value={formData.payValue || ''}
                      onChange={e => setFormData({...formData, payValue: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Classificação / Nível</label>
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status do Colaborador</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 appearance-none"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Afastado">Afastado</option>
                </select>
              </div>

              <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-100 rounded-3xl mt-4">
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed text-center">
                  O cadastro de colaboradores permite o rastreio de custos e a emissão automática da folha de pagamento baseada no cartão de ponto.
                </p>
              </div>
            </form>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-4">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ name: '', role: '', payType: 'Mensal', payValue: 0, currentWork: '', photo: '', status: 'Ativo' });
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
                {editingId ? 'Atualizar Cadastro' : 'Salvar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={confirmDelete.type === 'all' ? "Excluir Tudo" : "Excluir Colaborador"}
        message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default Colaboradores;
