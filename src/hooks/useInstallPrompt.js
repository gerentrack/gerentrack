import { useState, useEffect, useCallback } from "react";

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("pwa_install_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    // Detectar se já está instalado (standalone mode)
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || window.navigator.standalone === true);
    const handler = (e) => setIsInstalled(e.matches);
    mq.addEventListener?.("change", handler);

    // Capturar evento beforeinstallprompt (Android Chrome)
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    return () => {
      mq.removeEventListener?.("change", handler);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem("pwa_install_dismissed", "1"); } catch {}
  }, []);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const canInstall = !!deferredPrompt && !isInstalled && !dismissed;
  const showIOSGuide = isIOS && !isInstalled && !dismissed;

  return { canInstall, isInstalled, showIOSGuide, promptInstall, dismissInstall };
}
