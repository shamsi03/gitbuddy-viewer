// import { useEffect, useEffectEvent, useState } from "react"
// import useFetch from "../useFetch";

// function Body() {

    
//     const {generateProfile,numberOfProfile,profile,setNumberOfProfile} = useFetch();
    
//     return (

//         <>

//             <div className="input-section">
//                 <input type="number" min={1} max={100} placeholder="Enter a number between 1 to 100" value={numberOfProfile} onChange={(e) => setNumberOfProfile(e.target.value)}></input>
//                 <button onClick={()=>generateProfile( Number (numberOfProfile))}>Click Me</button>
//                 <input type="text" placeholder="search here"></input>
//                 <button>Show Result</button>
//             </div>

//             <div className="profile">
//                 { //curly braces isliye q ki jsx me javascript ke code ko aise hi likhte hai
//                     profile.map((value)=>{
//                         return( //multiple line of code likhne ke baad return likhna paarega ,ek line by default return ho jata hai but multiple lines nahi .
//                             <div key={value.id} className="cards">
//                                 <img src={value.avatar_url}></img>
//                                 <h2>{value.login}</h2>
//                                 <h3>{value.url.followers} Followers | {value.url.following} Following</h3>
//                                 <a href={value.html_url} target="_blank">View Profile</a>
//                                 <a href={value.repos_url} target="blank">View Repository</a>
//                             </div>
//                         )
//                     })
//                 }
//             </div>

//         </>
//     )


// }

// export default Body;