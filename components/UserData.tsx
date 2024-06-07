import { useEffect, useState } from 'react';
import app from '../firebaseConfig';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, } from 'firebase/auth';


const auth = getAuth(app)
const db = getFirestore(app)



interface UserData {
    name: string;
    todaySelections: string[];
    yesterdaySelections: string[];
    // Add other user data fields here if needed
}

const useUserData = (): UserData | null => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const today = new Date();
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;
    const todayFormatted = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in, now fetch their data from Firestore
                try {
                    const ref = await doc(db, 'UserData', auth.currentUser!.uid);
                    const document = await getDoc(ref);
                    const data = document.data();
                    setUserData(({ name: data!['name'], todaySelections: data![todayFormatted], yesterdaySelections: data![yesterdayFormatted] }) as UserData);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                // User is signed out, clear the user data
                setUserData(null);
                console.log("User signed out or no user has been signed in.");
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);
    return userData;
};

export default useUserData;