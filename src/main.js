import React from "react";
import ReactDOM from "react-dom/client";
import Header from "./Component/Header";
import Body1 from "./Component/Body1";

function GitHubProfile(){

    return(
        <>
            <Header/>
            <Body1/>
        </>
        
    )
}


ReactDOM.createRoot(document.getElementById('root')).render(<GitHubProfile/>);