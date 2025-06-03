import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../../context/AuthContext';
import { RegisterData } from '../../../services/AuthService';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isWeb = Platform.OS === 'web';

// Dark theme colors - matching login screen
const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceVariant: '#2a2a2a',
  surfaceElevated: '#1f1f1f',
  primary: '#3b82f6',
  primaryVariant: '#2563eb',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: '#27272a',
  borderLight: '#3f3f46',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  inputBackground: '#1f1f1f',
  inputBorder: '#3f3f46',
  inputFocused: '#3b82f6',
  overlay: 'rgba(0, 0, 0, 0.7)',
  gradientStart: 'rgba(59, 130, 246, 0.8)',
  gradientEnd: 'rgba(139, 92, 246, 0.8)',
  modalBackground: 'rgba(0, 0, 0, 0.8)',
};

interface RegisterScreenProps {
  navigation: any;
}

interface ExtendedRegisterData extends RegisterData {
  photo?: string;
}

// Universal DatePicker Component
const UniversalDatePicker: React.FC<{
  isVisible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  maximumDate?: Date;
}> = ({ isVisible, date, onConfirm, onCancel, maximumDate }) => {
  const [tempDate, setTempDate] = useState(date);

  // Update tempDate when date prop changes
  useEffect(() => {
    setTempDate(date);
  }, [date]);

  if (!isVisible) return null;

  if (isWeb || Platform.OS === 'web') {
    // Web version with HTML input
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.webDatePickerContainer}>
            <Text style={styles.webDatePickerTitle}>
              Seleccionar Fecha de Nacimiento
            </Text>
            <input
              type="date"
              value={tempDate.toISOString().split('T')[0]}
              max={maximumDate ? maximumDate.toISOString().split('T')[0] : undefined}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setTempDate(newDate);
              }}
              style={styles.webDateInput}
            />
            <View style={styles.webDatePickerButtons}>
              <TouchableOpacity style={styles.webDatePickerButton} onPress={onCancel}>
                <Text style={styles.webDatePickerButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.webDatePickerButton, styles.webDatePickerConfirmButton]} 
                onPress={() => onConfirm(tempDate)}
              >
                <Text style={[styles.webDatePickerButtonText, styles.webDatePickerConfirmText]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Mobile version with native DateTimePicker
  return (
    <DateTimePicker
      value={tempDate}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      maximumDate={maximumDate}
      onChange={(event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          onConfirm(selectedDate);
        } else if (event.type === 'dismissed') {
          onCancel();
        }
      }}
    />
  );
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState<ExtendedRegisterData>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    accountType: 'user',
    photo: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ExtendedRegisterData & { confirmPassword: string }>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // DatePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<ExtendedRegisterData & { confirmPassword: string }> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Ingrese un correo válido';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    // Birth date validation
    if (!formData.birthDate) {
      newErrors.birthDate = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(formData.birthDate);
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 18);
      
      if (birthDate > cutoffDate) {
        newErrors.birthDate = 'Tienes que ser mayor de edad para registrarte';
      }
    }

    // Photo URL validation (optional but if provided, should be valid)
    if (formData.photo && formData.photo.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.photo)) {
        newErrors.photo = 'Ingrese una URL válida para la foto';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Remove photo if empty to use default
      const registerData = { ...formData };
      if (!registerData.photo?.trim()) {
        delete registerData.photo;
      }

      const response = await register(registerData);

      if (response.success) {
        Alert.alert('Éxito', 'Registro exitoso', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Error al registrarse');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExtendedRegisterData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleDateSelect = (selectedDate: Date) => {
    const isoString = selectedDate.toISOString().split('T')[0];
    setFormData({ ...formData, birthDate: isoString });
    
    if (errors.birthDate) {
      setErrors({ ...errors, birthDate: undefined });
    }
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-ES');
  };

  // Calculate maximum date (18 years ago)
  const getMaximumDate = (): Date => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today;
  };

  // Get current date for date picker
  const getCurrentDateForPicker = (): Date => {
    if (formData.birthDate) {
      const date = new Date(formData.birthDate);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    // Default to 25 years ago
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 25);
    return defaultDate;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd, colors.overlay]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              scrollEventThrottle={16}
            >
              <Animated.View 
                style={[
                  styles.contentContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                {/* Logo Section */}
                <View style={styles.logoSection}>
                  <View style={styles.logoContainer}>
                    <Icon name="local-bar" size={isTablet ? 60 : 48} color={colors.text} />
                  </View>
                  <Text style={styles.logoText}>Ruta Cervecera</Text>
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                  <View style={styles.titleSection}>
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>Únete a la comunidad cervecera</Text>
                  </View>

                  {/* Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'name' && styles.inputWrapperFocused,
                      errors.name && styles.inputWrapperError
                    ]}>
                      <Icon name="person" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        placeholder="Tu nombre completo"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="words"
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'email' && styles.inputWrapperFocused,
                      errors.email && styles.inputWrapperError
                    ]}>
                      <Icon name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        placeholder="correo@ejemplo.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>

                  {/* Phone Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Teléfono</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'phone' && styles.inputWrapperFocused,
                      errors.phone && styles.inputWrapperError
                    ]}>
                      <Icon name="phone" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.phone}
                        onChangeText={(value) => handleInputChange('phone', value)}
                        placeholder="Tu número de teléfono"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                  </View>

                  {/* Birth Date Input with DatePicker */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Fecha de Nacimiento</Text>
                    <TouchableOpacity
                      style={[
                        styles.inputWrapper,
                        styles.datePickerButton,
                        focusedField === 'birthDate' && styles.inputWrapperFocused,
                        errors.birthDate && styles.inputWrapperError
                      ]}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Icon name="cake" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <Text style={[
                        styles.datePickerText,
                        !formData.birthDate && styles.datePickerPlaceholder
                      ]}>
                        {formData.birthDate ? formatDateForDisplay(formData.birthDate) : 'Selecciona tu fecha de nacimiento'}
                      </Text>
                      <Icon name="calendar-today" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.helperText}>Debes ser mayor de 18 años</Text>
                    {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
                  </View>

                  {/* Photo URL Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Foto de Perfil (Opcional)</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'photo' && styles.inputWrapperFocused,
                      errors.photo && styles.inputWrapperError
                    ]}>
                      <Icon name="photo-camera" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.photo}
                        onChangeText={(value) => handleInputChange('photo', value)}
                        placeholder="https://ejemplo.com/mi-foto.jpg"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="url"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedField('photo')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    <Text style={styles.helperText}>URL de tu foto de perfil</Text>
                    {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
                  </View>

                  {/* Account Type Selector */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tipo de Cuenta</Text>
                    <View style={styles.accountTypeContainer}>
                      <TouchableOpacity
                        style={[
                          styles.accountTypeButton,
                          formData.accountType === 'user' && styles.accountTypeButtonActive
                        ]}
                        onPress={() => handleInputChange('accountType', 'user')}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name="person" 
                          size={20} 
                          color={formData.accountType === 'user' ? colors.text : colors.textMuted} 
                        />
                        <Text style={[
                          styles.accountTypeText,
                          formData.accountType === 'user' && styles.accountTypeTextActive
                        ]}>
                          Usuario
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.accountTypeButton,
                          formData.accountType === 'business' && styles.accountTypeButtonActive
                        ]}
                        onPress={() => handleInputChange('accountType', 'business')}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name="business" 
                          size={20} 
                          color={formData.accountType === 'business' ? colors.text : colors.textMuted} 
                        />
                        <Text style={[
                          styles.accountTypeText,
                          formData.accountType === 'business' && styles.accountTypeTextActive
                        ]}>
                          Negocio
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'password' && styles.inputWrapperFocused,
                      errors.password && styles.inputWrapperError
                    ]}>
                      <Icon name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name={showPassword ? "visibility-off" : "visibility"} 
                          size={20} 
                          color={colors.textMuted} 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirmar Contraseña</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                      errors.confirmPassword && styles.inputWrapperError
                    ]}>
                      <Icon name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          if (errors.confirmPassword) {
                            setErrors({ ...errors, confirmPassword: undefined });
                          }
                        }}
                        placeholder="Confirma tu contraseña"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeButton}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name={showConfirmPassword ? "visibility-off" : "visibility"} 
                          size={20} 
                          color={colors.textMuted} 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                  </View>

                  {/* Register Button */}
                  <TouchableOpacity
                    style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryVariant]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={colors.text} size="small" />
                      ) : (
                        <>
                          <Icon name="person-add" size={20} color={colors.text} />
                          <Text style={styles.buttonText}>Crear Cuenta</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>¿Ya tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                      <Text style={styles.link}>Inicia sesión aquí</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>

      {/* Universal DatePicker */}
      {showDatePicker && (
        <UniversalDatePicker
          isVisible={showDatePicker}
          date={getCurrentDateForPicker()}
          maximumDate={getMaximumDate()}
          onConfirm={handleDateSelect}
          onCancel={() => setShowDatePicker(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    borderRadius: isTablet ? 50 : 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoText: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: colors.inputFocused,
    backgroundColor: colors.surfaceVariant,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
    minHeight: 20,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  // DatePicker specific styles
  datePickerButton: {
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: colors.textMuted,
  },
  // Account Type specific styles
  accountTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 48,
  },
  accountTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accountTypeText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
  accountTypeTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  // Register Button styles
  registerButton: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    minHeight: 48,
  },
  buttonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Link styles
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 8,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  link: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal and Web DatePicker styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalBackground,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  webDatePickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  webDatePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  webDateInput: {
    width: '100%',
    padding: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    outline: 'none',
    fontFamily: 'inherit',
    border: `1px solid ${colors.inputBorder}`,
    ...Platform.select({
      web: {
        '&:focus': {
          borderColor: colors.inputFocused,
          backgroundColor: colors.surfaceVariant,
        },
      },
    }),
  } as any,
  webDatePickerButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  webDatePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webDatePickerConfirmButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  webDatePickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  webDatePickerConfirmText: {
    color: colors.text,
    fontWeight: '600',
  },
});

export default RegisterScreen;