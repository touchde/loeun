import { useEffect, useState } from "react";
import icon from "../../../assets/logo/loeun-icon.svg";
import { engineVersion } from "./lib/engine";

export function App() {
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    engineVersion()
      .then(setVersion)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <img src={icon} alt="" width={96} height={96} className="drop-shadow-lg" />
      <h1 className="text-3xl font-semibold tracking-tight">Loeun</h1>
      <p className="text-ink-800/70 dark:text-paper-50/70">
        Fast, open-source download manager. Coming soon.
      </p>
      <p className="font-mono text-sm" data-testid="engine-version">
        {error
          ? `Engine unavailable: ${error}`
          : version
            ? `Engine v${version}`
            : "Starting engine…"}
      </p>
    </main>
  );
}
