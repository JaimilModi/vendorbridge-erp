import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../constants';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FileEdit, 
  CheckSquare, 
  ShoppingCart, 
  Receipt, 
  CreditCard,
  FileBadge,
  BarChart3, 
  Activity 
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR] },
    { name: 'Vendors', href: '/vendors', icon: Users, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER] },
    { name: 'RFQs', href: '/rfqs', icon: FileText, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER] },
    { name: 'Quotations', href: '/quotations', icon: FileEdit, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR] },
    { name: 'Approvals', href: '/approvals', icon: CheckSquare, roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR] },
    { name: 'Invoices', href: '/invoices', icon: Receipt, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR] },
    { name: 'Receipts', href: '/receipts', icon: FileBadge, roles: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { name: 'Activity Logs', href: '/activity', icon: Activity, roles: [ROLES.ADMIN] },
    { name: 'User Management', href: '/users', icon: Users, roles: [ROLES.ADMIN] },
  ];

  const visibleLinks = links.filter(link => link.roles.includes(user.role));

  return (
    <aside className="w-64 flex-shrink-0 bg-secondary border-r border-border hidden md:flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-border bg-white">
        <span className="text-xl font-bold tracking-tight text-primary">VendorBridge</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {visibleLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.href) && 
                           (link.href !== '/dashboard' || location.pathname === '/dashboard');
          
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-white text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:bg-white/50 hover:text-primary"
              )}
            >
              <link.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="bg-white p-3 rounded-md border border-border shadow-sm">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
          <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
