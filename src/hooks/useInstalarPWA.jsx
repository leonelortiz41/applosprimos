import { useState, useEffect } from 'react';

export const useInstalarPWA = () => {
  const [promptEvento, setPromptEvento] = useState(null);
  const [estaInstalada, setEstaInstalada] = useState(false);
  const [esIOS, setEsIOS] = useState(false);

  useEffect(() => {
    const modoStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (modoStandalone) {
      setEstaInstalada(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const dispositivoApple =
      /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setEsIOS(dispositivoApple);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvento(e);
    };

    const handleAppInstalled = () => {
      setEstaInstalada(true);
      setPromptEvento(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const instalarApp = async () => {
    if (!promptEvento) return false;
    promptEvento.prompt();
    const { outcome } = await promptEvento.userChoice;
    if (outcome === 'accepted') {
      setEstaInstalada(true);
      setPromptEvento(null);
      return true;
    }
    return false;
  };

  const mostrarBoton = !estaInstalada && (Boolean(promptEvento) || esIOS);

  return {
    mostrarBoton,
    esIOS,
    instalarApp
  };
};