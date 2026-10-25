/** Web preview only: renders the oasis page in an iframe with the same bridge as the native WebView. */
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
export type WebViewMessageEvent = { nativeEvent: { data: string } };
type Props = {
  source: { html: string; baseUrl?: string };
  injectedJavaScriptBeforeContentLoaded?: string;
  onMessage?: (e: WebViewMessageEvent) => void;
  style?: any;
  [k: string]: any;
};
export const WebView = forwardRef<any, Props>(function WebView({ source, injectedJavaScriptBeforeContentLoaded, onMessage, style }, ref) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const token = useMemo(() => Math.random().toString(36).slice(2), []);
  const srcDoc = useMemo(() => {
    const boot = `<script>window.ReactNativeWebView={postMessage:function(d){parent.postMessage({__sirag:${JSON.stringify(token)},data:d},'*')}};${injectedJavaScriptBeforeContentLoaded || ''}</script>`;
    return source.html.replace('<head>', '<head>' + boot.replace(/<\/script>(?=.)/g, '<\\/script>'));
  }, [source.html, injectedJavaScriptBeforeContentLoaded, token]);
  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.data && e.data.__sirag === token) onMessage?.({ nativeEvent: { data: e.data.data } }); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [onMessage, token]);
  useImperativeHandle(ref, () => ({
    injectJavaScript: (code: string) => { try { (frame.current?.contentWindow as any)?.eval(code); } catch { /* ignore */ } },
    reload: () => { if (frame.current) frame.current.srcdoc = srcDoc; },
  }), [srcDoc]);
  return React.createElement('iframe', { ref: frame, srcDoc, style: { border: 0, width: '100%', height: '100%', display: 'block', ...(Array.isArray(style) ? Object.assign({}, ...style) : style) } });
});
