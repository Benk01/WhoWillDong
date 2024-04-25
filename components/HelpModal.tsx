import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HelpModalProps {
    visible: boolean;
    onClose: () => void;
    isMobile: boolean;
}

const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose, }) => {
    const { width, height } = useWindowDimensions();
    const isMobile = width <= 830;
    return (
        <Modal
            animationType='fade'
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalBackground}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={[styles.centeredView, { width: isMobile ? width - 30 : 800 }]}>
                            <View style={[styles.modalView,]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#04143C' }}>How To Play</Text>
                                    <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                                        <Ionicons name='close' size={32} color={'lightgrey'} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ fontSize: 16, marginBottom: 6 }} >1.{")"}  Select 10 players you think will hit a Dong today. The players to choose from are a random subset that changes every day.</Text>
                                <Text style={{ fontSize: 16, marginBottom: 6 }} >2.{")"}  Press Submit when you are done and compare your selections against The Algorithm's.</Text>
                                <Text style={{ fontSize: 16, marginBottom: 24 }} >3.{")"}  Points are tallied at the end of the day and remember, the more correctly predicted Dongs, the better.</Text>
                                <Text style={{ fontSize: 16, }}>Incase you don't know, Dongs are Home Runs.</Text>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -100,
    },
    modalView: {
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 10,
        borderRadius: 10,
    },
});

export default HelpModal;
