import "./LoadingScreen.css";
import loadingGif from "../../Assets/Loading-Page/LoadingGif.gif";

const loadingMessage = "Please be patient while we log you in.";

//Loading screen for signing and logging in
export function CredentialLoadingScreen(): React.JSX.Element {
  return (
    <div className="loading-screen-body">
      <div className="loading-screen--image">
        <img src={loadingGif} alt="Loading..." />
      </div>

      <div className="loading-screen--message-container">
        <h1> {loadingMessage} </h1>
      </div>
    </div>
  );
}
