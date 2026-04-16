
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, MoreVertical, Download, Filter, 
  Package, AlertCircle, CheckCircle2, Trash2, Edit2,
  BarChart3, Info, Bell, X, AlertTriangle, StickyNote,
  Save, FileUp, DollarSign, Calendar as CalendarIcon, TrendingDown,
  ArrowDownCircle, Trophy, Zap, ChevronLeft, ChevronRight, Loader2, Globe,
  Sparkles, FileSearch, ExternalLink, MapPin,
  Camera, Users
} from 'lucide-react';
import { Material, Project, Supplier, Payment, View, TechnicalProject, Client } from '../types';
import ConfirmModal from './ConfirmModal';
import { findBestMaterialPrice, extractMaterialsFromProject } from '../services/geminiService';
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
  getDocs,
  setDoc
} from 'firebase/firestore';

// Componente Interno de Calendário para Seleção de Data
const MiniCalendar: React.FC<{ 
  selectedDate: string; 
  onSelect: (date: string) => void 
}> = ({ selectedDate, onSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = [];
  
  // Fill empty days for the first week
  for (let i = 0; i < firstDayOfMonth(year, month); i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = selectedDate === dateStr;
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    days.push(
      <button
        key={d}
        type="button"
        onClick={() => onSelect(dateStr)}
        className={`h-8 w-8 text-[10px] font-black rounded-lg transition-all flex items-center justify-center
          ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 
            isToday ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
          {monthNames[month]} {year}
        </h4>
        <div className="flex gap-1">
          <button 
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
          <div key={day} className="h-8 w-8 flex items-center justify-center text-[9px] font-black text-slate-300 uppercase">
            {day}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
};

const Materiais: React.FC<{ readOnly?: boolean; onNavigate?: (view: View) => void }> = ({ readOnly, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expirationFilter, setExpirationFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Material; direction: 'asc' | 'desc' } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'delete' | 'purchase' | 'sync';
    id?: string;
    name?: string;
    data?: any;
  }>({
    isOpen: false,
    type: 'delete',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bestPrices, setBestPrices] = useState<Record<string, any>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSearching, setIsSearching] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [isExtracting, setIsExtracting] = useState<string | null>(null);
  const [showEconomyReport, setShowEconomyReport] = useState(false);
  const [showQuickSuggest, setShowQuickSuggest] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [projects, setProjects] = useState<TechnicalProject[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [works, setWorks] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const materialsCollectionRef = collection(db, 'materials');
    const q = query(materialsCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const materialsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
      setMaterials(materialsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'materials');
      setIsLoading(false);
    });

    const projectsUnsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TechnicalProject[]);
    });

    const clientsUnsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[]);
    });

    const worksUnsubscribe = onSnapshot(collection(db, 'works'), (snapshot) => {
      setWorks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    });

    // Load best prices from Firestore or local storage (as a cache)
    const savedBestPrices = localStorage.getItem('perfil_best_prices');
    if (savedBestPrices) setBestPrices(JSON.parse(savedBestPrices));

    return () => {
      unsubscribe();
      projectsUnsubscribe();
      clientsUnsubscribe();
      worksUnsubscribe();
    };
  }, []);

  const handleQuickSuggest = async () => {
    if (!suggestQuery) return;
    setIsExtracting('quick');
    try {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      const context = selectedProject ? `Projeto: ${selectedProject.name} (${selectedProject.type})` : "Geral";
      const suggestedMaterials = await extractMaterialsFromProject(suggestQuery, context);
      
      if (suggestedMaterials && suggestedMaterials.length > 0) {
        for (const m of suggestedMaterials) {
          const materialToAdd: Material = {
            ...m,
            id: '', // Firestore will generate ID
            workId: '',
            workName: selectedProject?.workName || 'Estoque Geral',
            projectId: selectedProject?.id || '',
            projectName: selectedProject?.name || '',
            lastRestock: new Date().toLocaleDateString('pt-BR')
          };
          await addDoc(collection(db, 'materials'), materialToAdd);
        }

        setShowQuickSuggest(false);
        setSuggestQuery('');
        setSelectedProjectId('');
        alert(`${suggestedMaterials.length} materiais sugeridos pela IA foram adicionados ao estoque com base na sua descrição.`);
      } else {
        alert("Não foi possível sugerir materiais para esta descrição via IA.");
      }
    } catch (error) {
      console.error("Erro ao sugerir materiais:", error);
      handleFirestoreError(error, OperationType.CREATE, 'materials');
    } finally {
      setIsExtracting(null);
    }
  };

  const handleExtractFromProject = async (proj: TechnicalProject) => {
    setIsExtracting(proj.id);
    try {
      const suggestedMaterials = await extractMaterialsFromProject(proj.name, proj.type);
      
      if (suggestedMaterials && suggestedMaterials.length > 0) {
        for (const m of suggestedMaterials) {
          const materialToAdd: Material = {
            ...m,
            id: '', // Firestore will generate ID
            workId: '', // We'll link to the workName from the project
            workName: proj.workName,
            projectId: proj.id,
            projectName: proj.name,
            lastRestock: new Date().toLocaleDateString('pt-BR')
          };
          await addDoc(collection(db, 'materials'), materialToAdd);
        }

        setShowProjectPicker(false);
        alert(`${suggestedMaterials.length} materiais sugeridos pela IA foram adicionados ao estoque com base no projeto "${proj.name}".`);
      } else {
        alert("Não foi possível extrair materiais deste projeto via IA.");
      }
    } catch (error) {
      console.error("Erro ao extrair materiais:", error);
      handleFirestoreError(error, OperationType.CREATE, 'materials');
    } finally {
      setIsExtracting(null);
    }
  };

  // Form State
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: '',
    category: 'Básico',
    quantity: 0,
    unit: 'Unidades',
    unitPrice: 0,
    minStock: 0,
    expirationDate: '',
    observations: '',
    workId: '',
    workName: '',
    projectId: '',
    projectName: '',
    image: ''
  });

  const handleSort = (key: keyof Material) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name) {
      alert("Por favor, preencha o nome do material.");
      return;
    }

    try {
      if (editingId) {
        const materialRef = doc(db, 'materials', editingId);
        await updateDoc(materialRef, { ...newMaterial });
      } else {
        const materialToAdd: Material = {
          ...newMaterial as Material,
          id: '', // Firestore will generate ID
          lastRestock: new Date().toLocaleDateString('pt-BR')
        };
        await addDoc(collection(db, 'materials'), materialToAdd);
      }

      setIsAdding(false);
      setEditingId(null);
      setNewMaterial({
        name: '',
        category: 'Básico',
        quantity: 0,
        unit: 'Unidades',
        unitPrice: 0,
        minStock: 0,
        expirationDate: '',
        observations: '',
        workId: '',
        workName: '',
        projectId: '',
        projectName: '',
        image: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'materials');
    }
  };

  const handleEdit = (material: Material) => {
    setNewMaterial({
      name: material.name,
      category: material.category,
      quantity: material.quantity,
      unit: material.unit,
      unitPrice: material.unitPrice,
      minStock: material.minStock,
      expirationDate: material.expirationDate,
      observations: material.observations,
      workId: material.workId,
      workName: material.workName,
      image: material.image
    });
    setEditingId(material.id);
    setIsAdding(true);
  };

  const handleRegisterPurchase = (material: Material) => {
    const totalValue = material.quantity * material.unitPrice;
    if (totalValue <= 0) {
      alert("Quantidade ou preço unitário inválido para registro de compra.");
      return;
    }

    setConfirmAction({
      isOpen: true,
      type: 'purchase',
      id: material.id,
      name: material.name,
      data: { totalValue, material }
    });
  };

  const executeRegisterPurchase = async (data: any) => {
    const { totalValue, material } = data;
    
    try {
      const newPayment: Payment = {
        id: '', // Firestore will generate ID
        recipientId: material.bestSupplierName || 'Fornecedor Geral',
        recipientName: material.bestSupplierName || 'Fornecedor Geral',
        type: 'Fornecedor',
        value: totalValue,
        date: new Date().toISOString().split('T')[0],
        status: 'Pago',
        reference: `Material: ${material.name} (${material.quantity} ${material.unit})`,
        workId: material.workId || '',
        workName: material.workName || ''
      };

      await addDoc(collection(db, 'payments'), newPayment);
      alert("Compra registrada e saldo atualizado com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmAction({ isOpen: true, type: 'delete', id, name });
  };

  const executeDelete = async () => {
    if (!confirmAction.id) return;
    try {
      await deleteDoc(doc(db, 'materials', confirmAction.id));
      setConfirmAction(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `materials/${confirmAction.id}`);
    }
  };

  const ensureSupplierExists = (supplierName: string, category: string, sourceUrl?: string) => {
    const savedSuppliers = JSON.parse(localStorage.getItem('perfil_suppliers') || '[]') as Supplier[];
    const exists = savedSuppliers.some(s => s.name.toLowerCase() === supplierName.toLowerCase());
    
    if (!exists) {
      const newSupplier: Supplier = {
        id: Math.random().toString(36).substr(2, 9),
        name: supplierName,
        category: category || 'Geral',
        contact: 'IA: Encontrado via Web',
        email: sourceUrl || 'N/A'
      };
      const updated = [...savedSuppliers, newSupplier];
      localStorage.setItem('perfil_suppliers', JSON.stringify(updated));
      // Trigger a storage event for other components if needed
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleAutoPrice = async (material: Material, silent = false) => {
    setIsSearching(material.id);
    try {
      // Use the address of the specific work linked to the material, or the client's address, or default
      let projectAddress = "São Paulo, SP";
      
      if (material.workId) {
        const linkedWork = works.find(w => w.id === material.workId);
        if (linkedWork) {
          // Prioritize client address if available, otherwise use work address
          const client = clients.find(c => c.name === linkedWork.owner);
          if (client && client.address) {
            projectAddress = client.address;
          } else if (linkedWork.address) {
            projectAddress = linkedWork.address;
          }
        }
      } else if (works.length > 0) {
        const firstWork = works[0];
        const client = clients.find(c => c.name === firstWork.owner);
        projectAddress = (client && client.address) ? client.address : firstWork.address;
      }
      
      const result = await findBestMaterialPrice(material.name, projectAddress);
      
      if (result && result.price) {
        const materialRef = doc(db, 'materials', material.id);
        await updateDoc(materialRef, {
          bestPriceFound: result.price,
          bestSupplierName: result.supplier,
          bestPriceUrl: result.sourceUrl,
          observations: `${material.observations || ''}\n[IA] Melhor preço: R$ ${result.price} em ${result.supplier} (Raio: 75km de ${projectAddress}). Link: ${result.sourceUrl || 'N/A'}`.trim()
        });
        
        // Update bestPrices state to show in UI
        const newBestPrices = { ...bestPrices };
        newBestPrices[material.name.toLowerCase()] = {
          bestPrice: result.price,
          bestSupplier: result.supplier,
          sourceUrl: result.sourceUrl,
          distance: result.distance || 'Até 75km'
        };
        setBestPrices(newBestPrices);
        localStorage.setItem('perfil_best_prices', JSON.stringify(newBestPrices));

        // Auto-create supplier in system
        ensureSupplierExists(result.supplier, material.category, result.sourceUrl);
        
        if (!silent) alert(`IA encontrou: R$ ${result.price} em ${result.supplier}. Fornecedor cadastrado automaticamente.`);
        return result;
      }
      if (!silent) alert("Não foi possível encontrar um preço melhor no momento.");
      return null;
    } catch (error) {
      console.error("Erro na busca automática:", error);
      if (!silent) alert("Erro ao processar busca via IA.");
      return null;
    } finally {
      setIsSearching(null);
    }
  };

  const handleSyncAll = async () => {
    setConfirmAction({ isOpen: true, type: 'sync' });
  };

  const executeSyncAll = async () => {
    setIsSyncingAll(true);
    let updatedCount = 0;
    
    for (const material of materials) {
      const result = await handleAutoPrice(material, true);
      if (result) updatedCount++;
    }
    
    setIsSyncingAll(false);
    alert(`Sincronização concluída! ${updatedCount} materiais atualizados com melhores preços encontrados.`);
  };

  const filteredMaterials = useMemo(() => {
    let result = materials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (m.workName && m.workName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesClient = clientFilter === 'all' || m.workName?.includes(clientFilter);
      const matchesProject = projectFilter === 'all' || m.projectId === projectFilter;
      
      let matchesExpiration = true;
      if (expirationFilter !== 'all') {
        const alert = getExpirationAlert(m.expirationDate);
        if (expirationFilter === 'vencido') {
          matchesExpiration = alert?.severity === 'critical';
        } else if (expirationFilter === 'semana') {
          matchesExpiration = alert?.severity === 'high';
        } else if (expirationFilter === '30dias') {
          matchesExpiration = alert?.severity === 'medium';
        }
      }

      return matchesSearch && matchesCategory && matchesExpiration && matchesClient && matchesProject;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [materials, searchTerm, categoryFilter, expirationFilter, clientFilter, sortConfig]);

  const getStockStatus = (material: Material) => {
    if (material.quantity === 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={14} /> };
    if (material.quantity <= material.minStock) return { label: 'Estoque Baixo', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle size={14} /> };
    return { label: 'Em Dia', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={14} /> };
  };

  const getExpirationAlert = (dateStr?: string) => {
    if (!dateStr) return null;
    const expDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Vencido', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle size={14} />, severity: 'critical' };
    if (diffDays <= 7) return { label: 'Vence esta semana', color: 'text-rose-600', bg: 'bg-rose-50', icon: <AlertCircle size={14} />, severity: 'high' };
    if (diffDays <= 30) return { label: `Vence em ${diffDays} dias`, color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertCircle size={14} />, severity: 'medium' };
    return null;
  };

  const expirationSummary = useMemo(() => {
    const expired = materials.filter(m => {
      const alert = getExpirationAlert(m.expirationDate);
      return alert?.severity === 'critical';
    });
    const critical = materials.filter(m => {
      const alert = getExpirationAlert(m.expirationDate);
      return alert?.severity === 'high';
    });
    return { expired, critical };
  }, [materials]);

  const economyData = useMemo(() => {
    let totalCurrentValue = 0;
    let totalBestValue = 0;
    let count = 0;
    const items: { name: string, current: number, best: number, savings: number, quantity: number, unit: string }[] = [];

    materials.forEach(m => {
      const bestOffer = bestPrices[m.name.toLowerCase()];
      if (bestOffer && m.unitPrice > bestOffer.bestPrice) {
        const currentVal = m.unitPrice * m.quantity;
        const bestVal = bestOffer.bestPrice * m.quantity;
        const savings = currentVal - bestVal;
        
        totalCurrentValue += currentVal;
        totalBestValue += bestVal;
        count++;
        
        items.push({
          name: m.name,
          current: m.unitPrice,
          best: bestOffer.bestPrice,
          savings: savings,
          quantity: m.quantity,
          unit: m.unit
        });
      }
    });

    return {
      totalCurrentValue,
      totalBestValue,
      totalSavings: totalCurrentValue - totalBestValue,
      count,
      items: items.sort((a, b) => b.savings - a.savings)
    };
  }, [materials, bestPrices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">Materiais e Estoque</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-slate-500 font-medium">Controle rigoroso de suprimentos e inteligência de custos</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex flex-col items-center gap-1">
            {onNavigate && (
              <button 
                onClick={() => onNavigate(View.EMPREITEIROS)}
                className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
              >
                Empreiteiros
              </button>
            )}
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-100 flex items-center gap-1 shadow-sm">
              <MapPin size={10} />
              Busca IA: 75km
            </span>
          </div>
          {!readOnly && (
            <>
              <button 
                onClick={() => setShowQuickSuggest(true)}
                className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-50"
              >
                <Sparkles size={20} />
                Sugerir via IA (Descrever Obra)
              </button>
              <button 
                onClick={() => setShowProjectPicker(true)}
                className="bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-50"
              >
                <Sparkles size={20} />
                Importar de Projeto (IA)
              </button>
              <button 
                onClick={handleSyncAll}
                disabled={isSyncingAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                {isSyncingAll ? <Loader2 size={20} className="animate-spin" /> : <Globe size={20} />}
                Sincronizar Preços (IA)
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
              >
                <Plus size={20} />
                Cadastrar Material
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alertas de Validade Críticos */}
      {(expirationSummary.expired.length > 0 || expirationSummary.critical.length > 0) && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200 animate-pulse">
              <Bell size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight">Alertas de Validade</h3>
              <p className="text-rose-600 font-bold text-sm">
                {expirationSummary.expired.length > 0 && `${expirationSummary.expired.length} itens vencidos. `}
                {expirationSummary.critical.length > 0 && `${expirationSummary.critical.length} itens vencendo esta semana.`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-200">
              Resolver Agora
            </button>
            <div className="group relative">
              <button className="p-3 bg-white border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all">
                <Info size={20} />
              </button>
              <div className="absolute bottom-full right-0 mb-3 w-64 p-4 bg-slate-900 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 shadow-2xl">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Sugestão de Automação</p>
                <p className="text-xs leading-relaxed">Implemente gatilhos para enviar alertas via WhatsApp ou E-mail 15 dias antes do vencimento para evitar perdas financeiras.</p>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por material ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="all">Todas Categorias</option>
              <option value="Básico">Básico</option>
              <option value="Acabamento">Acabamento</option>
              <option value="Ferragens">Ferragens</option>
              <option value="Elétrico">Elétrico</option>
              <option value="Hidráulico">Hidráulico</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Químicos">Químicos</option>
            </select>

            <select 
              value={expirationFilter}
              onChange={(e) => setExpirationFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="all">Todas Validades</option>
              <option value="vencido">Vencidos</option>
              <option value="semana">Vence esta semana</option>
              <option value="30dias">Vence em 30 dias</option>
            </select>

            {(searchTerm || categoryFilter !== 'all' || expirationFilter !== 'all' || clientFilter !== 'all' || projectFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setExpirationFilter('all');
                  setClientFilter('all');
                  setProjectFilter('all');
                }}
                className="px-4 py-3 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
              >
                Limpar
              </button>
            )}
            <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-colors shadow-sm"><Download size={20} /></button>
          </div>
        </div>

        {/* Client Selection Chips - Clickable instead of searching */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
            <Users size={16} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Filtrar por Cliente:</span>
          </div>
          <button 
            onClick={() => setClientFilter('all')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${clientFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Todos
          </button>
          {clients.map(client => (
            <button 
              key={client.id}
              onClick={() => setClientFilter(client.name)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${clientFilter === client.name ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              {client.name}
            </button>
          ))}
        </div>

        {/* Project Selection Chips */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
            <FileSearch size={16} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Filtrar por Projeto:</span>
          </div>
          <button 
            onClick={() => setProjectFilter('all')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${projectFilter === 'all' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-100'}`}
          >
            Todos
          </button>
          {projects.map(project => (
            <button 
              key={project.id}
              onClick={() => setProjectFilter(project.id)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${projectFilter === project.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-100'}`}
            >
              {project.name}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th 
                  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Material / Item
                    {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronRight size={10} className="-rotate-90" /> : <ChevronRight size={10} className="rotate-90" />)}
                  </div>
                </th>
                <th 
                  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-2">
                    Categoria
                    {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? <ChevronRight size={10} className="-rotate-90" /> : <ChevronRight size={10} className="rotate-90" />)}
                  </div>
                </th>
                <th 
                  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('expirationDate')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Validade
                    {sortConfig?.key === 'expirationDate' && (sortConfig.direction === 'asc' ? <ChevronRight size={10} className="-rotate-90" /> : <ChevronRight size={10} className="rotate-90" />)}
                  </div>
                </th>
                <th 
                  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('unitPrice')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Preço em Estoque
                    {sortConfig?.key === 'unitPrice' && (sortConfig.direction === 'asc' ? <ChevronRight size={10} className="-rotate-90" /> : <ChevronRight size={10} className="rotate-90" />)}
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Destaque de Preço</th>
                <th 
                  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Quantidade
                    {sortConfig?.key === 'quantity' && (sortConfig.direction === 'asc' ? <ChevronRight size={10} className="-rotate-90" /> : <ChevronRight size={10} className="rotate-90" />)}
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((material) => {
                  const status = getStockStatus(material);
                  const expAlert = getExpirationAlert(material.expirationDate);
                  const bestOffer = bestPrices[material.name.toLowerCase()];
                  const hasSignificantSavings = bestOffer && (material.unitPrice > bestOffer.bestPrice);

                  return (
                    <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${status.color.split(' ')[0]} bg-opacity-20 flex items-center justify-center`}>
                            {material.image ? (
                              <img src={material.image} alt={material.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={20} className={status.color.split(' ')[1]} />
                            )}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block tracking-tight">{material.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${status.color}`}>
                                {status.label}
                              </span>
                              {material.workName && (
                                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                                  {material.workName}
                                </span>
                              )}
                              {material.projectName && (
                                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  Projeto: {material.projectName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{material.category}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {material.expirationDate ? (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-black tabular-nums ${expAlert?.severity === 'critical' ? 'text-red-600' : 'text-slate-900'}`}>
                              {new Date(material.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                            {expAlert && (
                              <span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md mt-1 border ${expAlert.bg} ${expAlert.color} ${
                                expAlert.severity === 'critical' ? 'border-red-200 animate-pulse' : 
                                expAlert.severity === 'high' ? 'border-rose-200' : 'border-amber-200'
                              }`}>
                                {expAlert.icon} {expAlert.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Contínuo</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-900 text-right tabular-nums">
                        R$ {material.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {bestOffer ? (
                          <div className="flex flex-col items-center">
                            <button className={`group relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                              hasSignificantSavings ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Zap size={12} className={hasSignificantSavings ? 'animate-pulse' : ''} />
                              {hasSignificantSavings ? 'Preço Imbatível' : 'Cotação Salva'}
                              
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white rounded-xl text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl">
                                <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Melhor Fornecedor</p>
                                <p className="text-xs font-bold">{bestOffer.bestSupplier}</p>
                                {bestOffer.distance && (
                                  <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                    <MapPin size={8} />
                                    {bestOffer.distance}
                                  </p>
                                )}
                                <p className="text-xl font-black mt-2 text-emerald-400">R$ {bestOffer.bestPrice.toFixed(2)}</p>
                                {bestOffer.sourceUrl && (
                                  <a 
                                    href={bestOffer.sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="mt-2 block w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-center rounded-lg text-[9px] font-black uppercase tracking-widest pointer-events-auto flex items-center justify-center gap-2"
                                  >
                                    <ExternalLink size={10} />
                                    Ver Oferta na Loja
                                  </a>
                                )}
                                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                                  <span className="text-[8px] font-bold uppercase text-slate-400">Economia</span>
                                  <span className="text-[10px] font-black text-emerald-400">R$ {(material.unitPrice - bestOffer.bestPrice).toFixed(2)}</span>
                                </div>
                              </div>
                            </button>
                            {hasSignificantSavings && (
                              <span className="text-[8px] font-black text-emerald-600 uppercase mt-1 tracking-widest">Sugestão de Compra</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Nenhuma cotação</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg tabular-nums font-black">{material.quantity}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{material.unit}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {!readOnly && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleAutoPrice(material)}
                              disabled={isSearching === material.id}
                              className={`p-2.5 rounded-xl transition-all ${
                                isSearching === material.id 
                                  ? 'bg-blue-50 text-blue-400' 
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title="IA: Buscar Melhor Preço (até 75km)"
                            >
                              {isSearching === material.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Globe size={18} />
                              )}
                            </button>
                            {bestOffer?.sourceUrl && (
                              <a 
                                href={bestOffer.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                title="Ver Oferta na Loja"
                              >
                                <ExternalLink size={18} />
                              </a>
                            )}
                            <button 
                              onClick={() => handleRegisterPurchase(material)}
                              className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Registrar Compra (Abater do Saldo)"
                            >
                              <DollarSign size={18} />
                            </button>
                            <button 
                              onClick={() => handleEdit(material)}
                              className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(material.id, material.name)}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <div className="p-8 bg-slate-100 rounded-full mb-6">
                        <Package size={80} className="text-slate-300" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Estoque sem registros</h3>
                      <p className="text-slate-500 max-w-sm mt-2 font-medium">Cadastre os materiais para iniciar o monitoramento de validade e inteligência de preços.</p>
                      {!readOnly && (
                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                          <button 
                            onClick={() => setIsAdding(true)}
                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 transition-transform"
                          >
                            Começar Cadastro Manual
                          </button>
                          <button 
                            onClick={() => setShowQuickSuggest(true)}
                            className="px-8 py-4 bg-white border-2 border-emerald-500 text-emerald-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-50 hover:scale-105 transition-transform flex items-center gap-2"
                          >
                            <Sparkles size={18} />
                            Sugerir via IA (Descrever Obra)
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => {
            setIsAdding(false);
            setEditingId(null);
            setNewMaterial({
              name: '',
              category: 'Básico',
              quantity: 0,
              unit: 'Unidades',
              unitPrice: 0,
              minStock: 0,
              expirationDate: '',
              observations: '',
              workId: '',
              workName: ''
            });
          }} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">
                  {editingId ? 'Editar Suprimento' : 'Novo Suprimento'}
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Alimentação de Estoque</p>
              </div>
              <button onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setNewMaterial({
                  name: '',
                  category: 'Básico',
                  quantity: 0,
                  unit: 'Unidades',
                  unitPrice: 0,
                  minStock: 0,
                  expirationDate: '',
                  observations: '',
                  workId: '',
                  workName: ''
                });
              }} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição do Material</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                  placeholder="Ex: Cimento Portland CP II"
                  value={newMaterial.name} 
                  onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto do Material</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewMaterial({...newMaterial, image: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="material-photo-upload"
                  />
                  <label 
                    htmlFor="material-photo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all overflow-hidden"
                  >
                    {newMaterial.image ? (
                      <img src={newMaterial.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload da Foto</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 appearance-none" 
                    value={newMaterial.category} 
                    onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}
                  >
                    <option value="Básico">Básico</option>
                    <option value="Acabamento">Acabamento</option>
                    <option value="Ferragens">Ferragens</option>
                    <option value="Elétrico">Elétrico</option>
                    <option value="Hidráulico">Hidráulico</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Químicos">Químicos</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidade</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 appearance-none" 
                    value={newMaterial.unit} 
                    onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}
                  >
                    <option>Sacos</option>
                    <option>Peças</option>
                    <option>Unidades</option>
                    <option>m²</option>
                    <option>Metros</option>
                    <option>Litros</option>
                    <option>Kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Qtd Inicial</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500" 
                    value={newMaterial.quantity} 
                    onChange={e => setNewMaterial({...newMaterial, quantity: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço Unit. (R$)</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 focus:ring-2 focus:ring-blue-500" 
                        value={newMaterial.unitPrice || ''} 
                        onChange={e => setNewMaterial({...newMaterial, unitPrice: Number(e.target.value)})} 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newMaterial.name) return alert("Digite o nome do material primeiro.");
                        setIsSearching('form');
                        let addr = "São Paulo, SP";
                        if (newMaterial.workId) {
                          const w = works.find(x => x.id === newMaterial.workId);
                          if (w) addr = w.address;
                        } else if (works.length > 0) {
                          addr = works[0].address;
                        }
                        const res = await findBestMaterialPrice(newMaterial.name, addr);
                        if (res && res.price) {
                          setNewMaterial({...newMaterial, unitPrice: res.price, observations: `${newMaterial.observations || ''}\n[IA] Sugestão: R$ ${res.price} (${res.supplier})`.trim()});
                          // Auto-create supplier in system
                          ensureSupplierExists(res.supplier, newMaterial.category || 'Geral', res.sourceUrl);
                        }
                        setIsSearching(null);
                      }}
                      className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center"
                      title="Sugerir preço via IA"
                    >
                      {isSearching === 'form' ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projeto Técnico Vinculado (Opcional)</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 appearance-none" 
                  value={newMaterial.projectId} 
                  onChange={e => {
                    const proj = projects.find(p => p.id === e.target.value);
                    setNewMaterial({...newMaterial, projectId: e.target.value, projectName: proj?.name || '', workName: proj?.workName || newMaterial.workName});
                  }}
                >
                  <option value="">Nenhum projeto técnico</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name} - {proj.workName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obra Vinculada (para logística 75km)</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 appearance-none" 
                  value={newMaterial.workId} 
                  onChange={e => {
                    const work = works.find(w => w.id === e.target.value);
                    setNewMaterial({...newMaterial, workId: e.target.value, workName: work?.name || ''});
                  }}
                >
                  <option value="">Nenhuma obra vinculada (Geral)</option>
                  {works.map(work => (
                    <option key={work.id} value={work.id}>{work.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Validade</label>
                  <button 
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    {showCalendar ? 'Fechar Calendário' : 'Ver Calendário'}
                  </button>
                </div>
                
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                  <input 
                    type="text" 
                    readOnly
                    onClick={() => setShowCalendar(true)}
                    placeholder="Selecione no calendário abaixo"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                    value={newMaterial.expirationDate ? new Date(newMaterial.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''} 
                  />
                </div>

                {showCalendar && (
                  <div className="animate-in zoom-in-95 fade-in duration-200">
                    <MiniCalendar 
                      selectedDate={newMaterial.expirationDate || ''} 
                      onSelect={(date) => {
                        setNewMaterial({...newMaterial, expirationDate: date});
                        setShowCalendar(false);
                      }} 
                    />
                  </div>
                )}
              </div>

              <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-100 rounded-3xl text-center">
                <Package size={28} className="mx-auto text-blue-400 mb-2" />
                <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                  Controle inteligente de validade integrado. Receba notificações automáticas de vencimento para evitar desperdício de insumos.
                </p>
              </div>
            </form>
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-4">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setNewMaterial({
                    name: '',
                    category: 'Básico',
                    quantity: 0,
                    unit: 'Unidades',
                    unitPrice: 0,
                    minStock: 0,
                    expirationDate: '',
                    observations: '',
                    workId: '',
                    workName: ''
                  });
                }} 
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all">
                <Save size={18} /> 
                {editingId ? 'Atualizar Item' : 'Cadastrar Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickSuggest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowQuickSuggest(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-2xl">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Sugerir Materiais</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Inteligência Artificial Perfil</p>
                </div>
              </div>
              <button onClick={() => setShowQuickSuggest(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vincular a um Projeto (Opcional)</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Estoque Geral (Sem vínculo)</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name} - {proj.workName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">O que você vai construir ou reformar?</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                  placeholder="Ex: Reforma de banheiro social de 4m², Pintura de apartamento de 60m², Construção de muro de arrimo de 10m..."
                  value={suggestQuery}
                  onChange={(e) => setSuggestQuery(e.target.value)}
                />
              </div>

              <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-100 rounded-3xl text-center">
                <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                  A IA sugerirá uma lista básica de materiais essenciais com base na sua descrição, incluindo quantidades e preços estimados.
                </p>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setShowQuickSuggest(false)}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleQuickSuggest}
                disabled={!suggestQuery || isExtracting === 'quick'}
                className="flex-[2] py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {isExtracting === 'quick' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Gerar Lista Sugerida
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowProjectPicker(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-2xl">
                  <FileSearch size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Importar de Projeto</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Inteligência Artificial Perfil</p>
                </div>
              </div>
              <button onClick={() => setShowProjectPicker(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                {projects.length > 0 ? (
                  projects.map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => handleExtractFromProject(proj)}
                      disabled={isExtracting !== null}
                      className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all group text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Package size={24} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 uppercase tracking-tight">{proj.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{proj.workName} • {proj.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isExtracting === proj.id ? (
                          <Loader2 size={20} className="animate-spin text-emerald-600" />
                        ) : (
                          <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            Selecionar
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhum projeto técnico encontrado para importar.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                A IA analisará o título e o contexto do projeto para sugerir a lista de materiais necessária.<br/>
                Os materiais serão adicionados automaticamente ao seu estoque.
              </p>
            </div>
          </div>
        </div>
      )}

      {showEconomyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowEconomyReport(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                <TrendingDown size={140} />
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="p-5 bg-emerald-500 rounded-[2rem] shadow-xl shadow-emerald-500/20">
                  <TrendingDown size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Relatório de Economia</h2>
                  <p className="text-emerald-400 text-[10px] font-black uppercase mt-2 tracking-[0.2em]">Inteligência de Compras Perfil</p>
                </div>
              </div>
              <button onClick={() => setShowEconomyReport(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors relative z-10"><X size={28} /></button>
            </div>
            
            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Economia Total</p>
                  <p className="text-4xl font-black text-emerald-600 tracking-tighter">
                    R$ {economyData.totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                    <Zap size={12} />
                    Potencial de Redução
                  </div>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itens Otimizados</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">
                    {economyData.count}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase">
                    <CheckCircle2 size={12} />
                    Ofertas Vinculadas
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Investimento Otimizado</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">
                    R$ {economyData.totalBestValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                    <ArrowDownCircle size={12} />
                    Valor com Descontos
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Detalhamento por Material</h3>
                <div className="space-y-3">
                  {economyData.items.map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                          <Package size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 uppercase tracking-tight">{item.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {item.quantity} {item.unit} • De R$ {item.current.toFixed(2)} por R$ {item.best.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-emerald-600 tracking-tight">
                          - R$ {item.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Economia</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-10 bg-white border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-400">
                <Info size={16} />
                <p className="text-[9px] font-bold uppercase tracking-widest">Valores baseados nas últimas cotações de IA</p>
              </div>
              <button 
                onClick={() => setShowEconomyReport(false)}
                className="px-10 py-4 bg-[#0b1222] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-slate-200"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
        onConfirm={() => {
          if (confirmAction.type === 'delete') executeDelete();
          else if (confirmAction.type === 'purchase') executeRegisterPurchase(confirmAction.data);
          else if (confirmAction.type === 'sync') executeSyncAll();
          setConfirmAction({ ...confirmAction, isOpen: false });
        }}
        title={
          confirmAction.type === 'delete' ? "Excluir Material" :
          confirmAction.type === 'purchase' ? "Registrar Compra" :
          "Sincronizar Preços"
        }
        message={
          confirmAction.type === 'delete' ? `Tem certeza que deseja excluir o material "${confirmAction.name}" do estoque? Esta ação não pode ser desfeita.` :
          confirmAction.type === 'purchase' ? `Deseja registrar o pagamento de R$ ${confirmAction.data?.totalValue.toLocaleString('pt-BR')} para ${confirmAction.name}? Isso abaterá o valor do saldo principal no Dashboard.` :
          "Deseja atualizar os preços de todos os materiais via IA? Isso pode levar alguns minutos."
        }
      />
    </div>
  );
};

export default Materiais;
