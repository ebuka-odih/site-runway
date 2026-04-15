import { useEffect } from 'react';

declare global {
  interface Window {
    chaport?: {
      _q?: unknown[];
      _l?: Record<string, Array<(...args: unknown[]) => void>>;
      q?: (...args: unknown[]) => void;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
    chaportConfig?: {
      appId: string;
    };
  }
}

const CHAPORT_APP_ID = '69df2dae49b709eaaf2beb08';
const CHAPORT_SCRIPT_ID = 'chaport-live-chat-script';
const CHAPORT_SCRIPT_SRC = 'https://app.chaport.com/javascripts/insert.js';

const ChaportLiveChat = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    window.chaportConfig = { appId: CHAPORT_APP_ID };

    if (document.getElementById(CHAPORT_SCRIPT_ID)) {
      return;
    }

    if (window.chaport) {
      return;
    }

    const chaport = (window.chaport = {});
    chaport._q = [];
    chaport._l = {};
    chaport.q = (...args: unknown[]) => {
      chaport._q?.push(args);
    };
    chaport.on = (event: string, callback: (...args: unknown[]) => void) => {
      if (!chaport._l?.[event]) {
        chaport._l = { ...chaport._l, [event]: [] };
      }

      chaport._l[event]?.push(callback);
    };

    const script = document.createElement('script');
    script.id = CHAPORT_SCRIPT_ID;
    script.type = 'text/javascript';
    script.async = true;
    script.src = CHAPORT_SCRIPT_SRC;

    document.body.appendChild(script);
  }, []);

  return null;
};

export default ChaportLiveChat;
