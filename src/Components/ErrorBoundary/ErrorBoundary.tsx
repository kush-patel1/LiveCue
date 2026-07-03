import { Component, ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

/**
 * Catches render/runtime errors anywhere below it and shows a recovery screen
 * instead of a blank white page. Without this, one thrown error unmounts the
 * whole app with no way back.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced in the console + any wired analytics; keeps the app recoverable.
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, background: "#0b1116", color: "#e8eef0", fontFamily: "-apple-system, sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 15, letterSpacing: "0.14em", color: "#7fa8b5" }}>LIVECUE</div>
        <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#9fb4bc", maxWidth: 420, fontSize: 15, lineHeight: 1.6 }}>
          An unexpected error occurred. Reloading usually fixes it. If it keeps
          happening, please let us know.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "linear-gradient(135deg, #578493, #3d7080)", color: "#fff", border: "none", borderRadius: 999, padding: "11px 24px", fontSize: 15, cursor: "pointer" }}
          >
            Reload
          </button>
          <button
            onClick={() => { window.location.hash = "#/"; window.location.reload(); }}
            style={{ background: "transparent", color: "#cfe0e5", border: "1px solid rgba(127,168,181,0.4)", borderRadius: 999, padding: "11px 24px", fontSize: 15, cursor: "pointer" }}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}
