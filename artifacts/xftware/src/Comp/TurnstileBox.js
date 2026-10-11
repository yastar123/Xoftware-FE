import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import Config from '@/config';

export default function TurnstileBox({ onToken }) {
  const ref = React.useRef(null);
  const widgetIdRef = React.useRef(null);

  useEffect(() => {
    if (!Config.siteKeyTurnStile) return;

    const id = 'cf-turnstile-script';
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const wait = setInterval(() => {
      if (!window.turnstile || !ref.current) return;

      clearInterval(wait);

      try {
        if (widgetIdRef.current) window.turnstile.remove(widgetIdRef.current);
      } catch {}

      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: Config.siteKeyTurnStile,
        theme: 'light',
        callback: token => onToken?.(token),
        'expired-callback': () => onToken?.(''),
        'timeout-callback': () => onToken?.(''),
      });
    }, 80);

    return () => clearInterval(wait);
  }, [onToken]);

  return (
    <Box sx={{ mt: 1.2, width: '100%', display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
      <Box ref={ref} />
    </Box>
  );
}
