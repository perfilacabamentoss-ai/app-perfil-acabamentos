
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  TrendingDown, 
  DollarSign, 
  Send, 
  X, 
  Save, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  BarChart4,
  ArrowRight,
  Globe,
  Navigation,
  ExternalLink,
  Zap,
  ShoppingBag,
  ArrowDownCircle,
  Trophy,
  Pencil
} from 'lucide-react';
import { Supplier, QuoteItem } from '../types';
import ConfirmModal from './ConfirmModal';
import { GoogleGenAI } from "@google/genai";
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

const Fornecedores: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
  const categories = ['Básico', 'Acabamento', 'Ferragens', 'Elétrico', 'Hidráulico', 'Ferramentas', 'Químicos', 'Geral'];
  const [activeTab, setActiveTab] = useState<'list' | 'compare' | 'deals'>('list');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const suppliersCollectionRef = collection(db, 'suppliers');
    const q = query(suppliersCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suppliersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];
      setSuppliers(suppliersData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string; type: 'single' | 'all' }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'single'
  });
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [linkedToInventory, setLinkedToInventory] = useState(false);

  // Search Deals State
  const [searchLocation, setSearchLocation] = useState('São Paulo, SP');
  const [isSearchingDeals, setIsSearchingDeals] = useState(false);
  const [foundDeals, setFoundDeals] = useState<any[]>([]);
  const [dealsAnalysis, setDealsAnalysis] = useState<string | null>(null);

  // Form states
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({ name: '', category: '', contact: '', email: '' });
  
  // Comparison states
  const [materialName, setMaterialName] = useState('');
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [newQuote, setNewQuote] = useState({ supplierName: '', price: 0 });

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;

    try {
      if (editingSupplierId) {
        const supplierRef = doc(db, 'suppliers', editingSupplierId);
        await updateDoc(supplierRef, { ...newSupplier });
      } else {
        const supplierToAdd: Supplier = {
          ...newSupplier as Supplier,
          id: '', // Firestore will generate ID
          category: newSupplier.category || 'Geral',
          contact: newSupplier.contact || '',
          email: newSupplier.email || ''
        };
        await addDoc(collection(db, 'suppliers'), supplierToAdd);
      }

      setIsAddingSupplier(false);
      setEditingSupplierId(null);
      setNewSupplier({ name: '', category: '', contact: '', email: '' });
    } catch (error) {
      handleFirestoreError(error, editingSupplierId ? OperationType.UPDATE : OperationType.CREATE, 'suppliers');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name, type: 'single' });
  };

  const handleClearAll = () => {
    setConfirmDelete({ isOpen: true, id: 'all', name: 'TODOS os fornecedores', type: 'all' });
  };

  const executeDelete = async () => {
    try {
      if (confirmDelete.type === 'all') {
        const batch = writeBatch(db);
        const snapshot = await getDocs(collection(db, 'suppliers'));
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } else {
        if (confirmDelete.id) {
          await deleteDoc(doc(db, 'suppliers', confirmDelete.id));
        }
      }
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${confirmDelete.id || 'all'}`);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setNewSupplier({
      name: supplier.name,
      category: supplier.category,
      contact: supplier.contact,
      email: supplier.email
    });
    setEditingSupplierId(supplier.id);
    setIsAddingSupplier(true);
  };

  const handleAddQuote = () => {
    if (!newQuote.supplierName || newQuote.price <= 0) return;
    const item: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      supplierName: newQuote.supplierName,
      price: newQuote.price
    };
    setQuotes([...quotes, item]);
    setNewQuote({ supplierName: '', price: 0 });
    setLinkedToInventory(false);
  };

  const bestQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => a.price - b.price);
  }, [quotes]);

  const winner = bestQuotes[0];

  const handleAnalyzeAndSend = async () => {
    if (bestQuotes.length === 0) return;
    setIsAnalyzing(true);
    setEmailSent(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analise os seguintes orçamentos para o material "${materialName}":
      ${bestQuotes.map((q, i) => `${i+1}. ${q.supplierName}: R$ ${q.price.toFixed(2)}`).join('\n')}
      
      Crie um relatório curto e profissional para o administrador da Perfil Acabamentos, destacando a economia da melhor opção em relação às outras.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Você é um analista de compras sênior da Perfil Acabamentos." }
      });

      setAnalysisResult(response.text || "Análise concluída.");
      
      // Simulação de envio de e-mail
      setTimeout(() => {
        setIsAnalyzing(false);
        setEmailSent(true);
      }, 1500);

    } catch (error) {
      console.error("Erro na análise:", error);
      setIsAnalyzing(false);
    }
  };

  const linkToInventory = () => {
    if (!winner || !materialName) return;
    
    // Simulação de persistência para o componente Materiais via localStorage
    const savings = bestQuotes.length > 1 ? bestQuotes[1].price - winner.price : 0;
    const linkData = {
      materialName,
      bestPrice: winner.price,
      bestSupplier: winner.supplierName,
      savings: savings,
      date: new Date().toISOString()
    };
    
    const existingLinks = JSON.parse(localStorage.getItem('perfil_best_prices') || '{}');
    existingLinks[materialName.toLowerCase()] = linkData;
    localStorage.setItem('perfil_best_prices', JSON.stringify(existingLinks));
    
    setLinkedToInventory(true);
    alert(`Preço de R$ ${winner.price.toFixed(2)} do fornecedor ${winner.supplierName} vinculado ao estoque de ${materialName}!`);
  };

  const handleSearchDeals = async () => {
    if (!searchLocation) return;
    setIsSearchingDeals(true);
    setFoundDeals([]);
    setDealsAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const supplierNames = suppliers.map(s => s.name).join(', ');
      const prompt = `Busque por materiais de construção em oferta, promoção ou saldão em sites de empresas num raio de 40km de "${searchLocation}". 
      Dê atenção especial às lojas: ${supplierNames}.
      Liste as melhores oportunidades encontradas hoje, focando em acabamentos, cimento, pisos e ferramentas. 
      Explique brevemente por que cada uma é uma boa oferta.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setDealsAnalysis(response.text || "Nenhuma oferta detalhada encontrada.");
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
      
      setFoundDeals(links);
    } catch (error) {
      console.error("Erro ao buscar ofertas:", error);
    } finally {
      setIsSearchingDeals(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Fornecedores</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão de parceiros e inteligência de mercado</p>
        </div>
        
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Meus Fornecedores
          </button>
          <button 
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${activeTab === 'compare' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Comparar Preços
          </button>
          <button 
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${activeTab === 'deals' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="flex items-center justify-center gap-1"><Zap size={12} /> Ofertas na Região</span>
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Truck size={20} className="text-blue-600" /> Parceiros Cadastrados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
              {!readOnly && (
                <>
                  <button 
                    onClick={handleClearAll}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-rose-100"
                  >
                    <Trash2 size={16} /> Limpar Tudo
                  </button>
                  <button 
                    onClick={() => setIsAddingSupplier(true)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={16} /> Novo Fornecedor
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Truck size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <>
                        <button 
                          onClick={() => handleEditSupplier(s)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar Fornecedor"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Excluir Fornecedor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-md">{s.category}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                  {s.name}
                  {s.contact === 'IA: Encontrado via Web' && (
                    <span className="p-1 bg-blue-50 text-blue-600 rounded-md" title="Cadastrado Automaticamente via IA">
                      <Zap size={12} />
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Phone size={14} className="text-blue-500" /> {s.contact}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Mail size={14} className="text-blue-500" /> {s.email}
                  </div>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center opacity-40">
                <Truck size={48} className="mb-4" />
                <p className="font-bold uppercase tracking-widest text-sm">Nenhum fornecedor registrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0b1222] text-white p-8 rounded-3xl shadow-xl">
              <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                <TrendingDown className="text-blue-400" /> Nova Cotação
              </h2>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material / Serviço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Porcelanato 80x80"
                    className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={materialName}
                    onChange={e => setMaterialName(e.target.value)}
                  />
                </div>

                <div className="p-4 bg-slate-800/50 rounded-2xl space-y-4 border border-slate-700">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Adicionar Valor</p>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Fornecedor"
                      className="w-full bg-slate-700 border-none rounded-lg px-3 py-2 text-xs outline-none"
                      value={newQuote.supplierName}
                      onChange={e => setNewQuote({...newQuote, supplierName: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                        <input 
                          type="number" 
                          placeholder="Preço Total"
                          className="w-full bg-slate-700 border-none rounded-lg pl-8 pr-3 py-2 text-xs outline-none"
                          value={newQuote.price || ''}
                          onChange={e => setNewQuote({...newQuote, price: Number(e.target.value)})}
                        />
                      </div>
                      <button 
                        onClick={handleAddQuote}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAnalyzeAndSend}
                  disabled={isAnalyzing || bestQuotes.length === 0}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                    bestQuotes.length > 0 ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? 'Analisando...' : (
                    <>
                      <Send size={16} /> Analisar com IA
                    </>
                  )}
                </button>
              </div>
            </div>

            {winner && (
              <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl shadow-emerald-200 animate-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Trophy size={28} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-60">Economia Detectada</p>
                    <p className="text-xl font-black">
                      R$ {bestQuotes.length > 1 ? (bestQuotes[bestQuotes.length - 1].price - winner.price).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase leading-tight mb-2">Vencedor: {winner.supplierName}</h3>
                <p className="text-emerald-100 text-sm font-bold">Valor Final: R$ {winner.price.toFixed(2)}</p>
                
                <button 
                  onClick={linkToInventory}
                  disabled={linkedToInventory}
                  className={`mt-6 w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                    linkedToInventory ? 'bg-emerald-700 opacity-50 cursor-not-allowed' : 'bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {linkedToInventory ? (
                    <><CheckCircle2 size={16} /> Vinculado ao Estoque</>
                  ) : (
                    <><ShoppingBag size={16} /> Vincular ao Material</>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-2xl flex items-center gap-2">
                  <BarChart4 className="text-blue-600" /> Ranking de Preços
                </h3>
                {materialName && <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase">{materialName}</span>}
              </div>

              {quotes.length > 0 ? (
                <div className="space-y-6 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bestQuotes.map((q, i) => (
                      <div key={q.id} className={`p-6 rounded-2xl border-2 transition-all ${i === 0 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-lg ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {i === 0 ? <Trophy size={18} /> : i + 1 + 'º'}
                          </div>
                          {i === 0 && <span className="text-[10px] font-black text-emerald-600 uppercase">Menor Valor</span>}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">{q.supplierName}</p>
                        <p className={`text-2xl font-black ${i === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                          R$ {q.price.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {analysisResult && (
                    <div className="p-8 bg-slate-900 text-slate-300 rounded-3xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown size={120} /></div>
                       <h4 className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4">Relatório do Analista Gemini</h4>
                       <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                         {analysisResult}
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                  <ArrowDownCircle size={64} className="mb-4 text-slate-200" />
                  <p className="font-black text-xl text-slate-400 uppercase tracking-tighter">Aguardando cotações</p>
                  <p className="text-slate-400 text-sm max-w-xs mt-2">Insira os valores recebidos dos fornecedores para comparar o melhor custo-benefício.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deals' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 -mr-12 -mt-12">
               <Globe size={300} />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200">
                    <Navigation size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Radar de Ofertas (Raio 40km)</h2>
                    <p className="text-slate-500 text-sm font-medium">Busca diária em fornecedores registrados ou externos</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold"
                      value={searchLocation}
                      onChange={e => setSearchLocation(e.target.value)}
                      placeholder="Cidade para busca..."
                    />
                  </div>
                  <button 
                    onClick={handleSearchDeals}
                    disabled={isSearchingDeals}
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      isSearchingDeals ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-amber-500 shadow-lg shadow-slate-200'
                    }`}
                  >
                    {isSearchingDeals ? 'Escaneando Web...' : 'Buscar Promoções'}
                  </button>
                </div>
              </div>

              {isSearchingDeals ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <p className="font-black text-slate-800 uppercase tracking-widest animate-pulse">Inteligência Artificial Escaneando Lojas...</p>
                  <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest">Analisando ofertas próximas a {searchLocation}</p>
                </div>
              ) : dealsAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <BarChart4 size={14} /> Análise do Mercado Local
                      </h3>
                      <div className="prose prose-slate max-w-none text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                        {dealsAnalysis}
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2 px-2 flex items-center gap-2">
                      <ExternalLink size={14} /> Links das Ofertas Encontradas
                    </h3>
                    <div className="space-y-3">
                      {foundDeals.map((deal, i) => (
                        <a 
                          key={i} 
                          href={deal.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all group"
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                              <Globe size={18} />
                            </div>
                            <span className="font-bold text-slate-800 text-sm truncate">{deal.title}</span>
                          </div>
                          <ArrowRight size={16} className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                  <Navigation size={80} className="text-slate-300 mb-6" />
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Pronto para Buscar Ofertas</h3>
                  <p className="text-slate-500 max-w-sm mt-2 font-medium">Insira uma localização e clique no botão acima para encontrar os materiais mais baratos da região hoje.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddingSupplier && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddingSupplier(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {editingSupplierId ? 'Editar Parceiro' : 'Novo Parceiro'}
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Rede de Fornecedores</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingSupplier(false);
                  setEditingSupplierId(null);
                  setNewSupplier({ name: '', category: '', contact: '', email: '' });
                }} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-8 flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Nome da Empresa</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                  placeholder="Ex: Cerâmica Porto"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Categoria</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  value={newSupplier.category}
                  onChange={e => setNewSupplier({...newSupplier, category: e.target.value})}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="(00) 00000-0000"
                    value={newSupplier.contact}
                    onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">E-mail de Contato</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                  <input 
                    type="email" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="exemplo@email.com"
                    value={newSupplier.email}
                    onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                  />
                </div>
              </div>
            </form>
            <div className="p-8 border-t bg-slate-50 flex gap-4">
              <button 
                onClick={() => {
                  setIsAddingSupplier(false);
                  setEditingSupplierId(null);
                  setNewSupplier({ name: '', category: '', contact: '', email: '' });
                }} 
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddSupplier}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingSupplierId ? 'Atualizar Dados' : 'Salvar Fornecedor'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={confirmDelete.type === 'all' ? "Excluir Tudo" : "Excluir Fornecedor"}
        message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default Fornecedores;
