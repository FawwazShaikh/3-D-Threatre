import { useRef, useCallback } from 'react';

const CW = 1172;

/**
 * Type fitter — detached <canvas> 2D context for exact font metric measurement.
 * All writes are direct DOM manipulation via refs, never React state.
 */
export default function useTypeFit() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const c = document.createElement('canvas');
      ctxRef.current = c.getContext('2d');
    }
    return ctxRef.current;
  }, []);

  const fontOf = useCallback((el) => {
    const s = getComputedStyle(el);
    return {
      css: s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily,
      size: parseFloat(s.fontSize),
    };
  }, []);

  const capRatio = useCallback((el) => {
    const f = fontOf(el);
    const ctx = getCtx();
    ctx.font = f.css.replace(f.size + 'px', '100px');
    const m = ctx.measureText('H');
    return (m.actualBoundingBoxAscent || 70) / 100;
  }, [fontOf, getCtx]);

  const fitBox = useCallback((el, tw, tc, pre, canvasEl) => {
    if (!el) return;
    el.style.transform = pre || '';
    el.style.fontSize = '';
    const cr = capRatio(el);
    if (cr > 0) el.style.fontSize = (tc / cr) + 'px';
    const rect = el.getBoundingClientRect();
    const canvasRect = canvasEl.getBoundingClientRect();
    const currentK = canvasRect.width / CW || 1;
    const w = rect.width / currentK;
    const sx = tw / w;
    el.style.transform = (pre ? pre + ' ' : '') + 'scaleX(' + sx + ')';
  }, [capRatio]);

  const baseline = useCallback((el, y) => {
    if (!el) return;
    const f = fontOf(el);
    const ctx = getCtx();
    ctx.font = f.css;
    const m = ctx.measureText('Hg');
    const A = m.fontBoundingBoxAscent || (f.size * 0.8);
    const D = m.fontBoundingBoxDescent || (f.size * 0.2);
    el.style.top = (y - ((f.size - (A + D)) / 2 + A)) + 'px';
  }, [fontOf, getCtx]);

  const centreLabel = useCallback((btn, el, capPx, canvasEl) => {
    if (!el || !btn) return;
    const f = fontOf(el);
    const probe = document.createElement('i');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;font-size:0';
    el.parentNode.insertBefore(probe, el);
    let probeTop = probe.getBoundingClientRect().top - btn.getBoundingClientRect().top;
    probe.remove();
    let btnH = btn.getBoundingClientRect().height;
    const canvasRect = canvasEl.getBoundingClientRect();
    const currentK = canvasRect.width / CW || 1;
    btnH /= currentK;
    probeTop /= currentK;
    const BIAS = 1.1;
    el.style.marginTop = ((btnH / 2) - (probeTop + f.size / 2 - capPx / 2) + BIAS) + 'px';
  }, [fontOf]);

  /**
   * Run the full layout pass — called by useStageScale on resize and after fonts.ready.
   * @param {object} refs - DOM element refs
   * @param {boolean} mobile - <=700px
   * @param {boolean} tablet - 701-1080px
   * @param {number} T - tboost (tablet type scale multiplier)
   * @param {HTMLElement} canvasEl - the canvas container element
   */
  const layout = useCallback((refs, mobile, tablet, T, canvasEl) => {
    const {
      h1a, h1b, sub1, sub2, badgeTxt, wmName,
      ctaLabel, vpLabel, linksEl,
    } = refs;

    if (mobile) {
      // Clear all inline styles the fitter wrote
      [h1a, h1b, sub1, sub2, badgeTxt, wmName, ctaLabel, vpLabel].forEach((el) => {
        if (!el) return;
        el.style.fontSize = '';
        el.style.top = '';
        el.style.transform = '';
        el.style.marginTop = '';
      });
      if (linksEl) {
        linksEl.style.fontSize = '';
        linksEl.style.transform = '';
        const linkChildren = linksEl.querySelectorAll('a');
        for (let i = 0; i < linkChildren.length; i++) {
          linkChildren[i].style.fontSize = '';
        }
      }
      return;
    }

    T = T || 1;

    fitBox(h1a, 563.5 * T, 37.2 * T, 'translateX(-50%)', canvasEl);
    baseline(h1a, 204.5);
    fitBox(h1b, 197.5 * T, 37.2 * T, 'translateX(-50%)', canvasEl);
    baseline(h1b, 258.5);
    fitBox(sub1, 389 * T, 8.4 * T, 'translateX(-50%)', canvasEl);
    baseline(sub1, 300.5);
    fitBox(sub2, 311 * T, 8.4 * T, 'translateX(-50%)', canvasEl);
    baseline(sub2, 316.5);
    fitBox(badgeTxt, 184 * T, 9.4 * T, 'translate(2px,-1px)', canvasEl);
    fitBox(wmName, 51 * T, 11.4 * T, '', canvasEl);
    baseline(wmName, 38.5);
    fitBox(ctaLabel, 87 * T, 8.9 * T, '', canvasEl);
    // Centre label in nav button
    if (ctaLabel) {
      const navBtn = ctaLabel.closest('.btn');
      if (navBtn) centreLabel(navBtn, ctaLabel, 8.9 * T, canvasEl);
    }
    fitBox(vpLabel, 76 * T, 9.5 * T, '', canvasEl);
    if (vpLabel) {
      const heroBtn = vpLabel.closest('.btn');
      if (heroBtn) centreLabel(heroBtn, vpLabel, 9.5 * T, canvasEl);
    }

    // Nav links
    if (linksEl) {
      if (tablet) {
        linksEl.style.transform = '';
        const tLinks = linksEl.querySelectorAll('a');
        for (let i = 0; i < tLinks.length; i++) tLinks[i].style.fontSize = '';
      } else {
        linksEl.style.transform = '';
        const dLinks = linksEl.querySelectorAll('a');
        if (dLinks.length > 0) {
          const cr = capRatio(dLinks[0]);
          const fs = cr > 0 ? 7.9 / cr : 12.5;
          for (let i = 0; i < dLinks.length; i++) dLinks[i].style.fontSize = fs + 'px';
          const canvasRect = canvasEl.getBoundingClientRect();
          const currentK = canvasRect.width / CW || 1;
          const rowW = linksEl.getBoundingClientRect().width / currentK;
          if (rowW > 0) linksEl.style.transform = 'scaleX(' + (317 / rowW) + ')';
        }
      }
    }
  }, [fitBox, baseline, centreLabel, capRatio]);

  return layout;
}
