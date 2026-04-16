
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  Folder, 
  FileText, 
  FileCode, 
  ChevronRight,
  Plus,
  X,
  Save,
  HardHat,
  FileUp,
  FileCheck,
  Trash2,
  Upload,
  Edit2,
  Star,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { TechnicalProject, View, Material } from '../types';
import { extractMaterialsFromProject, extractServicesFromProject } from '../services/geminiService';
import { Loader2, Sparkles, ClipboardList } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc,
  getDocs
} from 'firebase/firestore';

const ProjectMetricCard: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group cursor-pointer h-36">
    <div className="flex justify-between items-start">
      <h3 className="text-slate-600 font-bold text-sm leading-tight w-2/3">{label}</h3>
      <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <span className="text-4xl font-black text-slate-900 tracking-tight">
        {value}
      </span>
    </div>
  </div>
);

const ProjectListCard: React.FC<{ 
  label: string; 
  projects: any[]; 
  icon: React.ReactNode;
  onProjectClick: (project: any) => void;
}> = ({ label, projects, icon, onProjectClick }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-all group h-36 overflow-hidden">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-slate-600 font-bold text-sm leading-tight w-2/3">{label}</h3>
      <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
        {icon}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-none space-y-1">
      {projects.length > 0 ? (
        projects.map((p) => (
          <div 
            key={p.id} 
            onClick={() => onProjectClick(p)}
            className="flex items-center gap-2 group/item cursor-pointer hover:bg-blue-50 p-1.5 rounded-xl transition-all border border-transparent hover:border-blue-100"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-[10px] font-black text-slate-700 truncate group-hover/item:text-blue-600 uppercase tracking-tight">
              {p.name}
            </span>
          </div>
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center opacity-40">
          <Download size={20} className="mb-1" />
          <p className="text-[8px] font-bold uppercase tracking-widest">Nenhum download</p>
        </div>
      )}
    </div>
  </div>
);

const LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEjRUQCeZnEJue8_9Hx-MgK6LIqJ2K1WFc9xgLwf_IZQ&s"; // New logo provided by user
const GOLDEN_HELMET_STYLE = { filter: "sepia(0.5) saturate(2) brightness(1.1)" }; // Adjusted filter

const Projetos: React.FC<{ onNavigate?: (view: View) => void }> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [workFilter, setWorkFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string; type: 'single' | 'all' }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'single'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load works to map clients
  const [works, setWorks] = useState<any[]>([]);
  const [projects, setProjects] = useState<(TechnicalProject & { version?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('uploadDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (TechnicalProject & { version?: string })[];
      setProjects(projs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    const qWorks = query(collection(db, 'works'), orderBy('name', 'asc'));
    const unsubscribeWorks = onSnapshot(qWorks, (snapshot) => {
      const wks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorks(wks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'works');
    });

    return () => {
      unsubscribe();
      unsubscribeWorks();
    };
  }, []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState<string | null>(null);
  const [showServicesModal, setShowServicesModal] = useState<{projId: string, services: any[]} | null>(null);
  const [evaluatingProject, setEvaluatingProject] = useState<TechnicalProject | null>(null);
  const [evaluationData, setEvaluationData] = useState({ rating: 0, comment: '' });
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  useEffect(() => {
    // For now, let's just use a simple 'isDownloaded' flag in the project document
    // or a separate collection 'user_downloads' if we want it per-user.
    // Given the context, a field in the project document is easiest for sync.
    const downloaded = projects.filter(p => (p as any).isDownloaded).map(p => p.id);
    setDownloadedIds(downloaded);
  }, [projects]);

  const downloadedProjects = useMemo(() => {
    return projects.filter(p => downloadedIds.includes(p.id));
  }, [projects, downloadedIds]);

  const handleDownload = async (proj: TechnicalProject) => {
    try {
      const projRef = doc(db, 'projects', proj.id);
      await updateDoc(projRef, {
        isDownloaded: true
      });
      alert(`Iniciando download de: ${proj.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${proj.id}`);
    }
  };

  const handleEvaluate = (proj: TechnicalProject) => {
    setEvaluatingProject(proj);
    // Evaluations are stored in the project document itself or a separate collection
    // For simplicity, let's assume they are in the project document
    if (proj.evaluation) {
      setEvaluationData(proj.evaluation);
    } else {
      setEvaluationData({ rating: 0, comment: '' });
    }
  };

  const saveEvaluation = async () => {
    if (!evaluatingProject) return;
    try {
      const projRef = doc(db, 'projects', evaluatingProject.id);
      await updateDoc(projRef, {
        evaluation: evaluationData
      });
      setEvaluatingProject(null);
      alert("Avaliação salva com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${evaluatingProject.id}`);
    }
  };

  const handleExtractMaterials = async (proj: TechnicalProject) => {
    setIsExtracting(proj.id);
    try {
      // Extract both materials and services
      const [suggestedMaterials, suggestedServices] = await Promise.all([
        extractMaterialsFromProject(proj.name, proj.type),
        extractServicesFromProject(proj.name, proj.type)
      ]);
      
      if (suggestedMaterials && suggestedMaterials.length > 0) {
        for (const m of suggestedMaterials) {
          const materialToAdd: Material = {
            ...m,
            id: '', // Firestore will generate ID
            workId: proj.id, // Linking to project/work
            workName: proj.workName,
            lastRestock: new Date().toLocaleDateString('pt-BR')
          };
          await addDoc(collection(db, 'materials'), materialToAdd);
        }
      }

      if (suggestedServices && suggestedServices.length > 0) {
        const projRef = doc(db, 'projects', proj.id);
        await updateDoc(projRef, {
          extractedServices: suggestedServices
        });
        
        setShowServicesModal({ projId: proj.id, services: suggestedServices });
      }

      alert(`Análise concluída! ${suggestedMaterials?.length || 0} materiais e ${suggestedServices?.length || 0} serviços foram identificados.`);
    } catch (error) {
      console.error("Erro ao extrair dados via IA:", error);
      alert("Erro ao processar extração via IA.");
    } finally {
      setIsExtracting(null);
    }
  };

  const openServices = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (proj && (proj as any).extractedServices) {
      setShowServicesModal({ projId, services: (proj as any).extractedServices });
    } else {
      alert("Nenhum serviço extraído para este projeto ainda. Use o botão de IA para analisar.");
    }
  };

  // New project form state
  const [formData, setFormData] = useState<Partial<TechnicalProject & { version?: string }>>({
    name: '',
    workName: '',
    type: 'PDF',
    author: 'Administrador',
    version: 'v1.0'
  });

  // Automatically calculate metrics from data
  const metrics = useMemo(() => {
    return {
      total: projects.length,
      dwg: projects.filter(p => p.type === 'DWG').length,
      pdf: projects.filter(p => p.type === 'PDF').length,
      works: new Set(projects.map(p => p.workName)).size
    };
  }, [projects]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.workName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWork = workFilter === 'all' || p.workName === workFilter;
    
    // Filter by client if active
    let matchesClient = true;
    if (clientFilter) {
      const work = works.find(w => w.name === p.workName);
      matchesClient = work?.owner === clientFilter;
    }

    return matchesSearch && matchesWork && matchesClient;
  });

  const uniqueWorks = Array.from(new Set(projects.map(p => p.workName)));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const extension = file.name.split('.').pop()?.toUpperCase();
      if (extension === 'DWG' || extension === 'PDF') {
        setFormData(prev => ({ ...prev, type: extension as 'DWG' | 'PDF' }));
      }
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name.split('.')[0] }));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.workName) {
      alert("Preencha o nome do projeto e a obra correspondente.");
      return;
    }
    if (!selectedFile) {
      alert("Por favor, selecione um arquivo (PDF ou DWG).");
      return;
    }

    try {
      const newProjectData = {
        name: formData.name || 'Sem nome',
        workName: formData.workName || 'Obra não definida',
        type: formData.type as 'DWG' | 'PDF',
        uploadDate: new Date().toLocaleDateString('pt-BR'),
        size: formatFileSize(selectedFile.size),
        author: formData.author || auth.currentUser?.displayName || 'Administrador',
        version: formData.version || 'v1.0',
        uid: auth.currentUser?.uid || 'system'
      };

      await addDoc(collection(db, 'projects'), newProjectData);
      setIsAdding(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const handleDeleteProject = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name, type: 'single' });
  };

  const executeDelete = async () => {
    try {
      if (confirmDelete.type === 'all') {
        const snapshot = await getDocs(collection(db, 'projects'));
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'projects', d.id)));
        await Promise.all(deletePromises);
      } else {
        await deleteDoc(doc(db, 'projects', confirmDelete.id));
      }
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${confirmDelete.id}`);
    }
  };

  const handleClearAll = () => {
    setConfirmDelete({
      isOpen: true,
      id: 'all',
      name: 'TODOS os projetos',
      type: 'all'
    });
  };

  const resetForm = () => {
    setFormData({ name: '', workName: '', type: 'PDF', author: 'Administrador', version: 'v1.0' });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-amber-500/20 border-2 border-white flex-shrink-0 bg-amber-500 flex items-center justify-center">
            <img 
              src={LOGO_URL} 
              alt="Logo Perfil" 
              className="w-full h-full object-contain"
              style={GOLDEN_HELMET_STYLE}
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Projetos</h1>
            <p className="text-slate-500 mt-2 font-medium">Upload e download de projetos técnicos das obras</p>
          </div>
        </div>
        <div className="flex gap-4">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.MATERIAIS)}
              className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              Materiais
            </button>
          )}
          <button 
            onClick={handleClearAll}
            className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            title="Apagar todos os projetos"
          >
            <Trash2 size={20} />
            Limpar Tudo
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Upload size={20} />
            Enviar Projeto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProjectMetricCard 
          label="Total de Projetos" 
          value={metrics.total} 
          icon={<Folder size={20} />} 
        />
        <ProjectListCard 
          label="Projetos Baixados" 
          projects={downloadedProjects} 
          icon={<Download size={20} />}
          onProjectClick={handleEvaluate}
        />
        <ProjectMetricCard 
          label="Arquivos PDF" 
          value={metrics.pdf} 
          icon={<FileText size={20} />} 
        />
        <ProjectMetricCard 
          label="Obras com Projetos" 
          value={metrics.works} 
          icon={<Folder size={20} />} 
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar projetos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-600"
            />
          </div>
          <div className="relative min-w-[240px]">
            <select 
              className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none appearance-none font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
              value={workFilter}
              onChange={(e) => setWorkFilter(e.target.value)}
            >
              <option value="all">Todas as obras</option>
              {uniqueWorks.map(work => (
                <option key={work} value={work}>{work}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
          </div>
          {clientFilter && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 animate-in zoom-in duration-300">
              <span className="text-xs font-black uppercase tracking-widest">Cliente: {clientFilter}</span>
              <button 
                onClick={() => setClientFilter(null)}
                className="p-1 hover:bg-blue-100 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Lista de Projetos</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">{filteredProjects.length} projeto(s) encontrado(s)</p>
          
          <div className="mt-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4">Nome</th>
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4 text-center">Tipo</th>
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4">Obra</th>
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4 text-center">Versão</th>
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4">Data</th>
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4">Tamanho</th>
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4 text-center">Formato</th>
                  <th className="pb-4 text-sm font-bold text-slate-400 px-4 text-center">Sugestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-6 px-4">
                        <span className="font-bold text-slate-800 text-sm">{proj.name}</span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="bg-orange-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight">
                          {proj.name.includes('Estrutura') ? 'Estrutura' : proj.type}
                        </span>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-sm font-bold text-slate-600">{proj.workName}</span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold">
                          {proj.version || 'v1.0'}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-sm font-bold text-slate-600">
                        {proj.uploadDate}
                      </td>
                      <td className="py-6 px-4 text-sm font-bold text-slate-600">
                        {proj.size}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold">
                          {proj.type}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => handleDownload(proj)}
                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                            title="Download do Projeto"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            onClick={() => handleEvaluate(proj)}
                            className="text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition-colors"
                            title="Avaliar Desenho"
                          >
                            <Star size={18} />
                          </button>
                          <button 
                            onClick={() => handleExtractMaterials(proj)}
                            disabled={isExtracting === proj.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              isExtracting === proj.id 
                                ? 'bg-slate-100 text-slate-400' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100'
                            }`}
                            title="IA: Sugerir Materiais e Serviços com base no Projeto"
                          >
                            {isExtracting === proj.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                            {isExtracting === proj.id ? 'Processando...' : 'Analisar Projeto'}
                          </button>
                          <button 
                            onClick={() => openServices(proj.id)}
                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                            title="Ver Lista de Serviços"
                          >
                            <ClipboardList size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProject(proj.id, proj.name)}
                            className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                            title="Excluir Projeto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-24 text-center">
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="flex flex-col items-center mx-auto group"
                      >
                        <div className="bg-slate-50 p-6 rounded-full mb-4 group-hover:bg-blue-50 transition-all duration-300 group-hover:scale-110">
                          <FileUp size={48} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="font-black text-xl text-slate-400 uppercase tracking-tighter group-hover:text-slate-600 transition-colors">Nenhum projeto registrado</p>
                        <p className="text-slate-400 text-sm font-medium mt-2 group-hover:text-blue-500 transition-colors">Clique aqui para enviar o primeiro projeto</p>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Services Modal */}
      {showServicesModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowServicesModal(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-8">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-2xl">
                  <ClipboardList size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Lista de Serviços</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Extraído via IA do Projeto</p>
                </div>
              </div>
              <button 
                onClick={() => setShowServicesModal(null)} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
              {showServicesModal.services.map((service, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{service.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {service.estimatedDays} Dias
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{service.description}</p>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    <HardHat size={14} className="text-amber-500" />
                    Equipe: {service.suggestedTeam}
                  </div>
                </div>
              ))}
              
              {showServicesModal.services.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum serviço encontrado.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowServicesModal(null)}
                className="px-8 py-3 bg-[#0b1222] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
              >
                Fechar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsAdding(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Novo Projeto Técnico</h2>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Gestão de Documentação</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Projeto</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ex: Elétrico Pavimento Superior"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Obra Correspondente</label>
                <input 
                  type="text" 
                  placeholder="Ex: Shopping Alameda"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={formData.workName}
                  onChange={e => setFormData({...formData, workName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo Detectado</label>
                  <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2">
                    {formData.type === 'DWG' ? <FileCode size={16} /> : <FileText size={16} />}
                    {formData.type}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Versão</label>
                  <input 
                    type="text" 
                    placeholder="v1.0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    value={formData.version}
                    onChange={e => setFormData({...formData, version: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".dwg,.pdf"
                />
                {!selectedFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all"
                  >
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <FileUp className="text-blue-500" size={32} />
                    </div>
                    <p className="text-sm font-bold text-blue-800">Clique para anexar o arquivo</p>
                    <p className="text-[10px] text-blue-500 mt-2 uppercase font-bold tracking-widest">Suporta arquivos DWG (AutoCAD) e PDF</p>
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500 p-2.5 rounded-xl text-white">
                        <FileCheck size={24} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-emerald-900 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            </form>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={!selectedFile}
                className={`flex-[2] py-4 text-white text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  selectedFile 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Save size={18} />
                Cadastrar Projeto
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title="Excluir Projeto"
        message={`Tem certeza que deseja excluir o projeto "${confirmDelete.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />

      {/* Evaluation Modal */}
      {evaluatingProject && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setEvaluatingProject(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Star size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Avaliar Desenho</h2>
                  <p className="text-blue-100 text-[10px] font-bold uppercase mt-1 tracking-widest">{evaluatingProject.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEvaluatingProject(null)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Qual sua nota para este desenho?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEvaluationData({ ...evaluationData, rating: star })}
                      className={`p-2 transition-all transform hover:scale-125 ${evaluationData.rating >= star ? 'text-amber-500' : 'text-slate-200'}`}
                    >
                      <Star size={40} fill={evaluationData.rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-500" />
                  Observações Técnicas
                </label>
                <textarea
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 min-h-[120px]"
                  placeholder="Descreva o que pode ser melhorado ou o que está excelente no desenho..."
                  value={evaluationData.comment}
                  onChange={(e) => setEvaluationData({ ...evaluationData, comment: e.target.value })}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                <CheckCircle size={20} className="text-blue-600" />
                <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                  Sua avaliação ajuda a equipe de engenharia a manter o padrão de qualidade Perfil Acabamentos.
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setEvaluatingProject(null)}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveEvaluation}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Salvar Avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projetos;

