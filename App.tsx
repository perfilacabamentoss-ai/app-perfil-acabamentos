
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  HardHat, 
  FolderKanban, 
  Layers, 
  Truck, 
  Users, 
  User,
  UserPlus,
  UserSquare2, 
  Clock, 
  ClipboardList, 
  FileText,
  LogOut,
  ChevronLeft,
  Building2,
  Fingerprint,
  Bell,
  Ruler,
  Scale,
  Settings,
  Search,
  Globe,
  Target,
  X,
  Sparkles,
  Zap,
  Hammer,
  ShieldCheck,
  Menu,
  ShoppingBag,
  Calculator,
  Youtube,
  FileSearch,
  Camera,
  HelpCircle,
  Info,
  CheckCircle2,
  Share2,
  Video,
  GripVertical,
  MessageSquare,
  Sun,
  Moon,
  Palette,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Dashboard from './components/Dashboard';
import Obras from './components/Obras';
import Materiais from './components/Materiais';
import Projetos from './components/Projetos';
import Etapas from './components/Etapas';
import Fornecedores from './components/Fornecedores';
import Empreiteiros from './components/Empreiteiros';
import Colaboradores from './components/Colaboradores';
import PontoFacial from './components/PontoFacial';
import Medicoes from './components/Medicoes';
import Faturas from './components/Faturas';
import Pagamentos from './components/Pagamentos';
import ProducaoDiaria from './components/ProducaoDiaria';
import Clientes from './components/Clientes';
import ControleAcesso from './components/ControleAcesso';
import Configuracoes from './components/Configuracoes';
import Calculadoras from './components/Calculadoras';
import LeituraProjetos from './components/LeituraProjetos';
import Tutorial from './components/Tutorial';
import Autonomo from './components/Autonomo';
import Login from './components/Login';
import Propostas from './components/Propostas';
import QAChat from './components/QAChat';
import PlanejamentoEstrategico from './components/PlanejamentoEstrategico';
import PortalColaborador from './components/PortalColaborador';
import DecorAI from './components/DecorAI';
import AIAssistant from './components/AIAssistant';
import Profissionais from './components/Profissionais';
import { View, UserRole } from './types';
import { dataSync } from './src/services/dataSync';
import { LAST_MODIFIED_VIEW, LAST_MODIFIED_TIMESTAMP } from './src/dev-metadata';
import ConfirmModal from './components/ConfirmModal';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';

import Pedidos from './components/Pedidos';

import { compressImage } from './src/utils/imageUtils';

const LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEjRUQCeZnEJue8_9Hx-MgK6LIqJ2K1WFc9xgLwf_IZQ&s"; // New logo provided by user
const PROFILE_PHOTO = "https://storage.googleapis.com/a1aa/image/Vq3L9m_O6_r_R-16_0_0_0_0.jpg";
const GOLDEN_HELMET_STYLE = { filter: "sepia(0.5) saturate(2) brightness(1.1)" };

interface MenuItem {
  id: View;
  label: string;
  icon: React.ReactNode;
  url?: string;
}

interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

const defaultMenuGroups: MenuGroup[] = [
  {
    id: 'visao-geral',
    title: 'Visão Geral',
    items: [
      { id: View.DECOR, label: 'Reforma / Decorações', icon: <Palette size={18} /> },
      { id: View.PROFISSIONAIS, label: 'Profissionais', icon: <HardHat size={18} /> },
      { id: View.DASHBOARD, label: 'Dashboard Executivo', icon: <LayoutDashboard size={18} /> },
      { id: View.CLIENTES, label: 'Registro de Clientes', icon: <Users size={18} /> },
    ]
  },
  {
    id: 'inteligencia',
    title: 'Inteligência Perfil',
    items: [
      { id: View.LEITURA_PROJETOS, label: 'IA Leitora de Projetos', icon: <FileSearch size={18} /> },
      { id: View.PLANEJAMENTO_ESTRATEGICO, label: 'Planejamento Estratégico', icon: <Target size={18} /> },
      { id: View.QA_CHAT, label: 'Perguntas & Respostas', icon: <MessageSquare size={18} /> },
    ]
  },
  {
    id: 'operacional',
    title: 'Execução & Obras',
    items: [
      { id: View.OBRAS, label: 'Gestão de Obras', icon: <Building2 size={18} /> },
      { id: View.PROJETOS, label: 'Projetos Técnicos', icon: <FolderKanban size={18} /> },
      { id: View.ETAPAS, label: 'Etapas & Cronograma', icon: <Layers size={18} /> },
      { id: View.PRODUCAO, label: 'Produção Diária', icon: <Hammer size={18} /> },
      { id: View.MEDICOES, label: 'Medições de Campo', icon: <Ruler size={18} /> },
    ]
  },
  {
    id: 'equipes',
    title: 'Gestão de Equipes',
    items: [
      { id: View.COLABORADORES, label: 'Colaboradores', icon: <Users size={18} /> },
      { id: View.EMPREITEIROS, label: 'Empreiteiros', icon: <HardHat size={18} /> },
      { id: View.PONTO, label: 'Ponto Facial Biométrico', icon: <Fingerprint size={18} /> },
      { id: View.AUTONOMO, label: 'Regulamento Autônomo', icon: <Scale size={18} /> },
      { id: View.COLABORADOR_PORTAL, label: 'Portal do Colaborador', icon: <UserSquare2 size={18} /> },
    ]
  },
  {
    id: 'financeiro',
    title: 'Suprimentos & Financeiro',
    items: [
      { id: View.FORNECEDORES, label: 'Fornecedores', icon: <Truck size={18} /> },
      { id: View.MATERIAIS, label: 'Gestão de Materiais', icon: <ClipboardList size={18} /> },
      { id: View.PEDIDOS, label: 'Pedidos de Compra', icon: <ShoppingBag size={18} /> },
      { id: View.FATURAS, label: 'Faturas & Boletos', icon: <ClipboardList size={18} /> },
      { id: View.PAGAMENTOS, label: 'Fluxo de Pagamentos', icon: <Clock size={18} /> },
      { id: View.PROPOSTAS, label: 'Propostas de Serviço', icon: <FileText size={18} /> },
    ]
  },
  {
    id: 'sistema',
    title: 'Suporte & Configurações',
    items: [
      { id: View.CALCULADORAS, label: 'Calculadoras Técnicas', icon: <Calculator size={18} /> },
      { id: View.TUTORIAL, label: 'Vídeo Tutorial', icon: <Video size={18} /> },
      { id: View.YOUTUBE, label: 'Canal Oficial', icon: <Youtube size={18} />, url: 'https://www.youtube.com/@David-d2i7x' },
      { id: View.CONTROLE_ACESSO, icon: <ShieldCheck size={18} />, label: 'Controle de Acesso' },
      { id: View.CONFIGURACOES, label: 'Configurações', icon: <Settings size={18} /> },
    ]
  }
];

