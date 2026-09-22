import GlowButton from './GlowButton';
import './Hero.css';

export default function Hero() {
  return (
    <>
      <div className="h1 l1" id="h1a">Book your next</div>
      <div className="h1" id="h1b">Show</div>

      <div className="sub s1" id="sub1">
        <b>Movies, plays, events, sports —</b> pick seats together
      </div>
      <div className="sub" id="sub2">
        and lock them in before anyone else does.
      </div>

      <GlowButton variant="hero" id="vpLabel">Find showtimes</GlowButton>
    </>
  );
}
