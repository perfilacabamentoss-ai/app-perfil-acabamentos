
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Palette, Home, Sparkles, Loader2, Download, List, DollarSign, Layers, ChevronRight, Image as ImageIcon, Plus, X, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { View } from '../types';

const DEFAULT_ROOM_TYPES = [
  { id: 'living-room', name: 'Sala de Estar', icon: <Home size={18} /> },
  { id: 'bedroom', name: 'Quarto', icon: <ImageIcon size={18} /> },
  { id: 'kitchen', name: 'Cozinha', icon: <ImageIcon size={18} /> },
  { id: 'bathroom', name: 'Banheiro', icon: <ImageIcon size={18} /> },
  { id: 'office', name: 'Escritório', icon: <ImageIcon size={18} /> },
  { id: 'corridor', name: 'Corredor', icon: <ImageIcon size={18} /> },
  { id: 'balcony', name: 'Varanda', icon: <ImageIcon size={18} /> },
  { id: 'laundry', name: 'Área de Serviço', icon: <ImageIcon size={18} /> },
  { id: 'suite', name: 'Quarto/Suíte', icon: <ImageIcon size={18} /> },
  { id: 'garage', name: 'Garagem', icon: <ImageIcon size={18} /> },
  { id: 'backyard', name: 'Quintal', icon: <ImageIcon size={18} /> },
  { id: 'facade', name: 'Fachada do Muro', icon: <ImageIcon size={18} /> },
  { id: 'gate', name: 'Portão', icon: <ImageIcon size={18} /> },
];

const DEFAULT_DECOR_STYLES = [
  { id: 'modern', name: 'Moderno' },
  { id: 'minimalist', name: 'Minimalista' },
  { id: 'luxury', name: 'Luxo' },
  { id: 'industrial', name: 'Industrial' },
  { id: 'classic', name: 'Clássico' },
  { id: 'scandinavian', name: 'Escandinavo' },
];

interface DecorAIProps {
  isAdmin?: boolean;
  onNavigate?: (view: View) => void;
}

