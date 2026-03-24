
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  X, 
  Save, 
  Layers, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Download, 
  Trash2, 
  Building2,
  HardHat,
  ChevronRight,
  Clock,
  FileUp,
  ChevronLeft,
  Maximize2,
  Camera,
  Sparkles
} from 'lucide-react';
import { ProjectStage, StageMedia, View } from '../types';

const Etapas: React.FC<{ readOnly?: boolean; onNavigate?: (view: View) => void }> = ({ readOnly, onNavigate }) => {
  const [stages, setStages] = useState<ProjectStage[]>(() => {
    const saved = localStorage.getItem('perfil_stages');
    let initialStages: ProjectStage[] = saved ? JSON.parse(saved) : [];
    
    // Adiciona as etapas solicitadas se não existirem
    const stagesToAdd = [
      { name: "Escavação (valas/sapatas/infra)", order: 1 },
      { name: "Confecção de concreto térreo", order: 2 },
      { name: "Assentamento de Tijolos simples/dobrado", order: 3 },
      { name: "Assentamento de portais", order: 4 },
      { name: "Assentamento de caixinha de tomadas", order: 5 },
      { name: "Chapisco", order: 6 },
      { name: "Reboco", order: 7 },
      { name: "Requádrações (porta/janelas/vigas)", order: 8 },
      { name: "Confecção de contra piso", order: 9 },
      { name: "Assentamento de revestimentos (parede/piso)", order: 10 }
    ];

    stagesToAdd.forEach((sToAdd, index) => {
      if (!initialStages.some(s => s.name === sToAdd.name)) {
        const newStage: ProjectStage = {
          id: `s-default-${Math.random().toString(36).substr(2, 9)}`,
          name: sToAdd.name,
          workId: 'Geral',
          status: 'Pendente',
          progress: 0,
          media: [],
          order: sToAdd.order || (Date.now() + index)
        };
        initialStages = [...initialStages, newStage];
      }
    });
    
    return initialStages;
  });

  const [works] = useState<any[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever stages change
  React.useEffect(() => {
    localStorage.setItem('perfil_stages', JSON.stringify(stages));
  }, [stages]);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState('Geral');
  const [selectedMedia, setSelectedMedia] = useState<{ items: StageMedia[], index: number } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    workId: 'Geral',
    status: 'Em andamento' as 'Pendente' | 'Em andamento' | 'Concluído',
    media: [] as StageMedia[]
  });

  const [aiSuggestions, setAiSuggestions] = useState<any[]>(() => {
    const saved = localStorage.getItem('perfil_stages_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSelectAiSuggestion = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      media: [
        {
          id: `m${Math.random()}`,
          type: 'image',
          url: 'https://picsum.photos/seed/projeto/200/200',
          name: `Referência: ${suggestion.projectId || 'Projeto'}`,
          timestamp: new Date().toLocaleString('pt-BR'),
          size: '0.1 MB'
        }
      ]
    }));
  };

  // Auto-fill first suggestion when drawer opens and form is empty
  React.useEffect(() => {
    if (isAdding && formData.name === '' && aiSuggestions.length > 0) {
      handleSelectAiSuggestion(aiSuggestions[aiSuggestions.length - 1]);
    }
    
    // Also pre-fill the work if there's only one available
    if (isAdding && formData.workId === 'Geral' && uniqueWorks.length === 1) {
      setFormData(prev => ({ ...prev, workId: uniqueWorks[0].id }));
    }
  }, [isAdding]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const createMediaInputRef = useRef<HTMLInputElement>(null);
  const createCameraInputRef = useRef<HTMLInputElement>(null);
  const [activeStageForUpload, setActiveStageForUpload] = useState<string | null>(null);

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newStage: ProjectStage = {
      id: `s${Date.now()}`,
      name: formData.name,
      workId: formData.workId || 'Geral',
      status: formData.status,
      progress: formData.status === 'Concluído' ? 100 : formData.status === 'Pendente' ? 0 : 50,
      media: formData.media,
      order: Date.now()
    };

    setStages([newStage, ...stages]);
    setIsAdding(false);
    setFormData({ name: '', workId: 'Geral', status: 'Em andamento', media: [] });
  };

  const handleCreateMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const mediaPromises = Array.from(files).map(async (file: File) => {
        const isVideo = file.type.startsWith('video');
        let url = '';
        
        if (isVideo) {
          url = URL.createObjectURL(file); // Videos are still blob for now due to size
        } else {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        return {
          id: `m${Math.random()}`,
          type: isVideo ? 'video' : 'image' as 'video' | 'image',
          url,
          name: file.name,
          timestamp: new Date().toLocaleString('pt-BR'),
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        };
      });

      const newMedia = await Promise.all(mediaPromises);

      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...newMedia]
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && activeStageForUpload) {
      const mediaPromises = Array.from(files).map(async (file: File) => {
        const isVideo = file.type.startsWith('video');
        let url = '';
        
        if (isVideo) {
          url = URL.createObjectURL(file);
        } else {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        return {
          id: `m${Math.random()}`,
          type: isVideo ? 'video' : 'image' as 'video' | 'image',
          url,
          name: file.name,
          timestamp: new Date().toLocaleString('pt-BR'),
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        };
      });

      const newMedia = await Promise.all(mediaPromises);

      setStages(prev => prev.map(s => 
        s.id === activeStageForUpload ? { ...s, media: [...s.media, ...newMedia] } : s
      ));
      
      setActiveStageForUpload(null);
    }
  };

  const deleteMedia = (stageId: string, mediaId: string) => {
    setStages(prev => prev.map(s => 
      s.id === stageId ? { ...s, media: s.media.filter(m => m.id !== mediaId) } : s
    ));
  };

  const openGallery = (items: StageMedia[], index: number) => {
    setSelectedMedia({ items, index });
  };

  const nextMedia = () => {
    if (!selectedMedia) return;
    setSelectedMedia({
      ...selectedMedia,
      index: (selectedMedia.index + 1) % selectedMedia.items.length
    });
  };

  const prevMedia = () => {
    if (!selectedMedia) return;
    setSelectedMedia({
      ...selectedMedia,
      index: (selectedMedia.index - 1 + selectedMedia.items.length) % selectedMedia.items.length
    });
  };

  const uniqueWorks = useMemo(() => {
    const worksList = [...works];
    
    // Add "Geral" if it's not there
    if (!worksList.some(w => w.id === 'Geral')) {
      worksList.push({ id: 'Geral', name: 'Geral' });
    }

    // Add any workIds from stages that aren't in the works list
    stages.forEach(s => {
      if (s.workId && !worksList.some(w => w.id === s.workId)) {
        worksList.push({ id: s.workId, name: s.workId });
      }
    });

    return worksList;
  }, [stages, works]);

  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [stages]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Etapas</h1>
          <p className="text-slate-500 mt-2 font-medium">Gerenciamento visual do progresso das obras</p>
        </div>
        <div className="flex gap-4">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.MEDICOES)}
              className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              Medições
            </button>
          )}
          {!readOnly && (
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} />
              Nova Etapa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedStages.length > 0 ? (
          sortedStages.map((stage) => (
            <div key={stage.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`p-3 rounded-2xl ${
                      stage.status === 'Concluído' ? 'bg-emerald-100 text-emerald-600' : 
                      stage.status === 'Pendente' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Layers size={24} />
                    </div>
                    {stage.order && (
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                        {stage.order.toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none">{stage.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Building2 size={12} /> {works.find(w => w.id === stage.workId)?.name || stage.workId}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        stage.status === 'Concluído' ? 'text-emerald-500' : 
                        stage.status === 'Pendente' ? 'text-slate-400' : 'text-blue-500'
                      }`}>
                        {stage.status}
                      </span>
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setActiveStageForUpload(stage.id);
                        cameraInputRef.current?.click();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-emerald-100 transition-colors"
                    >
                      <Camera size={16} />
                      Câmera
                    </button>
                    <button 
                      onClick={() => {
                        setActiveStageForUpload(stage.id);
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-blue-100 transition-colors"
                    >
                      <FileUp size={16} />
                      Adicionar Mídia
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/50">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {stage.media.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="group relative bg-white p-2 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer"
                      onClick={() => openGallery(stage.media, index)}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative">
                        {item.type === 'image' ? (
                          <img 
                            src={item.url} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-500 bg-blue-50">
                            <VideoIcon size={32} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openGallery(stage.media, index);
                            }}
                            className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            <Maximize2 size={16} />
                          </button>
                          <a 
                            href={item.url} 
                            download={item.name}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white text-slate-900 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            <Download size={16} />
                          </a>
                          {!readOnly && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMedia(stage.id, item.id);
                              }}
                              className="p-2 bg-white text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 px-1">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{item.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.size}</p>
                      </div>
                    </div>
                  ))}
                  
                  {!readOnly && stage.media.length === 0 && (
                    <div 
                      onClick={() => {
                        setActiveStageForUpload(stage.id);
                        fileInputRef.current?.click();
                      }}
                      className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-300 cursor-pointer transition-all"
                    >
                      <Plus size={32} />
                      <span className="text-[10px] font-black uppercase mt-2">Upload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white py-24 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center px-6">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Layers size={64} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sem etapas cadastradas</h2>
            <p className="text-slate-400 max-w-xs mt-2 text-sm font-medium">Adicione as etapas da sua obra para começar a armazenar fotos e vídeos de acompanhamento.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 transition-transform"
            >
              Criar Primeira Etapa
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        multiple 
        accept="image/*,video/*"
        onChange={handleFileUpload}
      />
      <input 
        type="file" 
        className="hidden" 
        ref={cameraInputRef} 
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
      />

      {/* Drawer for adding stages */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-8 border-b border-slate-100 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">Nova Etapa Técnica</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Acompanhamento de Obra</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="flex-1 p-8 space-y-6 overflow-y-auto">
              {aiSuggestions.length > 0 && (
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-blue-600" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sugestões da IA (Análise de Projeto)</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.slice(-5).reverse().map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectAiSuggestion(suggestion)}
                        className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all"
                      >
                        {suggestion.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Clique para preencher automaticamente</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Obra Correspondente</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                    value={formData.workId}
                    onChange={e => setFormData({...formData, workId: e.target.value})}
                  >
                    {uniqueWorks.map(work => (
                      <option key={work.id} value={work.id}>{work.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome da Etapa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Fundação, Alvenaria, Pintura..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Inicial</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mídias da Etapa</label>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => createCameraInputRef.current?.click()}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-700 transition-colors"
                    >
                      <Camera size={14} /> Câmera
                    </button>
                    <button 
                      type="button"
                      onClick={() => createMediaInputRef.current?.click()}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors"
                    >
                      <Plus size={14} /> Arquivos
                    </button>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  className="hidden" 
                  ref={createMediaInputRef}
                  onChange={handleCreateMediaUpload}
                />
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  className="hidden" 
                  ref={createCameraInputRef}
                  onChange={handleCreateMediaUpload}
                />

                {formData.media.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.media.map((item, i) => (
                      <div key={item.id} className="aspect-square rounded-xl overflow-hidden border border-slate-200 relative group">
                        {item.type === 'image' ? (
                          <img 
                            src={item.url} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <VideoIcon size={20} />
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, media: prev.media.filter((_, index) => index !== i) }))}
                          className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    onClick={() => createMediaInputRef.current?.click()}
                    className="p-8 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-100 text-center cursor-pointer hover:bg-blue-100/50 transition-all group"
                  >
                    <ImageIcon className="mx-auto text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={32} />
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                      Clique para adicionar fotos ou vídeos desta etapa
                    </p>
                  </div>
                )}
              </div>
            </form>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-2xl transition-colors">Cancelar</button>
              <button 
                onClick={handleSaveStage}
                className="flex-[2] py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Criar Etapa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Gallery Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
          >
            <X size={32} />
          </button>

          <div className="absolute top-6 left-6 text-white/70">
            <p className="text-xs font-black uppercase tracking-[0.2em]">{selectedMedia.items[selectedMedia.index].name}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1">{selectedMedia.items[selectedMedia.index].timestamp}</p>
          </div>

          <div className="relative w-full h-full flex items-center justify-center p-12 md:p-24">
            {selectedMedia.items.length > 1 && (
              <>
                <button 
                  onClick={prevMedia}
                  className="absolute left-6 p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <ChevronLeft size={48} />
                </button>
                <button 
                  onClick={nextMedia}
                  className="absolute right-6 p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <ChevronRight size={48} />
                </button>
              </>
            )}

            <div className="max-w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
              {selectedMedia.items[selectedMedia.index].type === 'image' ? (
                <img 
                  src={selectedMedia.items[selectedMedia.index].url} 
                  alt="Gallery" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video 
                  src={selectedMedia.items[selectedMedia.index].url} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-full rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {selectedMedia.items.map((_, i) => (
              <button 
                key={i}
                onClick={() => setSelectedMedia({ ...selectedMedia, index: i })}
                className={`w-2 h-2 rounded-full transition-all ${i === selectedMedia.index ? 'bg-blue-500 w-8' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Etapas;
