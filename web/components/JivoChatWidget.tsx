import { useEffect } from 'react';

const JIVOCHAT_WIDGET_SRC = '//code.jivosite.com/widget/LhoV9Nvdnc';
const JIVOCHAT_WIDGET_ATTR = 'data-jivochat-widget';

const JivoChatWidget = () => {
  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[${JIVOCHAT_WIDGET_ATTR}="LhoV9Nvdnc"]`);

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.src = JIVOCHAT_WIDGET_SRC;
    script.async = true;
    script.setAttribute(JIVOCHAT_WIDGET_ATTR, 'LhoV9Nvdnc');
    document.body.appendChild(script);
  }, []);

  return null;
};

export default JivoChatWidget;
