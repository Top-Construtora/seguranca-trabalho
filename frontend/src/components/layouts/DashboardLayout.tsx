import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ForceChangePasswordModal } from '@/components/auth/ForceChangePasswordModal';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import {
  LayoutDashboard,
  Building2,
  FileText,
  LogOut,
  Menu,
  X,
  HardHat,
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  ClipboardList,
  Sun,
  Moon,
  FolderOpen,
  AlertTriangle,
  Activity,
  CheckCircle2,
  List,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logoGIO from '@/assets/images/logoGIO.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Obras', href: '/works', icon: Building2 },
  { name: 'Avaliação de Obra', href: '/evaluations/obra', icon: HardHat },
  { name: 'Avaliação de Alojamento', href: '/evaluations/alojamento', icon: Home },
  { name: 'Planos de Ação', href: '/action-plans', icon: ClipboardList },
  {
    name: 'Acidentes',
    icon: AlertTriangle,
    children: [
      { name: 'Lista de Acidentes', href: '/accidents', icon: List },
      { name: 'Dashboard', href: '/accidents/dashboard', icon: Activity },
      { name: 'Ações Corretivas', href: '/corrective-actions', icon: CheckCircle2 },
    ]
  },
  { name: 'Documentos', href: '/documents', icon: FolderOpen },
  { name: 'Relatórios', href: '/reports', icon: FileText },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const saved = localStorage.getItem('expanded-menus');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleLogout = () => {
    signOut();
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newExpanded = prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName];
      return newExpanded;
    });
  };

  // Check if any child route is active
  const isChildActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child =>
      child.href && (location.pathname === child.href || location.pathname.startsWith(child.href + '/'))
    );
  };

  // Auto-expand menu if child is active
  useEffect(() => {
    navigation.forEach(item => {
      if (item.children && isChildActive(item) && !expandedMenus.includes(item.name)) {
        setExpandedMenus(prev => [...prev, item.name]);
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Save expanded menus to localStorage
  useEffect(() => {
    localStorage.setItem('expanded-menus', JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  return (
    <div className="min-h-screen bg-[#1e2938] dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-[#1e2938] dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between px-4">
            <img 
              src={logoGIO} 
              alt="GIO Logo" 
              className="h-10 w-auto object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.includes(item.name);
              const isActive = item.href && (location.pathname === item.href ||
                (item.href.startsWith('/evaluations') && location.pathname.startsWith('/evaluations') &&
                 location.pathname.includes(item.href.split('/')[2])));
              const hasActiveChild = isChildActive(item);

              if (hasChildren) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={cn(
                        "flex items-center gap-4 rounded-lg px-4 py-3 text-base font-medium transition-colors w-full",
                        hasActiveChild
                          ? "bg-blue-600 text-white dark:bg-blue-500"
                          : "text-gray-300 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-gray-200"
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                    <div className={cn(
                      "overflow-hidden transition-all duration-200",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="mt-1 space-y-1">
                        {item.children?.map((child) => {
                          const isChildItemActive = child.href && (location.pathname === child.href || location.pathname.startsWith(child.href + '/'));
                          return (
                            <Link
                              key={child.name}
                              to={child.href || '#'}
                              className={cn(
                                "flex items-center gap-4 rounded-lg px-4 py-3 text-base font-medium transition-colors ml-6",
                                isChildItemActive
                                  ? "bg-blue-600 text-white dark:bg-blue-500"
                                  : "text-gray-300 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-gray-200"
                              )}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <child.icon className="h-6 w-6" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href || '#'}
                  className={cn(
                    "flex items-center gap-4 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "text-gray-300 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-gray-200"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300", sidebarCollapsed ? "lg:w-20" : "lg:w-64")}>
        <div className="flex min-h-0 flex-1 flex-col bg-[#1e2938] dark:bg-gray-900">
          <div className={cn("flex h-16 items-center border-b border-gray-600 dark:border-gray-700 transition-all duration-300", sidebarCollapsed ? "px-2 justify-center" : "px-4 justify-between")}>
            {!sidebarCollapsed ? (
              <>
                <img 
                  src={logoGIO} 
                  alt="GIO Logo" 
                  className="h-10 w-auto object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5 shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <img 
                src={logoGIO} 
                alt="GIO Logo" 
                className="h-8 w-auto object-contain"
              />
            )}
          </div>
          
          <nav className="flex-1 space-y-2 px-3 py-6">
            {/* Toggle button apenas quando sidebar colapsada */}
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5 py-3 mb-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {navigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.includes(item.name);
              const isActive = item.href && (location.pathname === item.href ||
                (item.href.startsWith('/evaluations') && location.pathname.startsWith('/evaluations') &&
                 location.pathname.includes(item.href.split('/')[2])));
              const hasActiveChild = isChildActive(item);

              if (hasChildren) {
                // Menu com submenus (expandível)
                if (sidebarCollapsed) {
                  // Quando colapsado, mostrar dropdown no hover
                  return (
                    <DropdownMenu key={item.name}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center rounded-lg py-3 px-3 justify-center text-base font-medium transition-colors relative group w-full",
                            hasActiveChild
                              ? "bg-blue-600 text-white dark:bg-blue-500"
                              : "text-gray-300 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-gray-200"
                          )}
                          title={item.name}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="w-48">
                        <DropdownMenuLabel>{item.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {item.children?.map((child) => {
                          const isChildItemActive = child.href && (location.pathname === child.href || location.pathname.startsWith(child.href + '/'));
                          return (
                            <DropdownMenuItem key={child.name} asChild>
                              <Link
                                to={child.href || '#'}
                                className={cn(
                                  "flex items-center gap-2 w-full",
                                  isChildItemActive && "bg-blue-100 dark:bg-blue-900"
                                )}
                              >
                                <child.icon className="h-4 w-4" />
                                {child.name}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                // Quando expandido, mostrar submenu colapsável
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={cn(
                        "flex items-center rounded-lg py-3 px-4 gap-4 text-base font-medium transition-colors w-full",
                        hasActiveChild
                          ? "bg-blue-600 text-white dark:bg-blue-500"
                          : "text-gray-300 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-gray-200"
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      <span className="flex-1 text-left transition-opacity duration-200">{item.name}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                    <div className={cn(
                      "overflow-hidden transition-all duration-200",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="mt-1 space-y-2">
                        {item.children?.map((child) => {
                          const isChildItemActive = child.href && (location.pathname === child.href || location.pathname.startsWith(child.href + '/'));
                          return (
                            <Link
                              key={child.name}
                              to={child.href || '#'}
                              className={cn(
                                "flex items-center rounded-lg py-3 px-4 gap-4 text-base font-medium transition-colors ml-6",
                                isChildItemActive
                                  ? "bg-blue-600 text-white dark:bg-blue-500"
                                  : "text-gray-300 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-gray-200"
                              )}
                            >
                              <child.icon className="h-6 w-6 shrink-0" />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Item simples sem submenus
              return (
                <Link
                  key={item.name}
                  to={item.href || '#'}
                  className={cn(
                    "flex items-center rounded-lg py-3 text-base font-medium transition-colors relative group",
                    sidebarCollapsed ? "px-3 justify-center" : "px-4 gap-4",
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "text-gray-300 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-gray-200"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-6 w-6 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="transition-opacity duration-200">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="border-t border-gray-600 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 min-w-0">
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="border-t border-gray-600 dark:border-gray-700 p-2">
              <Button
                variant="outline"
                size="icon"
                className="w-full border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={cn("flex flex-1 flex-col transition-all duration-300", sidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-600 dark:border-gray-700 bg-[#1e2938] dark:bg-gray-900 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile title */}
            <h1 className="text-lg font-semibold text-white dark:text-gray-100 lg:hidden">SST Sistema</h1>
          </div>

          {/* Header center - Date and Time */}
          <div className="hidden lg:block text-center">
            <p className="text-sm font-medium text-white dark:text-gray-100">
              {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {format(currentTime, 'HH:mm')}
            </p>
          </div>

          {/* Header right section */}
          <div className="flex items-center gap-2">
            {/* Theme toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-300 hover:text-white hover:bg-white/10"
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5">
                  <div className="w-8 h-8 bg-[#12b0a0] rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {user?.role === 'admin' ? 'Administrador' : 'Avaliador'}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="text-gray-600 dark:text-gray-300 cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="text-gray-600 dark:text-gray-300 cursor-pointer"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Alterar Senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 lg:rounded-tl-3xl bg-gray-50 dark:bg-gray-800 overflow-hidden min-h-[calc(100vh-4rem)]">
          <div className="p-4 sm:p-6 lg:p-8 h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Modal de alteração de senha obrigatória */}
      <ForceChangePasswordModal open={user?.must_change_password === true} />

      {/* Modal de alteração de senha voluntária */}
      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      />
    </div>
  );
}