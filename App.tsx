import React, { Fragment, useState, useEffect } from 'react';
import { FlatList, Text, View, StyleSheet, Dimensions, useWindowDimensions, Image, TouchableOpacity, SafeAreaView, ScrollView, Modal, Platform, StatusBar, } from 'react-native';
import Snackbar from 'react-native-snackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import firebase from './firebaseConfig';


interface PlayerData {
  id: string;
  name: string;
  team: string;
  starter: string;
  versus: string;
  home_runs: string;
  stand: string;
  p_throws: string;
}

interface TeamLogos {
  [key: string]: any; // Image source type or any other appropriate type
}

let data: PlayerData[] = [
  { id: '1', name: 'Rafael Devers', team: 'BOS', starter: 'Gerrit Cole', versus: 'NYY', home_runs: '12', stand: 'R', p_throws: 'L' },
  { id: '2', name: 'Cal Raleigh', team: 'SEA', starter: 'Brayan Bello', versus: 'ATL', home_runs: '8', stand: 'R', p_throws: 'L' },
  { id: '3', name: 'Aaron Judge', team: 'NYY', starter: 'Nester Cortez', versus: 'TEX', home_runs: '3', stand: 'R', p_throws: 'L' },
  { id: '4', name: 'Rafael Devers', team: 'BOS', starter: 'Gerrit Cole', versus: 'NYY', home_runs: '12', stand: 'R', p_throws: 'L' },
  { id: '5', name: 'Cal Raleigh', team: 'SEA', starter: 'Brayan Bello', versus: 'ATL', home_runs: '8', stand: 'R', p_throws: 'L' },
  { id: '6', name: 'Aaron Judge', team: 'NYY', starter: 'Nester Cortez', versus: 'TEX', home_runs: '3', stand: 'R', p_throws: 'L' },
  { id: '7', name: 'Rafael Devers', team: 'BOS', starter: 'Gerrit Cole', versus: 'NYY', home_runs: '12', stand: 'R', p_throws: 'L' },
  { id: '8', name: 'Cal Raleigh', team: 'SEA', starter: 'Brayan Bello', versus: 'ATL', home_runs: '8', stand: 'R', p_throws: 'L' },
  { id: '9', name: 'Aaron Judge', team: 'NYY', starter: 'Nester Cortez', versus: 'TEX', home_runs: '3', stand: 'R', p_throws: 'L' },
  { id: '11', name: 'Rafael Devers', team: 'BOS', starter: 'Gerrit Cole', versus: 'NYY', home_runs: '12', stand: 'R', p_throws: 'L' },
  { id: '21', name: 'Cal Raleigh', team: 'SEA', starter: 'Brayan Bello', versus: 'ATL', home_runs: '8', stand: 'R', p_throws: 'L' },
  { id: '31', name: 'Aaron Judge', team: 'NYY', starter: 'Nester Cortez', versus: 'TEX', home_runs: '3', stand: 'R', p_throws: 'L' },
  { id: '41', name: 'Rafael Devers', team: 'BOS', starter: 'Gerrit Cole', versus: 'NYY', home_runs: '12', stand: 'R', p_throws: 'L' },
  { id: '51', name: 'Cal Raleigh', team: 'SEA', starter: 'Brayan Bello', versus: 'ATL', home_runs: '8', stand: 'R', p_throws: 'L' },
  { id: '61', name: 'Aaron Judge', team: 'NYY', starter: 'Nester Cortez', versus: 'TEX', home_runs: '3', stand: 'R', p_throws: 'L' },
  { id: '71', name: 'Rafael Devers', team: 'BOS', starter: 'Gerrit Cole', versus: 'NYY', home_runs: '12', stand: 'R', p_throws: 'L' },
  { id: '81', name: 'Cal Raleigh', team: 'SEA', starter: 'Brayan Bello', versus: 'ATL', home_runs: '8', stand: 'R', p_throws: 'L' },
  { id: '91', name: 'Aaron Judge', team: 'NYY', starter: 'Nester Cortez', versus: 'TEX', home_runs: '3', stand: 'R', p_throws: 'L' },
  // Add more items as needed
];

const teamLogos: TeamLogos = {
  'BOS': require('./assets/mlb_logos/BOS.png'),
  'SEA': require('./assets/mlb_logos/SEA.png'),
  'NYY': require('./assets/mlb_logos/NYY.png'),
  // Add more entries for other teams as needed
};

const windowWidth = Dimensions.get('window').width;

const today = new Date()