const DecorAI: React.FC<DecorAIProps> = ({ isAdmin, onNavigate }) => {
  const [roomTypes, setRoomTypes] = useState(DEFAULT_ROOM_TYPES);
  const [decorStyles, setDecorStyles] = useState(DEFAULT_DECOR_STYLES);
  const [selectedRoom, setSelectedRoom] = useState('living-room');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<'renovate' | 'decorate' | null>(null);
  const [lastGenerationMode, setLastGenerationMode] = useState<'renovate' | 'decorate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<'room' | 'style' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRooms = localStorage.getItem('decor_room_types');
    const savedStyles = localStorage.getItem('decor_styles');
    if (savedRooms) {
      const parsed = JSON.parse(savedRooms);
      // Re-add icons to saved rooms
      const withIcons = parsed.map((r: any) => ({
        ...r,
        icon: DEFAULT_ROOM_TYPES.find(dr => dr.id === r.id)?.icon || <ImageIcon size={18} />
      }));
      setRoomTypes(withIcons);
    }
    if (savedStyles) setDecorStyles(JSON.parse(savedStyles));
  }, []);

  const saveRooms = (rooms: any[]) => {
    setRoomTypes(rooms);
    const toSave = rooms.map(({ id, name }) => ({ id, name }));
    localStorage.setItem('decor_room_types', JSON.stringify(toSave));
  };

  const saveStyles = (styles: any[]) => {
    setDecorStyles(styles);
    localStorage.setItem('decor_styles', JSON.stringify(styles));
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const id = newItemName.toLowerCase().replace(/\s+/g, '-');
    
    if (showAddModal === 'room') {
      const newRooms = [...roomTypes, { id, name: newItemName, icon: <ImageIcon size={18} /> }];
      saveRooms(newRooms);
    } else {
      const newStyles = [...decorStyles, { id, name: newItemName }];
      saveStyles(newStyles);
    }
    
    setNewItemName('');
    setShowAddModal(null);
  };

  const handleRemoveItem = (type: 'room' | 'style', id: string) => {
    if (type === 'room') {
      if (DEFAULT_ROOM_TYPES.some(r => r.id === id)) return;
      saveRooms(roomTypes.filter(r => r.id !== id));
    } else {
      if (DEFAULT_DECOR_STYLES.some(s => s.id === id)) return;
      saveStyles(decorStyles.filter(s => s.id !== id));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateDecor = async (mode: 'renovate' | 'decorate') => {
    if (!originalImage) return;

    setIsGenerating(true);
    setGenerationMode(mode);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Extract base64 data
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(';')[0].split(':')[1] || 'image/png';

      const roomName = roomTypes.find(r => r.id === selectedRoom)?.name;
      const styleName = decorStyles.find(s => s.id === selectedStyle)?.name;

      let prompt = '';
      
      if (mode === 'renovate') {
        prompt = `Generate a high-quality, realistic interior renovation of this ${roomName} in ${styleName} style. 
        Instructions:
        1. Remove all existing furniture and clutter.
        2. Replace wall finishes, flooring, and ceiling with new materials matching the ${styleName} aesthetic.
        3. Show the room either empty or with minimal modern furniture to highlight the architectural renovation.
        4. The output must be a realistic visualization of the renovated space.`;
      } else {
        prompt = `Generate a high-quality, realistic interior decoration for this ${roomName} in ${styleName} style.
        Instructions:
        1. PRESERVE the existing walls, floor, ceiling, and fixed architectural structures exactly as they are.
        2. Add new movable furniture, rugs, lighting, and decor items in ${styleName} style.
        3. The goal is virtual staging without any construction or renovation.
        4. The output must be a realistic visualization of the decorated space.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          systemInstruction: "You are an expert interior designer and architectural visualizer. Your task is to generate realistic images based on user photos and specific design instructions. Always prioritize generating a high-quality image response.",
        }
      });

      let foundImage = false;
      const parts = response.candidates?.[0]?.content?.parts || [];
      
      for (const part of parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
          setLastGenerationMode(mode);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        // Log text response if any for debugging
        const textResponse = response.text;
        console.warn("IA returned text instead of image:", textResponse);
        throw new Error("A IA retornou apenas texto em vez de uma imagem. Isso pode acontecer se a imagem original for muito escura ou se as instruções forem conflitantes. Tente uma foto diferente ou outro estilo.");
      }

    } catch (err: any) {
      console.error("Erro ao gerar decoração:", err);
      setError(err.message || "Ocorreu um erro ao processar a imagem. Verifique sua conexão e tente novamente.");
    } finally {
      setIsGenerating(false);
      setGenerationMode(null);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Offline Badge - Visual only as requested by screenshot */}
      <div className="flex justify-center lg:justify-start">
        <button 
          onClick={() => onNavigate && onNavigate(View.PROFISSIONAIS)}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-colors group"
        >
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">Modo Offline</span>
        </button>
      </div>

      {/* Header & Toolbar */}
      <div className="bg-[#0f172a] dark:bg-[#0b1222] p-8 rounded-[3rem] shadow-2xl border border-slate-800/50 space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
              <Palette size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">REFORMA / DECORAÇÕES</h1>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest opacity-60">Transforme seus ambientes com IA</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => generateDecor('renovate')}
              disabled={!originalImage || isGenerating}
              className={`px-10 py-4 bg-[#1e293b] hover:bg-[#334155] disabled:bg-slate-800/50 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 border border-slate-700/50 hover:border-rose-500/50 group`}
            >
              {isGenerating && generationMode === 'renovate' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Reformando...
                </>
              ) : (
                <>
                  <Plus size={18} className="text-rose-500" />
                  Reformar (Esvaziar)
                </>
              )}
            </button>

            <button
              onClick={() => generateDecor('decorate')}
              disabled={!originalImage || isGenerating}
              className="px-10 py-4 bg-[#1e293b] hover:bg-[#334155] disabled:bg-slate-800/50 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 border border-slate-700/50 hover:border-indigo-500/50 group"
            >
              {isGenerating && generationMode === 'decorate' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Decorando...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-indigo-400" />
                  Decorar Ambiente
                </>
              )}
            </button>

            <button
              onClick={triggerFileUpload}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                originalImage 
                  ? 'bg-indigo-900/20 text-indigo-400 border-indigo-500/30' 
                  : 'bg-[#1e293b] text-slate-400 border-slate-700/50 hover:border-indigo-500/50'
              }`}
            >
              <Upload size={18} />
              {originalImage ? 'Trocar Foto' : 'Carregar Foto'}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 pt-8 border-t border-slate-800/50 relative z-10">
          {/* Room Type Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Tipo de Ambiente</label>
              {isAdmin && (
                <button 
                  onClick={() => setShowAddModal('room')}
                  className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {roomTypes.map((room) => (
                <div key={room.id} className="relative group">
                  <button
                    onClick={() => setSelectedRoom(room.id)}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                      selectedRoom === room.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-[#1e293b]/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <span className={selectedRoom === room.id ? 'text-white' : 'text-slate-500'}>{room.icon}</span>
                    {room.name}
                  </button>
                  {isAdmin && !DEFAULT_ROOM_TYPES.some(r => r.id === room.id) && (
                    <button 
                      onClick={() => handleRemoveItem('room', room.id)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Estilo de Decoração</label>
              {isAdmin && (
                <button 
                  onClick={() => setShowAddModal('style')}
                  className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {decorStyles.map((style) => (
                <div key={style.id} className="relative group">
                  <button
                    onClick={() => setSelectedStyle(style.id)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                      selectedStyle === style.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-[#1e293b]/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {style.name}
                  </button>
                  {isAdmin && !DEFAULT_DECOR_STYLES.some(s => s.id === style.id) && (
                    <button 
                      onClick={() => handleRemoveItem('style', style.id)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Adicionar {showAddModal === 'room' ? 'Ambiente' : 'Estilo'}
              </h3>
              <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do {showAddModal === 'room' ? 'Ambiente' : 'Estilo'}</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Varanda Gourmet, Estilo Boho..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItem}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Area - Full Width */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 min-h-[600px] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Visualização do Projeto</h3>
          {generatedImage && (
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
              onClick={() => {
                const link = document.createElement('a');
                link.href = generatedImage;
                link.download = `decor-${selectedRoom}-${selectedStyle}.png`;
                link.click();
              }}
            >
              <Download size={14} />
              Baixar Imagem
            </button>
          )}
        </div>

        {error && (
          <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="p-2 bg-rose-500 text-white rounded-lg">
              <AlertCircle size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-wide mb-1">Erro na Geração</p>
              <p className="text-[11px] text-rose-400 font-medium leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!originalImage && !generatedImage && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <ImageIcon size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-400 uppercase tracking-tight">Aguardando Imagem</h4>
            <p className="text-slate-400 text-xs mt-2 max-w-xs">Faça o upload de uma foto do seu ambiente para começar a transformação.</p>
          </div>
        )}

        {(originalImage || generatedImage) && (
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Antes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antes (Original)</span>
                </div>
                <div className="relative aspect-[4/3] bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
                  {originalImage ? (
                    <img src={originalImage} alt="Antes" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={48} />
                    </div>
                  )}
                </div>
              </div>

              {/* Depois */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={10} />
                    Depois (Gerado por IA)
                  </span>
                </div>
                <div className="relative aspect-[4/3] bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
                  {isGenerating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-indigo-50/50 dark:bg-indigo-900/10">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">IA está decorando...</p>
                    </div>
                  ) : generatedImage ? (
                    <img src={generatedImage} alt="Depois" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                      <ImageIcon size={48} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Clique em Gerar Decoração</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {generatedImage && (
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wide mb-1">Análise da IA Concluída</p>
                  <p className="text-[11px] text-indigo-800/70 dark:text-indigo-400 font-medium leading-relaxed">
                    {lastGenerationMode === 'renovate' 
                      ? `O ambiente passou por uma REFORMA completa no estilo ${decorStyles.find(s => s.id === selectedStyle)?.name}. A IA renovou as paredes, teto e piso, permitindo a modificação da estrutura original para mostrar o potencial máximo do espaço.`
                      : `O ambiente foi DECORADO preservando toda a estrutura original. Mantivemos as paredes, piso e elementos fixos (como balcões e nichos), adicionando apenas móveis e objetos decorativos no estilo ${decorStyles.find(s => s.id === selectedStyle)?.name}.`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecorAI;
