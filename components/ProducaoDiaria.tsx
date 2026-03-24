
import React, { useState, useMemo } from 'react';
import { 
  Hammer, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Save,
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  Calculator,
  X,
  Globe,
  Loader2,
  Sparkles,
  RefreshCw,
  Pencil
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { View } from '../types';
import ConfirmModal from './ConfirmModal';

interface ProductionEntry {
  id: string;
  professionalName: string;
  date: string;
  quantity: number;
  unit: 'm²' | 'ml';
  unitValue: number;
}

interface CategoryProduction {
  id: string;
  name: string;
  entries: ProductionEntry[];
}

const ProducaoDiaria: React.FC<{ onNavigate?: (view: View) => void }> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<CategoryProduction[]>(() => {
    const saved = localStorage.getItem('perfil_production_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    
    // If empty, try to load from projects
    const savedProjects = localStorage.getItem('perfil_projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      return projects.map((proj: any) => ({
        id: `cat-proj-${proj.id}`,
        name: proj.name,
        entries: []
      }));
    }
    
    return [];
  });

  // Persist categories
  React.useEffect(() => {
    localStorage.setItem('perfil_production_categories', JSON.stringify(categories));
  }, [categories]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string; type: 'category' | 'all' | 'sync' }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'category'
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingPrice, setIsSearchingPrice] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');

  const renameCategory = (id: string, newName: string) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, name: newName } : cat));
    setEditingCategoryId(null);
  };

  const searchMarketPrice = async (categoryId: string, categoryName: string, entryId: string) => {
    setIsSearchingPrice(entryId);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || '') });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pesquise o valor médio de mercado por unidade (m² ou ml) para o serviço de construção civil: "${categoryName}" no Brasil em 2024/2025. 
        Retorne APENAS o valor numérico médio. 
        Exemplo de resposta: 45.50`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      // Procura o primeiro número no formato 0.000,00 ou 0000.00
      const match = text.match(/\d+([.,]\d+)?/);
      
      if (match) {
        let priceText = match[0].replace(',', '.');
        // Se houver múltiplos pontos (ex: 1.200.50), remove os primeiros
        const parts = priceText.split('.');
        if (parts.length > 2) {
          const decimal = parts.pop();
          priceText = parts.join('') + '.' + decimal;
        }
        
        const price = parseFloat(priceText);

        if (!isNaN(price) && price > 0) {
          updateEntry(categoryId, entryId, 'unitValue', price);
          return;
        }
      }
      
      alert("A IA encontrou informações, mas não conseguiu extrair um valor numérico exato. Por favor, insira manualmente.");
    } catch (error) {
      console.error("Erro na busca de preço:", error);
      alert("Ocorreu um erro ao consultar o mercado. Tente novamente em instantes.");
    } finally {
      setIsSearchingPrice(null);
    }
  };

  const suggestedCategories = [
    'Escavação (valas/sapatas/infra)',
    'Confecção de concreto térreo',
    'Assentamento de Tijolos simples/dobrado',
    'Assentamento de portais',
    'Assentamento de caixinha de tomadas',
    'Chapisco',
    'Reboco',
    'Requádrações (porta/janelas/vigas)',
    'Confecção de contra piso',
    'Assentamento de revestimentos (parede/piso)',
    'Rejuntamento de Pisos e Paredes',
    'Colocação de Bancadas e Pias de Granito'
  ];

  const addCategory = (name?: string) => {
    const finalName = name || newCategoryName;
    if (!finalName) return;
    const newCat: CategoryProduction = {
      id: `cat-${Date.now()}`,
      name: finalName,
      entries: []
    };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const addEntry = (categoryId: string) => {
    const newEntry: ProductionEntry = {
      id: `e-${Date.now()}`,
      professionalName: '',
      date: new Date().toLocaleDateString('pt-BR'),
      quantity: 0,
      unit: 'm²',
      unitValue: 0
    };

    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, entries: [...cat.entries, newEntry] } : cat
    ));
  };

  const updateEntry = (categoryId: string, entryId: string, field: keyof ProductionEntry, value: any) => {
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          entries: cat.entries.map(entry => 
            entry.id === entryId ? { ...entry, [field]: value } : entry
          )
        };
      }
      return cat;
    }));
  };

  const removeEntry = (categoryId: string, entryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, entries: cat.entries.filter(e => e.id !== entryId) } : cat
    ));
  };

  const removeCategory = (categoryId: string, name: string) => {
    setConfirmDelete({ isOpen: true, id: categoryId, name, type: 'category' });
  };

  const clearAllProduction = () => {
    setConfirmDelete({ isOpen: true, id: 'all', name: 'TUDO (Categorias e Registros)', type: 'all' });
  };

  const executeDelete = () => {
    if (confirmDelete.type === 'all') {
      setCategories([]);
    } else if (confirmDelete.type === 'sync') {
      const savedProjects = localStorage.getItem('perfil_projects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const newCategories: CategoryProduction[] = projects.map((proj: any) => ({
          id: `cat-proj-${proj.id}`,
          name: proj.name,
          entries: []
        }));
        setCategories(newCategories);
      }
    } else {
      setCategories(prev => prev.filter(cat => cat.id !== confirmDelete.id));
    }
  };

  const syncWithProjects = () => {
    const savedProjects = localStorage.getItem('perfil_projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      if (projects.length === 0) {
        alert("Nenhum projeto encontrado na página de Projetos Técnicos.");
        return;
      }
      
      setConfirmDelete({ 
        isOpen: true, 
        id: 'sync', 
        name: `${projects.length} projetos como categorias de produção (isso substituirá as categorias atuais)`, 
        type: 'sync' 
      });
    } else {
      alert("Nenhum projeto encontrado na página de Projetos Técnicos.");
    }
  };

  const totalProductionValue = useMemo(() => {
    return categories.reduce((acc, cat) => {
      return acc + cat.entries.reduce((eAcc, entry) => eAcc + (entry.quantity * entry.unitValue), 0);
    }, 0);
  }, [categories]);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.entries.some(e => e.professionalName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Produção Diária</h1>
          <p className="text-slate-500 mt-2 font-medium">Acompanhamento de produtividade e custos por m² / ml</p>
        </div>
        <div className="flex gap-3">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.ETAPAS)}
              className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              Etapas
            </button>
          )}
          <button 
            onClick={syncWithProjects}
            className="px-6 py-3 border-2 border-emerald-500 text-emerald-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-2"
            title="Importar categorias dos Projetos Técnicos"
          >
            <Sparkles size={20} />
            Importar Projetos
          </button>
          <button 
            onClick={syncWithProjects}
            className="px-6 py-3 border-2 border-blue-500 text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
            title="Limpar e Sincronizar com Projetos"
          >
            <RefreshCw size={20} />
            Limpar e Sincronizar
          </button>
          <button 
            onClick={clearAllProduction}
            className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            title="Limpar todos os registros de produção"
          >
            <Trash2 size={20} />
            Limpar Tudo
          </button>
          <button 
            onClick={() => setIsAddingCategory(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <LayoutGrid size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorias Ativas</p>
            <h3 className="text-3xl font-black text-slate-900">{categories.length.toString().padStart(2, '0')}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Produzido</p>
            <h3 className="text-3xl font-black text-slate-900">
              {categories.reduce((acc, cat) => acc + cat.entries.length, 0).toString().padStart(2, '0')} <span className="text-sm text-slate-400 font-bold">Registros</span>
            </h3>
          </div>
        </div>
        <div className="bg-[#0b1222] p-6 rounded-3xl shadow-xl flex items-center gap-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Calculator size={100} />
          </div>
          <div className="p-4 bg-blue-600 text-white rounded-2xl relative z-10">
            <DollarSign size={32} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Valor Total Produção</p>
            <h3 className="text-3xl font-black">R$ {totalProductionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por categoria ou profissional..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-8">
        {filteredCategories.map(category => (
          <div key={category.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                  <Hammer size={24} />
                </div>
                <div className="flex-1">
                  {editingCategoryId === category.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        autoFocus
                        type="text"
                        className="text-2xl font-black text-slate-900 uppercase tracking-tight bg-white border-b-2 border-blue-500 outline-none px-1 py-0.5 w-full max-w-md"
                        value={tempCategoryName}
                        onChange={e => setTempCategoryName(e.target.value)}
                        onBlur={() => renameCategory(category.id, tempCategoryName)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') renameCategory(category.id, tempCategoryName);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                      />
                      <button 
                        onClick={() => renameCategory(category.id, tempCategoryName)}
                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 group">
                      <h2 
                        className="text-2xl font-black text-slate-900 uppercase tracking-tight cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setTempCategoryName(category.name);
                        }}
                        title="Clique para renomear"
                      >
                        {category.name}
                      </h2>
                      <button 
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setTempCategoryName(category.name);
                        }}
                        className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Renomear Categoria"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {category.entries.length} registros de produção
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => addEntry(category.id)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Lançar Produção
                </button>
                <button 
                  onClick={() => removeCategory(category.id, category.name)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Unit.</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {category.entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          <input 
                            type="text"
                            placeholder="Nome do profissional"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            value={entry.professionalName}
                            onChange={e => updateEntry(category.id, entry.id, 'professionalName', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          <input 
                            type="text"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            value={entry.date}
                            onChange={e => updateEntry(category.id, entry.id, 'date', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <select 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                          value={entry.unit}
                          onChange={e => updateEntry(category.id, entry.id, 'unit', e.target.value)}
                        >
                          <option value="m²">m²</option>
                          <option value="ml">ml</option>
                        </select>
                      </td>
                      <td className="px-8 py-4">
                        <input 
                          type="number"
                          className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                          value={entry.quantity || ''}
                          onChange={e => updateEntry(category.id, entry.id, 'quantity', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-8 py-4">
                        <div className="relative flex items-center gap-2">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                            <input 
                              type="number"
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                              value={entry.unitValue || ''}
                              onChange={e => updateEntry(category.id, entry.id, 'unitValue', Number(e.target.value))}
                            />
                          </div>
                          <button
                            onClick={() => searchMarketPrice(category.id, category.name, entry.id)}
                            disabled={isSearchingPrice === entry.id}
                            className={`p-2 rounded-lg transition-all border ${
                              isSearchingPrice === entry.id 
                                ? 'bg-slate-100 text-slate-400 border-slate-200' 
                                : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white shadow-sm'
                            }`}
                            title="Pesquisar valor de mercado via IA"
                          >
                            {isSearchingPrice === entry.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Globe size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm font-black text-blue-600">
                          R$ {(entry.quantity * entry.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => removeEntry(category.id, entry.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Excluir Lançamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {category.entries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20">
                          <Hammer size={48} className="text-slate-300 mb-2" />
                          <p className="text-xs font-black uppercase tracking-widest">Nenhum lançamento nesta categoria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {category.entries.length > 0 && (
                  <tfoot>
                    <tr className="bg-blue-50/30 border-t border-blue-100">
                      <td colSpan={5} className="px-8 py-4 text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Categoria:</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-lg font-black text-blue-600">
                          R$ {category.entries.reduce((acc, curr) => acc + (curr.quantity * curr.unitValue), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-8 rounded-full mb-6">
              <Hammer size={64} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Nenhuma categoria de produção</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Crie categorias como "Piso", "Reboco" ou "Pintura" para começar a lançar a produção diária.</p>
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Criar Primeira Categoria
            </button>
          </div>
        )}
      </div>

      {/* Modal for adding category */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsAddingCategory(false)} 
          />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Nova Categoria</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Organização de Serviços</p>
              </div>
              <button 
                onClick={() => setIsAddingCategory(false)} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Categoria</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ex: Porcelanato 80x80, Reboco Interno..."
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sugestões Rápidas</label>
                <div className="flex flex-wrap gap-2">
                  {suggestedCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => addCategory(cat)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg text-[10px] font-bold text-slate-600 transition-all border border-slate-200"
                    >
                      + {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-100 rounded-3xl text-center">
                <Hammer size={28} className="mx-auto text-blue-400 mb-2" />
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                  Categorias ajudam a organizar os lançamentos por tipo de serviço e facilitam o cálculo de custos por m² ou ml.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsAddingCategory(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => addCategory()}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Criar Categoria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={confirmDelete.type === 'all' ? "Excluir Tudo" : confirmDelete.type === 'sync' ? "Importar Projetos" : "Excluir Categoria"}
        message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
        confirmText="Confirmar"
      />
    </div>
  );
};

export default ProducaoDiaria;
