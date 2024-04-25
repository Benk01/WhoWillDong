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
}


interface TeamLogos {
  [key: string]: any; // Image source type or any other appropriate type
}

const teamLogos: TeamLogos = {
  'BOS': require('./assets/mlb_logos/BOS.png'),
  'SEA': require('./assets/mlb_logos/SEA.png'),
  'NYY': require('./assets/mlb_logos/NYY.png'),
  'CIN': require('./assets/mlb_logos/CIN.png'),
  'LAD': require('./assets/mlb_logos/LAD.png'),
  'PHI': require('./assets/mlb_logos/PHI.png'),
  'LAA': require('./assets/mlb_logos/LAA.png'),
  'TEX': require('./assets/mlb_logos/TEX.png'),
  'ATL': require('./assets/mlb_logos/ATL.png'),
  'MIL': require('./assets/mlb_logos/MIL.png'),
  'COL': require('./assets/mlb_logos/COL.png'),
  'WSH': require('./assets/mlb_logos/WSH.png'),
  'CHC': require('./assets/mlb_logos/CHC.png'),
  'BAL': require('./assets/mlb_logos/BAL.png'),
  'CHW': require('./assets/mlb_logos/CHW.png'),
  'TOR': require('./assets/mlb_logos/TOR.png'),
  'MIN': require('./assets/mlb_logos/MIN.png'),
  'HOU': require('./assets/mlb_logos/HOU.png'),
  'NYM': require('./assets/mlb_logos/NYM.png'),
  'TB': require('./assets/mlb_logos/TB.png'),
  'SD': require('./assets/mlb_logos/SD.png'),
  'STL': require('./assets/mlb_logos/STL.png'),
  'CLE': require('./assets/mlb_logos/CLE.png'),
  'MIA': require('./assets/mlb_logos/MIA.png'),
  'KAN': require('./assets/mlb_logos/KAN.png'),
  'ARI': require('./assets/mlb_logos/ARI.png'),
  'SF': require('./assets/mlb_logos/SF.png'),
  'OAK': require('./assets/mlb_logos/OAK.png'),
  'PIT': require('./assets/mlb_logos/PIT.png'),
  'DET': require('./assets/mlb_logos/DET.png')
};


const today = new Date()
const auth = getAuth(app)
const db = getFirestore(app)


