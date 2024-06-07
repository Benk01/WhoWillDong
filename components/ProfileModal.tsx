import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, useWindowDimensions, TouchableWithoutFeedback, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import app from '../firebaseConfig';
import { signInWithEmailAndPassword, getAuth, createUserWithEmailAndPassword, initializeAuth, signOut } from 'firebase/auth';
import { doc, getFirestore, setDoc, updateDoc } from "firebase/firestore";


const auth = getAuth(app)
const db = getFirestore(app)

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    name: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose, name }) => {
    const [userName, setName] = useState<string>(name);
    const [error, setError] = useState<string>('');
    const { width, height } = useWindowDimensions();
    const isMobile = width <= 630;



    const handleNameChange = async () => {
        try {
            if (userName == '') {
                throw Error('Name must not be empty');
            }
            await updateDoc(doc(db, "UserData", auth.currentUser!.uid), {
                name: userName
            });
            console.log('Name changed successfully');
            handleClose();
        } catch (error) {
            console.error('Error changing name:', error);
            if (error instanceof Error) {
                handleError(error.message)
            }
        }
    };

    const handleLogout = async () => {
        try {
            signOut(auth).then(() => console.log('User signed out!'));
            handleClose();
        } catch (error) {
            console.error('Error signing out', error)
        }
    }

    const handleError = (message: string) => {
        if (message == 'Firebase: Error (auth/email-already-in-use).') {
            setError('Email is already in use.');
        }
        else if (message == 'Firebase: Password should be at least 6 characters (auth/weak-password).') {
            setError('Password should be at least 6 characters.');
        }
        else if (message == 'Firebase: Error (auth/missing-password).') {
            setError('Missing Password');
        }
        else if (message == 'Firebase: Error (auth/invalid-email).') {
            setError('Invalid Email');
        }
        else if (message == 'Firebase: Error (auth/missing-email).') {
            setError('Missing Email');
        }
        else if (message == 'Firebase: Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later. (auth/too-many-requests).') {
            setError('Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.');
        }
        else if (message == 'Firebase: Error (auth/invalid-credential).') {
            setError('Invalid Password');
        }
        else {
            setError(message);
        }
    }

    const handleClose = () => {
        setError('');
        onClose();
    }

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.modalContainer}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={[styles.modalContent, { width: isMobile ? width - 30 : 600 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingLeft: 10 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#04143C' }}>{'Profile'}</Text>
                                <TouchableOpacity onPress={handleClose} style={{ padding: 0 }}>
                                    <Ionicons name='close' size={32} color={'lightgrey'} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ paddingHorizontal: 10 }}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Display Name (Used for Leaderboard)"
                                    value={userName}
                                    onChangeText={setName}
                                />
                                <Button title="Save" color={'#04143C'} onPress={handleNameChange} />
                                {error != '' && <Text style={{ color: 'red', paddingTop: 4 }}>{error}</Text>}
                                <Text style={styles.switchModeLink} onPress={handleLogout}>Logout</Text>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        marginTop: -100,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 10,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 24,
        marginBottom: 10,
        color: '#04143C',
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 15,
        marginBottom: 10,
    },
    switchModeText: {
        marginTop: 10,
    },
    switchModeLink: {
        fontWeight: 'bold',
        color: 'red',
        paddingTop: 12
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
});

export default ProfileModal
