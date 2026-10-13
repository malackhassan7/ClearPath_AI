import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "./session";
import { LanguageProvider } from "./LanguageContext";

export function AppProviders({
  children,
  client,
}: {
  children: ReactNode;
  client?: QueryClient;
}) {
  const [qc] = useState(
    () =>
      client ??
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={qc}>
      <SessionProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
