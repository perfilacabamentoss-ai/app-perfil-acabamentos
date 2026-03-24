
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Truck, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2,
  Filter,
  Tag,
  X,
  Save,
  QrCode,
  Image as ImageIcon,
  History,
  Trash2,
  Download,
  Pencil
} from 'lucide-react';
import { Invoice, Supplier, ScannedQR, Payment, Material, View } from '../types';
import ConfirmModal from './ConfirmModal';
import QRScanner from './QRScanner';
import { QRCodeCanvas } from 'qrcode.react';
import { Package, ShoppingCart } from 'lucide-react';

const Faturas: React.FC<{ onNavigate?: (view: View) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'faturas' | 'materiais'>('faturas');
  const [faturas, setFaturas] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('perfil_faturas');
    return saved ? JSON.parse(saved) : [];
  });
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('perfil_materials');
    return saved ? JSON.parse(saved) : [];
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('perfil_suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  const [qrGallery, setQrGallery] = useState<ScannedQR[]>(() => {
    const saved = localStorage.getItem('perfil_qr_gallery');
    return saved ? JSON.parse(saved) : [];
  });
  const [projects] = useState<any[]>(() => {
    const saved = localStorage.getItem('perfil_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const loadData = () => {
    const savedFaturas = localStorage.getItem('perfil_faturas');
    if (savedFaturas) setFaturas(JSON.parse(savedFaturas));
    
    const savedMaterials = localStorage.getItem('perfil_materials');
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
    
    const savedSuppliers = localStorage.getItem('perfil_suppliers');
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
    
    const savedQR = localStorage.getItem('perfil_qr_gallery');
    if (savedQR) setQrGallery(JSON.parse(savedQR));
  };

  useEffect(() => {
    window.addEventListener('storage', loadData);
    window.addEventListener('perfil_sync_complete', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('perfil_sync_complete', loadData);
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'invoice' | 'material' | 'all' | 'qr' | 'pay_material';
    id?: string;
    name?: string;
    data?: any;
  }>({
    isOpen: false,
    type: 'invoice',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [newFatura, setNewFatura] = useState<Partial<Invoice>>({
    supplierId: '',
    supplierName: '',
    issueDate: new Date().toLocaleDateString('pt-BR'),
    dueDate: '',
    value: 0,
    status: 'Pendente',
    category: 'Materiais',
    product: ''
  });

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
    workName: ''
  });

  useEffect(() => {
    localStorage.setItem('perfil_faturas', JSON.stringify(faturas));
  }, [faturas]);

  useEffect(() => {
    localStorage.setItem('perfil_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('perfil_qr_gallery', JSON.stringify(qrGallery));
  }, [qrGallery]);

  const stats = useMemo(() => {
    const pendente = faturas.filter(f => f.status === 'Pendente').reduce((acc, curr) => acc + curr.value, 0);
    const atrasado = faturas.filter(f => f.status === 'Atrasado').reduce((acc, curr) => acc + curr.value, 0);
    const pago = faturas.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
    return { pendente, atrasado, pago };
  }, [faturas]);

  const filtered = faturas.filter(f => 
    f.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFatura.supplierName || !newFatura.value || !newFatura.dueDate) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingId) {
      const oldFatura = faturas.find(f => f.id === editingId);
      const updatedFaturas = faturas.map(f => f.id === editingId ? {
        ...f,
        supplierId: newFatura.supplierId || f.supplierId,
        supplierName: newFatura.supplierName || f.supplierName,
        dueDate: newFatura.dueDate || f.dueDate,
        value: Number(newFatura.value),
        status: newFatura.status as any,
        category: newFatura.category || f.category,
        product: newFatura.product || ''
      } : f);
      setFaturas(updatedFaturas);

      // If status changed to Pago or was already Pago but value changed
      if (newFatura.status === 'Pago') {
        const fatura = updatedFaturas.find(f => f.id === editingId);
        if (fatura) {
          registerPaymentFromFatura(fatura);
        }
      }
    } else {
      const fatura: Invoice = {
        id: Date.now().toString(),
        supplierId: newFatura.supplierId || 'manual',
        supplierName: newFatura.supplierName!,
        issueDate: newFatura.issueDate || new Date().toLocaleDateString('pt-BR'),
        dueDate: newFatura.dueDate!,
        value: Number(newFatura.value),
        status: newFatura.status as 'Pendente' | 'Pago' | 'Atrasado',
        category: newFatura.category || 'Geral',
        product: newFatura.product || ''
      };
      setFaturas([fatura, ...faturas]);
      
      if (fatura.status === 'Pago') {
        registerPaymentFromFatura(fatura);
      }
    }

    setIsAdding(false);
    setEditingId(null);
    setNewFatura({
      supplierId: '',
      supplierName: '',
      issueDate: new Date().toLocaleDateString('pt-BR'),
      dueDate: '',
      value: 0,
      status: 'Pendente',
      category: 'Materiais',
      product: ''
    });
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    
    // Simulate parsing data from QR Code (PIX or NFC-e)
    // In a real app, you would fetch data from the URL or parse the PIX string
    let simulatedValue = 0;
    let simulatedSupplier = "Compra Extra via QR";
    
    if (decodedText.includes('pix')) {
      simulatedValue = 150.00; // Example value
      simulatedSupplier = "Pagamento PIX";
    } else {
      simulatedValue = Math.floor(Math.random() * 500) + 50;
    }

    const fatura: Invoice = {
      id: Date.now().toString(),
      supplierId: 'qr-scan',
      supplierName: simulatedSupplier,
      issueDate: new Date().toLocaleDateString('pt-BR'),
      dueDate: new Date().toLocaleDateString('pt-BR'),
      value: simulatedValue,
      status: 'Pago', // QR scan usually implies immediate payment
      category: 'Materiais'
    };

    // Save to QR Gallery
    const newQR: ScannedQR = {
      id: Date.now().toString(),
      data: decodedText,
      timestamp: new Date().toLocaleString('pt-BR'),
      type: decodedText.includes('pix') ? 'PIX' : 'Nota Fiscal',
      value: simulatedValue
    };
    setQrGallery([newQR, ...qrGallery]);

    setFaturas([fatura, ...faturas]);
    registerPaymentFromFatura(fatura);
    alert(`Compra extra registrada com sucesso!\nFornecedor: ${simulatedSupplier}\nValor: R$ ${simulatedValue.toFixed(2)}`);
  };

  const registerPaymentFromFatura = (fatura: Invoice) => {
    const savedPayments = JSON.parse(localStorage.getItem('perfil_payments') || '[]') as Payment[];
    const newPayment: Payment = {
      id: `inv-${fatura.id}`,
      recipientId: fatura.supplierId,
      recipientName: fatura.supplierName,
      type: 'Fornecedor',
      value: fatura.value,
      date: new Date().toISOString().split('T')[0],
      status: 'Pago',
      reference: `Fatura: ${fatura.product || 'Geral'}`,
      workId: 'Geral',
      workName: 'Geral'
    };
    
    // Avoid duplicates or update existing
    const filtered = savedPayments.filter(p => p.id !== newPayment.id);
    localStorage.setItem('perfil_payments', JSON.stringify([...filtered, newPayment]));
    window.dispatchEvent(new Event('storage'));
  };

  const handleStatusChange = (id: string, newStatus: 'Pendente' | 'Pago' | 'Atrasado') => {
    const updatedFaturas = faturas.map(f => f.id === id ? { ...f, status: newStatus } : f);
    setFaturas(updatedFaturas);

    if (newStatus === 'Pago') {
      const fatura = updatedFaturas.find(f => f.id === id);
      if (fatura) {
        registerPaymentFromFatura(fatura);
      }
    } else {
      // If it was Pago and now it's not, remove the payment record
      const savedPayments = JSON.parse(localStorage.getItem('perfil_payments') || '[]') as Payment[];
      const filtered = savedPayments.filter(p => p.id !== `inv-${id}`);
      localStorage.setItem('perfil_payments', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handlePayMaterial = (material: Material) => {
    const totalValue = material.quantity * material.unitPrice;
    if (totalValue <= 0) {
      alert("Valor inválido para pagamento.");
      return;
    }

    setConfirmAction({
      isOpen: true,
      type: 'pay_material',
      id: material.id,
      name: material.name,
      data: { totalValue, material }
    });
  };

  const executePayMaterial = (data: any) => {
    const { totalValue, material } = data;
    const savedPayments = JSON.parse(localStorage.getItem('perfil_payments') || '[]') as Payment[];
    
    const newPayment: Payment = {
      id: `mat-${material.id}-${Date.now()}`,
      recipientId: material.bestSupplierName || 'Fornecedor Geral',
      recipientName: material.bestSupplierName || 'Fornecedor Geral',
      type: 'Fornecedor',
      value: totalValue,
      date: new Date().toISOString().split('T')[0],
      status: 'Pago',
      reference: `Material: ${material.name} (${material.quantity} ${material.unit})`,
      workId: material.workId || 'Geral',
      workName: material.workName || 'Geral'
    };

    const updated = [...savedPayments, newPayment];
    localStorage.setItem('perfil_payments', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    alert("Pagamento do material registrado com sucesso! O Dashboard será atualizado.");
  };

  const handleEdit = (fatura: Invoice) => {
    setNewFatura({
      supplierId: fatura.supplierId,
      supplierName: fatura.supplierName,
      issueDate: fatura.issueDate,
      dueDate: fatura.dueDate,
      value: fatura.value,
      status: fatura.status,
      category: fatura.category,
      product: fatura.product || ''
    });
    setEditingId(fatura.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string, invoiceNumber: string) => {
    setConfirmAction({ isOpen: true, type: 'invoice', id, name: invoiceNumber });
  };

  const executeDelete = () => {
    if (confirmAction.type === 'invoice') {
      const { id } = confirmAction;
      setFaturas(prev => prev.filter(f => f.id !== id));
      
      const savedPayments = JSON.parse(localStorage.getItem('perfil_payments') || '[]') as Payment[];
      const filtered = savedPayments.filter(p => p.id !== `inv-${id}`);
      localStorage.setItem('perfil_payments', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    } else if (confirmAction.type === 'material') {
      const { id } = confirmAction;
      setMaterials(prev => {
        const updated = prev.filter(m => m.id !== id);
        localStorage.setItem('perfil_materials', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        return updated;
      });
    } else if (confirmAction.type === 'all') {
      setFaturas([]);
      localStorage.removeItem('perfil_faturas');
    } else if (confirmAction.type === 'qr') {
      setQrGallery(qrGallery.filter(q => q.id !== confirmAction.id));
    }
  };

  const handleEditMaterial = (material: Material) => {
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
      workName: material.workName
    });
    setEditingMaterialId(material.id);
    setIsAddingMaterial(true);
  };

  const handleDeleteMaterial = (id: string, name: string) => {
    setConfirmAction({ isOpen: true, type: 'material', id, name });
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name) {
      alert("Por favor, preencha o nome do material.");
      return;
    }

    let updatedMaterials: Material[];
    if (editingMaterialId) {
      updatedMaterials = materials.map(m => String(m.id) === String(editingMaterialId) ? { ...m, ...newMaterial } as Material : m);
    } else {
      const materialToAdd: Material = {
        id: Math.random().toString(36).substr(2, 9),
        name: newMaterial.name || '',
        category: newMaterial.category || 'Básico',
        quantity: newMaterial.quantity || 0,
        unit: newMaterial.unit || 'Unidades',
        unitPrice: newMaterial.unitPrice || 0,
        minStock: newMaterial.minStock || 0,
        expirationDate: newMaterial.expirationDate || '',
        observations: newMaterial.observations || '',
        workId: newMaterial.workId || '',
        workName: newMaterial.workName || '',
        lastRestock: new Date().toLocaleDateString('pt-BR')
      };
      updatedMaterials = [materialToAdd, ...materials];
    }

    setMaterials(updatedMaterials);
    localStorage.setItem('perfil_materials', JSON.stringify(updatedMaterials));
    window.dispatchEvent(new Event('storage'));

    setIsAddingMaterial(false);
    setEditingMaterialId(null);
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
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Faturas</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão de contas a pagar e faturas de fornecedores</p>
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 w-full md:w-auto">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.PAGAMENTOS)}
              className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
            >
              Pagamentos
            </button>
          )}
          <button 
            onClick={() => setConfirmAction({ isOpen: true, type: 'all', name: 'todas as faturas' })}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-rose-100"
          >
            <Trash2 size={20} />
            Limpar
          </button>
          <button 
            onClick={() => setShowGallery(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm"
          >
            <History size={20} />
            <span className="whitespace-nowrap">Galeria QR</span>
          </button>
          <button 
            onClick={() => setIsScanning(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg"
          >
            <QrCode size={20} />
            <span className="whitespace-nowrap">QR Code</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            <span className="whitespace-nowrap">Nova Fatura</span>
          </button>
        </div>
      </div>

      {isScanning && (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total em Aberto</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-blue-500">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase">Vencendo em breve</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Atrasado</p>
          <h3 className="text-2xl font-black text-rose-600">R$ {stats.atrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-rose-500">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase">Ação Necessária</span>
          </div>
        </div>
        <div className="bg-[#0b1222] p-6 rounded-3xl shadow-xl text-white">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Pago este Mês</p>
          <h3 className="text-2xl font-black">R$ {stats.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-emerald-400">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-bold uppercase">Fluxo de Caixa Saudável</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('faturas')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'faturas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList size={14} />
            Faturas
          </button>
          <button 
            onClick={() => setActiveTab('materiais')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'materiais' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package size={14} />
            Materiais
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'faturas' ? "Buscar por fornecedor ou categoria..." : "Buscar por material ou categoria..."}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-center gap-2 font-bold text-sm hover:bg-slate-100 transition-all">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {activeTab === 'faturas' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                          <Truck size={16} />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{f.supplierName}</span>
                      </div>
                      {f.product && (
                        <span className="text-[10px] text-slate-400 font-medium mt-1 ml-11 uppercase tracking-wider">
                          Prod: {f.product}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <Tag size={12} className="text-blue-400" />
                      {f.category}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 text-sm font-medium ${f.status === 'Atrasado' ? 'text-rose-500' : 'text-slate-500'}`}>
                      <Calendar size={14} />
                      {f.dueDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 text-sm">
                      R$ {f.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      f.status === 'Pago' ? 'bg-emerald-50 text-emerald-600' : 
                      f.status === 'Atrasado' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {f.status === 'Pago' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {f.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {f.status !== 'Pago' && (
                        <button 
                          onClick={() => handleStatusChange(f.id, 'Pago')}
                          className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Marcar como Pago"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(f)}
                        className="text-amber-500 p-2 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(f.id, f.supplierName)}
                        className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma fatura encontrada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMaterials.length > 0 ? filteredMaterials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Package size={16} />
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                      {m.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-600">
                      {m.quantity} {m.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 text-sm">
                      R$ {(m.quantity * m.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handlePayMaterial(m)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                      >
                        <DollarSign size={14} />
                        Pago
                      </button>
                      <button 
                        onClick={() => handleEditMaterial(m)}
                        className="text-amber-500 p-2 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar Material"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMaterial(m.id, m.name)}
                        className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir Material"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum material encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Galeria QR */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowGallery(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Galeria de QR Codes</h2>
                <p className="text-blue-400 text-[10px] font-black uppercase mt-2 tracking-widest">Histórico de Leituras Realizadas</p>
              </div>
              <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {qrGallery.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {qrGallery.map((qr) => (
                    <div key={qr.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col items-center group hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all">
                      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100">
                        <QRCodeCanvas value={qr.data} size={120} />
                      </div>
                      <div className="text-center w-full">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            qr.type === 'PIX' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {qr.type}
                          </span>
                          <span className="text-[10px] font-black text-slate-900">
                            R$ {qr.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-3">{qr.timestamp}</p>
                        
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              const canvas = document.querySelector(`canvas[value="${qr.data}"]`) as HTMLCanvasElement;
                              if (canvas) {
                                const url = canvas.toDataURL("image/png");
                                const link = document.createElement('a');
                                link.download = `qr-code-${qr.id}.png`;
                                link.href = url;
                                link.click();
                              }
                            }}
                            className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                            title="Baixar QR Code"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ isOpen: true, type: 'qr', id: qr.id, name: 'este registro da galeria' })}
                            className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400">
                  <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Sua galeria está vazia</p>
                  <p className="text-[10px] mt-2">Escaneie um QR Code para salvá-lo aqui automaticamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Fatura */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAdding(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">
                  {editingId ? 'Editar Fatura' : 'Nova Fatura'}
                </h2>
                <p className="text-blue-400 text-[10px] font-black uppercase mt-2 tracking-widest">
                  {editingId ? 'Atualização de Lançamento' : 'Lançamento de Contas a Pagar'}
                </p>
              </div>
              <button onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setNewFatura({
                  supplierId: '',
                  supplierName: '',
                  issueDate: new Date().toLocaleDateString('pt-BR'),
                  dueDate: '',
                  value: 0,
                  status: 'Pendente',
                  category: 'Materiais',
                  product: ''
                });
              }} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fornecedor</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newFatura.supplierId}
                    onChange={e => {
                      const s = suppliers.find(sup => sup.id === e.target.value);
                      setNewFatura({ ...newFatura, supplierId: e.target.value, supplierName: s?.name || '' });
                    }}
                  >
                    <option value="">Selecionar Fornecedor</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="manual">Outro (Manual)</option>
                  </select>
                </div>

                {newFatura.supplierId === 'manual' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Fornecedor</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newFatura.supplierName}
                      onChange={e => setNewFatura({ ...newFatura, supplierName: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Produto / Serviço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cimento CP-II 50kg"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newFatura.product}
                    onChange={e => setNewFatura({ ...newFatura, product: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newFatura.value}
                      onChange={e => setNewFatura({ ...newFatura, value: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vencimento</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      onChange={e => {
                        const date = new Date(e.target.value);
                        setNewFatura({ ...newFatura, dueDate: date.toLocaleDateString('pt-BR') });
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                    <select 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newFatura.category}
                      onChange={e => setNewFatura({ ...newFatura, category: e.target.value })}
                    >
                      <option value="Materiais">Materiais</option>
                      <option value="Serviços">Serviços</option>
                      <option value="Equipamentos">Equipamentos</option>
                      <option value="Logística">Logística</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status Inicial</label>
                    <select 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newFatura.status}
                      onChange={e => setNewFatura({ ...newFatura, status: e.target.value as any })}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setNewFatura({
                      supplierId: '',
                      supplierName: '',
                      issueDate: new Date().toLocaleDateString('pt-BR'),
                      dueDate: '',
                      value: 0,
                      status: 'Pendente',
                      category: 'Materiais'
                    });
                  }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingId ? 'Atualizar Fatura' : 'Salvar Fatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Material (Edit/Add) */}
      {isAddingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddingMaterial(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">
                  {editingMaterialId ? 'Editar Material' : 'Novo Material'}
                </h2>
                <p className="text-blue-400 text-[10px] font-black uppercase mt-2 tracking-widest">
                  Gestão de Estoque
                </p>
              </div>
              <button onClick={() => {
                setIsAddingMaterial(false);
                setEditingMaterialId(null);
              }} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Material</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newMaterial.name}
                  onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular a um Projeto (Opcional)</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  value={newMaterial.workId}
                  onChange={e => {
                    const proj = projects.find(p => p.id === e.target.value);
                    setNewMaterial({ 
                      ...newMaterial, 
                      workId: e.target.value, 
                      workName: proj ? proj.workName : '' 
                    });
                  }}
                >
                  <option value="">Estoque Geral (Sem vínculo)</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name} - {proj.workName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMaterial.category}
                    onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value })}
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMaterial.unit}
                    onChange={e => setNewMaterial({ ...newMaterial, unit: e.target.value })}
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantidade</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMaterial.quantity}
                    onChange={e => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço Unitário</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMaterial.unitPrice}
                    onChange={e => setNewMaterial({ ...newMaterial, unitPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingMaterial(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Salvar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
        onConfirm={() => {
          if (confirmAction.type === 'pay_material') executePayMaterial(confirmAction.data);
          else executeDelete();
          setConfirmAction({ ...confirmAction, isOpen: false });
        }}
        title={
          confirmAction.type === 'invoice' ? "Excluir Fatura" :
          confirmAction.type === 'material' ? "Excluir Material" :
          confirmAction.type === 'all' ? "Limpar Tudo" :
          confirmAction.type === 'qr' ? "Excluir Registro" :
          "Confirmar Pagamento"
        }
        message={
          confirmAction.type === 'invoice' ? `Tem certeza que deseja excluir a fatura de "${confirmAction.name}"? Esta ação removerá também todos os pagamentos associados e não pode ser desfeita.` :
          confirmAction.type === 'material' ? `Deseja realmente excluir o material "${confirmAction.name}" do estoque?` :
          confirmAction.type === 'all' ? "Deseja apagar todas as faturas? Esta ação não pode ser desfeita." :
          confirmAction.type === 'qr' ? "Deseja excluir este registro da galeria?" :
          `Deseja confirmar o pagamento de R$ ${confirmAction.data?.totalValue.toLocaleString('pt-BR')} para o material: ${confirmAction.name}?`
        }
        confirmText={confirmAction.type === 'pay_material' ? "Confirmar" : "Excluir"}
      />
    </div>
  );
};

export default Faturas;
