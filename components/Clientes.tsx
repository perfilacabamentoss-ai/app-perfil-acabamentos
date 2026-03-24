
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  X, 
  Save, 
  Trash2, 
  Pencil,
  UserPlus,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Eye,
  EyeOff,
  Camera,
  ChevronRight
} from 'lucide-react';
import { Client, View } from '../types';
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
  orderBy
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../App';

const Clientes: React.FC<{ readOnly?: boolean; onNavigate?: (view: View) => void }> = ({ readOnly, onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clientsCollectionRef = collection(db, 'clients');
    const q = query(clientsCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [visibleData, setVisibleData] = useState<Record<string, { phone?: boolean; cpf?: boolean }>>({});

  const toggleVisibility = (clientId: string, field: 'phone' | 'cpf') => {
    setVisibleData(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [field]: !prev[clientId]?.[field]
      }
    }));
  };

  const maskData = (data: string, isVisible: boolean) => {
    if (isVisible) return data;
    return data.replace(/./g, '*').substring(0, 12);
  };
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    cpf_cnpj: '',
    status: 'Ativo',
    observations: '',
    whatsappPhoto: ''
  });

  useEffect(() => {
    localStorage.setItem('perfil_clientes', JSON.stringify(clients));
  }, [clients]);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;

    try {
      if (editingClientId) {
        const clientRef = doc(db, 'clients', editingClientId);
        await updateDoc(clientRef, { ...newClient });
      } else {
        const clientToAdd: Client = {
          ...newClient as Client,
          id: '', // Firestore will generate ID
          registrationDate: new Date().toLocaleDateString('pt-BR')
        };
        await addDoc(collection(db, 'clients'), clientToAdd);
      }

      setIsAddingClient(false);
      setEditingClientId(null);
      setNewClient({ name: '', email: '', phone: '', address: '', cpf_cnpj: '', status: 'Ativo', observations: '', whatsappPhoto: '' });
    } catch (error) {
      handleFirestoreError(error, editingClientId ? OperationType.UPDATE : OperationType.CREATE, 'clients');
    }
  };

  const handleEditClient = (client: Client) => {
    setNewClient(client);
    setEditingClientId(client.id);
    setIsAddingClient(true);
  };

  const handleDeleteClient = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await deleteDoc(doc(db, 'clients', confirmDelete.id));
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${confirmDelete.id}`);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpf_cnpj && c.cpf_cnpj.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Registro de Clientes</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão e cadastro de proprietários e contratantes</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.OBRAS)}
              className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              Obra
            </button>
          )}
          {!readOnly && (
            <button 
              onClick={() => setIsAddingClient(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
            >
              <UserPlus size={20} />
              Novo Cliente
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                {client.whatsappPhoto ? (
                  <img src={client.whatsappPhoto} alt={client.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-100 group-hover:border-blue-600 transition-colors" />
                ) : (
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                  client.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {client.status}
                </span>
              </div>
            </div>
            
            <h3 
              onClick={() => {
                localStorage.setItem('perfil_project_filter_client', client.name);
                onNavigate?.(View.PROJETOS);
              }}
              className="text-xl font-black text-slate-900 mb-4 truncate cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              {client.name}
              <ChevronRight size={16} className="text-slate-300" />
            </h3>
            
            <div className="space-y-3">
              {client.phone && (
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <Phone size={14} className="text-blue-500" />
                    <span className="font-medium">
                      {maskData(client.phone, visibleData[client.id]?.phone ?? false)}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleVisibility(client.id, 'phone')}
                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    {visibleData[client.id]?.phone ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Mail size={14} className="text-blue-500" />
                  <span className="font-medium truncate">{client.email}</span>
                </div>
              )}
              {client.cpf_cnpj && (
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <CreditCard size={14} className="text-blue-500" />
                    <span className="font-medium">
                      {maskData(client.cpf_cnpj, visibleData[client.id]?.cpf ?? false)}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleVisibility(client.id, 'cpf')}
                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    {visibleData[client.id]?.cpf ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="font-medium truncate">{client.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2 border-t border-slate-50">
                <Calendar size={12} />
                Desde {client.registrationDate}
              </div>
            </div>

            {!readOnly && (
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditClient(client)}
                  className="p-2 bg-white text-amber-500 rounded-xl shadow-sm border border-slate-100 hover:bg-amber-50 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteClient(client.id, client.name)}
                  className="p-2 bg-white text-rose-500 rounded-xl shadow-sm border border-slate-100 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-8 rounded-full mb-6">
              <Users size={64} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Nenhum cliente encontrado</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Cadastre seus clientes para gerenciar melhor suas obras e propostas.</p>
            {!readOnly && (
              <button 
                onClick={() => setIsAddingClient(true)}
                className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Cadastrar Primeiro Cliente
              </button>
            )}
          </div>
        )}
      </div>

      {isAddingClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddingClient(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Cadastro de Proprietário</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingClient(false);
                  setEditingClientId(null);
                  setNewClient({ name: '', email: '', phone: '', address: '', cpf_cnpj: '', status: 'Ativo', observations: '', whatsappPhoto: '' });
                }} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-8 flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CPF / CNPJ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newClient.cpf_cnpj}
                    onChange={e => setNewClient({...newClient, cpf_cnpj: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    value={newClient.status}
                    onChange={e => setNewClient({...newClient, status: e.target.value as any})}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                  <input 
                    type="email" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newClient.address}
                    onChange={e => setNewClient({...newClient, address: e.target.value})}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Foto do WhatsApp (URL)</label>
                <div className="relative">
                  <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newClient.whatsappPhoto}
                    onChange={e => setNewClient({...newClient, whatsappPhoto: e.target.value})}
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observações</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-4 text-blue-500" size={16} />
                  <textarea 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                    value={newClient.observations}
                    onChange={e => setNewClient({...newClient, observations: e.target.value})}
                    placeholder="Notas adicionais sobre o cliente..."
                  />
                </div>
              </div>
            </form>

            <div className="p-8 border-t bg-slate-50 flex gap-4">
              <button 
                onClick={() => {
                  setIsAddingClient(false);
                  setEditingClientId(null);
                  setNewClient({ name: '', email: '', phone: '', address: '', cpf_cnpj: '', status: 'Ativo', observations: '', whatsappPhoto: '' });
                }} 
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveClient}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingClientId ? 'Atualizar Dados' : 'Salvar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${confirmDelete.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};

export default Clientes;
