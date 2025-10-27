import { useState,useEffect } from "react";

export default function useFetch(){

    const [profile, setProfile] = useState([]);
    const [numberOfProfile, setNumberOfProfile] = useState("");

    async function generateProfile(countPages) {
        try {
            let randomValue = Math.floor(1 + Math.random() * 10000);

            const response = await fetch(`https://api.github.com/users?since=${randomValue}&per_page=${countPages}`);

            // Check if response is OK (status 200–299)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setProfile(data);
        } 
        catch (error) {
            console.error("Error while fetching GitHub profiles:", error);
            // You can also show this error to the user in UI
            setProfile([]); // Optional: clear data if failed
        }
    }


    useEffect(() => {
        generateProfile(10);
    }, []) //empty array isliye pass kiya q ki mai ye chah rha hu ki ye function sirf ek hi baar execute ho  
    //ek hi baar user ka data fetch kare.


    return ({numberOfProfile,generateProfile,profile,setNumberOfProfile})

}
    
