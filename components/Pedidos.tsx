import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  X,
  Save,
  Package,
  Truck,
  DollarSign
} from 'lucide-react';
import { Material, Project } from '../types';

interface Order {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  supplier: string;
  status: 'Pendente' | 'Aprovado' | 'Enviado' | 'Entregue' | 'Cancelado';
  date: string;
  estimatedDelivery?: string;
  totalValue: number;
  workId?: string;
  workName?: string;
}

const Pedidos: React.FC = () => {
  // Load materials from localStorage
  const [materials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('perfil_materials');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Load works from localStorage
  const [works] = useState<Project[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('perfil_orders');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'o1',
        materialId: 'm1',
        materialName: 'Tubo 100 mm',
        quantity: 50,
        unit: 'Metros',
        supplier: 'Hidráulica Central',
        status: 'Entregue',
        date: '02/02/2024',
        totalValue: 2250.00,
        workName: 'Residencial Horizonte'
      },
      {
        id: 'o2',
        materialId: 'm7',
        materialName: 'Caixa de gordura',
        quantity: 2,
        unit: 'Unidades',
        supplier: 'Materiais Silva',
        status: 'Pendente',
        date: '10/02/2024',
        totalValue: 240.00,
        workName: 'Edifício Central'
      }
    ];
  });

  // Save orders to localStorage
  React.useEffect(() => {
    localStorage.setItem('perfil_orders', JSON.stringify(orders));
  }, [orders]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [isCreating, setIsCreating] = useState(false);

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    materialId: '',
    quantity: 0,
    supplier: '',
    status: 'Pendente',
    date: new Date().toLocaleDateString('pt-BR'),
    workId: '',
    totalValue: 0
  });

  const handleSaveOrder = () => {
    if (!newOrder.materialId || !newOrder.quantity || !newOrder.supplier) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const selectedMaterial = materials.find(m => m.id === newOrder.materialId);
    const selectedWork = works.find(w => w.id === newOrder.workId);

    const orderToAdd: Order = {
      ...newOrder as Order,
      id: Math.random().toString(36).substr(2, 9),
      materialName: selectedMaterial?.name || '',
      unit: selectedMaterial?.unit || '',
      workName: selectedWork?.name || '',
      totalValue: (selectedMaterial?.unitPrice || 0) * (newOrder.quantity || 0)
    };

    setOrders([orderToAdd, ...orders]);
    setIsCreating(false);
    setNewOrder({
      materialId: '',
      quantity: 0,
      supplier: '',
      status: 'Pendente',
      date: new Date().toLocaleDateString('pt-BR'),
      workId: '',
      totalValue: 0
    });
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.materialName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Pedidos de Materiais</h1>
          <p className="text-slate-500 mt-2 font-medium">Gerencie suas ordens de compra e entregas</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendentes</p>
            <h3 className="text-2xl font-black text-slate-900">{orders.filter(o => o.status === 'Pendente').length} Pedidos</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Trânsito</p>
            <h3 className="text-2xl font-black text-slate-900">{orders.filter(o => o.status === 'Enviado').length} Pedidos</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregues (Mês)</p>
            <h3 className="text-2xl font-black text-slate-900">{orders.filter(o => o.status === 'Entregue').length} Pedidos</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por material ou fornecedor..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="w-full md:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="Todos">Todos Status</option>
          <option value="Pendente">Pendente</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Enviado">Enviado</option>
          <option value="Entregue">Entregue</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd / Un</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">#{order.id}</span>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{order.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{order.materialName}</p>
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{order.workName || 'Geral'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-700">{order.quantity}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.unit}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-600">{order.supplier}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      order.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'Enviado' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-slate-900">
                      R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <ShoppingBag size={32} />
            </div>
            <p className="text-slate-500 font-medium">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#0b1222] text-white">
              <h2 className="text-xl font-bold uppercase tracking-tight">Novo Pedido de Compra</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material do Estoque</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newOrder.materialId}
                    onChange={e => setNewOrder({...newOrder, materialId: e.target.value})}
                  >
                    <option value="">Selecione um material...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit} em estoque)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="0"
                      value={newOrder.quantity || ''}
                      onChange={e => setNewOrder({...newOrder, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Nome do fornecedor"
                      value={newOrder.supplier}
                      onChange={e => setNewOrder({...newOrder, supplier: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Obra Destino</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newOrder.workId}
                    onChange={e => setNewOrder({...newOrder, workId: e.target.value})}
                  >
                    <option value="">Uso Geral / Almoxarifado</option>
                    {works.map(work => (
                      <option key={work.id} value={work.id}>{work.name}</option>
                    ))}
                  </select>
                </div>

                {newOrder.materialId && newOrder.quantity && (
                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Valor Estimado</span>
                      <span className="text-xl font-black text-blue-600">
                        R$ {((materials.find(m => m.id === newOrder.materialId)?.unitPrice || 0) * (newOrder.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-8 border-t bg-slate-50 flex gap-4">
              <button onClick={() => setIsCreating(false)} className="flex-1 py-4 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
              <button onClick={handleSaveOrder} className="flex-[2] py-4 bg-blue-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest"><Save size={18} /> Criar Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
