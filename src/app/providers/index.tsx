import { type ReactNode } from "react";
import { ReactQueryProvider } from "./ReactQueryProvider";
import { ThemeProvider } from "./ThemeProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReactQueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </ReactQueryProvider>
  );
}
