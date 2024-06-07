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
import { getAuth } from 'firebase/auth';
import app from '../firebaseConfig';
import useUserData from '../components/UserData';
import HelpModal from '../components/HelpModal';
import LoginRegisterModal from '../components/LoginRegisterModal';

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


interface TeamLogos {
    [key: string]: any; // Image source type or any other appropriate type
}

const teamLogos: TeamLogos = {
    'BOS': require('../assets/mlb_logos/BOS.png'),
    'SEA': require('../assets/mlb_logos/SEA.png'),
    'NYY': require('../assets/mlb_logos/NYY.png'),
    'CIN': require('../assets/mlb_logos/CIN.png'),
    'LAD': require('../assets/mlb_logos/LAD.png'),
    'PHI': require('../assets/mlb_logos/PHI.png'),
    'LAA': require('../assets/mlb_logos/LAA.png'),
    'TEX': require('../assets/mlb_logos/TEX.png'),
    'ATL': require('../assets/mlb_logos/ATL.png'),
    'MIL': require('../assets/mlb_logos/MIL.png'),
    'COL': require('../assets/mlb_logos/COL.png'),
    'WAS': require('../assets/mlb_logos/WAS.png'),
    'CHC': require('../assets/mlb_logos/CHC.png'),
    'BAL': require('../assets/mlb_logos/BAL.png'),
    'CHW': require('../assets/mlb_logos/CHW.png'),
    'TOR': require('../assets/mlb_logos/TOR.png'),
    'MIN': require('../assets/mlb_logos/MIN.png'),
    'HOU': require('../assets/mlb_logos/HOU.png'),
    'NYM': require('../assets/mlb_logos/NYM.png'),
    'TB': require('../assets/mlb_logos/TB.png'),
    'SD': require('../assets/mlb_logos/SD.png'),
    'STL': require('../assets/mlb_logos/STL.png'),
    'CLE': require('../assets/mlb_logos/CLE.png'),
    'MIA': require('../assets/mlb_logos/MIA.png'),
    'KAN': require('../assets/mlb_logos/KAN.png'),
    'ARI': require('../assets/mlb_logos/ARI.png'),
    'SF': require('../assets/mlb_logos/SF.png'),
    'OAK': require('../assets/mlb_logos/OAK.png'),
    'PIT': require('../assets/mlb_logos/PIT.png'),
    'DET': require('../assets/mlb_logos/DET.png')
};

const ListItem: React.FC<{ player1: MatchupData, player2: MatchupData, isLast: boolean, isFirst: boolean }> = ({ player1, player2, isLast, isFirst }) => {
    return (
        <View style={[styles.listItem, !isLast && styles.borderBottom, isLast && {
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
        }, isFirst && {
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
        }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                {/* Display first player */}
                <View style={styles.playerContainer}>
                    <Image
                        source={teamLogos[player1.batterAbr]}
                        style={{ height: 50, width: 50, marginLeft: 10 }}
                    />
                    <View style={styles.infoContainer}>
                        <Text style={{ fontSize: 20, textAlign: 'center' }}>{player1.batterName} ({player1.stand})</Text>
                        <Text style={{ textAlign: 'center' }}>vs. {player1.pitcherName} {player1.pitcherAbr} ({player1.p_throws})</Text>
                    </View>
                </View>
                {/* Display second player */}
                <View style={styles.playerContainer}>
                    <Image
                        source={teamLogos[player2.batterAbr]}
                        style={{ height: 50, width: 50, marginLeft: 10 }}
                    />
                    <View style={styles.infoContainer}>
                        <Text style={{ fontSize: 20, textAlign: 'center' }}>{player2.batterName} ({player2.stand})</Text>
                        <Text style={{ textAlign: 'center' }}>vs. {player2.pitcherName} {player2.pitcherAbr} ({player2.p_throws})</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

interface ViewProps {
    setMainContent: (view: string) => void;
    setSelections: React.Dispatch<React.SetStateAction<string[]>>;
    setPlayers: React.Dispatch<React.SetStateAction<MatchupData[]>>;
    players: MatchupData[];
    selectedIds: string[];
    today: Date;
}


const ResultsView: React.FC<ViewProps> = ({ players, selectedIds }) => {
    const [helpModalVisible, setHelpModalVisible] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const { width, height } = useWindowDimensions();
    const isMobile = width <= 790;

    function reorderListsByMatchingIDs(players: MatchupData[]): [MatchupData[], MatchupData[]] {
        const userSelections = players.slice().filter(player => selectedIds.includes(player.id)).sort((a, b) => b.probabilityClass1 - a.probabilityClass1)
        const algSelections = players.sort((a, b) => b.probabilityClass1 - a.probabilityClass1).slice(0, 10)
        // Extract IDs from both lists for comparison
        const idsList1: Set<string> = new Set(userSelections.map(player => player.id));
        const idsList2: Set<string> = new Set(algSelections.map(player => player.id));

        // Find common IDs
        const commonIDs: Set<string> = new Set([...idsList1].filter(id => idsList2.has(id)));

        // Function to reorder each list based on matching IDs
        function reorderList(list: MatchupData[]): MatchupData[] {
            const withMatch: MatchupData[] = [];
            const withoutMatch: MatchupData[] = [];

            // Divide players into those with matching IDs and those without
            list.forEach(player => {
                if (commonIDs.has(player.id)) {
                    withMatch.push(player);
                } else {
                    withoutMatch.push(player);
                }
            });

            // Concatenate the two arrays: matching IDs first, then the rest
            return withMatch.concat(withoutMatch);
        }

        // Reorder both lists
        return [reorderList(userSelections), reorderList(algSelections)];
    }

    const [userSelections, algSelections] = reorderListsByMatchingIDs(players)

    return (<View>
        {algSelections.length == 0 && <View style={{ height: 1000 }}>
        </View>}
        {algSelections.length != 0 && <Animated.View
            key={'uniqueKey'}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(400)}>
            <View style={[styles.mainContent, { width: isMobile ? width - 30 : width / 2 },]}>
                <View style={styles.titleBar}>
                    <Text style={{ fontSize: isMobile ? 24 : 32, marginBottom: 4 }} >Results ({today.getMonth() + 1}-{today.getDate()}-{today.getFullYear()})</Text>
                    <TouchableOpacity onPress={() => setHelpModalVisible(true)}>
                        <Ionicons name="help-circle-sharp" size={30} color="#04143C" />
                    </TouchableOpacity>
                    <HelpModal visible={helpModalVisible} onClose={() => setHelpModalVisible(false)} isMobile={isMobile} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 16 }}>
                    <View style={{
                        flex: 1, // Each player container takes up half the width
                    }}>
                        <Text style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold' }} >Your Picks</Text>
                    </View>
                    <View style={{
                        flex: 1, // Each player container takes up half the width
                    }}>
                        <Text style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold' }} >The Algorithm's Picks</Text>
                    </View>
                </View>
                <View style={styles.list}>
                    {algSelections.map((item1, index) => {
                        const item2 = userSelections[index]; // Ensure players2 has the same or more items than players1
                        return (
                            <ListItem
                                key={item1.id}
                                player1={item2}
                                player2={item1}
                                isLast={index === 9}
                                isFirst={index === 0}
                            />
                        );
                    })}
                </View>
            </View>
        </Animated.View>}
    </View>);
}

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
    playerContainer: {
        flex: 1, // Each player container takes up half the width
        alignItems: 'center',
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
        flexDirection: 'column',
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
        paddingHorizontal: 10,
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


export default ResultsView;