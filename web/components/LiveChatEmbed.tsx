import React, { useEffect, useRef } from 'react';

interface LiveChatEmbedProps {
  enabled: boolean;
  embedCode: string | null | undefined;
  className?: string;
}

const LiveChatEmbed: React.FC<LiveChatEmbedProps> = ({ enabled, embedCode, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    container.innerHTML = '';

    if (!enabled || !embedCode) {
      return undefined;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = embedCode;

    const scripts = Array.from(wrapper.querySelectorAll('script'));
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.text = script.textContent ?? '';
      container.appendChild(newScript);
      script.remove();
    });

    while (wrapper.firstChild) {
      container.appendChild(wrapper.firstChild);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [enabled, embedCode]);

  return <div ref={containerRef} className={className} />;
};

export default LiveChatEmbed;
