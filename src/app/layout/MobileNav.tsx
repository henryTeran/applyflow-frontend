import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "../../shared/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Offres", href: "/offers", icon: Briefcase },
  { name: "Candidatures", href: "/applications", icon: FileText },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-card">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}
