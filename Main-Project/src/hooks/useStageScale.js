import { useEffect, useCallback } from 'react';
import useTypeFit from './useTypeFit';

const CW = 1172, DW_MIN = 920, TAB_MAX = 1080, TAB_MIN = 701;

/**
 * Scale law — computes k = min(vw/W, vh/560) and writes CSS vars to canvas.
 * Also triggers the type fitter layout on every resize.
 * @param {React.RefObject} canvasRef - ref to the .canvas element
 * @param {object} typeRefs - element refs for the type fitter
 * @param {Function} placeCards - carousel card placement callback
 */
export default function useStageScale(canvasRef, typeRefs, placeCards) {
  const typeFitLayout = useTypeFit();

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw <= 700;
    const tablet = vw <= TAB_MAX && vw >= TAB_MIN;

    if (mobile) {
      canvas.style.setProperty('--k', 1);
      canvas.style.removeProperty('--fill');
      canvas.style.removeProperty('--stshift');
      canvas.style.removeProperty('--sshift');
      canvas.style.removeProperty('--rs');
      typeFitLayout(typeRefs, true, false, 1, canvas);
      if (placeCards) placeCards();
      return;
    }

    let W, k, fill, ss, rs, st, tboost;

    if (tablet) {
      // Tablet ramp: W narrows so type stops shrinking, k stays continuous at 1080
      W = DW_MIN + (vw - TAB_MIN) * (CW - DW_MIN) / (TAB_MAX - TAB_MIN);
      if (vh > vw * 1.15) W = Math.min(W, 900);
      k = Math.min(vw / W, vh / 560);
      const ramp = Math.min(1, (TAB_MAX - vw) / 120);
      tboost = 1 + 0.14 * ramp;
      fill = Math.max(0, vh / k - 657);
      ss = 0; rs = 1; st = 0;
      if (fill > 0) {
        ss = Math.min(fill * 0.55, 420) * ramp;
        rs = 1 + Math.min(fill / 1100, 0.75) * ramp;
        const slack = 219.5 - 125 * rs + ss;
        st = Math.max(0, slack / 2 - 28) * ramp;
        fill -= ss;
      }
      canvas.style.setProperty('--k', k);
      canvas.style.setProperty('--fill', Math.max(0, fill) + 'px');
      canvas.style.setProperty('--stshift', st + 'px');
      canvas.style.setProperty('--sshift', ss + 'px');
      canvas.style.setProperty('--rs', rs);
    } else {
      // Desktop: k = min(vw/1172, vh/560) — 560 not 657 lets the browser mock bleed off bottom
      W = CW;
      k = Math.min(vw / W, vh / 560);
      fill = Math.max(0, vh / k - 657);
      canvas.style.setProperty('--k', k);
      canvas.style.setProperty('--fill', fill + 'px');
      canvas.style.removeProperty('--stshift');
      canvas.style.removeProperty('--sshift');
      canvas.style.removeProperty('--rs');
    }

    typeFitLayout(typeRefs, false, tablet, tboost || 1, canvas);
    if (placeCards) placeCards();
  }, [canvasRef, typeRefs, typeFitLayout, placeCards]);

  useEffect(() => {
    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Initial call
    resize();

    // After fonts load, re-layout for accurate measurements
    document.fonts.ready.then(() => resize());
    const t1 = setTimeout(() => resize(), 400);
    const t2 = setTimeout(() => resize(), 1400);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [resize]);

  return resize;
}
