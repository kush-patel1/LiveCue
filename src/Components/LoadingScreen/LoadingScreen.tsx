import loadingGif from "../../Assets/Loading-Page/LoadingGif.gif";
import "./LoadingScreen.css";


const loadingMessage = "Please be patient while we gather your information."

export function LoadingScreen() : React.JSX.Element {
   
    return (
        <div className = "loading-screen-body">
            <div className = "loading-screen--image">
                <img src = {loadingGif} alt = "Loading..." />
            </div>

            <div className = "loading-screen--message-container">
                <h1> {loadingMessage} </h1>
            </div>
        </div>
    )
}