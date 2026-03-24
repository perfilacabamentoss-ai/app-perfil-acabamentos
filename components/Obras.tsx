
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, MoreVertical, Download, Filter, 
  ChevronLeft, LayoutGrid, CheckCircle2, CircleDashed, 
  Clock, AlertTriangle, Truck, Mail, Phone, ExternalLink,
  MapPin, Hash, Users, Camera, X, Save, Image as ImageIcon,
  Building2, Share2, Trash2, Pencil
} from 'lucide-react';
import { Project, ProjectStage, ProjectPriority, Supplier, Collaborator, View } from '../types';
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
  getDocs
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../App';

const Obras: React.FC<{ readOnly?: boolean; onNavigate?: (view: View) => void }> = ({ readOnly, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string; type: 'work' | 'media'; index?: number }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'work'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  
  const [works, setWorks] = useState<Project[]>([]);
  const [allCollaborators, setAllCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const worksCollectionRef = collection(db, 'works');
    const q = query(worksCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const worksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setWorks(worksData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'works');
      setIsLoading(false);
    });

    const collabUnsubscribe = onSnapshot(collection(db, 'collaborators'), (snapshot) => {
      const collabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Collaborator[];
      setAllCollaborators(collabs);
    });

    return () => {
      unsubscribe();
      collabUnsubscribe();
    };
  }, []);

  // Available collaborators for the form
  const availableCollaborators = allCollaborators.length > 0 
    ? allCollaborators.map(c => c.name)
    : ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza'];

  // Form State
  const [newWork, setNewWork] = useState<Partial<Project>>({
    name: '',
    registrationNumber: '',
    address: '',
    owner: '',
    projectAuthor: '',
    technicalResponsible: '',
    responsible: 'Administrador',
    status: 'Em andamento',
    priority: 'Média',
    collaborators: [],
    photos: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const photoPromises = Array.from(files).map(async (file: File) => {
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      const newPhotos = await Promise.all(photoPromises);
      setNewWork(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos]
      }));
    }
  };

  const handleDetailPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && selectedWorkId) {
      const photoPromises = Array.from(files).map(async (file: File) => {
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      const newPhotos = await Promise.all(photoPromises);
      setWorks(prev => prev.map(w => 
        w.id === selectedWorkId 
          ? { ...w, photos: [...(w.photos || []), ...newPhotos] }
          : w
      ));
    }
  };

  const removePhoto = (index: number) => {
    setNewWork(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index)
    }));
  };

  const toggleCollaborator = (name: string) => {
    setNewWork(prev => {
      const current = prev.collaborators || [];
      if (current.includes(name)) {
        return { ...prev, collaborators: current.filter(c => c !== name) };
      }
      return { ...prev, collaborators: [...current, name] };
    });
  };

  const handleSave = async () => {
    if (!newWork.name || !newWork.registrationNumber) {
      alert("Por favor, preencha o nome da obra e o número de matrícula.");
      return;
    }

    try {
      if (editingWorkId) {
        const workRef = doc(db, 'works', editingWorkId);
        await updateDoc(workRef, { ...newWork });
      } else {
        const workToAdd: Project = {
          ...newWork as Project,
          id: '', // Firestore will generate ID
          progress: 0,
          startDate: new Date().toLocaleDateString('pt-BR'),
          stages: [],
          suppliers: [],
          photos: newWork.photos || []
        };
        await addDoc(collection(db, 'works'), workToAdd);
      }

      setIsCreating(false);
      setEditingWorkId(null);
      setNewWork({
        name: '',
        registrationNumber: '',
        address: '',
        owner: '',
        projectAuthor: '',
        technicalResponsible: '',
        responsible: 'Administrador',
        status: 'Em andamento',
        priority: 'Média',
        collaborators: [],
        photos: []
      });
    } catch (error) {
      handleFirestoreError(error, editingWorkId ? OperationType.UPDATE : OperationType.CREATE, 'works');
    }
  };

  const handleDeleteWork = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name, type: 'work' });
  };

  const handleDeleteMedia = (index: number) => {
    setConfirmDelete({ isOpen: true, id: '', name: 'esta mídia', type: 'media', index });
  };

  const executeDeleteWork = async () => {
    const { id, type, index } = confirmDelete;
    try {
      if (type === 'work') {
        await deleteDoc(doc(db, 'works', id));
        setSelectedWorkId(null);
      } else if (type === 'media' && index !== undefined && selectedWorkId) {
        const workRef = doc(db, 'works', selectedWorkId);
        const currentWork = works.find(w => w.id === selectedWorkId);
        if (currentWork && currentWork.photos) {
          const updatedPhotos = currentWork.photos.filter((_, i) => i !== index);
          await updateDoc(workRef, { photos: updatedPhotos });
        }
      }
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `works/${id || selectedWorkId}`);
    }
  };

  const handleEditWork = (work: Project) => {
    setNewWork({
      name: work.name,
      registrationNumber: work.registrationNumber,
      address: work.address,
      owner: work.owner,
      projectAuthor: work.projectAuthor,
      technicalResponsible: work.technicalResponsible,
      responsible: work.responsible,
      status: work.status,
      priority: work.priority,
      collaborators: work.collaborators,
      photos: work.photos
    });
    setEditingWorkId(work.id);
    setIsCreating(true);
  };

  const handleShare = (work: Project) => {
    const shareUrl = `${window.location.origin}/?work=${work.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Link da obra "${work.name}" copiado para a área de transferência!`);
    });
  };

  const selectedWork = works.find(w => w.id === selectedWorkId);

  // Dynamic allocated team based on collaborators registered for this work
  const allocatedTeam = React.useMemo(() => {
    if (!selectedWork) return [];
    let team = allCollaborators.filter(c => c.currentWork === selectedWork.name);
    if (teamSearchTerm) {
      team = team.filter(c => 
        c.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
        c.role.toLowerCase().includes(teamSearchTerm.toLowerCase())
      );
    }
    return team;
  }, [selectedWork, allCollaborators, teamSearchTerm]);

  const filteredWorks = works.filter(w => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      w.name.toLowerCase().includes(searchLower) || 
      w.responsible.toLowerCase().includes(searchLower) ||
      w.registrationNumber.toLowerCase().includes(searchLower) ||
      (w.address && w.address.toLowerCase().includes(searchLower)) ||
      (w.owner && w.owner.toLowerCase().includes(searchLower)) ||
      (w.projectAuthor && w.projectAuthor.toLowerCase().includes(searchLower)) ||
      (w.technicalResponsible && w.technicalResponsible.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    
    // Date filtering logic
    let matchesDate = true;
    if (startDateFilter || endDateFilter) {
      // Convert DD/MM/YYYY to Date object
      const [day, month, year] = w.startDate.split('/').map(Number);
      const workDate = new Date(year, month - 1, day);
      
      if (startDateFilter) {
        const start = new Date(startDateFilter);
        if (workDate < start) matchesDate = false;
      }
      
      if (endDateFilter) {
        const end = new Date(endDateFilter);
        if (workDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (selectedWorkId && selectedWork) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedWorkId(null)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{selectedWork.name}</h1>
              <div className="mt-1 space-y-1">
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <Hash size={14} /> {selectedWork.registrationNumber} • <MapPin size={14} /> {selectedWork.address}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {selectedWork.owner && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Proprietário: <span className="text-slate-600">{selectedWork.owner}</span>
                    </p>
                  )}
                  {selectedWork.projectAuthor && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Autor: <span className="text-slate-600">{selectedWork.projectAuthor}</span>
                    </p>
                  )}
                  {selectedWork.technicalResponsible && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Resp. Técnico: <span className="text-slate-600">{selectedWork.technicalResponsible}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleShare(selectedWork)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              <Share2 size={18} />
              Compartilhar
            </button>
            {!readOnly && (
              <button 
                onClick={() => {
                  if (selectedWorkId) {
                    handleDeleteWork(selectedWorkId, selectedWork.name);
                  } else {
                    alert("Erro: ID da obra não encontrado.");
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-100 rounded-lg text-rose-500 font-bold text-sm hover:bg-rose-50 transition-all shadow-sm"
              >
                <Trash2 size={18} />
                Excluir
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ImageIcon size={18} className="text-blue-600" />
                    Registros do Dia a Dia
                  </h3>
                  {!readOnly && (
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*"
                        className="hidden" 
                        ref={detailFileInputRef}
                        onChange={handleDetailPhotoUpload}
                      />
                      <button 
                        onClick={() => detailFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                      >
                        <Plus size={14} />
                        Adicionar Mídia
                      </button>
                    </div>
                  )}
               </div>
               <div className="p-6">
                 {selectedWork.photos && selectedWork.photos.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {selectedWork.photos.map((photo, i) => (
                       <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group/photo">
                         <img 
                           src={photo} 
                           alt="Obra" 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer"
                         />
                         <button 
                           onClick={() => handleDeleteMedia(i)}
                           className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-lg"
                         >
                           <X size={14} />
                         </button>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                     <Camera size={48} className="mb-4 text-slate-100" />
                     <p className="italic">Nenhuma foto registrada nesta obra.</p>
                   </div>
                 )}
               </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={18} className="text-rose-500" />
                  Localização da Obra
                </h3>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWork.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  Abrir no Maps <ExternalLink size={12} />
                </a>
              </div>
              <div className="aspect-video w-full bg-slate-100">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedWork.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                  title="Mapa da Obra"
                ></iframe>
              </div>
              <div className="p-4 bg-white border-t border-slate-50">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  {selectedWork.address}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Cronograma</h3>
              </div>
              <div className="p-6 text-center text-slate-500 italic">
                Aguardando definição de etapas para o cronograma.
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Equipe Alocada
                </h3>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                  {allocatedTeam.length} Membros
                </span>
              </div>

              {/* Team Search Filter */}
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar equipe..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  value={teamSearchTerm}
                  onChange={e => setTeamSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {allocatedTeam.map((collab) => (
                  <div key={collab.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      {collab.photo ? (
                        <img 
                          src={collab.photo} 
                          alt={collab.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        collab.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{collab.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{collab.role}</p>
                        {collab.startDate && (
                          <>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest" title="Data de Registro">
                              Desde {collab.startDate}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${collab.status === 'Ativo' ? 'bg-emerald-500' : 'bg-amber-500'}`} title={collab.status}></div>
                  </div>
                ))}
                {allocatedTeam.length === 0 && (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Users size={32} className="mb-2 opacity-20" />
                    <p className="text-xs italic">Nenhum colaborador encontrado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
          onConfirm={executeDeleteWork}
          title={confirmDelete.type === 'media' ? "Excluir Mídia" : "Excluir Obra"}
          message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Obras</h1>
          <p className="text-slate-500 mt-1">Gerencie todos os seus projetos de construção</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.PROJETOS)}
              className="px-6 py-2.5 border-2 border-rose-500 text-rose-500 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              Projetos
            </button>
          )}
          {!readOnly && (
            <>
              <button 
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
              >
                <Plus size={20} />
                Nova Obra
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-sm"
              />
            </div>
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showAdvancedSearch ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <Filter size={16} />
              Busca Avançada
            </button>
          </div>

          {showAdvancedSearch && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top duration-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                >
                  <option value="all">Todos os Status</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Parado">Parado</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Início (De)</label>
                <input 
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Início (Até)</label>
                <input 
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Obra / Matrícula</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Localização</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Progresso</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredWorks.length > 0 ? (
                filteredWorks.map((obra) => (
                  <tr key={obra.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => setSelectedWorkId(obra.id)}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{obra.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{obra.registrationNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {obra.address}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">{obra.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[100px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{obra.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              obra.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${obra.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(obra);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Compartilhar"
                        >
                          <Share2 size={18} />
                        </button>
                        {!readOnly && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditWork(obra);
                              }}
                              className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                              title="Editar Obra"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWork(obra.id, obra.name);
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Excluir Obra"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <Building2 size={64} className="mb-4 text-slate-400" />
                      <p className="font-bold text-slate-500 uppercase tracking-widest text-sm">Nenhuma obra cadastrada</p>
                      <p className="text-xs text-slate-400 mt-1">Os dados aparecerão aqui após o cadastro manual.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => {
            setIsCreating(false);
            setEditingWorkId(null);
          }} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white">
              <h2 className="text-xl font-bold">{editingWorkId ? 'Editar Obra' : 'Nova Obra'}</h2>
              <button onClick={() => {
                setIsCreating(false);
                setEditingWorkId(null);
              }} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome da Obra</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-900 dark:text-slate-100" value={newWork.name} onChange={e => setNewWork({...newWork, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Matrícula</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-900 dark:text-slate-100" value={newWork.registrationNumber} onChange={e => setNewWork({...newWork, registrationNumber: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-900 dark:text-slate-100" value={newWork.address} onChange={e => setNewWork({...newWork, address: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Proprietário</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-900 dark:text-slate-100" value={newWork.owner} onChange={e => setNewWork({...newWork, owner: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Autor do Projeto</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-900 dark:text-slate-100" value={newWork.projectAuthor} onChange={e => setNewWork({...newWork, projectAuthor: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Responsável Técnico</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-900 dark:text-slate-100" value={newWork.technicalResponsible} onChange={e => setNewWork({...newWork, technicalResponsible: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3">
              <button onClick={() => {
                setIsCreating(false);
                setEditingWorkId(null);
              }} className="flex-1 py-3 text-sm font-bold text-slate-500">Cancelar</button>
              <button onClick={handleSave} className="flex-[2] py-3 bg-blue-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> {editingWorkId ? 'Atualizar Obra' : 'Salvar Obra'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDeleteWork}
        title={confirmDelete.type === 'media' ? "Excluir Mídia" : "Excluir Obra"}
        message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default Obras;
