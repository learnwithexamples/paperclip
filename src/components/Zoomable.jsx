import { useEffect, useRef, useState } from 'react';

/**
 * Wraps a thumbnail: clicking it pops a larger preview next to the thumbnail.
 * With no `src` (emoji icons) it renders as a plain container.
 */
export default function Zoomable({ src, className, style, children, alt = '' }) {
  const [anchor, setAnchor] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!anchor) return;
    const onDown = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setAnchor(null);
    };
    const onKey = (e) => { if (e.key === 'Escape') setAnchor(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchor]);

  if (!src) {
    return <div className={className} style={style}>{children}</div>;
  }

  const open = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor(a => (a ? null : { x: r.left + r.width / 2, top: r.top, bottom: r.bottom }));
  };

  let popup = null;
  if (anchor) {
    const size = Math.min(window.innerWidth - 24, window.innerHeight - 24, 400);
    const above = anchor.top - size - 10;
    const raw = above >= 8 ? above : anchor.bottom + 10;
    const top = Math.max(8, Math.min(raw, window.innerHeight - size - 8));
    const left = Math.max(8, Math.min(anchor.x - size / 2, window.innerWidth - size - 8));
    popup = (
      <div ref={popupRef} className="lightbox" style={{ left, top, width: size }}>
        <button className="lightbox-close" onClick={() => setAnchor(null)} aria-label="Close preview">✕</button>
        <img src={src} alt={alt} style={{ maxHeight: size - 16 }} />
      </div>
    );
  }

  return (
    <>
      <div className={`${className ?? ''} zoomable`} style={style} onClick={open}>{children}</div>
      {popup}
    </>
  );
}
