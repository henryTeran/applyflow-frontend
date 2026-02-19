import { Menu, Moon, Sun, LogOut, User } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../../features/auth/hooks";
import { useUser } from "../../features/users/hooks";
import { Button } from "../../shared/components/ui/button";

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { data: user } = useUser();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="hidden lg:block text-lg font-semibold">
          Bienvenue, {user?.name || "Utilisateur"}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        <Button variant="ghost" size="icon" aria-label="Profile">
          <User className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
