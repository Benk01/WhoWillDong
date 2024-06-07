import React, { Fragment, useState, useEffect } from 'react';
import { FlatList, Text, View, StyleSheet, Dimensions, useWindowDimensions, Image, TouchableOpacity, SafeAreaView, ScrollView, Modal, Platform, StatusBar, TouchableWithoutFeedback, } from 'react-native';
import Snackbar from 'react-native-snackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  updateDoc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  getFirestore
} from "firebase/firestore";
import app from './firebaseConfig';
import LoginRegisterModal from './components/LoginRegisterModal';
import HelpModal from './components/HelpModal';
import { getAuth } from 'firebase/auth';
import ProfileModal from './components/ProfileModal';
import useUserData from './components/UserData';
import PicksView from './main_components/PicksView';
import ResultsView from './main_components/ResultsView';
import UserData from './components/UserData';


const today = new Date()
const auth = getAuth(app)
const db = getFirestore(app)

interface MatchupData {
  id: string,
  probabilityClass0: number;
  probabilityClass1: number;
  batterId: number;
  batterAbr: string;
  batterName: string;
  hr_2023: number;
  hr_2024: number;
  hr_last10: number;
  stand: string;
  p_throws: string;
  pitcherId: number;
  pitcherAbr: string;
  pitcherName: string;
  isSelected: boolean;
}

// Or if you prefer using interfaces


function firestoreTimestampToDate(timestamp: Timestamp): Date {
  // Convert Firestore timestamp to milliseconds since Unix epoch
  const milliseconds = timestamp.toMillis();
  // Create JavaScript Date object from milliseconds
  const date = new Date(milliseconds);
  return date;
}

function isEDT(date: Date) {
  const mar = new Date(date.getFullYear(), 2, 1); // March 1st
  const nov = new Date(date.getFullYear(), 10, 1); // November 1st
  const startEDT = new Date(mar.getFullYear(), mar.getMonth(), 14 - (mar.getDay() || 7));
  const endEDT = new Date(nov.getFullYear(), nov.getMonth(), 7 - (nov.getDay() || 7));
  return date >= startEDT && date < endEDT;
}

function getEasternTime() {
  const now = new Date(); // Local time
  const localOffset = now.getTimezoneOffset() * 60000; // Local timezone offset in milliseconds
  const utc = now.getTime() + localOffset; // Convert local time to UTC time in milliseconds
  const estOffset = -5 * 3600000; // EST is UTC-5 hours
  const estTime = new Date(utc + estOffset); // Create a new Date object for EST time

  // Determine if currently during Eastern Daylight Time (EDT)
  if (isEDT(estTime)) {
    return new Date(estTime.getTime() + 3600000); // Adjust for EDT (UTC-4)
  }
  return estTime;
}

function getFormattedDate(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

const CountdownTimer = ({ targetTime, isOpen }: { targetTime: Date, isOpen: boolean }) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    // Calculate the initial remaining time
    const currentTime = getEasternTime().getTime();
    const difference = Math.max(0, targetTime.getTime() - currentTime); // Ensure the difference is not negative
    setRemainingTime(difference);

    // Update the remaining time every second
    const timer = setInterval(() => {
      const updatedCurrentTime = getEasternTime().getTime();
      const updatedDifference = targetTime.getTime() - updatedCurrentTime;
      setRemainingTime(updatedDifference);
    }, 1000);

    // Clear the interval on component unmount
    return () => clearInterval(timer);
  }, [targetTime]);

  // Format the remaining time into hours, minutes, and seconds
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
  if (isOpen) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 30 }}>
        <Text style={{
          color: 'white',
          fontSize: 20,
        }}>Picks Close in: {`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</Text></View>
    );
  } else {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 30 }}>
        <Text style={{
          color: 'white',
          fontSize: 20,
        }}>Picks Open in: {`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</Text></View>
    );
  }
};

