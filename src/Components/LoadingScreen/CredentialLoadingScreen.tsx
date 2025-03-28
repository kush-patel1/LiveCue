import "./LoadingScreen.css";
import loadingGif from "../../Assets/Loading-Page/LoadingGif.gif";

//Loading screen for signing and logging in
export function CredentialLoadingScreen(): React.JSX.Element {
  return (
    <div className="loading-screen-body">
      <div className="loading-screen--image">
        <img src={loadingGif} alt="Loading..." />
      </div>
    </div>
  );
}
