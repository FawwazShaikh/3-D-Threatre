/**
 * Card creative builder — returns JSX for each variant.
 * Marquee (ticket booking) content.
 */
export default function getCreative(d) {
  const im = <img alt="" src={d.url} />;

  switch (d.v) {
    case 'pay':
      return (
        <>
          <div className="fill" style={{ background: '#efedea' }} />
          <div className="ph" style={{ top: 112, bottom: 0 }}>{im}</div>
          <svg className="ph" style={{ top: 118, bottom: 0 }} viewBox="0 0 130 182" preserveAspectRatio="none">
            <g stroke="#e5202f" strokeWidth="8" fill="none" opacity=".92" strokeLinecap="square">
              <path d="M2 42h30M14 30v96M4 100l26-16" />
              <path d="M96 34v58M120 34v58M96 92q12 15 24 0" />
              <path d="M92 108l14 34M126 108l-12 34" />
            </g>
          </svg>
          <div className="cv" style={{ top: 20, textAlign: 'right', fontSize: '3.4px', letterSpacing: '.15em', color: '#8d9298' }}>WAYS TO PAY</div>
          <div className="cv t-big" style={{ top: 32, fontSize: 14, color: '#16171b' }}>Payments</div>
          <div className="cv t-big" style={{ top: 47, fontSize: 14, color: '#e5202f' }}>Instant refunds</div>
          <div className="cv" style={{ top: 76, fontSize: '5.2px', fontWeight: 700, color: '#16171b', lineHeight: 1.7 }}>
            <div><b className="dot" />PAY VIA <b>UPI</b></div>
            <div style={{ marginTop: 8 }}><b className="dot sq" />OR SPLIT <b>3X</b><br />
              <span style={{ marginLeft: 11 }}>ON CARDS</span></div>
          </div>
        </>
      );

    case 'launch':
      return (
        <>
          <div className="fill" style={{ background: 'linear-gradient(168deg,#f9d9e5,#f3bdd2 55%,#e8a3c0)' }} />
          <div className="ph" style={{ top: 100, bottom: 0 }}>
            {im}
            <div className="fill" style={{ background: 'linear-gradient(180deg,rgba(249,217,229,.97),rgba(249,217,229,0) 30%)' }} />
          </div>
          <div className="cv t-serif" style={{ top: 36, fontSize: 17, color: '#b03a63' }}>PRE-BOOKING</div>
          <div className="cv t-serif" style={{ top: 55, fontSize: 17, color: '#b03a63' }}>OPEN NOW!</div>
        </>
      );

    case 'shop':
      return (
        <>
          <div className="fill" style={{ background: '#fff' }} />
          <div className="ph" style={{ top: 0, height: 148 }}>{im}</div>
          <div className="cv" style={{ top: 158, fontSize: '5.4px', fontWeight: 700, letterSpacing: '.09em', color: '#16171b' }}>A SHOW EVERY NIGHT</div>
          <div className="cv" style={{ top: 168, fontSize: '4.2px', color: '#7b8087' }}>Movies · Plays · Concerts</div>
          <div style={{ position: 'absolute', left: 10, top: 180, padding: '4px 11px', borderRadius: 20, background: '#16171b', fontSize: '4.6px', fontWeight: 600, color: '#fff', letterSpacing: '.05em' }}>Book tonight</div>
        </>
      );

    case 'brand':
      return (
        <>
          <div className="fill" style={{ background: 'linear-gradient(180deg,#0a2a4a,#0d3a63 50%,#08192b)' }} />
          <div className="ph" style={{ top: 92, bottom: 0 }}>
            {im}
            <div className="fill" style={{ background: 'linear-gradient(180deg,rgba(10,42,74,.98),rgba(10,42,74,0) 36%)' }} />
          </div>
          <div className="cv" style={{ top: 16, fontSize: '4.2px', lineHeight: 1.7, color: 'rgba(255,255,255,.82)', width: 74 }}>
            Real seats, real venues, picked live with the people you're going with — no more group chats full of screenshots.
          </div>
          <div style={{ position: 'absolute', right: 10, top: 16, fontSize: '5.4px', fontWeight: 600, color: '#fff', opacity: .92 }}>✳ Marquee</div>
        </>
      );

    case 'frete':
      return (
        <>
          <div className="fill" style={{ background: 'linear-gradient(158deg,#4a0c80 0%,#7a16a6 40%,#a81fc6 66%,#5c0e90 100%)' }} />
          <div className="ph" style={{ top: 140, bottom: 0, opacity: .45, mixBlendMode: 'screen' }}>{im}</div>
          <div className="fill" style={{ background: 'radial-gradient(44% 16% at 50% 62%,rgba(255,255,255,.92),rgba(255,255,255,0) 72%)' }} />
          <div style={{ position: 'absolute', left: -6, right: -6, top: 44, height: 13, background: '#ff2d8a', transform: 'rotate(-2.6deg)', boxShadow: '0 4px 12px rgba(255,45,138,.5)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 45.5, transform: 'rotate(-2.6deg)', textAlign: 'center', fontSize: '5.6px', fontWeight: 700, letterSpacing: '.05em', color: '#fff' }}>ZERO FEES ON YOUR</div>
          <div className="cv t-big" style={{ top: 64, fontSize: 24, color: '#fff', textShadow: '0 3px 0 rgba(84,9,124,.6)' }}>First</div>
          <div className="cv t-big" style={{ top: 87, fontSize: 24, color: '#fff', textShadow: '0 3px 0 rgba(84,9,124,.6)' }}>Booking</div>
          <div className="cv t-big" style={{ top: 113, fontSize: 19, color: '#fff' }}>+</div>
        </>
      );

    case 'power':
      return (
        <>
          <div className="ph phf">{im}</div>
          <div className="fill" style={{ background: 'linear-gradient(180deg,rgba(6,5,10,0) 34%,rgba(6,5,10,.55) 52%,rgba(6,5,10,.92) 72%)' }} />
          <div className="cv t-serif" style={{ top: 132, fontSize: 16, color: '#fff' }}>A NIGHT</div>
          <div className="cv t-serif" style={{ top: 150, fontSize: 16, color: '#fff' }}>WELL SPENT</div>
          <div className="cv" style={{ top: 171, fontSize: '4.4px', letterSpacing: '.07em', color: 'rgba(255,255,255,.85)' }}>starts with the right seats, picked together</div>
        </>
      );

    case 'off':
      return (
        <>
          <div className="ph phf">{im}</div>
          <div className="fill" style={{ background: 'linear-gradient(180deg,rgba(3,9,20,0) 30%,rgba(3,9,20,.6) 48%,rgba(3,9,20,.95) 70%)' }} />
          <div className="cv t-big" style={{ top: 126, fontSize: 10, color: '#fff', opacity: .9 }}>Now showing · from</div>
          <div className="cv t-big" style={{ top: 139, fontSize: 22, color: '#3fe3ff', textShadow: '0 0 16px rgba(63,227,255,.5)' }}>Today</div>
        </>
      );

    case 'plain':
    default:
      return (
        <>
          <div className="ph phf">{im}</div>
          <div className="fill" style={{ background: 'linear-gradient(180deg,rgba(4,8,16,0) 38%,rgba(4,8,16,.85) 68%)' }} />
          <div className="cv" style={{ top: 150, fontSize: '5.4px', fontWeight: 600, letterSpacing: '.2em', color: '#fff' }}>{d.t || ''}</div>
        </>
      );
  }
}