const App: React.FC = () => {

  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [AuthModalVisible, setAuthModalVisible] = useState(false);
  const [ProfileModalVisible, setProfileModalVisible] = useState(false);
  const [startTime, setStartTime] = useState<Date>()
  const [endTime, setEndTime] = useState<Date>()
  const userData = useUserData();
  const [data, setData] = useState<MatchupData[]>([]);
  const [today, setToday] = useState<Date>(new Date());
  const [mainContent, setMainContent] = useState('Picks');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    if (userData && userData.todaySelections) {
      setSelectedItems(userData.todaySelections);
      setMainContent('Results');
    }
  }, [userData]);

  useEffect(() => {
    const fetchData = async () => {
      var scheduleRef = doc(db, 'Schedule', getFormattedDate(today));
      var scheduleSnapshot = await getDoc(scheduleRef)
      var starttime = scheduleSnapshot.data()!['starttime']
      var endtime = scheduleSnapshot.data()!['endtime']
      var now = getEasternTime()
      var start = firestoreTimestampToDate(starttime)
      var end = firestoreTimestampToDate(endtime)
      var ref = collection(db, 'Playerset', getFormattedDate(today), 'Players');
      console.log(now)
      console.log(start)
      console.log(end)
      if (now < start) {
        console.log('Before start time')
        setIsOpen(true)
      } else if (now > start && now < end) {
        console.log('Live period')
        setIsOpen(false)
      } else {
        console.log('After end time')
        setIsOpen(true)
        var tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setToday(tomorrow)
        scheduleRef = doc(db, 'Schedule', getFormattedDate(tomorrow));
        scheduleSnapshot = await getDoc(scheduleRef)
        starttime = scheduleSnapshot.data()!['starttime']
        endtime = scheduleSnapshot.data()!['endtime']
        ref = collection(db, 'Playerset', getFormattedDate(tomorrow), 'Players');
        now = getEasternTime()
        start = firestoreTimestampToDate(starttime)
        end = firestoreTimestampToDate(endtime)
      }
      setStartTime(start)
      setEndTime(end)
      try {
        const querySnapshot = await getDocs(ref);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          probabilityClass0: doc.data().Probability_class_0,
          probabilityClass1: doc.data().Probability_class_1,
          batterId: doc.data().batter,
          batterAbr: doc.data().batter_abr,
          batterName: doc.data().batter_name,
          hr_2023: doc.data().home_runs_2023,
          hr_2024: doc.data().home_runs_2024,
          hr_last10: doc.data().home_runs_last10,
          stand: doc.data().stand,
          p_throws: doc.data().p_throws,
          pitcherId: doc.data().pitcher,
          pitcherAbr: doc.data().pitcher_abr,
          pitcherName: doc.data().pitcher_name,
          isSelected: false
        }));
        setData(items.sort((a, b) => b.hr_2024 - a.hr_2024 || b.batterAbr.localeCompare(a.batterAbr)));
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };
    fetchData();
    checkLastVisit();
  }, []);

  const checkLastVisit = async () => {
    try {
      const lastVisit = await AsyncStorage.getItem('lastVisit');
      const lastVisitTime = lastVisit ? new Date(lastVisit).getTime() : 0;
      const currentTime = new Date().getTime();

      if (currentTime - lastVisitTime > 3600000) { // 1 hour in milliseconds
        console.log('User has not visited the application in the last hour.');
        setHelpModalVisible(true); // Set modalVisible to true
        await AsyncStorage.setItem('lastVisit', new Date().toISOString());
      } else {
        console.log('User has visited the application in the last hour.');
      }
    } catch (error) {
      console.error('Error retrieving or storing last visit date:', error);
    }
  };



  interface ViewProps {
    setMainContent: (view: string) => void;
    setSelections: React.Dispatch<React.SetStateAction<string[]>>;
    setPlayers: React.Dispatch<React.SetStateAction<MatchupData[]>>;
    players: MatchupData[];
    selectedIds: string[];
    today: Date;
  }

  let MainContent: React.FC<ViewProps> = PicksView;
  switch (mainContent) {
    case 'Picks':
      MainContent = PicksView;
      break;
    case 'Results':
      MainContent = ResultsView;
      break;
  }

  return (
    <Fragment>
      <LinearGradient colors={['#04143C', 'whitesmoke']} locations={[0.5, 0.5]} style={{ flex: 1 }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <SafeAreaView>
            <View style={styles.container}>
              <View style={styles.header}>
                <View style={styles.imageContainer}>
                  <Image
                    source={require('./assets/logo.png')}
                    style={styles.image}
                  />
                </View>
                {isOpen && endTime != null && startTime != null && <CountdownTimer targetTime={startTime!} isOpen={isOpen} />}
                {!isOpen && endTime != null && startTime != null && <CountdownTimer targetTime={endTime!} isOpen={isOpen} />}
                <View style={{ width: 110 }}>
                  {auth.currentUser == null && <TouchableOpacity
                    style={[{
                      backgroundColor: 'white', paddingHorizontal: 15,
                      paddingVertical: 8,
                      marginTop: 9,
                      borderRadius: 6,
                    }, styles.endButton]}
                    onPress={() =>
                      setAuthModalVisible(true)
                    }
                  >
                    <LoginRegisterModal visible={AuthModalVisible} onClose={() => setAuthModalVisible(false)} />
                    <Text style={{ color: '#04143C' }}>Login</Text>
                  </TouchableOpacity>}
                  {auth.currentUser != null && userData != null && <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.endButton}>
                    <ProfileModal visible={ProfileModalVisible} onClose={() => setProfileModalVisible(false)} name={userData.name} />
                    <FontAwesome name="user" size={30} color="white" />
                  </TouchableOpacity>}
                </View>
              </View>
              <MainContent setMainContent={setMainContent} setSelections={setSelectedItems} setPlayers={setData} selectedIds={selectedItems} players={data} today={today} />
            </View>
          </SafeAreaView>
        </ScrollView>
      </LinearGradient>
    </Fragment >
  );
};