const SortableMenuItem: React.FC<{
  item: any;
  activeView: View;
  setActiveView: (view: View) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  isReorderMode: boolean;
}> = ({ item, activeView, setActiveView, setIsMobileMenuOpen, isSidebarOpen, isReorderMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: !isReorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="relative group">
      <button
        onClick={() => {
          if (isReorderMode) return;
          if ((item as any).url) {
            window.open((item as any).url, '_blank');
          } else {
            setActiveView(item.id);
          }
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group border ${
          activeView === item.id 
            ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-lg shadow-amber-500/20' 
            : 'text-amber-500 border-amber-500/10 hover:bg-slate-800 hover:text-amber-400 hover:border-amber-500/30'
        } ${isReorderMode ? 'cursor-default' : 'cursor-pointer'}`}
        title={!isSidebarOpen ? item.label : undefined}
      >
        <span className={`flex-shrink-0 transition-transform ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
        {isSidebarOpen && (
          <span className={`font-black uppercase tracking-widest text-[11px] flex-1 text-left ${
            activeView === item.id 
              ? 'text-slate-900' 
              : 'bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600'
          }`}>
            {item.label}
          </span>
        )}
        {isReorderMode && isSidebarOpen && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-amber-500/10 rounded">
            <GripVertical size={14} className="text-amber-500/50" />
          </div>
        )}
      </button>
    </li>
  );
};

const SortableMenuGroup: React.FC<{
  group: any;
  isSidebarOpen: boolean;
  isReorderMode: boolean;
  expandedGroups: string[];
  toggleGroup: (title: string) => void;
  activeView: View;
  setActiveView: (view: View) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  onItemDragEnd: (groupId: string, event: DragEndEvent) => void;
  sensors: any;
}> = ({ group, isSidebarOpen, isReorderMode, expandedGroups, toggleGroup, activeView, setActiveView, setIsMobileMenuOpen, onItemDragEnd, sensors }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: group.id, disabled: !isReorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const isExpanded = expandedGroups.includes(group.title);
  const activeInGroup = group.items.some((item: any) => item.id === activeView);

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      {isSidebarOpen ? (
        <div className="flex items-center gap-2 group">
          <button 
            onClick={() => !isReorderMode && toggleGroup(group.title)}
            className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-colors border border-amber-500/5 ${
              activeInGroup ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-amber-500/70 hover:text-amber-400 hover:bg-slate-800/50'
            } ${isReorderMode ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">{group.title}</span>
            {!isReorderMode && <ChevronLeft size={16} className={`transition-transform duration-200 ${isExpanded ? '-rotate-90' : ''}`} />}
          </button>
          {isReorderMode && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-amber-500/10 rounded">
              <GripVertical size={16} className="text-amber-500/50" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-px bg-slate-800 my-4 mx-2" />
      )}
      
      {(isExpanded || !isSidebarOpen || isReorderMode) && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onItemDragEnd(group.id, e)}>
          <SortableContext items={group.items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className={`space-y-1 ${isSidebarOpen ? 'ml-2 border-l border-amber-500/10 pl-2' : ''}`}>
              {group.items.map((item: any) => (
                <SortableMenuItem 
                  key={item.id} 
                  item={item} 
                  activeView={activeView} 
                  setActiveView={setActiveView} 
                  setIsMobileMenuOpen={setIsMobileMenuOpen} 
                  isSidebarOpen={isSidebarOpen}
                  isReorderMode={isReorderMode}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Ops! Algo deu errado</h2>
            <p className="text-slate-500 font-medium mb-8">Ocorreu um erro inesperado. Tente recarregar a página ou voltar para o início.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const RegistrationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'pro' | 'client' | 'login';
  loggedUser: { type: 'pro' | 'client', id: string } | null;
  setLoggedUser: (user: { type: 'pro' | 'client', id: string } | null) => void;
}> = ({ isOpen, onClose, type, loggedUser, setLoggedUser }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      />
      <div className="relative w-full max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-blue-200 transition-colors"
        >
          <X size={32} />
        </button>
        <Profissionais 
          isModal={true}
          defaultTab={type === 'login' ? 'login' : (type === 'pro' ? 'register_pro' : 'register_client')}
          loggedUser={loggedUser}
          onClose={onClose}
          setLoggedUser={(user) => {
            setLoggedUser(user);
            if (user) onClose();
          }}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<View>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Priority 1: URL view parameter
    const viewParam = urlParams.get('view');
    if (viewParam && Object.values(View).includes(viewParam as View)) {
      return viewParam as View;
    }

    // Priority 2: URL role parameter
    if (urlParams.get('role') === 'colaborador') return View.COLABORADOR_PORTAL;
    
    // Priority 3: Saved view from localStorage
    const saved = localStorage.getItem('perfil_active_view');
    if (saved && Object.values(View).includes(saved as View)) {
      return saved as View;
    }

    // Default view
    return View.DECOR;
  });
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState<{ isOpen: boolean, type: 'pro' | 'client' | 'login' }>({ isOpen: false, type: 'pro' });
  const [loggedMarketplaceUser, setLoggedMarketplaceUser] = useState<{ type: 'pro' | 'client', id: string } | null>(() => {
    const saved = localStorage.getItem('perfil_marketplace_logged_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing loggedMarketplaceUser:", e);
      return null;
    }
  });

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let userData = userDoc.exists() ? userDoc.data() : null;

        if (!userData) {
          // Create user doc if it doesn't exist
          userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photo: user.photoURL || PROFILE_PHOTO,
            role: 'user' // Default role
          };
          await setDoc(doc(db, 'users', user.uid), userData);
        }

        setCurrentUser({
          id: user.uid,
          name: userData.displayName || user.displayName || 'Usuário',
          email: user.email || '',
          photo: user.photoURL || PROFILE_PHOTO,
          role: userData.role || 'user'
        });
        setIsAuthenticated(true);
        localStorage.setItem('perfil_auth', 'true');
      } else {
        // User is signed out
        setCurrentUser({
          id: 'guest',
          name: 'Visitante',
          email: '',
          photo: PROFILE_PHOTO,
          role: 'user'
        });
        setIsAuthenticated(false);
        localStorage.removeItem('perfil_auth');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Real-time Sync
  useEffect(() => {
    if (!isAuthenticated || !isAuthReady || !auth.currentUser) return;

    const collections = ['projects', 'works', 'materials'];
    const unsubscribes = collections.map(colName => {
      return onSnapshot(collection(db, colName), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        localStorage.setItem(`perfil_${colName}`, JSON.stringify(data));
        // Trigger a custom event to notify components
        window.dispatchEvent(new CustomEvent(`perfil_${colName}_updated`, { detail: data }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, colName);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [isAuthenticated, isAuthReady]);

  useEffect(() => {
    try {
      if (loggedMarketplaceUser) {
        localStorage.setItem('perfil_marketplace_logged_user', JSON.stringify(loggedMarketplaceUser));
      } else {
        localStorage.removeItem('perfil_marketplace_logged_user');
      }
    } catch (e) {
      console.error("Error saving loggedMarketplaceUser to localStorage:", e);
    }
  }, [loggedMarketplaceUser]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOfferSearch, setShowOfferSearch] = useState(false);
  const [showHelpAI, setShowHelpAI] = useState(false);
  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [profissionaisTab, setProfissionaisTab] = useState<'find' | 'register_pro' | 'register_client' | 'dashboard_pro' | 'dashboard_client' | 'publish_request' | 'login' | 'manage' | 'feedback' | 'wallet'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const validTabs = ['find', 'register_pro', 'register_client', 'dashboard_pro', 'dashboard_client', 'publish_request', 'login', 'manage', 'feedback', 'wallet'];
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam as any;
    }
    return 'find';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasImportedProjects, setHasImportedProjects] = useState(() => {
    const saved = localStorage.getItem('perfil_imported_projects');
    try {
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch (e) {
      console.error("Error parsing hasImportedProjects:", e);
      return false;
    }
  });
  const [onlineUsers, setOnlineUsers] = useState(739);
  const [activeAdmins, setActiveAdmins] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('perfil_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing perfil_user:", e);
      }
    }
    return {
      id: 'guest',
      name: 'Visitante',
      email: '',
      photo: PROFILE_PHOTO,
      role: 'user'
    };
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('perfil_theme');
    // Force dark theme for this version to match user preference
    const lastForcedTheme = localStorage.getItem('perfil_forced_dark_v2');
    if (!lastForcedTheme) {
      localStorage.setItem('perfil_forced_dark_v2', 'true');
      return 'dark';
    }
    return (saved as 'light' | 'dark') || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('perfil_theme', theme);
  }, [theme]);

  // Real-time presence tracking
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Identify ourselves
        ws.send(JSON.stringify({
          type: 'identify',
          user: {
            id: currentUser.id || currentUser.email,
            name: currentUser.name || 'Admin',
            photo: currentUser.photo || PROFILE_PHOTO,
            role: currentUser.role
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'presence') {
            setOnlineUsers(data.count + 738);
            if (data.admins) {
              setActiveAdmins(data.admins);
            }
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [isAuthenticated, currentUser]);

  const [isSyncing, setIsSyncing] = useState(dataSync.isSyncing);
  const [isConnected, setIsConnected] = useState(dataSync.isConnected);
  const [syncKey, setSyncKey] = useState(0);

  // Persist active view and handle URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle action parameter
    const actionParam = urlParams.get('action');
    if (actionParam === 'registrar_cliente') {
      if (activeView !== View.PROFISSIONAIS) {
        setActiveView(View.PROFISSIONAIS);
      }
      if (!showRegistrationModal.isOpen || showRegistrationModal.type !== 'client') {
        setShowRegistrationModal({ isOpen: true, type: 'client' });
      }
      setIsMobileMenuOpen(false);
      
      // Clear the action parameter to prevent re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl.toString());
      return;
    }

    // Handle role=colaborador
    if (urlParams.get('role') === 'colaborador' && activeView !== View.COLABORADOR_PORTAL) {
      setActiveView(View.COLABORADOR_PORTAL);
      return;
    }

    // Handle view parameter (e.g. ?view=decor)
    const viewParam = urlParams.get('view');
    const tabParam = urlParams.get('tab');

    if (viewParam && Object.values(View).includes(viewParam as View)) {
      if (activeView !== viewParam) {
        setActiveView(viewParam as View);
      }
      
      // Handle specific tab for profissionais
      if (viewParam === View.PROFISSIONAIS && tabParam) {
        const validTabs = ['find', 'register_pro', 'register_client', 'dashboard_pro', 'dashboard_client', 'publish_request', 'login', 'manage', 'feedback', 'wallet'];
        if (validTabs.includes(tabParam) && profissionaisTab !== tabParam) {
          setProfissionaisTab(tabParam as any);
        }
      }
      
      setIsMobileMenuOpen(false);
      return;
    }

    localStorage.setItem('perfil_active_view', activeView);
  }, [activeView, showRegistrationModal.isOpen, showRegistrationModal.type, profissionaisTab]);

  // Handle URL parameters and sync events
  React.useEffect(() => {
    // Developer Auto-Navigation: Jump to the view that was last modified by the developer
    // ONLY if no specific view is requested in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasViewParam = urlParams.get('view') || urlParams.get('role') === 'colaborador';
    
    const lastSeenTimestamp = localStorage.getItem('perfil_last_dev_change_ts');
    if (!hasViewParam && lastSeenTimestamp !== String(LAST_MODIFIED_TIMESTAMP)) {
      setActiveView(LAST_MODIFIED_VIEW);
      localStorage.setItem('perfil_last_dev_change_ts', String(LAST_MODIFIED_TIMESTAMP));
    }

    dataSync.init();
    dataSync.setOnSyncStateChange(setIsSyncing);
    dataSync.setOnConnectionChange(setIsConnected);

    const refreshGlobalState = () => {
      // Refresh states that depend on localStorage
      const auth = localStorage.getItem('perfil_auth') === 'true';
      setIsAuthenticated(auth);

      const savedUser = localStorage.getItem('perfil_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      
      const imported = localStorage.getItem('perfil_imported_projects');
      try {
        setHasImportedProjects(imported ? JSON.parse(imported).length > 0 : false);
      } catch (e) {
        console.error("Error parsing imported projects in useEffect:", e);
        setHasImportedProjects(false);
      }
    };

    const handleSyncComplete = () => {
      refreshGlobalState();
    };

    const handleStorageChange = () => {
      refreshGlobalState();
    };

    window.addEventListener('perfil_sync_complete', handleSyncComplete);
    window.addEventListener('storage', handleStorageChange);

    // Initial sync check to ensure user sees latest data from cloud
    if (localStorage.getItem('perfil_auth') === 'true') {
      dataSync.forceSync();
    }

    return () => {
      window.removeEventListener('perfil_sync_complete', handleSyncComplete);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogin = async (user: any) => {
    // This is now handled by onAuthStateChanged
    console.log('Login handled by Firebase Auth listener');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentUser({
        id: 'guest',
        name: 'Visitante',
        email: '',
        photo: PROFILE_PHOTO,
        role: 'user'
      });
      localStorage.removeItem('perfil_auth');
      localStorage.removeItem('perfil_user');
      setActiveView(View.DECOR);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearchOffers = () => {
    if (!offerSearchTerm) return;
    setIsSearching(true);
    // Mock search results with images
    setTimeout(() => {
      setSearchResults([
        { id: 1, name: 'Porcelanato Polido 80x80', price: 'R$ 89,90/m²', supplier: 'Pisos & Acabamentos DF', image: 'https://picsum.photos/seed/piso1/400/400', discount: '15% OFF', url: 'https://www.google.com/search?q=porcelanato+80x80+oferta' },
        { id: 2, name: 'Cimento CP II 50kg', price: 'R$ 34,50', supplier: 'Brasília Materiais', image: 'https://picsum.photos/seed/cimento/400/400', discount: 'Preço Imbatível', url: 'https://www.google.com/search?q=cimento+cp2+50kg+preco' },
        { id: 3, name: 'Fio Flexível 2.5mm 100m', price: 'R$ 189,00', supplier: 'Elétrica Capital', image: 'https://picsum.photos/seed/fio/400/400', discount: 'Atacado', url: 'https://www.google.com/search?q=fio+flexivel+2.5mm+100m' },
      ]);
      setIsSearching(false);
    }, 1500);
  };
  
  // Permission System State
  const [roles] = useState<UserRole[]>(() => {
    const saved = localStorage.getItem('perfil_user_roles');
    const defaultRoles = [
      { id: 'admin', name: 'Administrador', permissions: Object.values(View) },
      { id: 'user', name: 'Público', permissions: [View.CALCULADORAS, View.PROFISSIONAIS, View.DECOR] },
      { id: 'colaborador', name: 'Colaborador', permissions: [View.COLABORADOR_PORTAL, View.PONTO] }
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserRole[];
        // Ensure admin always has all permissions
        const adminRole = parsed.find(r => r.id === 'admin');
        if (adminRole) {
          adminRole.permissions = Object.values(View);
        }
        
        // Ensure 'user' role exists and has only calculator
        if (!parsed.find((r: any) => r.id === 'user')) {
          parsed.push(defaultRoles[1]);
        } else {
          const userRole = parsed.find((r: any) => r.id === 'user');
          userRole.permissions = [View.CALCULADORAS, View.PROFISSIONAIS, View.DECOR];
          userRole.name = 'Público';
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing user roles:", e);
      }
    }
    return defaultRoles;
  });
  const [currentRoleId, setCurrentRoleId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('role') === 'admin') return 'admin';
    if (urlParams.get('role') === 'colaborador') return 'colaborador';
    if (urlParams.get('role') === 'publico') return 'user';
    const saved = localStorage.getItem('perfil_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        return user.role === 'admin' ? 'admin' : 'user';
      } catch (e) {
        console.error("Error parsing user for role check:", e);
      }
    }
    return 'user';
  });
  const currentRole = useMemo(() => roles.find(r => r.id === currentRoleId) || roles[0], [roles, currentRoleId]);

  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: 'Oferta: Pisos & Acabamentos DF', 
      message: 'Porcelanato 80x80 com 15% de desconto hoje!', 
      time: '10 min atrás', 
      isNew: true,
      image: 'https://picsum.photos/seed/piso/200/200',
      url: 'https://www.leroymerlin.com.br/porcelanatos'
    },
    { 
      id: 2, 
      title: 'Promoção: Elétrica Capital', 
      message: 'Saldão de fios e cabos - Preços de atacado.', 
      time: '1 hora atrás', 
      isNew: true,
      image: 'https://picsum.photos/seed/eletrica/200/200',
      url: 'https://www.telhanorte.com.br/eletrica'
    }
  ]);

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Execução & Obras']);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
    const saved = localStorage.getItem('perfil_menu_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MenuGroup[];
        
        // Merge saved order with current default items to ensure new features appear
        const mergedGroups = defaultMenuGroups.map(defaultGroup => {
          const savedGroup = parsed.find(g => g.id === defaultGroup.id);
          if (!savedGroup) return defaultGroup;
          
          // Add missing items from default group to saved items
          const mergedItems = [...savedGroup.items];
          defaultGroup.items.forEach(defaultItem => {
            if (!mergedItems.some(i => i.id === defaultItem.id)) {
              mergedItems.push(defaultItem);
            }
          });
          
          return {
            ...savedGroup,
            items: mergedItems.map(item => {
              const defaultItem = defaultMenuGroups
                .flatMap(g => g.items)
                .find(i => i.id === item.id);
              return { ...item, icon: defaultItem?.icon || <Layers size={18} /> };
            })
          };
        });
        
        return mergedGroups;
      } catch (e) {
        return defaultMenuGroups;
      }
    }
    return defaultMenuGroups;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setMenuGroups((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('perfil_menu_order', JSON.stringify(newOrder.map(g => {
          const { items, ...restGroup } = g;
          return {
            ...restGroup,
            items: items.map(({ icon, ...restItem }: any) => restItem)
          };
        })));
        return newOrder;
      });
    }
  };

  const handleItemDragEnd = (groupId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setMenuGroups((groups) => {
        return groups.map(group => {
          if (group.id !== groupId) return group;
          const oldIndex = group.items.findIndex((i) => i.id === active.id);
          const newIndex = group.items.findIndex((i) => i.id === over.id);
          const newItems = arrayMove(group.items, oldIndex, newIndex);
          const updatedGroup = { ...group, items: newItems };
          
          // Save all groups to preserve overall order
          const allGroups = groups.map(g => g.id === groupId ? updatedGroup : g);
          localStorage.setItem('perfil_menu_order', JSON.stringify(allGroups.map(g => {
            const { items, ...restGroup } = g;
            return {
              ...restGroup,
              items: items.map(({ icon, ...restItem }: any) => restItem)
            };
          })));
          
          return updatedGroup;
        });
      });
    }
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  const handleShareAccess = async () => {
    const shareUrl = `${window.location.origin}?role=publico`;
    const shareData = {
      title: 'Perfil Acabamentos - Cadastro de Usuário',
      text: 'Cadastre-se no sistema da Perfil Acabamentos para acompanhar suas obras e serviços.',
      url: shareUrl
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link de cadastro para usuários comuns copiado com sucesso!');
      } catch (clipErr) {
        window.prompt('Copie o link de cadastro abaixo:', shareUrl);
      }
    }
  };

  const renderContent = () => {
    // Check if user has permission for activeView
    if (currentRoleId !== 'admin' && !currentRole.permissions.includes(activeView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-20 text-center animate-in fade-in zoom-in duration-300 transition-colors">
          <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-full mb-6 text-rose-500 dark:text-rose-400">
            <ShieldCheck size={64} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Acesso Restrito</h2>
          <p className="max-w-md mt-2">Você não possui permissão para visualizar este módulo. Entre em contato com o administrador.</p>
          <button 
            onClick={() => setActiveView(currentRoleId === 'admin' ? View.DASHBOARD : View.CALCULADORAS)}
            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            {currentRoleId === 'admin' ? 'Voltar ao Dashboard' : 'Ir para Calculadoras'}
          </button>
        </div>
      );
    }

    switch (activeView) {
      case View.DASHBOARD:
        return <Dashboard theme={theme} />;
      case View.OBRAS:
        return <Obras onNavigate={setActiveView} />;
      case View.PROJETOS:
        return <Projetos onNavigate={setActiveView} />;
      case View.ETAPAS:
        return <Etapas onNavigate={setActiveView} />;
      case View.FORNECEDORES:
        return <Fornecedores />;
      case View.EMPREITEIROS:
        return <Empreiteiros onNavigate={setActiveView} />;
      case View.COLABORADORES:
        return <Colaboradores />;
      case View.PONTO:
        return <PontoFacial />;
      case View.MATERIAIS:
        return <Materiais onNavigate={setActiveView} />;
      case View.MEDICOES:
        return <Medicoes onNavigate={setActiveView} />;
      case View.FATURAS:
        return <Faturas onNavigate={setActiveView} />;
      case View.PAGAMENTOS:
        return <Pagamentos />;
      case View.PROFISSIONAIS:
        return <Profissionais onNavigate={setActiveView} defaultTab={profissionaisTab} onTabChange={setProfissionaisTab} loggedUser={loggedMarketplaceUser} setLoggedUser={setLoggedMarketplaceUser} />;
      case View.PRODUCAO:
        return <ProducaoDiaria onNavigate={setActiveView} />;
      case View.CLIENTES:
        return <Clientes onNavigate={setActiveView} />;
      case View.PEDIDOS:
        return <Pedidos />;
      case View.CALCULADORAS:
        return <Calculadoras onNavigate={setActiveView} />;
      case View.PROPOSTAS:
        return <Propostas />;
      case View.YOUTUBE:
        return null; // Handled by window.open
      case View.AUTONOMO:
        return <Autonomo />;
      case View.CONTROLE_ACESSO:
        return <ControleAcesso />;
      case View.CONFIGURACOES:
        return <Configuracoes theme={theme} setTheme={setTheme} />;
      case View.LEITURA_PROJETOS:
        return <LeituraProjetos />;
      case View.PLANEJAMENTO_ESTRATEGICO:
        return <PlanejamentoEstrategico key={syncKey} />;
      case View.QA_CHAT:
        return <QAChat />;
      case View.DECOR:
        return (
          <DecorAI 
            isAdmin={currentRoleId === 'admin'} 
            onNavigate={(view) => {
              if (view === View.PROFISSIONAIS) setProfissionaisTab('register_client');
              setActiveView(view);
            }} 
          />
        );
      case View.COLABORADOR_PORTAL:
        return <PortalColaborador key={syncKey} onLogout={handleLogout} />;
      case View.TUTORIAL:
        return <Tutorial />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-20 text-center animate-in fade-in zoom-in duration-300 transition-colors">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6 text-slate-300 dark:text-slate-600">
              <Layers size={64} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Módulo em Desenvolvimento</h2>
            <p className="max-w-md mt-2">Estamos trabalhando para trazer a melhor experiência de gestão de {menuGroups.flatMap(g => g.items).find(m => m.id === activeView)?.label.toLowerCase()} em breve.</p>
          </div>
        );
    }
  };

  const isPublicView = activeView === View.PROFISSIONAIS || activeView === View.DECOR || activeView === View.CALCULADORAS;

  if (!isAuthenticated && !isPublicView) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 relative transition-colors duration-300">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isAuthenticated && currentRoleId !== 'colaborador' && (
        <aside 
          className={`${
            isSidebarOpen ? 'w-80' : 'w-20'
          } ${
            isMobileMenuOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0'
          } bg-[#0b1222] text-white flex flex-col transition-all duration-300 ease-in-out fixed lg:sticky top-0 h-screen z-50 lg:z-10 shadow-2xl shadow-slate-900/50`}
        >
        <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shadow-amber-500/20 flex-shrink-0 bg-amber-500 flex items-center justify-center">
              <img 
                src={LOGO_URL} 
                alt="Logo Perfil" 
                className="w-full h-full object-contain"
                style={GOLDEN_HELMET_STYLE}
                referrerPolicy="no-referrer"
              />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-base leading-none tracking-tight tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">PERFIL</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Acabamentos</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileMenuOpen(false);
              } else {
                setIsSidebarOpen(!isSidebarOpen);
              }
            }}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 transition-colors"
          >
            {window.innerWidth < 1024 ? (
              <X size={18} />
            ) : (
              <ChevronLeft className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} size={18} />
            )}
          </button>
        </div>

        {/* Active Administrators Photos */}
        {isSidebarOpen && activeAdmins.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
            {activeAdmins.map((admin, idx) => (
              <div key={admin.id || idx} className="relative group/admin flex-shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                  <img 
                    src={admin.photo || PROFILE_PHOTO} 
                    alt={admin.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0b1222] rounded-full"></div>
                
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-amber-500 text-slate-900 text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/admin:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {admin.name} {admin.id === (currentUser?.id || currentUser?.email) ? '(VOCÊ)' : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Info */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-3">
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden flex-1">
                <select 
                  className="text-[10px] bg-transparent border-none text-amber-400 font-bold uppercase tracking-wider outline-none cursor-pointer w-full"
                  value={currentRoleId}
                  onChange={e => {
                    setCurrentRoleId(e.target.value);
                    // Reset to dashboard if current view is not allowed
                    const role = roles.find(r => r.id === e.target.value);
                    if (role && !role.permissions.includes(activeView)) {
                      setActiveView(View.DASHBOARD);
                    }
                  }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">{r.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Menu Search */}
          {isSidebarOpen && (
            <div className="mt-4 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={14} />
              <input 
                type="text"
                placeholder="BUSCAR NO MENU..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-[9px] font-bold uppercase tracking-widest text-amber-500 placeholder:text-amber-900 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                value={menuSearchTerm}
                onChange={e => setMenuSearchTerm(e.target.value)}
              />
              {menuSearchTerm && (
                <button 
                  onClick={() => setMenuSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar text-xs">
          <div className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={menuGroups.map(g => g.id)} strategy={verticalListSortingStrategy}>
                {menuGroups.map((group) => {
                  const filteredItems = group.items.filter(item => {
                    const matchesSearch = item.label.toLowerCase().includes(menuSearchTerm.toLowerCase());
                    const hasPermission = currentRoleId === 'admin' || currentRole.permissions.includes(item.id);
                    return matchesSearch && hasPermission;
                  });
                  
                  if (filteredItems.length === 0 && menuSearchTerm) return null;

                  // When searching, we don't use the sortable component to avoid confusion
                  if (menuSearchTerm) {
                    const isExpanded = expandedGroups.includes(group.title) || menuSearchTerm.length > 0;
                    const activeInGroup = filteredItems.some(item => activeView === item.id);
                    
                    return (
                      <div key={group.id} className="space-y-1">
                        {isSidebarOpen ? (
                          <button 
                            onClick={() => toggleGroup(group.title)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors border border-amber-500/5 ${
                              activeInGroup ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-amber-500/70 hover:text-amber-400 hover:bg-slate-800/50'
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">{group.title}</span>
                            <ChevronLeft size={14} className={`transition-transform duration-200 ${isExpanded ? '-rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <div className="h-px bg-slate-800 my-4 mx-2" />
                        )}
                        
                        {(isExpanded || !isSidebarOpen) && (
                          <ul className="space-y-1">
                            {filteredItems.map((item) => (
                              <li key={item.id}>
                                <button
                                  onClick={() => {
                                    if ((item as any).url) {
                                      window.open((item as any).url, '_blank');
                                    } else {
                                      setActiveView(item.id);
                                    }
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group border ${
                                    activeView === item.id 
                                      ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-lg shadow-amber-500/20' 
                                      : 'text-amber-500 border-amber-500/10 hover:bg-slate-800 hover:text-amber-400 hover:border-amber-500/30'
                                  }`}
                                >
                                  <span className="flex-shrink-0">{item.icon}</span>
                                  {isSidebarOpen && <span className="font-bold uppercase tracking-widest text-[9px]">{item.label}</span>}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }

                  return (
                    <SortableMenuGroup 
                      key={group.id}
                      group={group}
                      isSidebarOpen={isSidebarOpen}
                      isReorderMode={isReorderMode}
                      expandedGroups={expandedGroups}
                      toggleGroup={toggleGroup}
                      activeView={activeView}
                      setActiveView={setActiveView}
                      setIsMobileMenuOpen={setIsMobileMenuOpen}
                      onItemDragEnd={handleItemDragEnd}
                      sensors={sensors}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </nav>

        {/* Logout & Reorder */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {isSidebarOpen && (
            <button 
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all border ${
                isReorderMode 
                  ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-lg shadow-amber-500/20' 
                  : 'text-amber-500 border-amber-500/10 hover:bg-slate-800 hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <GripVertical size={18} />
              <span className="font-bold uppercase tracking-widest text-[9px]">
                {isReorderMode ? 'Salvar Ordem' : 'Reordenar Menu'}
              </span>
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            {isSidebarOpen && <span className="font-bold uppercase tracking-widest text-[9px]">Sair do Sistema</span>}
          </button>
        </div>
      </aside>
    )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto relative custom-scrollbar transition-all duration-300 ${!isSidebarOpen || !isAuthenticated ? 'lg:ml-0' : ''}`}>
        {/* Header with Notifications */}
        {isAuthenticated ? (
          <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 h-16 flex items-center justify-between px-4 md:px-8 gap-4 z-20 transition-colors">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Menu size={24} />
              </button>
              
              {/* Logo in top bar for all pages */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shadow-amber-500/20 flex-shrink-0 bg-amber-500 flex items-center justify-center">
                  <img 
                    src={LOGO_URL} 
                    alt="Logo Perfil" 
                    className="w-full h-full object-contain"
                    style={GOLDEN_HELMET_STYLE}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs leading-none tracking-tight uppercase text-slate-900 dark:text-white">PERFIL</span>
                  <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Acabamentos</span>
                </div>
              </div>
  
              {/* Sync Status Indicator */}
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isSyncing ? 'bg-blue-500 animate-pulse' : 
                  isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}></div>
                <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  {isSyncing ? 'Sincronizando...' : isConnected ? 'Nuvem Ativa' : 'Modo Offline'}
                </span>
                {isConnected && !isSyncing && (
                  <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                    <Globe size={8} className="text-emerald-500" />
                  </div>
                )}
              </div>
            </div>
  
            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center lg:justify-start">
              {currentRoleId === 'admin' && (
                <button 
                  onClick={handleShareAccess}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all group shadow-lg shadow-blue-200 dark:shadow-blue-900/20 cursor-pointer"
                  title="Convidar Usuário (Link de Cadastro)"
                >
                  <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">Convidar Usuário</span>
                </button>
              )}
  
              {activeView === View.DASHBOARD && (
                <>
                  <button 
                    onClick={() => setShowOfferSearch(true)}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl transition-all group cursor-pointer"
                  >
                    <Search size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Buscar Ofertas</span>
                  </button>
  
                  <button 
                    onClick={async () => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Sincronizar com a Nuvem',
                        message: 'Deseja sincronizar todos os dados com a nuvem agora?',
                        onConfirm: async () => {
                          await dataSync.forceSync();
                          setSyncKey(prev => prev + 1);
                          alert('Sincronização concluída!');
                        }
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all group border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                    title="Sincronizar Agora"
                  >
                    <Zap size={18} className={`${isSyncing ? 'animate-spin' : 'group-hover:scale-110'} transition-all`} />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">Sincronizar Nuvem</span>
                  </button>
                </>
              )}
            </div>
  
            <div className="flex items-center gap-2 md:gap-4">
              {activeView === View.PROFISSIONAIS && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500 mr-2">
                  {/* Login button removed as per user request */}

                  {loggedMarketplaceUser && (
                    <button 
                      onClick={() => setProfissionaisTab(loggedMarketplaceUser.type === 'pro' ? 'dashboard_pro' : 'dashboard_client')}
                      className={`px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${['dashboard_pro', 'dashboard_client'].includes(profissionaisTab) ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 ring-2 ring-blue-400/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}
                    >
                      <LayoutDashboard size={14} />
                      Painel
                    </button>
                  )}
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowRegisterMenu(!showRegisterMenu)}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-xl shadow-blue-500/40 hover:bg-blue-700 ring-2 ring-blue-400/20"
                    >
                      <UserPlus size={14} />
                      Cadastre-se
                    </button>

                  {showRegisterMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[60] animate-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => {
                          setShowRegistrationModal({ isOpen: true, type: 'pro' });
                          setShowRegisterMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 group"
                      >
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Hammer size={14} />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Sou Profissional</span>
                      </button>
                      <button 
                        onClick={() => {
                          setShowRegistrationModal({ isOpen: true, type: 'client' });
                          setShowRegisterMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 group border-t border-slate-50 dark:border-slate-800"
                      >
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Users size={14} />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Sou Cliente</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                <Users size={18} className="text-blue-600 dark:text-blue-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 leading-none">{onlineUsers}</span>
                  <span className="text-[7px] font-bold text-blue-500 dark:text-blue-500 uppercase tracking-widest">Usuários Ativos</span>
                </div>
              </div>

              {activeView === View.PROFISSIONAIS && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      // We'll need to trigger this in Profissionais component
                      window.dispatchEvent(new CustomEvent('trigger_ai_suggestion'));
                    }}
                    className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles size={14} />
                    <span className="hidden lg:block">Sugestão IA</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowRegistrationModal({ isOpen: true, type: 'client' });
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    <UserPlus size={14} />
                    <span className="hidden lg:block">Cadastrar Cliente</span>
                  </button>
                </div>
              )}

              {activeView === View.PROFISSIONAIS && !loggedMarketplaceUser && (
                <button 
                  onClick={() => {
                    setShowRegistrationModal({ isOpen: true, type: 'pro' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all group shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-700/20"
                >
                  <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Cadastrar Profissional</span>
                </button>
              )}
  
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group relative cursor-pointer"
                  title="Notificações e Ofertas"
                >
                  <Bell size={20} className="group-hover:scale-110 transition-transform" />
                  {notifications.some(n => n.isNew) && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-bounce"></span>
                  )}
                </button>
  
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-[#0b1222] text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-blue-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Radar de Ofertas</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                        {notifications.length} Ativas
                      </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group relative ${n.isNew ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={12} />
                            </button>
                            <div className="flex gap-4">
                              {n.image && (
                                <div className="relative">
                                  <a 
                                    href={n.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <img src={n.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </a>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate pr-6">{n.title}</h4>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">{n.time}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center opacity-30">
                          <Bell size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sem novas ofertas</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => {
                          setActiveView(View.FORNECEDORES);
                          setShowNotifications(false);
                        }}
                        className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-blue-600 dark:hover:bg-blue-700 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                      >
                        Ver Radar de Ofertas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-800 ml-2 animate-in fade-in duration-300 relative group/help">
              <div className="flex flex-col items-end hidden sm:flex">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" title="Você está online"></div>
                  {onlineUsers > 1 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)] animate-pulse" title={`${onlineUsers - 1} outro(s) usuário(s) online`}></div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{currentRole.name}</span>
                  {onlineUsers > 1 && (
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">({onlineUsers})</span>
                  )}
                </div>
              </div>
  
              {/* Help Tooltip - Appears on Hover */}
              <div className="absolute top-full right-0 mt-4 w-72 bg-[#0b1222] text-white rounded-3xl shadow-2xl border border-white/10 p-6 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-300 z-[200] translate-y-2 group-hover/help:translate-y-0">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  <div className="p-2 bg-blue-600 rounded-xl">
                    <HelpCircle size={16} />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Guia de Preenchimento</h4>
                </div>
                
                <div className="space-y-4">
                  {hasImportedProjects && (
                    <div className="p-4 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl mb-2 animate-in zoom-in duration-500">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <CheckCircle2 size={12} />
                        Dados Importados com Sucesso
                      </p>
                      <button 
                        onClick={() => {
                          alert('DESTINO DOS DADOS:\n\n1. MATERIAIS: Adicionados ao estoque com quantidade zerada para cotação.\n2. ETAPAS: Salvas como modelos de cronograma para novas obras.\n\nVerifique os módulos de "Materiais" e "Etapas" para gerenciar os itens.');
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <Info size={12} />
                        Ver Destino dos Dados
                      </button>
                    </div>
                  )}
  
                  <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-2">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Sparkles size={10} />
                      IA Leitora de Projetos
                    </p>
                    <p className="text-[10px] text-white font-bold leading-relaxed italic">
                      "Este botão transforma as informações paradas no papel (PDF/DWG) em dados operacionais dentro do seu estoque e planejamento de obra."
                    </p>
                  </div>
  
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Obras & Projetos</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">Use nomes claros (ex: Edifício Solar) e anexe arquivos em PDF ou imagens nítidas.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Financeiro</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">Insira valores líquidos, defina a data de vencimento real e anexe o comprovante/fatura.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Equipes & Suprimentos</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">Sempre informe o WhatsApp do colaborador e defina o estoque mínimo para alertas automáticos.</p>
                  </div>
  
                  <div className="pt-4 border-t border-white/10">
                    <button 
                      onClick={() => setActiveView(View.TUTORIAL)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <Video size={14} />
                      Ver Vídeo Tutorial
                    </button>
                  </div>
                </div>
  
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <Info size={12} className="text-slate-500" />
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Dica: Mantenha os dados sempre atualizados.</p>
                </div>
              </div>
            </div>
          </header>
        ) : (
          <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 h-16 flex items-center justify-between px-4 md:px-8 gap-4 z-20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shadow-amber-500/20 flex-shrink-0 bg-amber-500 flex items-center justify-center">
                <img 
                  src={LOGO_URL} 
                  alt="Logo Perfil" 
                  className="w-full h-full object-contain"
                  style={GOLDEN_HELMET_STYLE}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs leading-none tracking-tight uppercase text-slate-900 dark:text-white">PERFIL</span>
                <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Acabamentos</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                <Users size={14} className="text-blue-600 dark:text-blue-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 leading-none">{onlineUsers}</span>
                  <span className="text-[7px] font-bold text-blue-500 dark:text-blue-500 uppercase tracking-widest">Usuários Ativos</span>
                </div>
              </div>
            </div>
          </header>
        )}

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
        <AIAssistant />
      </main>

      {/* Material Offer Search Modal */}
      {showOfferSearch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowOfferSearch(false)} 
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <Truck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Radar de Ofertas</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Inteligência de Mercado Perfil</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOfferSearch(false)} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">O que você está procurando?</label>
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Ex: Porcelanato 80x80, Cimento CP II, Fios 2.5mm..."
                    className="w-full pl-16 pr-6 py-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all text-lg shadow-inner"
                    value={offerSearchTerm}
                    onChange={e => setOfferSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchOffers()}
                  />
                </div>
                
                {/* Suggestions from Materials List */}
                {(() => {
                  const savedMaterials = localStorage.getItem('perfil_materials');
                  const materialsList = savedMaterials ? JSON.parse(savedMaterials) : [];
                  const suggestions = materialsList
                    .filter((m: any) => m.name.toLowerCase().includes(offerSearchTerm.toLowerCase()) || m.category.toLowerCase().includes(offerSearchTerm.toLowerCase()))
                    .slice(0, 5);
                  
                  if (offerSearchTerm && suggestions.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-full mb-1">Sugestões da sua lista:</span>
                        {suggestions.map((m: any) => (
                          <button 
                            key={m.id}
                            onClick={() => {
                              setOfferSearchTerm(m.name);
                              // Trigger search immediately
                              setTimeout(handleSearchOffers, 100);
                            }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                          >
                            {m.name} ({m.category})
                          </button>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Consultando Radar Perfil...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Melhores Ofertas Encontradas</h3>
                    <button 
                      onClick={() => setSearchResults([])}
                      className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                    >
                      Nova Busca
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {searchResults.map(result => (
                      <div key={result.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-500 transition-all group cursor-pointer">
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img src={result.image} alt={result.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                        </a>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{result.name}</h4>
                              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded-lg uppercase tracking-widest">{result.discount}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">{result.supplier}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-black text-blue-600 dark:text-blue-400 tracking-tight">{result.price}</span>
                            <a 
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                            >
                              Ver Oferta
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={handleSearchOffers}
                    className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-100 dark:hover:border-blue-800 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Search size={20} />
                      </div>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Buscar no Inventário</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Verificar disponibilidade e preços internos</p>
                  </button>

                  <button 
                    onClick={handleSearchOffers}
                    className="p-6 bg-blue-600 border border-blue-500 rounded-3xl hover:bg-blue-700 transition-all text-left group shadow-xl shadow-blue-200 dark:shadow-blue-900/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform">
                        <Globe size={20} />
                      </div>
                      <Sparkles size={16} className="text-blue-300 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Buscar na Web com IA</h3>
                    <p className="text-[10px] text-blue-100 font-medium mt-1">Encontrar as melhores ofertas em tempo real</p>
                  </button>
                </div>
              )}

              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-3xl flex items-center gap-4">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <Zap size={16} />
                </div>
                <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide leading-relaxed">
                  Dica: Nossa IA compara preços em mais de 50 fornecedores da região automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <RegistrationModal
        isOpen={showRegistrationModal.isOpen}
        onClose={() => setShowRegistrationModal({ ...showRegistrationModal, isOpen: false })}
        type={showRegistrationModal.type}
        loggedUser={loggedMarketplaceUser}
        setLoggedUser={setLoggedMarketplaceUser}
      />
    </div>
  );
};

export default App;