const ListItem: React.FC<{ player: MatchupData; isLast: boolean, isFirst: boolean; selectionCount: number; selectedTab: string; onItemSelect: () => void }> = ({ player, isLast, isFirst, selectionCount, selectedTab, onItemSelect }) => {
  const [isSelected, setIsSelected] = useState(false);
  const handlePress = () => {
    if (selectionCount < 10 || isSelected) {
      setIsSelected(!isSelected);
      onItemSelect();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.listItem, !isLast && styles.borderBottom, isSelected && styles.selectedItem, isLast && {
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }, isFirst && {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }]}>
        <Image
          source={teamLogos[player.batterAbr]}
          style={{ height: 50, width: 50, marginLeft: 10 }}
        />
        <View style={styles.infoContainer}>
          <Text style={{ fontSize: 20 }}>{player.batterName} ({player.stand})</Text>
          <Text>vs. {player.pitcherName} {player.pitcherAbr} ({player.p_throws})</Text>
        </View>
        <View style={styles.homeRunsContainer}>
          {selectedTab == '2024' && <Text style={{ fontSize: 24 }}>{player.hr_2024}</Text>}
          {selectedTab == '2023' && <Text style={{ fontSize: 24 }}>{player.hr_2023}</Text>}
          {selectedTab == 'Last 10' && <Text style={{ fontSize: 24 }}>{player.hr_last10}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Or if you prefer using interfaces


const App: React.FC = () => {

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("2024")
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [AuthModalVisible, setAuthModalVisible] = useState(false);
  const [ProfileModalVisible, setProfileModalVisible] = useState(false);
  const [data, setData] = useState<MatchupData[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const hideButtons = selectedItems.length < 10;
  const { width, height } = useWindowDimensions();
  const isMobile = width <= 790;
  const userData = useUserData();

  useEffect(() => {
    const fetchData = async () => {
      const ref = collection(db, 'Playerset', '2024-04-22', 'Players');
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
          pitcherName: doc.data().pitcher_name
        }));
        setData(items.sort((a, b) => b.hr_2024 - a.hr_2024));
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

  const handleItemSelect = (item_id: string) => {
    // Toggle selection of items
    setSelectedItems(prevSelectedItems => {
      if (prevSelectedItems.includes(item_id)) {
        // Item is already selected, so remove it
        return prevSelectedItems.filter(id => id !== item_id);
      } else {
        // Item is not selected, so add it
        return [...prevSelectedItems, item_id];
      }
    });
  };

  const handlePlayerSubmit = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const dataToUpdate: { [key: string]: any } = {};
    dataToUpdate[currentDate] = selectedItems;
    // Toggle selection of items
    updateDoc(doc(db, "UserData", auth.currentUser!.uid,), dataToUpdate)
  };

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
              {data.length == 0 && <View style={{ height: 1000 }}>

              </View>}
              {data.length != 0 && <Animated.View
                key={'uniqueKey'}
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(400)}>
                <View style={[styles.mainContent, { width: isMobile ? width - 30 : width / 2 },]}>
                  <View style={styles.titleBar}>
                    <Text style={{ fontSize: isMobile ? 24 : 32, marginBottom: 4 }} >Today's Picks ({today.getMonth() + 1}-{today.getDate()}-{today.getFullYear()})</Text>
                    <TouchableOpacity onPress={() => setHelpModalVisible(true)}>
                      <Ionicons name="help-circle-sharp" size={30} color="#04143C" />
                    </TouchableOpacity>
                    <HelpModal visible={helpModalVisible} onClose={() => setHelpModalVisible(false)} isMobile={isMobile} />
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    <Text style={{ fontSize: isMobile ? 16 : 20, marginBottom: 4, marginLeft: 8, }} >Selections Remaining: </Text>
                    <Text style={{ fontSize: isMobile ? 16 : 20, color: 'cornflowerblue', fontWeight: 'bold' }} >{10 - selectedItems.length}</Text>
                  </View>
                  <View style={styles.tabBar}>
                    <TouchableOpacity
                      style={[selectedTab == '2024' ? styles.selectedTab : styles.unselectedTab, { paddingHorizontal: isMobile ? 12 : 18, }]}
                      onPress={() => {
                        setData(data.slice().sort((a, b) => b.hr_2024 - a.hr_2024))
                        setSelectedTab('2024')
                      }}>
                      <Text style={{ color: selectedTab == '2024' ? 'white' : '#04143C' }}>2024</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[selectedTab == '2023' ? styles.selectedTab : styles.unselectedTab, { paddingHorizontal: isMobile ? 12 : 18, }]}
                      onPress={() => {
                        setData(data.slice().sort((a, b) => b.hr_2023 - a.hr_2023))
                        setSelectedTab('2023')
                      }}>
                      <Text style={{ color: selectedTab == '2023' ? 'white' : '#04143C' }}>2023</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[selectedTab == 'Last 10' ? styles.selectedTab : styles.unselectedTab, { paddingHorizontal: isMobile ? 12 : 18, }]}
                      onPress={() => {
                        setData(data.slice().sort((a, b) => b.hr_last10 - a.hr_last10))
                        setSelectedTab('Last 10')
                      }}>
                      <Text style={{ color: selectedTab == 'Last 10' ? 'white' : '#04143C' }}>Last 10</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignSelf: 'flex-end' }}>
                      {selectedTab == '2024' && <Text style={{ alignSelf: 'flex-end', paddingBottom: 4, paddingRight: 4 }}>2024 Total Dongs:</Text>}
                      {selectedTab == '2023' && <Text style={{ alignSelf: 'flex-end', paddingBottom: 4, paddingRight: 4 }}>2023 Total Dongs:</Text>}
                      {selectedTab == 'Last 10' && <Text style={{ alignSelf: 'flex-end', paddingBottom: 4, paddingRight: 4 }}>Last 10 Days Dongs:</Text>}
                    </View>
                  </View>
                  <View style={styles.list}>
                    {
                      data.slice(0, visibleCount).map((item, index) => (
                        <ListItem
                          key={item.id}
                          player={item}
                          isLast={index === visibleCount - 1 || index === data.length - 1}
                          isFirst={index === 0}
                          selectionCount={selectedItems.length}
                          selectedTab={selectedTab}
                          onItemSelect={() => handleItemSelect(item.id)}
                        />
                      ))
                    }
                  </View>
                  <View style={{
                    marginTop: 0,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    flexDirection: 'row',
                  }}>
                    {visibleCount < data.length && <TouchableOpacity
                      style={styles.bottomTab}
                      onPress={() => setVisibleCount(visibleCount + 10)}
                    >
                      <Text style={{ color: 'white', alignSelf: 'center' }}>Load More</Text>
                    </TouchableOpacity>}
                  </View>
                  <TouchableOpacity
                    style={[{ backgroundColor: !hideButtons ? '#04143C' : 'lightgrey' }, styles.submitButton]}
                    onPress={() => {
                      if (!hideButtons) {
                        if (auth.currentUser == null) {
                          setAuthModalVisible(true)
                        } else {
                          handlePlayerSubmit()
                        }
                      }
                    }
                    }
                  >
                    <LoginRegisterModal visible={AuthModalVisible} onClose={() => setAuthModalVisible(false)} />
                    <Text style={{ color: 'white' }}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>}
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
    height: 85,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', // Center items vertically
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
    position: 'absolute',
    top: 4, // Adjust the top position as needed
    left: 8, // Adjust the left position as needed
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
    alignSelf: 'flex-end',
    justifyContent: 'center',
    marginHorizontal: 20
  }
})


export default App;