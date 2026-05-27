import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthService from '../services/AuthService';
import { isSupabaseConfigured } from '../services/SupabaseClient';

const AuthScreen = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSubmit = async () => {
    if (!configured) {
      Alert.alert(
        'Configuración pendiente',
        'Falta pegar la SUPABASE_ANON_KEY en src/config/supabase.config.js'
      );
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Email y contraseña son obligatorios');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      Alert.alert('Contraseña débil', 'Debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        const result = await AuthService.signUp(email, password, nombre);
        if (!result?.session) {
          // Email confirmation requerida
          setLoading(false);
          Alert.alert(
            'Cuenta creada',
            'Revisa tu correo para confirmar la cuenta y luego inicia sesión.'
          );
          setMode('signin');
          return;
        }
      } else {
        await AuthService.signIn(email, password);
      }
      setLoading(false);
      if (onAuthSuccess) onAuthSuccess();
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error?.message || 'No se pudo autenticar');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="wallet" size={42} color="#fff" />
            </View>
            <Text style={styles.title}>Gestor de Cuentas</Text>
            <Text style={styles.subtitle}>
              {mode === 'signin' ? 'Inicia sesión para sincronizar tus datos' : 'Crea tu cuenta para sincronizar en la nube'}
            </Text>
          </View>

          {!configured && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={18} color="#B26A00" />
              <Text style={styles.warningText}>
                Falta configurar SUPABASE_ANON_KEY en src/config/supabase.config.js
              </Text>
            </View>
          )}

          <View style={styles.card}>
            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  placeholderTextColor="#9aa3b2"
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#9aa3b2"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9aa3b2"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={mode === 'signin' ? 'log-in' : 'person-add'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}>
                    {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={styles.switchText}>
                {mode === 'signin'
                  ? '¿No tienes cuenta? Regístrate'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Tus datos se sincronizan de forma segura con Supabase.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1A237E' },
  subtitle: { fontSize: 14, color: '#5a6478', marginTop: 6, textAlign: 'center' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  warningText: { flex: 1, color: '#7a4d00', fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: '#5a6478', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E6EF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A237E',
    backgroundColor: '#FAFBFE',
  },
  button: {
    backgroundColor: '#1A237E',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#1A237E', fontSize: 13, fontWeight: '500' },
  footer: { textAlign: 'center', marginTop: 22, color: '#8a92a4', fontSize: 12 },
});

export default AuthScreen;