const ListItem: React.FC<{ player: PlayerData; isLast: boolean, isFirst: boolean; selectionCount: number; onItemSelect: () => void }> = ({ player, isLast, isFirst, selectionCount, onItemSelect }) => {
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
          source={teamLogos[player.team]}
          style={{ height: 50, width: 50, marginLeft: 10 }}
        />
        <View style={styles.infoContainer}>
          <Text style={{ fontSize: 20 }}>{player.name} ({player.stand})</Text>
          <Text>Versus ({player.versus}) {player.starter} ({player.p_throws})</Text>
        </View>
        <View style={styles.homeRunsContainer}>
          <Text style={{ fontSize: 24 }}>{player.home_runs}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const App: React.FC = () => {

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("2024")
  const [modalVisible, setModalVisible] = useState(false);
  const [playerData, sortData] = useState(data.slice().sort((a, b) => parseInt(b.home_runs) - parseInt(a.home_runs)));
  const [visibleCount, setVisibleCount] = useState(10);
  const hideButtons = selectedItems.length < 10;
  const { width, height } = useWindowDimensions();
  const isMobile = width <= 780;

  useEffect(() => {
    checkLastVisit();
  }, []);

  const checkLastVisit = async () => {
    try {
      const lastVisit = await AsyncStorage.getItem('lastVisit');
      const lastVisitTime = lastVisit ? new Date(lastVisit).getTime() : 0;
      const currentTime = new Date().getTime();

      if (currentTime - lastVisitTime > 3600000) { // 1 hour in milliseconds
        console.log('User has not visited the application in the last hour.');
        setModalVisible(true); // Set modalVisible to true
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
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Button 1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Button 2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Button 3</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.mainContent, { width: isMobile ? width - 30 : width / 2 },]}>
                <View style={styles.titleBar}>
                  <Text style={{ fontSize: isMobile ? 24 : 32, marginBottom: 4 }} >Today's Picks ({today.getMonth() + 1}-{today.getDate()}-{today.getFullYear()})</Text>
                  <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="help-circle-sharp" size={30} color="#04143C" />
                  </TouchableOpacity>
                  <Modal
                    animationType='fade'
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                  >
                    <View style={styles.modalBackground}>
                      <View style={styles.centeredView}>
                        <View style={[styles.modalView, { paddingHorizontal: isMobile ? 30 : 40, }]}>
                          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name='close' size={32} color={'lightgrey'} />
                          </TouchableOpacity>
                          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#04143C' }} >How To Play</Text>
                          <Text style={{ fontSize: 16, marginBottom: 6 }} >1.{")"}  Select 10 players you think will hit a Dong today. The players to choose from are a random subset that changes every day.</Text>
                          <Text style={{ fontSize: 16, marginBottom: 6 }} >2.{")"}  Press Submit when you are done and compare your selections against The Algorithm's.</Text>
                          <Text style={{ fontSize: 16, marginBottom: 24 }} >3.{")"}  Points are tallied at the end of the day and remember, the more correctly predicted Dongs, the better.</Text>
                          <Text style={{ fontSize: 16, }}>Incase you don't know, Dongs are Home Runs.</Text>
                        </View>
                      </View>
                    </View>
                  </Modal>
                </View>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <Text style={{ fontSize: isMobile ? 16 : 20, marginBottom: 4, marginLeft: 8, }} >Selections Remaining: </Text>
                  <Text style={{ fontSize: isMobile ? 16 : 20, color: 'cornflowerblue', fontWeight: 'bold' }} >{10 - selectedItems.length}</Text>
                </View>
                <View style={styles.tabBar}>
                  <TouchableOpacity
                    style={[selectedTab == '2024' ? styles.selectedTab : styles.unselectedTab, { paddingHorizontal: isMobile ? 12 : 18, }]}
                    onPress={() => {
                      sortData(playerData.slice().sort((a, b) => parseInt(b.home_runs) - parseInt(a.home_runs)))
                      setSelectedTab('2024')
                    }}>
                    <Text style={{ color: selectedTab == '2024' ? 'white' : '#04143C' }}>2024</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[selectedTab == '2023' ? styles.selectedTab : styles.unselectedTab, { paddingHorizontal: isMobile ? 12 : 18, }]}
                    onPress={() => {
                      sortData(playerData.slice().sort((a, b) => a.name.localeCompare(b.name)))
                      setSelectedTab('2023')
                    }}>
                    <Text style={{ color: selectedTab == '2023' ? 'white' : '#04143C' }}>2023</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[selectedTab == 'Last 7' ? styles.selectedTab : styles.unselectedTab, { paddingHorizontal: isMobile ? 12 : 18, }]}
                    onPress={() => {
                      sortData(playerData.slice().sort((a, b) => a.team.localeCompare(b.team)))
                      setSelectedTab('Last 7')
                    }}>
                    <Text style={{ color: selectedTab == 'Last 7' ? 'white' : '#04143C' }}>Last 7</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, alignSelf: 'flex-end' }}>
                    {selectedTab == '2024' && <Text style={{ alignSelf: 'flex-end', paddingBottom: 4, paddingRight: 4 }}>2024 Total Dongs:</Text>}
                    {selectedTab == '2023' && <Text style={{ alignSelf: 'flex-end', paddingBottom: 4, paddingRight: 4 }}>2023 Total Dongs:</Text>}
                    {selectedTab == 'Last 7' && <Text style={{ alignSelf: 'flex-end', paddingBottom: 4, paddingRight: 4 }}>Dongs in Last 7 Days:</Text>}
                  </View>
                </View>
                <View style={styles.list}>
                  {
                    playerData.slice(0, visibleCount).map((item, index) => (
                      <ListItem
                        key={item.id}
                        player={item}
                        isLast={index === visibleCount - 1 || index === playerData.length - 1}
                        isFirst={index === 0}
                        selectionCount={selectedItems.length}
                        onItemSelect={() => handleItemSelect(item.id)}
                      />
                    ))
                  }
                </View>
                {visibleCount < playerData.length && <TouchableOpacity
                  style={[{ alignContent: 'center' },]}
                  onPress={() => setVisibleCount(visibleCount + 10)}
                >
                  <Text style={{ color: '#04143C', alignSelf: 'center' }}>Load More</Text>
                </TouchableOpacity>}
                <TouchableOpacity
                  style={[{ backgroundColor: !hideButtons ? '#04143C' : 'lightgrey' }, styles.submitButton]}>
                  <Text style={{ color: 'white' }}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[{ backgroundColor: !hideButtons ? '#04143C' : 'lightgrey' }, styles.submitButton]}
                >
                  <Text style={{ color: 'white' }}>Test</Text>
                </TouchableOpacity>
              </View>
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
  }
})


export default App;