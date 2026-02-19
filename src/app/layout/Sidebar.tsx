import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { cn } from "../../shared/lib/utils";

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Offres", href: "/offers", icon: Briefcase },
  { name: "Candidatures", href: "/applications", icon: FileText },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <h1 className="text-xl font-bold text-primary">ApplyFlow</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          ApplyFlow v1.0.0
        </p>
      </div>
    </div>
  );
}
