import "./LoadingScreen.css";

export function LoadingScreen(): React.JSX.Element {
  return (
    <div className="loading-screen-body">
      <div className="loading-logo">
        <span className="loading-logo-live">LIVE</span>
        <span className="loading-logo-cue">CUE</span>
      </div>
      <div className="loading-dots">
        <span /><span /><span />
      </div>
      <div className="loading-screen--message-container">
        <p>Gathering your information…</p>
      </div>
    </div>
  );
}
