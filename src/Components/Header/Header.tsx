import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";
import "./Header.css";

export function AppHeader(): React.JSX.Element{
    const navigate = useNavigate()
  
    return (
        <header className="app-header">

          <h1 className = "app-header--heading"  onClick={() => {navigate("/home")}}>
            <img className = "heading--logo" src={logo} alt = "LiveCue"/>
          </h1>

        </header>
    )
}