const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'whitesmoke',
    paddingBottom: 50
  },
  mainContent: {
    marginTop: 40,
  },
  tabBar: {
    flex: 1,
    marginLeft: 12,
    alignItems: 'flex-end',
    flexDirection: 'row',
    paddingTop: 12
  },
  selectedTab: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    paddingVertical: 6,
    justifyContent: 'center',
    backgroundColor: '#04143C'
  },
  unselectedTab: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    paddingVertical: 4,
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#04143C'
  },
  bottomTab: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 18,
    justifyContent: 'center',
    backgroundColor: '#04143C'
  },
  header: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#04143C',
  },
  borderBottom: {
    borderBottomWidth: 2,
    borderColor: '#04143C',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
  },
  listItem: {
    width: '100%',
    paddingVertical: 15,
    flexDirection: 'row',
    // Arrange items horizontally
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Adjust for Android status bar
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    paddingTop: 4, // Adjust the top position as needed
    paddingLeft: 8, // Adjust the left position as needed
  },
  image: {
    width: 130, // Adjust the width as needed
    height: 80, // Adjust the height as needed
  },
  infoContainer: {
    paddingHorizontal: 20,
    flex: 1, // Takes up remaining space
  },
  list: {
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 0,
    paddingBottom: 0,
    borderColor: '#04143C',
    backgroundColor: 'white',
  },
  titleBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    flexDirection: 'row'
  },
  homeRunsContainer: {
    paddingEnd: 10,
    flexDirection: 'row', // Arrange items horizontally
    alignItems: 'center', // Align items vertically
  },
  logoContainer: {
    paddingStart: 10,
    flexDirection: 'row', // Arrange items horizontally
    alignItems: 'center', // Align items vertically
  },
  selectedItem: {
    backgroundColor: 'lightsteelblue',
  },
  submitButton: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    marginTop: 9,
    borderRadius: 6,
  },
  endButton: {
    marginHorizontal: 20,
    alignSelf: 'flex-end'
  }
})


export default App;