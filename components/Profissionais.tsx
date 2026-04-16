
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserPlus, 
  Users,
  Search, 
  MapPin, 
  Star, 
  MessageSquare, 
  MessageCircle,
  Facebook,
  Copy,
  ImageIcon, 
  FileText, 
  CheckCircle, 
  X, 
  Send, 
  Upload, 
  Briefcase, 
  Phone, 
  Mail, 
  ArrowRight,
  Filter,
  ChevronRight,
  Award,
  Clock,
  ThumbsUp,
  Camera,
  Trash2,
  Settings,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  LogOut,
  Wallet,
  ArrowLeft,
  Hammer,
  Share2,
  DollarSign,
  Video
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  MarketplaceProfessional, 
  MarketplaceClient, 
  MarketplaceServiceRequest, 
  MarketplaceChatMessage, 
  MarketplaceReview,
  View 
} from '../types';
import ConfirmModal from './ConfirmModal';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

const WORK_TYPES = [
  'Reforma de apartamento', 'Construção', 'Pequenos reparos', 'Instalação específica', 'Acabamentos'
];

const FloatingAIBubble: React.FC<{
  materials: string[];
  isLoading: boolean;
  onClose: () => void;
}> = ({ materials, isLoading, onClose }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[100] w-80 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-blue-100 overflow-hidden">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="animate-pulse" />
            <span className="font-black text-xs uppercase tracking-widest">Sugestão IA</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gerando lista de materiais...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Materiais Recomendados:</p>
              <ul className="space-y-2">
                {materials.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all mt-4"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Profissionais: React.FC<{ 
  onNavigate?: (view: View) => void; 
  defaultTab?: 'find' | 'register_pro' | 'register_client' | 'dashboard_pro' | 'dashboard_client' | 'publish_request' | 'login' | 'manage' | 'feedback' | 'wallet';
  onTabChange?: (tab: 'find' | 'register_pro' | 'register_client' | 'dashboard_pro' | 'dashboard_client' | 'publish_request' | 'login' | 'manage' | 'feedback' | 'wallet') => void;
  loggedUser: { type: 'pro' | 'client', id: string } | null;
  setLoggedUser: (user: { type: 'pro' | 'client', id: string } | null) => void;
  isModal?: boolean;
  onClose?: () => void;
}> = ({ onNavigate, defaultTab, onTabChange, loggedUser, setLoggedUser, isModal, onClose }) => {
  const [specialties, setSpecialties] = useState<string[]>([
    'Pedreiro', 'Azulejista', 'Gesseiro', 'Pintor', 'Eletricista', 'Encanador', 
    'Marceneiro', 'Vidraceiro', 'Serralheiro', 'Impermeabilização', 
    'Instalador de drywall', 'Instalador de porcelanato', 'Instalador de ar condicionado'
  ]);

  const [newSpecialty, setNewSpecialty] = useState('');
  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>([]);
  const [marketplaceClients, setMarketplaceClients] = useState<MarketplaceClient[]>([]);
  const [serviceRequests, setServiceRequests] = useState<MarketplaceServiceRequest[]>([]);
  const [messages, setMessages] = useState<MarketplaceChatMessage[]>([]);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [feedbacks, setFeedbacks] = useState<{id: string, type: 'Sugestão' | 'Reclamação', text: string, date: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubPros = onSnapshot(collection(db, 'marketplace_professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarketplaceProfessional[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'marketplace_professionals'));

    const unsubClients = onSnapshot(collection(db, 'marketplace_clients'), (snapshot) => {
      setMarketplaceClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarketplaceClient[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'marketplace_clients'));

    const unsubRequests = onSnapshot(collection(db, 'marketplace_requests'), (snapshot) => {
      setServiceRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarketplaceServiceRequest[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'marketplace_requests'));

    const unsubMessages = onSnapshot(collection(db, 'marketplace_messages'), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarketplaceChatMessage[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'marketplace_messages'));

    const unsubReviews = onSnapshot(collection(db, 'marketplace_reviews'), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarketplaceReview[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'marketplace_reviews'));

    const unsubFeedbacks = onSnapshot(collection(db, 'marketplace_feedbacks'), (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'marketplace_feedbacks'));

    const unsubSpecialties = onSnapshot(collection(db, 'marketplace_specialties'), (snapshot) => {
      if (!snapshot.empty) {
        const specs = snapshot.docs.map(doc => doc.data().name as string);
        setSpecialties(specs);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'marketplace_specialties'));

    setIsLoading(false);

    const handleTriggerAI = () => {
      generateMaterialsWithAI("Simulação de Reforma Geral", "Reforma");
    };

    window.addEventListener('trigger_ai_suggestion', handleTriggerAI);

    return () => {
      unsubPros();
      unsubClients();
      unsubRequests();
      unsubMessages();
      unsubReviews();
      unsubFeedbacks();
      unsubSpecialties();
      window.removeEventListener('trigger_ai_suggestion', handleTriggerAI);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'find' | 'register_pro' | 'register_client' | 'dashboard_pro' | 'dashboard_client' | 'publish_request' | 'manage' | 'feedback' | 'login' | 'wallet'>(defaultTab || 'find');

  const lastDefaultTab = useRef(defaultTab);
  useEffect(() => {
    if (defaultTab && defaultTab !== lastDefaultTab.current) {
      setActiveTab(defaultTab);
      lastDefaultTab.current = defaultTab;
    }
  }, [defaultTab]);

  useEffect(() => {
    if (onTabChange && activeTab !== lastDefaultTab.current) {
      onTabChange(activeTab);
      lastDefaultTab.current = activeTab;
    }
  }, [activeTab, onTabChange]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', type: 'pro' as 'pro' | 'client' });
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: '',
    name: '',
    type: 'pro' as 'pro' | 'client'
  });

  useEffect(() => {
    if (loggedUser && ['login', 'register_pro', 'register_client'].includes(activeTab)) {
      if (isModal && onClose) {
        onClose();
      } else {
        setActiveTab(loggedUser.type === 'pro' ? 'dashboard_pro' : 'dashboard_client');
      }
    }
  }, [loggedUser, activeTab, isModal, onClose]);

  const [selectedPro, setSelectedPro] = useState<MarketplaceProfessional | null>(null);
  const [activeChat, setActiveChat] = useState<{ proId: string, clientId: string, requestId?: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  // Forms
  const [proForm, setProForm] = useState<Partial<MarketplaceProfessional>>({
    specialties: [],
    portfolio: [],
    certificates: []
  });

  const [clientForm, setClientForm] = useState<Partial<MarketplaceClient>>({
    videos: []
  });
  const [requestForm, setRequestForm] = useState<Partial<MarketplaceServiceRequest>>({
    photos: [],
    videos: []
  });

  const [chatInput, setChatInput] = useState('');
  const [quoteInput, setQuoteInput] = useState('');
  const [viewingProposalsFor, setViewingProposalsFor] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean, proId: string, requestId: string } | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const [feedbackForm, setFeedbackForm] = useState({ type: 'Sugestão' as 'Sugestão' | 'Reclamação', text: '' });

  const [showAIBubble, setShowAIBubble] = useState(false);
  const [aiMaterials, setAiMaterials] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false);
  
  const instanceId = useRef(`inst_${Math.random().toString(36).substr(2, 9)}`);

  const generateMaterialsWithAI = async (description: string, workType: string) => {
    setIsGeneratingMaterials(true);
    setShowAIBubble(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sugira uma lista de materiais necessários para a seguinte reforma: "${description}" (Tipo: ${workType}). Retorne apenas uma lista de strings em JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const materials = JSON.parse(response.text);
      if (Array.isArray(materials)) {
        setAiMaterials(materials);
      } else {
        setAiMaterials(["Não foi possível gerar sugestões formatadas corretamente."]);
      }
    } catch (error) {
      console.error("Erro ao gerar materiais:", error);
      setAiMaterials(["Erro ao gerar sugestões. Tente novamente."]);
    } finally {
      setIsGeneratingMaterials(false);
    }
  };

  const handleRegisterPro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!proForm.name || !proForm.email || !proForm.phone || !proForm.cpf_cnpj || !proForm.city || !proForm.state || !proForm.password) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        setIsSubmitting(false);
        return;
      }

      if (!proForm.specialties || proForm.specialties.length === 0) {
        alert('Por favor, selecione pelo menos uma especialidade.');
        setIsSubmitting(false);
        return;
      }

      if (professionals.some(p => p.email === proForm.email) || marketplaceClients.some(c => c.email === proForm.email)) {
        alert('Este e-mail já está cadastrado no marketplace.');
        setIsSubmitting(false);
        return;
      }

      const newPro: MarketplaceProfessional = {
        id: '', // Firestore will generate ID
        name: proForm.name || '',
        photo: proForm.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
        phone: proForm.phone || '',
        email: proForm.email || '',
        city: proForm.city || '',
        state: proForm.state || '',
        radius: proForm.radius ?? 50,
        specialties: proForm.specialties || [],
        experience: proForm.experience || 0,
        description: proForm.description || '',
        portfolio: proForm.portfolio || [],
        cpf_cnpj: proForm.cpf_cnpj,
        certificates: proForm.certificates || [],
        rating: 0,
        reviews: [],
        password: proForm.password || '',
        walletBalance: 5.25,
        walletTransactions: [
          { id: Math.random().toString(36).substr(2, 9), amount: 5.25, description: 'Bônus de Boas-vindas (1.00 USD)', date: new Date().toISOString(), type: 'credit' }
        ],
        unlockedRequests: []
      };
      
      const docRef = await addDoc(collection(db, 'marketplace_professionals'), newPro);
      setLoggedUser({ type: 'pro', id: docRef.id });
      setActiveTab('dashboard_pro');
      setProForm({ specialties: [], portfolio: [], certificates: [] });
      
      setTimeout(() => {
        alert(`Bem-vindo! Você recebeu um bônus de boas-vindas de R$ 5,25 (Equivalente a 1.00 USD).`);
      }, 100);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'marketplace_professionals');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validation
      if (!clientForm.name || !clientForm.email || !clientForm.phone || !clientForm.city || !clientForm.password) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        setIsSubmitting(false);
        return;
      }

      if (marketplaceClients.some(c => c.email === clientForm.email) || professionals.some(p => p.email === clientForm.email)) {
        alert('Este e-mail já está cadastrado no marketplace.');
        setIsSubmitting(false);
        return;
      }

      const newClient: MarketplaceClient = {
        id: '', // Firestore will generate ID
        name: clientForm.name || '',
        photo: clientForm.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        phone: clientForm.phone || '',
        email: clientForm.email || '',
        city: clientForm.city || '',
        workType: clientForm.workType as any || 'Construção',
        serviceDescription: clientForm.serviceDescription || '',
        password: clientForm.password || '',
        videos: clientForm.videos || []
      };
      
      const docRef = await addDoc(collection(db, 'marketplace_clients'), newClient);
      setLoggedUser({ type: 'client', id: docRef.id });
      setActiveTab('dashboard_client');
      setClientForm({});
      
      // Trigger AI materials suggestion
      generateMaterialsWithAI(newClient.serviceDescription || `Novo cliente registrado para ${newClient.workType}`, newClient.workType);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'marketplace_clients');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (loginForm.type === 'pro') {
        const q = query(
          collection(db, 'marketplace_professionals'), 
          where('email', '==', loginForm.email), 
          where('password', '==', loginForm.password)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const pro = snapshot.docs[0];
          setLoggedUser({ type: 'pro', id: pro.id });
          setActiveTab('dashboard_pro');
        } else {
          alert('E-mail ou senha incorretos para profissional.');
        }
      } else {
        const q = query(
          collection(db, 'marketplace_clients'), 
          where('email', '==', loginForm.email), 
          where('password', '==', loginForm.password)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const client = snapshot.docs[0];
          setLoggedUser({ type: 'client', id: client.id });
          setActiveTab('dashboard_client');
        } else {
          alert('E-mail ou senha incorretos para cliente.');
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `marketplace_${loginForm.type === 'pro' ? 'professionals' : 'clients'}`);
    }
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setActiveTab('find');
  };

  const handleActionRequest = async (requestId: string, clientId: string) => {
    if (!loggedUser || loggedUser.type !== 'pro') {
      alert('Apenas profissionais logados podem realizar esta ação.');
      setActiveTab('login');
      return;
    }

    const pro = professionals.find(p => p.id === loggedUser.id);
    if (!pro) return;

    // Check if already unlocked
    if (pro.unlockedRequests?.includes(requestId)) {
      // Already unlocked, just open chat
      setActiveChat({ proId: pro.id, clientId: clientId });
      return;
    }

    // Check if R$ 5,25 (1.00 USD) can be deducted
    if (pro.walletBalance < 5.25) {
      alert('Saldo insuficiente na carteira. Você precisa de pelo menos R$ 5,25 (1.00 USD) para ver os detalhes do serviço.');
      setActiveTab('wallet');
      return;
    }

    try {
      const newTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount: 5.25,
        description: `Acesso ao serviço: ${serviceRequests.find(r => r.id === requestId)?.description?.substring(0, 20) || ''}...`,
        date: new Date().toISOString(),
        type: 'debit' as const
      };

      await updateDoc(doc(db, 'marketplace_professionals', pro.id), {
        walletBalance: pro.walletBalance - 5.25,
        walletTransactions: [newTransaction, ...(pro.walletTransactions || [])],
        unlockedRequests: [...(pro.unlockedRequests || []), requestId]
      });

      setActiveChat({ proId: pro.id, clientId: clientId, requestId });
      alert('R$ 5,25 (1.00 USD) foi descontado do seu bônus para acessar esta oportunidade.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `marketplace_professionals/${pro.id}`);
    }
  };

  const handlePublishRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedUser || loggedUser.type !== 'client') {
      alert('Apenas clientes logados podem publicar solicitações.');
      return;
    }
    
    const client = marketplaceClients.find(c => c.id === loggedUser.id);
    if (!client) return;

    try {
      const newRequest: MarketplaceServiceRequest = {
        id: '', // Firestore will generate ID
        clientId: client.id,
        clientName: client.name,
        serviceType: requestForm.serviceType || '',
        location: requestForm.location || '',
        description: requestForm.description || '',
        photos: requestForm.photos || [],
        videos: requestForm.videos || [],
        deadline: requestForm.deadline || '',
        budget: requestForm.budget || 0,
        status: 'Aberto',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'marketplace_requests'), newRequest);
      setRequestForm({ photos: [], videos: [] });
      setActiveTab('dashboard_client');

      // Trigger AI materials suggestion
      generateMaterialsWithAI(newRequest.description, newRequest.serviceType);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketplace_requests');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChat || !loggedUser) return;
    try {
      const newMessage: MarketplaceChatMessage = {
        id: '', // Firestore will generate ID
        senderId: loggedUser.id,
        receiverId: loggedUser.id === activeChat.proId ? activeChat.clientId : activeChat.proId,
        requestId: activeChat.requestId,
        text: chatInput,
        timestamp: new Date().toISOString()
      };
      await addDoc(collection(db, 'marketplace_messages'), newMessage);
      setChatInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketplace_messages');
    }
  };

  const handleSendQuote = async () => {
    if (!quoteInput.trim() || !activeChat || !loggedUser || loggedUser.type !== 'pro') return;

    const quoteValue = parseFloat(quoteInput.replace(',', '.'));
    if (isNaN(quoteValue)) {
      alert('Por favor, insira um valor numérico válido para o orçamento.');
      return;
    }

    try {
      const newMessage: MarketplaceChatMessage = {
        id: '', // Firestore will generate ID
        senderId: loggedUser.id,
        receiverId: activeChat.clientId,
        requestId: activeChat.requestId,
        text: `ORÇAMENTO ENVIADO: R$ ${quoteValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        quote: quoteValue,
        timestamp: new Date().toISOString(),
      };

      await addDoc(collection(db, 'marketplace_messages'), newMessage);
      setQuoteInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketplace_messages');
    }
  };

  const handleAcceptQuote = async (quote: number, proId: string, requestId?: string) => {
    if (!requestId || !loggedUser || loggedUser.type !== 'client') return;

    try {
      // Update request status
      await updateDoc(doc(db, 'marketplace_requests', requestId), {
        status: 'Em Negociação',
        hiredProId: proId
      });

      // Notify pro
      const pro = professionals.find(p => p.id === proId);
      if (pro) {
        await updateDoc(doc(db, 'marketplace_professionals', proId), {
          notifications: [...(pro.notifications || []), { id: Date.now().toString(), text: `Seu orçamento de R$ ${quote.toLocaleString('pt-BR')} foi aceito!`, timestamp: new Date().toISOString() }]
        });
      }

      // Send message in chat
      const newMessage: MarketplaceChatMessage = {
        id: '', // Firestore will generate ID
        senderId: loggedUser.id,
        receiverId: proId,
        requestId: requestId,
        text: `ORÇAMENTO ACEITO! Vamos iniciar o serviço.`,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'marketplace_messages'), newMessage);
      alert('Orçamento aceito com sucesso! O serviço agora está em negociação.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `marketplace_requests/${requestId}`);
    }
  };

  const handleCompleteService = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'marketplace_requests', requestId), {
        status: 'Concluído'
      });
      alert('Serviço marcado como concluído!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `marketplace_requests/${requestId}`);
    }
  };

  const handleRateProfessional = async (proId: string, rating: number, comment: string) => {
    try {
      const newReview: MarketplaceReview = {
        id: '', // Firestore will generate ID
        proId,
        clientId: loggedUser?.id || 'guest',
        clientName: marketplaceClients.find(c => c.id === loggedUser?.id)?.name || 'Cliente',
        rating,
        comment,
        date: new Date().toISOString(),
      };

      await addDoc(collection(db, 'marketplace_reviews'), newReview);

      // Update professional rating
      const proReviews = [...reviews, newReview].filter(r => r.proId === proId);
      const avgRating = proReviews.reduce((acc, r) => acc + r.rating, 0) / proReviews.length;

      const pro = professionals.find(p => p.id === proId);
      if (pro) {
        await updateDoc(doc(db, 'marketplace_professionals', proId), {
          rating: avgRating,
          reviewsCount: proReviews.length,
          reviews: [...(pro.reviews || []), newReview]
        });
      }
      alert('Avaliação enviada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketplace_reviews');
    }
  };

  const handleDeletePro = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name, type: 'pro' });
  };

  const handleDeleteClient = (id: string, name: string) => {
    setConfirmDelete({ isOpen: true, id, name, type: 'client' });
  };

  const executeDelete = async () => {
    const { id, type } = confirmDelete;
    try {
      if (type === 'pro') {
        await deleteDoc(doc(db, 'marketplace_professionals', id));
      } else {
        await deleteDoc(doc(db, 'marketplace_clients', id));
      }
      alert(`${type === 'pro' ? 'Profissional' : 'Cliente'} excluído com sucesso!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `marketplace_${type === 'pro' ? 'professionals' : 'clients'}/${id}`);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.text.trim()) return;
    
    try {
      const newFeedback = {
        id: '', // Firestore will generate ID
        type: feedbackForm.type,
        text: feedbackForm.text,
        date: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'marketplace_feedbacks'), newFeedback);
      setFeedbackForm({ type: 'Sugestão', text: '' });
      alert('Obrigado pelo seu feedback!');
      setActiveTab('find');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketplace_feedbacks');
    }
  };

  const [showShareModal, setShowShareModal] = useState<{ isOpen: boolean, url: string, title: string, text: string }>({ 
    isOpen: false, 
    url: '', 
    title: '', 
    text: '' 
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?view=profissionais`;
    const shareData = {
      title: 'Perfil Acabamentos - Marketplace de Profissionais',
      text: 'Confira os melhores profissionais da construção civil no marketplace da Perfil Acabamentos.',
      url: shareUrl
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowShareModal({ isOpen: true, ...shareData });
        }
      }
    } else {
      setShowShareModal({ isOpen: true, ...shareData });
    }
  };

  const ShareModal = ({ isOpen, onClose, url, title, text }: { isOpen: boolean, onClose: () => void, url: string, title: string, text: string }) => {
    if (!isOpen) return null;

    const shareOptions = [
      { 
        name: 'WhatsApp', 
        icon: <MessageCircle size={24} />, 
        color: 'bg-emerald-500', 
        link: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}` 
      },
      { 
        name: 'Facebook', 
        icon: <Facebook size={24} />, 
        color: 'bg-blue-600', 
        link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` 
      },
      { 
        name: 'E-mail', 
        icon: <Mail size={24} />, 
        color: 'bg-slate-600', 
        link: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}` 
      },
      { 
        name: 'Copiar Link', 
        icon: <Copy size={24} />, 
        color: 'bg-blue-500', 
        action: () => {
          navigator.clipboard.writeText(url);
          alert('Link copiado com sucesso!');
        }
      }
    ];

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 bg-blue-600 text-white">
            <h3 className="text-xl font-black uppercase tracking-tight">Compartilhar</h3>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Escolha como deseja compartilhar</p>
          </div>
          
          <div className="p-8 grid grid-cols-2 gap-4">
            {shareOptions.map(option => (
              <button
                key={option.name}
                onClick={() => {
                  if (option.link) {
                    window.open(option.link, '_blank');
                  } else if (option.action) {
                    option.action();
                  }
                  onClose();
                }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              >
                <div className={`p-3 ${option.color} text-white rounded-xl group-hover:scale-110 transition-transform shadow-lg`}>
                  {option.icon}
                </div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{option.name}</span>
              </button>
            ))}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border-t border-slate-100 dark:border-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  };

  const filteredPros = useMemo(() => {
    return professionals
      .filter(pro => {
        const matchesSearch = pro.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             pro.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialty = !selectedSpecialty || pro.specialties.includes(selectedSpecialty);
        return matchesSearch && matchesSpecialty;
      })
      .sort((a, b) => {
        // Sort by ID (which contains timestamp) descending to show newest first
        // IDs are pro_timestamp_random
        return b.id.localeCompare(a.id);
      });
  }, [professionals, searchTerm, selectedSpecialty]);

  if (isModal) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        {activeTab === 'login' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Entrar</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] mt-1 tracking-widest">Acesse sua conta no marketplace</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <LogOut size={24} className="rotate-180" />
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="p-8 space-y-6">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setLoginForm({ ...loginForm, type: 'pro' })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginForm.type === 'pro' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Profissional
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginForm({ ...loginForm, type: 'client' })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginForm.type === 'client' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cliente
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Não tem uma conta?</p>
                <div className="flex flex-col gap-2">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('register_pro')}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    Cadastrar como Profissional
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('register_client')}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    Cadastrar como Cliente
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'register_pro' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Cadastro Profissional</h2>
                <p className="text-blue-100 font-bold uppercase text-[10px] mt-1 tracking-widest">Faça parte da nossa rede de especialistas</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Hammer size={24} />
              </div>
            </div>
            
            <form onSubmit={handleRegisterPro} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto de Perfil</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 1024 * 1024) { // 1MB limit
                          alert('A imagem é muito grande. Escolha uma imagem menor que 1MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProForm({...proForm, photo: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="pro-photo-upload-modal"
                  />
                  <label 
                    htmlFor="pro-photo-upload-modal"
                    className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-400 transition-all overflow-hidden"
                  >
                    {proForm.photo ? (
                      <img src={proForm.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload da Foto</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Seu nome"
                  value={proForm.name || ''}
                  onChange={e => setProForm({...proForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="seu@email.com"
                    value={proForm.email || ''}
                    onChange={e => setProForm({...proForm, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Sua senha"
                    value={proForm.password || ''}
                    onChange={e => setProForm({...proForm, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CPF ou CNPJ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="000.000.000-00"
                    value={proForm.cpf_cnpj || ''}
                    onChange={e => setProForm({...proForm, cpf_cnpj: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="(00) 00000-0000"
                    value={proForm.phone || ''}
                    onChange={e => setProForm({...proForm, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cidade</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Cidade"
                    value={proForm.city || ''}
                    onChange={e => setProForm({...proForm, city: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="UF"
                    value={proForm.state || ''}
                    onChange={e => setProForm({...proForm, state: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raio (km)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    value={proForm.radius ?? 50}
                    onChange={e => setProForm({...proForm, radius: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Anos de Experiência</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ex: 5"
                    value={proForm.experience ?? ''}
                    onChange={e => setProForm({...proForm, experience: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição Profissional</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                    placeholder="Conte um pouco sobre seu trabalho..."
                    value={proForm.description || ''}
                    onChange={e => setProForm({...proForm, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Links do Portfólio (separados por vírgula)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="https://link1.com, https://link2.com"
                    value={proForm.portfolio?.join(', ') || ''}
                    onChange={e => setProForm({...proForm, portfolio: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Certificados (separados por vírgula)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Certificado 1, Certificado 2"
                    value={proForm.certificates?.join(', ') || ''}
                    onChange={e => setProForm({...proForm, certificates: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {specialties.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const current = proForm.specialties || [];
                        if (current.includes(s)) {
                          setProForm({...proForm, specialties: current.filter(item => item !== s)});
                        } else {
                          setProForm({...proForm, specialties: [...current, s]});
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        proForm.specialties?.includes(s) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'register_client' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Cadastro de Cliente</h2>
                <p className="text-emerald-100 font-bold uppercase text-[10px] mt-1 tracking-widest">Encontre os melhores profissionais para sua obra</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Users size={24} />
              </div>
            </div>
            
            <form onSubmit={handleRegisterClient} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto de Perfil</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 1024 * 1024) { // 1MB limit
                          alert('A imagem é muito grande. Escolha uma imagem menor que 1MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setClientForm({...clientForm, photo: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="client-photo-upload-modal"
                  />
                  <label 
                    htmlFor="client-photo-upload-modal"
                    className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-400 transition-all overflow-hidden"
                  >
                    {clientForm.photo ? (
                      <img src={clientForm.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload da Foto</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Seu nome"
                  value={clientForm.name || ''}
                  onChange={e => setClientForm({...clientForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="seu@email.com"
                    value={clientForm.email || ''}
                    onChange={e => setClientForm({...clientForm, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Sua senha"
                    value={clientForm.password || ''}
                    onChange={e => setClientForm({...clientForm, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="(00) 00000-0000"
                    value={clientForm.phone || ''}
                    onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cidade</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Sua cidade"
                    value={clientForm.city || ''}
                    onChange={e => setClientForm({...clientForm, city: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Obra Principal</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={clientForm.workType || 'Construção'}
                  onChange={e => setClientForm({...clientForm, workType: e.target.value as any})}
                  required
                >
                  {WORK_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição do Serviço</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                  placeholder="Descreva o que você precisa (ex: Reforma completa de banheiro, pintura de sala, etc.)"
                  value={clientForm.serviceDescription || ''}
                  onChange={e => setClientForm({...clientForm, serviceDescription: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vídeos da Obra/Projeto</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {clientForm.videos?.map((vid, i) => (
                    <div key={i} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100 flex items-center justify-center">
                      <Video size={24} className="text-slate-400" />
                      <button 
                        type="button"
                        onClick={() => setClientForm({...clientForm, videos: clientForm.videos?.filter((_, index) => index !== i)})}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="h-24 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all">
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">Adicionar Vídeo</span>
                    <input 
                      type="file" 
                      accept="video/*" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setClientForm(prev => ({
                              ...prev,
                              videos: [...(prev.videos || []), reader.result as string]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal.isOpen}
        onClose={() => setShowShareModal({ ...showShareModal, isOpen: false })}
        url={showShareModal.url}
        title={showShareModal.title}
        text={showShareModal.text}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Profissionais</h1>
          <p className="text-slate-500 mt-2 font-medium">Marketplace de serviços da construção civil</p>
          <button 
            onClick={() => {
              const inviteUrl = `${window.location.origin}${window.location.pathname}?action=registrar_profissional`;
              setShowShareModal({
                isOpen: true,
                url: inviteUrl,
                title: 'Convite Perfil Acabamentos',
                text: 'Olá! Gostaria de convidar você para se cadastrar como profissional na Perfil Acabamentos e fazer parte do nosso marketplace.'
              });
            }}
            className="mt-4 px-6 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-100 transition-all flex items-center justify-center gap-2 shadow-sm w-fit"
            title="Compartilhar link direto para cadastro de profissionais"
          >
            <UserPlus size={18} />
            Convidar Profissionais
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {loggedUser ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">
                  {loggedUser.type === 'pro' 
                    ? professionals.find(p => p.id === loggedUser.id)?.name?.charAt(0) || 'P'
                    : marketplaceClients.find(c => c.id === loggedUser.id)?.name?.charAt(0) || 'C'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Logado como</p>
                  <p className="text-xs font-black text-slate-900 leading-none">
                    {loggedUser.type === 'pro' 
                      ? professionals.find(p => p.id === loggedUser.id)?.name || 'Profissional'
                      : marketplaceClients.find(c => c.id === loggedUser.id)?.name || 'Cliente'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab(loggedUser.type === 'pro' ? 'dashboard_pro' : 'dashboard_client')}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${['dashboard_pro', 'dashboard_client'].includes(activeTab) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                Painel
              </button>
              <button 
                onClick={handleLogout}
                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : null}

          <button 
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Gerenciar
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'feedback' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Sugestões / Reclamações
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[600px]">
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-10 bg-[#0b1222] text-white">
              <h2 className="text-3xl font-black uppercase tracking-tight">Entrar</h2>
              <p className="text-slate-400 font-bold uppercase text-xs mt-2 tracking-widest">Acesse sua conta no marketplace</p>
            </div>
            
            <form onSubmit={handleLogin} className="p-10 space-y-6">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setLoginForm({ ...loginForm, type: 'pro' })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginForm.type === 'pro' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Profissional
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginForm({ ...loginForm, type: 'client' })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginForm.type === 'client' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cliente
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="seu@email.com"
                  value={loginForm.email || ''}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  value={loginForm.password || ''}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Não tem uma conta?</p>
                <div className="flex flex-col gap-2">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('register_pro')}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    Cadastrar como Profissional
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('register_client')}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    Cadastrar como Cliente
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'wallet' && loggedUser?.type === 'pro' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('dashboard_pro')}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex justify-between items-center w-full">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Minha Carteira</h2>
                <button 
                  onClick={async () => {
                    const amount = 50;
                    const pro = professionals.find(p => p.id === loggedUser?.id);
                    if (pro) {
                      try {
                        const newTransaction = {
                          id: Math.random().toString(36).substr(2, 9),
                          amount,
                          description: 'Recarga de Saldo (Simulação)',
                          date: new Date().toISOString(),
                          type: 'credit' as const
                        };
                        
                        await updateDoc(doc(db, 'marketplace_professionals', pro.id), {
                          walletBalance: (pro.walletBalance || 0) + amount,
                          walletTransactions: [newTransaction, ...(pro.walletTransactions || [])]
                        });
                        alert(`R$ ${amount.toLocaleString('pt-BR')} adicionados com sucesso!`);
                      } catch (error) {
                        handleFirestoreError(error, OperationType.UPDATE, `marketplace_professionals/${pro.id}`);
                      }
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <DollarSign size={16} />
                  Adicionar Saldo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-[#0b1222] p-8 rounded-[3rem] text-white shadow-xl shadow-blue-100">
                  <div className="flex items-center gap-3 mb-6 opacity-60">
                    <Wallet size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Saldo Disponível</span>
                  </div>
                  <div className="text-4xl font-black tracking-tight mb-2">
                    R$ {professionals.find(p => p.id === loggedUser.id)?.walletBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Saldo para desbloqueio de serviços</p>
                  
                  <button 
                    onClick={async () => {
                      const pro = professionals.find(p => p.id === loggedUser.id);
                      if (pro) {
                        try {
                          const newTransaction = {
                            id: Math.random().toString(36).substr(2, 9),
                            amount: 50.00,
                            description: 'Recarga de Saldo (Simulação)',
                            date: new Date().toISOString(),
                            type: 'credit' as const
                          };
                          
                          await updateDoc(doc(db, 'marketplace_professionals', pro.id), {
                            walletBalance: (pro.walletBalance || 0) + 50.00,
                            walletTransactions: [newTransaction, ...(pro.walletTransactions || [])]
                          });
                          alert('R$ 50,00 adicionados com sucesso (Simulação).');
                        } catch (error) {
                          handleFirestoreError(error, OperationType.UPDATE, `marketplace_professionals/${pro.id}`);
                        }
                      }
                    }}
                    className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg"
                  >
                    Adicionar Crédito
                  </button>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informações</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Sparkles size={16} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Você ganha R$ 5,25 (1.00 USD) ao se cadastrar.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Briefcase size={16} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Cada desbloqueio de serviço custa apenas R$ 5,25 (1.00 USD).</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  Histórico de Transações
                </h3>
                
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {professionals.find(p => p.id === loggedUser.id)?.walletTransactions?.map(tx => (
                      <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {tx.type === 'credit' ? <ArrowRight size={18} className="rotate-[-45deg]" /> : <ArrowRight size={18} className="rotate-[135deg]" />}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">{tx.description}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('pt-BR')} às {new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className={`font-black text-lg ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                    {(!professionals.find(p => p.id === loggedUser.id)?.walletTransactions || professionals.find(p => p.id === loggedUser.id)?.walletTransactions?.length === 0) && (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma transação encontrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'find' && (
          <div className="space-y-8">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou descrição..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative md:w-64">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm appearance-none"
                  value={selectedSpecialty}
                  onChange={e => setSelectedSpecialty(e.target.value)}
                >
                  <option value="">Todas Especialidades</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button 
                onClick={() => {
                  const inviteUrl = `${window.location.origin}${window.location.pathname}?action=registrar_cliente`;
                  setShowShareModal({
                    isOpen: true,
                    url: inviteUrl,
                    title: 'Convite Perfil Acabamentos',
                    text: 'Olá! Gostaria de convidar você para se cadastrar como cliente na Perfil Acabamentos e ter acesso aos melhores profissionais.'
                  });
                }}
                className="px-6 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                title="Compartilhar link direto para cadastro de clientes"
              >
                <Share2 size={18} />
                Convidar Clientes
              </button>
            </div>

            {/* Professionals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPros.map(pro => (
                <div key={pro.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img src={pro.photo} alt={pro.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePro(pro.id, pro.name);
                        }}
                        className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-all"
                        title="Excluir Profissional"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-slate-900">{pro.rating > 0 ? pro.rating.toFixed(1) : 'Novo'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 mb-2">{pro.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                      <MapPin size={14} className="text-blue-500" />
                      {pro.city}, {pro.state}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {pro.specialties.slice(0, 3).map(s => (
                        <span key={s} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {s}
                        </span>
                      ))}
                      {pro.specialties.length > 3 && (
                        <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          +{pro.specialties.length - 3}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-500 text-sm line-clamp-2 mb-8 flex-1">
                      {pro.description}
                    </p>

                    <button 
                      onClick={() => setSelectedPro(pro)}
                      className="w-full py-4 bg-[#0b1222] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      Ver Perfil Completo
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPros.length === 0 && (
              <div className="py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-50 p-8 rounded-full mb-6">
                  <Briefcase size={64} className="text-slate-200" />
                </div>
                <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Nenhum profissional encontrado</h2>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">Tente ajustar seus filtros ou buscar por outras especialidades.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'register_pro' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-10 bg-[#0b1222] text-white">
              <h2 className="text-3xl font-black uppercase tracking-tight">Cadastro de Profissional</h2>
              <p className="text-slate-400 font-bold uppercase text-xs mt-2 tracking-widest">Faça parte da nossa rede de especialistas</p>
            </div>
            
            <form onSubmit={handleRegisterPro} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Seu nome"
                    value={proForm.name || ''}
                    onChange={e => setProForm({...proForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto do Perfil</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1024 * 1024) { // 1MB limit
                            alert('A imagem é muito grande. Escolha uma imagem menor que 1MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProForm({...proForm, photo: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="pro-photo-upload"
                    />
                    <label 
                      htmlFor="pro-photo-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-400 transition-all overflow-hidden"
                    >
                      {proForm.photo && proForm.photo.startsWith('data:image') ? (
                        <img src={proForm.photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera size={24} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload da Foto</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="seu@email.com"
                    value={proForm.email || ''}
                    onChange={e => setProForm({...proForm, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Sua senha de acesso"
                    value={proForm.password || ''}
                    onChange={e => setProForm({...proForm, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CPF ou CNPJ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="000.000.000-00"
                    value={proForm.cpf_cnpj || ''}
                    onChange={e => setProForm({...proForm, cpf_cnpj: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="(00) 00000-0000"
                    value={proForm.phone || ''}
                    onChange={e => setProForm({...proForm, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cidade</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Cidade"
                    value={proForm.city || ''}
                    onChange={e => setProForm({...proForm, city: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="UF"
                    value={proForm.state || ''}
                    onChange={e => setProForm({...proForm, state: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raio (km)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    value={proForm.radius || 50}
                    onChange={e => setProForm({...proForm, radius: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {specialties.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const current = proForm.specialties || [];
                        if (current.includes(s)) {
                          setProForm({...proForm, specialties: current.filter(item => item !== s)});
                        } else {
                          setProForm({...proForm, specialties: [...current, s]});
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        proForm.specialties?.includes(s) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Portfólio (Máximo 3 Fotos ou Vídeos)</label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {proForm.portfolio?.map((item, i) => (
                    <div key={i} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      {item.startsWith('data:video') || item.includes('video') ? (
                        <video src={item} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item} alt={`Portfolio ${i}`} className="w-full h-full object-cover" />
                      )}
                      <button 
                        type="button"
                        onClick={() => setProForm({...proForm, portfolio: proForm.portfolio?.filter((_, index) => index !== i)})}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {(!proForm.portfolio || proForm.portfolio.length < 3) && (
                    <label className="h-24 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-400 transition-all">
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">Adicionar</span>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const currentPortfolio = proForm.portfolio || [];
                          if (currentPortfolio.length + files.length > 3) {
                            alert('Limite de 3 itens no portfólio atingido.');
                            return;
                          }
                          files.forEach(file => {
                            if (file.size > 5 * 1024 * 1024) { // 5MB limit for videos/images
                              alert(`O arquivo ${file.name} é muito grande (>5MB) e não será adicionado.`);
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProForm(prev => {
                                const newPortfolio = [...(prev.portfolio || []), reader.result as string];
                                if (newPortfolio.length > 3) return prev;
                                return {
                                  ...prev,
                                  portfolio: newPortfolio
                                };
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição Profissional</label>
                <textarea 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                  placeholder="Conte um pouco sobre sua experiência e serviços..."
                  value={proForm.description || ''}
                  onChange={e => setProForm({...proForm, description: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <input 
                  type="checkbox" 
                  id="terms-pro" 
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  required 
                />
                <label htmlFor="terms-pro" className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest cursor-pointer">
                  Eu aceito os <span className="text-blue-600 underline">Termos de Uso</span> e <span className="text-blue-600 underline">Política de Privacidade</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar Profissional'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'register_client' && (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-10 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Criar Conta</h2>
                <p className="text-blue-100 font-bold uppercase text-xs mt-2 tracking-widest">Encontre os melhores profissionais</p>
              </div>
              <button 
                type="button"
                onClick={() => generateMaterialsWithAI("Simulação de Cadastro", "Reforma")}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white flex items-center gap-2"
                title="Ver Exemplo de Sugestão IA"
              >
                <Sparkles size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRegisterClient} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto de Perfil</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 1024 * 1024) { // 1MB limit
                          alert('A imagem é muito grande. Escolha uma imagem menor que 1MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setClientForm({...clientForm, photo: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="client-photo-upload"
                  />
                  <label 
                    htmlFor="client-photo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-400 transition-all overflow-hidden"
                  >
                    {clientForm.photo ? (
                      <img src={clientForm.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload da Foto</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Seu nome"
                  value={clientForm.name || ''}
                  onChange={e => setClientForm({...clientForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telefone</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="(00) 00000-0000"
                  value={clientForm.phone || ''}
                  onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="seu@email.com"
                  value={clientForm.email || ''}
                  onChange={e => setClientForm({...clientForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Sua senha"
                  value={clientForm.password || ''}
                  onChange={e => setClientForm({...clientForm, password: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cidade</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Sua cidade"
                  value={clientForm.city || ''}
                  onChange={e => setClientForm({...clientForm, city: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Obra</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  value={clientForm.workType || ''}
                  onChange={e => setClientForm({...clientForm, workType: e.target.value as any})}
                >
                  {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <input 
                  type="checkbox" 
                  id="terms-client" 
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  required 
                />
                <label htmlFor="terms-client" className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest cursor-pointer">
                  Eu aceito os <span className="text-blue-600 underline">Termos de Uso</span> e <span className="text-blue-600 underline">Política de Privacidade</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Cadastrando...' : 'Criar Conta'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'dashboard_pro' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Painel do Profissional</h2>
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('wallet')}
                  className="px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-4"
                >
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Wallet size={20} />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carteira (Bônus)</p>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-600 text-lg">R$ {professionals.find(p => p.id === loggedUser?.id)?.walletBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                </button>
                <div className="px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação</p>
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <span className="font-black text-slate-900">4.9</span>
                  </div>
                </div>
                <div className="px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviços</p>
                  <span className="font-black text-slate-900">12</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-500" />
                    Serviços Desbloqueados
                  </h3>
                  <div className="space-y-4">
                    {serviceRequests.filter(r => professionals.find(p => p.id === loggedUser?.id)?.unlockedRequests?.includes(r.id)).length > 0 ? (
                      serviceRequests.filter(r => professionals.find(p => p.id === loggedUser?.id)?.unlockedRequests?.includes(r.id)).map(request => (
                        <div key={request.id} className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                              <Hammer size={20} />
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900">{request.serviceType}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{request.location}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveChat({ proId: loggedUser?.id || '', clientId: request.clientId })}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
                          >
                            Abrir Chat
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum serviço desbloqueado ainda</p>
                        <button 
                          onClick={() => setActiveTab('find')}
                          className="mt-4 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
                        >
                          Explorar Oportunidades
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-500" />
                    Oportunidades Disponíveis
                  </h3>
                  
                  <div className="space-y-4">
                    {serviceRequests.filter(r => r.status === 'Aberto' && !professionals.find(p => p.id === loggedUser?.id)?.unlockedRequests?.includes(r.id)).map(request => (
                      <div key={request.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {request.serviceType}
                            </span>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                              Há 2 horas
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orçamento</p>
                            <p className="text-lg font-black text-slate-900 tracking-tight">R$ {request.budget.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        
                        <h4 className="text-xl font-black text-slate-900 mb-2">{request.description}</h4>
                        
                        <div className="flex items-center gap-6 text-slate-500 text-sm font-medium mb-6">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" />
                            {request.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-blue-500" />
                            Prazo: {request.deadline}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleActionRequest(request.id, request.clientId)}
                          className="w-full py-4 bg-[#0b1222] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                        >
                          <MessageSquare size={18} />
                          Enviar Proposta / Chat (R$ 5,25)
                        </button>
                      </div>
                    ))}

                    {serviceRequests.filter(r => r.status === 'Aberto' && !professionals.find(p => p.id === loggedUser?.id)?.unlockedRequests?.includes(r.id)).length === 0 && (
                      <div className="py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <Search size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma nova oportunidade no momento</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-500" />
                  Conversas Recentes
                </h3>
                
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {Array.from(new Set(messages
                      .filter(m => m.senderId === loggedUser?.id || m.receiverId === loggedUser?.id)
                      .map(m => m.senderId === loggedUser?.id ? m.receiverId : m.senderId)
                    )).map(otherId => {
                      const otherUser = professionals.find(p => p.id === otherId) || marketplaceClients.find(c => c.id === otherId);
                      const lastMsg = [...messages]
                        .reverse()
                        .find(m => (m.senderId === loggedUser?.id && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === loggedUser?.id));
                      
                      return (
                        <button 
                          key={otherId}
                          onClick={() => setActiveChat({ proId: loggedUser?.type === 'pro' ? loggedUser.id : otherId, clientId: loggedUser?.type === 'client' ? loggedUser.id : otherId })}
                          className="w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-all text-left"
                        >
                          {otherUser?.photo ? (
                            <img src={otherUser.photo} alt={otherUser.name} className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black">
                              {otherUser?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 truncate">{otherUser?.name || 'Usuário'}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{lastMsg?.text || 'Sem mensagens'}</p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
                        </button>
                      );
                    })}
                    {messages.filter(m => m.senderId === loggedUser?.id || m.receiverId === loggedUser?.id).length === 0 && (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma conversa ativa</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Gerenciamento do Sistema</h2>
              <div className="flex gap-4">
                <div className="px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Profissionais</p>
                  <span className="font-black text-slate-900">{professionals.length}</span>
                </div>
                <div className="px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Clientes</p>
                  <span className="font-black text-slate-900">{marketplaceClients.length}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Professionals Management */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-500" />
                  Profissionais Registrados
                </h3>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {professionals.map(pro => (
                      <div key={pro.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-all">
                        <img src={pro.photo} alt={pro.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-900 truncate">{pro.name}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{pro.specialties.join(', ')}</p>
                        </div>
                        <button 
                          onClick={() => handleDeletePro(pro.id, pro.name)}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Excluir Profissional"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {professionals.length === 0 && (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum profissional registrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Clients Management */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  Clientes Registrados
                </h3>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {marketplaceClients.map(client => (
                      <div key={client.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-all">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-900 truncate">{client.name}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{client.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => generateMaterialsWithAI(`Reforma para ${client.name}`, client.workType)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                            title="Sugerir Materiais via IA"
                          >
                            <Sparkles size={14} />
                            Sugestão IA
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Excluir Cliente"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {marketplaceClients.length === 0 && (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum cliente registrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Management */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-500" />
                Sugestões e Reclamações Recebidas
              </h3>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {feedbacks.map(f => (
                    <div key={f.id} className="p-6 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${f.type === 'Sugestão' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                          {f.type}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(f.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium text-sm">{f.text}</p>
                      <button 
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, 'marketplace_feedbacks', f.id));
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `marketplace_feedbacks/${f.id}`);
                          }
                        }}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  {feedbacks.length === 0 && (
                    <div className="p-12 text-center">
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum feedback recebido</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="max-w-2xl mx-auto bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-10 bg-blue-600 text-white">
              <h2 className="text-3xl font-black uppercase tracking-tight">Sugestões / Reclamações</h2>
              <p className="text-blue-100 font-bold uppercase text-xs mt-2 tracking-widest">Sua opinião é muito importante para nós</p>
            </div>
            
            <form onSubmit={handleFeedbackSubmit} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Mensagem</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, type: 'Sugestão' })}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${feedbackForm.type === 'Sugestão' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    Sugestão
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, type: 'Reclamação' })}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${feedbackForm.type === 'Reclamação' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    Reclamação
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sua Mensagem</label>
                <textarea 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all min-h-[200px]"
                  placeholder="Escreva aqui sua sugestão ou reclamação..."
                  value={feedbackForm.text}
                  onChange={e => setFeedbackForm({ ...feedbackForm, text: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
              >
                <Send size={18} />
                Enviar Feedback
              </button>
            </form>
          </div>
        )}

        {activeTab === 'dashboard_client' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Meus Pedidos</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => generateMaterialsWithAI("Simulação de Reforma Geral", "Reforma")}
                  className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Simular Reforma (IA)
                </button>
                <button 
                  onClick={() => setActiveTab('publish_request')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  Nova Solicitação
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {serviceRequests.filter(r => r.clientId === loggedUser?.id).map(request => (
                    <div key={request.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {request.serviceType}
                          </span>
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                            Publicado em {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">{request.description}</h3>
                        
                        {(request.photos?.length || 0) > 0 || (request.videos?.length || 0) > 0 ? (
                          <div className="flex gap-2 overflow-x-auto py-2">
                            {request.photos?.map((photo, idx) => (
                              <img key={idx} src={photo} alt="Local" className="h-16 w-16 object-cover rounded-lg flex-shrink-0 border border-slate-100" />
                            ))}
                            {request.videos?.map((vid, idx) => (
                              <div key={idx} className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-100">
                                <Video size={20} className="text-slate-400" />
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" />
                            {request.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-blue-500" />
                            Prazo: {request.deadline}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between gap-4">
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            request.status === 'Aberto' ? 'bg-emerald-50 text-emerald-600' : 
                            request.status === 'Em Negociação' ? 'bg-amber-50 text-amber-600' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {request.status}
                          </span>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orçamento Estimado</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">R$ {request.budget?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => generateMaterialsWithAI(request.description, request.serviceType)}
                            className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
                          >
                            <Sparkles size={16} />
                            Sugestão IA
                          </button>
                          
                          {request.status === 'Aberto' ? (
                            <button 
                              onClick={() => setViewingProposalsFor(request.id)}
                              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                              Ver Propostas
                            </button>
                          ) : request.status === 'Em Negociação' ? (
                            <>
                              <button 
                                onClick={() => setActiveChat({ proId: request.hiredProId!, clientId: request.clientId, requestId: request.id })}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                              >
                                Ver Chat
                              </button>
                              <button 
                                onClick={() => handleCompleteService(request.id)}
                                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                              >
                                Concluir
                              </button>
                            </>
                          ) : (
                            !reviews.some(r => r.proId === request.hiredProId && r.clientId === loggedUser?.id) && (
                              <button 
                                onClick={() => setRatingModal({ isOpen: true, proId: request.hiredProId!, requestId: request.id })}
                                className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                              >
                                Avaliar
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {serviceRequests.filter(r => r.clientId === loggedUser?.id).length === 0 && (
                    <div className="py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                      <div className="bg-slate-50 p-8 rounded-full mb-6">
                        <FileText size={64} className="text-slate-200" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Você ainda não publicou serviços</h2>
                      <p className="text-slate-400 text-sm mt-2 max-w-xs">Publique uma solicitação para receber orçamentos de profissionais qualificados.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} className="text-blue-500" />
                  Gerenciar Categorias
                </h3>
                
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                  <div className="flex gap-4 mb-6">
                    <input 
                      type="text" 
                      placeholder="Nova categoria..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newSpecialty}
                      onChange={e => setNewSpecialty(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        if (newSpecialty && !specialties.includes(newSpecialty)) {
                          try {
                            await addDoc(collection(db, 'marketplace_specialties'), { name: newSpecialty });
                            setNewSpecialty('');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.CREATE, 'marketplace_specialties');
                          }
                        }
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {specialties.map(s => (
                      <div key={s} className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{s}</span>
                        <button 
                          onClick={async () => {
                            try {
                              const q = query(collection(db, 'marketplace_specialties'), where('name', '==', s));
                              const snapshot = await getDocs(q);
                              snapshot.forEach(async (doc) => {
                                await deleteDoc(doc.ref);
                              });
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, 'marketplace_specialties');
                            }
                          }}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-500" />
                  Conversas com Profissionais
                </h3>
                
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {messages.filter(m => m.senderId === loggedUser?.id || m.receiverId === loggedUser?.id).map(msg => {
                      const otherId = msg.senderId === loggedUser?.id ? msg.receiverId : msg.senderId;
                      const pro = professionals.find(p => p.id === otherId);
                      if (!pro) return null;
                      return (
                        <button 
                          key={msg.id}
                          onClick={() => setActiveChat({ proId: pro.id, clientId: loggedUser?.id || 'guest' })}
                          className="w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-all text-left"
                        >
                          <img src={pro.photo} alt={pro.name} className="w-12 h-12 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 truncate">{pro.name}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{pro.specialties[0]}</p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
                        </button>
                      );
                    })}
                    {messages.filter(m => m.senderId === loggedUser?.id || m.receiverId === loggedUser?.id).length === 0 && (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma conversa ativa</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'publish_request' && (
          <div className="max-w-2xl mx-auto bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-10 bg-blue-600 text-white">
              <h2 className="text-3xl font-black uppercase tracking-tight">Publicar Pedido</h2>
              <p className="text-blue-100 font-bold uppercase text-xs mt-2 tracking-widest">Descreva o que você precisa</p>
            </div>
            
            <form onSubmit={handlePublishRequest} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Serviço</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    value={requestForm.serviceType}
                    onChange={e => setRequestForm({...requestForm, serviceType: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Cidade, Estado"
                    value={requestForm.location}
                    onChange={e => setRequestForm({...requestForm, location: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prazo Desejado</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ex: 15 dias, Imediato"
                    value={requestForm.deadline}
                    onChange={e => setRequestForm({...requestForm, deadline: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orçamento Estimado (R$)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={requestForm.budget}
                    onChange={e => setRequestForm({...requestForm, budget: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição do Problema/Serviço</label>
                <textarea 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                  placeholder="Detalhe o que precisa ser feito..."
                  value={requestForm.description}
                  onChange={e => setRequestForm({...requestForm, description: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fotos do Local/Projeto</label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {requestForm.photos?.map((img, i) => (
                    <div key={i} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 group">
                      <img src={img} alt={`Request ${i}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setRequestForm({...requestForm, photos: requestForm.photos?.filter((_, index) => index !== i)})}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="h-24 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all">
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">Adicionar Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setRequestForm(prev => ({
                              ...prev,
                              photos: [...(prev.photos || []), reader.result as string]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vídeos do Local/Projeto</label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {requestForm.videos?.map((vid, i) => (
                    <div key={i} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100 flex items-center justify-center">
                      <Video size={24} className="text-slate-400" />
                      <button 
                        type="button"
                        onClick={() => setRequestForm({...requestForm, videos: requestForm.videos?.filter((_, index) => index !== i)})}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="h-24 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all">
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">Adicionar Vídeo</span>
                    <input 
                      type="file" 
                      accept="video/*" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setRequestForm(prev => ({
                              ...prev,
                              videos: [...(prev.videos || []), reader.result as string]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  type="button"
                  onClick={() => generateMaterialsWithAI(requestForm.description, requestForm.serviceType)}
                  className="flex-1 py-5 bg-white border-2 border-blue-500 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles size={18} />
                  Sugerir Materiais (IA)
                </button>
                <div className="flex flex-1 gap-4">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('dashboard_client')}
                    className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    Publicar Solicitação
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Professional Profile Modal */}
      {selectedPro && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPro(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-8">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div className="flex items-center gap-6">
                <img src={selectedPro.photo} alt={selectedPro.name} className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-white/20" />
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">{selectedPro.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={16} className="fill-amber-400" />
                      <span className="text-sm font-black text-white">{selectedPro.rating > 0 ? selectedPro.rating.toFixed(1) : 'Novo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <MapPin size={14} className="text-blue-500" />
                      {selectedPro.city}, {selectedPro.state}
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPro(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
                      Sobre o Profissional
                    </h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      {selectedPro.description}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ImageIcon size={16} className="text-blue-500" />
                      Portfólio de Obras
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedPro.portfolio.length > 0 ? selectedPro.portfolio.map((item, i) => (
                        <div key={i} className="relative h-32 rounded-2xl overflow-hidden border border-slate-100">
                          {item.startsWith('data:video') || item.includes('video') ? (
                            <video src={item} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={item} alt={`Obra ${i+1}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                      )) : (
                        <div className="col-span-full py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon size={32} className="mb-2 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma foto ou vídeo no portfólio</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Star size={16} className="text-blue-500" />
                      Avaliações dos Clientes
                    </h3>
                    <div className="space-y-4">
                      {selectedPro.reviews.length > 0 ? selectedPro.reviews.map(review => (
                        <div key={review.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-slate-900 text-sm">{review.clientName}</h4>
                            <div className="flex items-center gap-1 text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} className={i < review.rating ? 'fill-amber-500' : 'text-slate-200'} />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm font-medium">{review.comment}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-3">{review.date}</p>
                        </div>
                      )) : (
                        <p className="text-slate-400 text-sm font-medium italic">Este profissional ainda não recebeu avaliações.</p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Especialidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPro.specialties.map(s => (
                          <span key={s} className="px-3 py-1 bg-white text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Experiência</h4>
                      <div className="flex items-center gap-3 text-slate-900 font-black">
                        <Award size={20} className="text-blue-500" />
                        {selectedPro.experience} Anos no Mercado
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Atendimento</h4>
                      <div className="flex items-center gap-3 text-slate-900 font-black">
                        <MapPin size={20} className="text-blue-500" />
                        Raio de {selectedPro.radius}km
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveChat({ proId: selectedPro.id, clientId: marketplaceClients[0]?.id || 'guest' });
                      setSelectedPro(null);
                    }}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                  >
                    <MessageSquare size={20} />
                    Iniciar Negociação
                  </button>

                  <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest leading-relaxed">
                    Toda a comunicação e orçamentos devem ser realizados dentro da plataforma para sua segurança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveChat(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-[80vh] flex flex-col my-8">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {professionals.find(p => p.id === activeChat.proId)?.name}
                  </h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Chat Seguro • Perfil Acabamentos</p>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50">
              {messages
                .filter(m => (m.senderId === activeChat.clientId && m.receiverId === activeChat.proId) || 
                            (m.senderId === activeChat.proId && m.receiverId === activeChat.clientId))
                .map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === loggedUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${
                      msg.senderId === loggedUser?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      {msg.quote ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
                            <DollarSign size={12} />
                            Orçamento Proposto
                          </div>
                          <p className="text-2xl font-black">R$ {msg.quote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          {loggedUser?.type === 'client' && 
                           serviceRequests.find(r => r.id === activeChat.requestId)?.status === 'Aberto' && (
                            <button 
                              onClick={() => handleAcceptQuote(msg.quote!, activeChat.proId, activeChat.requestId)}
                              className="w-full py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
                            >
                              Aceitar Orçamento
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm font-medium">{msg.text}</p>
                      )}
                      <p className={`text-[8px] font-bold uppercase tracking-widest mt-2 ${
                        msg.senderId === loggedUser?.id ? 'text-blue-200' : 'text-slate-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 space-y-4">
              {loggedUser?.type === 'pro' && (
                <div className="flex gap-4 items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <DollarSign size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Enviar Orçamento Formal</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold">R$</span>
                        <input 
                          type="text" 
                          placeholder="0,00"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                          value={quoteInput}
                          onChange={e => setQuoteInput(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={handleSendQuote}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
                  <Camera size={20} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Digite sua mensagem..."
                    className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposals Modal */}
      {viewingProposalsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingProposalsFor(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Propostas Recebidas</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">
                  {serviceRequests.find(r => r.id === viewingProposalsFor)?.description}
                </p>
              </div>
              <button onClick={() => setViewingProposalsFor(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50">
              {professionals.filter(pro => 
                messages.some(m => m.requestId === viewingProposalsFor && (m.senderId === pro.id || m.receiverId === pro.id))
              ).map(pro => {
                const lastMessage = [...messages]
                  .reverse()
                  .find(m => m.requestId === viewingProposalsFor && (m.senderId === pro.id || m.receiverId === pro.id));
                
                return (
                  <div key={pro.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <img src={pro.photo} alt={pro.name} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900">{pro.name}</h4>
                      <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-black">{pro.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 italic">"{lastMessage?.text}"</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveChat({ proId: pro.id, clientId: loggedUser?.id || 'guest', requestId: viewingProposalsFor });
                        setViewingProposalsFor(null);
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      Ver Chat
                    </button>
                  </div>
                );
              })}
              
              {professionals.filter(pro => 
                messages.some(m => m.requestId === viewingProposalsFor && (m.senderId === pro.id || m.receiverId === pro.id))
              ).length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma proposta recebida ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRatingModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-amber-500 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={40} fill="white" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Avaliar Serviço</h2>
              <p className="text-amber-100 font-bold uppercase text-xs mt-2 tracking-widest">Sua avaliação ajuda a comunidade</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    onClick={() => setRatingValue(star)}
                    className={`p-2 transition-all ${ratingValue >= star ? 'text-amber-500 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
                  >
                    <Star size={40} fill={ratingValue >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seu Comentário</label>
                <textarea 
                  rows={4}
                  placeholder="Conte como foi sua experiência com este profissional..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                  value={ratingComment}
                  onChange={e => setRatingComment(e.target.value)}
                />
              </div>
              
              <button 
                onClick={() => {
                  handleRateProfessional(ratingModal.proId, ratingValue, ratingComment);
                  setRatingModal(null);
                  setRatingComment('');
                  setRatingValue(5);
                }}
                className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all"
              >
                Enviar Avaliação
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={confirmDelete.type === 'pro' ? "Excluir Profissional" : "Excluir Cliente"}
        message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />

      {showAIBubble && (
        <FloatingAIBubble 
          materials={aiMaterials} 
          isLoading={isGeneratingMaterials} 
          onClose={() => setShowAIBubble(false)} 
        />
      )}
    </div>
  );
};

export default Profissionais;
