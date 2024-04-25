import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, useWindowDimensions, TouchableWithoutFeedback, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import app from '../firebaseConfig';
import { signInWithEmailAndPassword, getAuth, createUserWithEmailAndPassword, initializeAuth } from 'firebase/auth';
import { doc, getFirestore, setDoc } from "firebase/firestore";

const auth = getAuth(app)
const db = getFirestore(app)

interface LoginRegisterModalProps {
    visible: boolean;
    onClose: () => void;
}

const LoginRegisterModal: React.FC<LoginRegisterModalProps> = ({ visible, onClose }) => {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const { width, height } = useWindowDimensions();
    const isMobile = width <= 630;

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('User logged in successfully');
            handleClose();
        } catch (error) {
            console.error('Error logging in:', error);
            if (error instanceof Error) {
                handleError(error.message)
            }
        }
    };

    const handleRegister = async () => {
        try {
            if (name == '') {
                throw Error('Name must not be empty');
            }
            const user = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "UserData", user.user.uid), {
                name: name
            });
            console.log('User registered successfully');
            handleClose();
        } catch (error) {
            console.error('Error registering:', error);
            if (error instanceof Error) {
                handleError(error.message);
            }
        }
    };

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
        setName('');
        setEmail('');
        setPassword('');
        onClose();
    }

    const switchLogin = (isLogin: boolean) => {
        setError('');
        setName('');
        setEmail('');
        setPassword('');
        setIsLogin(isLogin);
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
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#04143C' }}>{isLogin ? 'Login' : 'Register'}</Text>
                                <TouchableOpacity onPress={handleClose} style={{ padding: 0 }}>
                                    <Ionicons name='close' size={32} color={'lightgrey'} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ paddingHorizontal: 10 }}>
                                {!isLogin && <TextInput
                                    style={styles.input}
                                    placeholder="Display Name (Used for Leaderboard)"
                                    value={name}
                                    onChangeText={setName}
                                />}
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    secureTextEntry={true}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                {isLogin ? (
                                    <Button title="Login" color={'#04143C'} onPress={handleLogin} />
                                ) : (
                                    <Button title="Register" color={'#04143C'} onPress={handleRegister} />
                                )}
                                {error != '' && <Text style={{ color: 'red', paddingTop: 4 }}>{error}</Text>}
                                {isLogin && <Text style={styles.switchModeText}>Don't have an account? <Text style={styles.switchModeLink} onPress={() => switchLogin(false)}>Register</Text></Text>}
                                {!isLogin && <Text style={styles.switchModeText}>Have an account? <Text style={styles.switchModeLink} onPress={() => switchLogin(true)}>Login</Text></Text>}
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
        color: '#04143C',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
});

export default LoginRegisterModal
