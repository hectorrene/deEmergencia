import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../../context/AuthContext';
import { ProfileStackParamList } from '../../../types/navigation';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Dark theme colors
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
};

interface EditableUser {
  name: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
  photo: string;
}

type EditProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'EditProfile'>;

interface EditProfileScreenProps {
  navigation: EditProfileScreenNavigationProp;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  
  const [formData, setFormData] = useState<EditableUser>({
    name: '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
    photo: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
        photo: user.photo || '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar URL de foto (opcional, pero si se proporciona debe ser válida)
    if (formData.photo && formData.photo.trim()) {
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
      if (!urlPattern.test(formData.photo.trim())) {
        newErrors.photo = 'Ingresa una URL válida de imagen (jpg, png, gif, webp)';
      }
    }

    // Validar contraseña (solo si se está intentando cambiar)
    if (formData.password || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'La contraseña actual es requerida para cambiar la contraseña';
      }

      if (!formData.password) {
        newErrors.password = 'La nueva contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirmar contraseña es requerido';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setSaving(true);

      // Actualizar perfil básico
      const profileData = {
        name: formData.name,
        photo: formData.photo,
      };

      const updateResponse = await updateProfile(profileData);
      
      if (!updateResponse.success) {
        Alert.alert('Error', updateResponse.message || 'No se pudo actualizar el perfil');
        return;
      }

      // Cambiar contraseña si se proporcionó
      if (formData.password && formData.currentPassword) {
        const passwordData = {
          currentPassword: formData.currentPassword,
          newPassword: formData.password,
          confirmPassword: formData.confirmPassword,
        };

        const passwordResponse = await changePassword(passwordData);
        
        if (!passwordResponse.success) {
          Alert.alert('Error', passwordResponse.message || 'No se pudo cambiar la contraseña');
          return;
        }
      }

      Alert.alert(
        'Éxito', 
        'Perfil actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditableUser, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoPress = () => {
    Alert.alert(
      'Cambiar foto',
      'Selecciona una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cámara', onPress: () => console.log('Open camera') },
        { text: 'Galería', onPress: () => console.log('Open gallery') },
        { 
          text: 'Limpiar foto', 
          onPress: () => handleInputChange('photo', ''),
          style: 'destructive'
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        
        <TouchableOpacity 
          style={[styles.headerButton, saving && styles.headerButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="check" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity 
              style={styles.photoContainer}
              onPress={handlePhotoPress}
            >
              <Image
                source={{
                  uri: formData.photo || 'https://www.gravatar.com/avatar/?d=mp&s=150',
                }}
                style={styles.profilePhoto}
              />
              <View style={styles.photoOverlay}>
                <Icon name="camera-alt" size={24} color={colors.text} />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Toca para cambiar foto</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Read-only fields */}
            <View style={styles.readOnlySection}>
              <Text style={styles.sectionTitle}>Información de cuenta</Text>
              
              {/* Email Field (Read-only) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Correo electrónico</Text>
                <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                  <Icon name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <Text style={styles.readOnlyText}>{user?.email}</Text>
                  <Icon name="lock" size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.fieldHint}>El correo electrónico no se puede modificar</Text>
              </View>

              {/* Phone Field (Read-only) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Teléfono</Text>
                <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                  <Icon name="phone" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <Text style={styles.readOnlyText}>{user?.phone}</Text>
                  <Icon name="lock" size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.fieldHint}>El teléfono no se puede modificar</Text>
              </View>

              {/* Birth Date Field (Read-only) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
                <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                  <Icon name="cake" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <Text style={styles.readOnlyText}>
                    {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'No especificada'}
                  </Text>
                  <Icon name="lock" size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.fieldHint}>La fecha de nacimiento no se puede modificar</Text>
              </View>
          </View>

            {/* Editable fields */}
            <View style={styles.editableSection}>
              <Text style={styles.sectionTitle}>Información editable</Text>

              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nombre completo</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'name' && styles.inputContainerFocused,
                  errors.name && styles.inputContainerError
                ]}>
                  <Icon name="person" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    placeholder="Ingresa tu nombre completo"
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Photo URL Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>URL de foto de perfil</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'photo' && styles.inputContainerFocused,
                  errors.photo && styles.inputContainerError
                ]}>
                  <Icon name="image" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.photo}
                    onChangeText={(text) => handleInputChange('photo', text)}
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setFocusedField('photo')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
                {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
                <Text style={styles.fieldHint}>Ingresa la URL de tu foto de perfil</Text>
              </View>

              {/* Password Change Section */}
              <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
              <Text style={styles.fieldHint}>Completa todos los campos para cambiar tu contraseña</Text>

              {/* Current Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Contraseña actual</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'currentPassword' && styles.inputContainerFocused,
                  errors.currentPassword && styles.inputContainerError
                ]}>
                  <Icon name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.currentPassword}
                    onChangeText={(text) => handleInputChange('currentPassword', text)}
                    placeholder="Ingresa tu contraseña actual"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showCurrentPassword}
                    onFocus={() => setFocusedField('currentPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Icon 
                      name={showCurrentPassword ? "visibility-off" : "visibility"} 
                      size={20} 
                      color={colors.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}
              </View>

              {/* New Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nueva contraseña</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputContainerFocused,
                  errors.password && styles.inputContainerError
                ]}>
                  <Icon name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    placeholder="Ingresa nueva contraseña"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon 
                      name={showPassword ? "visibility-off" : "visibility"} 
                      size={20} 
                      color={colors.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Confirm Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirmar nueva contraseña</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'confirmPassword' && styles.inputContainerFocused,
                  errors.confirmPassword && styles.inputContainerError
                ]}>
                  <Icon name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    placeholder="Confirma tu nueva contraseña"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon 
                      name={showConfirmPassword ? "visibility-off" : "visibility"} 
                      size={20} 
                      color={colors.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Icon name="save" size={20} color={colors.text} />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: isTablet ? 140 : 120,
    height: isTablet ? 140 : 120,
    borderRadius: isTablet ? 70 : 60,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 4,
    borderColor: colors.border,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  photoHint: {
    fontSize: 14,
    color: colors.textMuted,
  },
  formContainer: {
    padding: 20,
  },
  readOnlySection: {
    marginBottom: 32,
  },
  editableSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainerFocused: {
    borderColor: colors.inputFocused,
    backgroundColor: colors.surfaceVariant,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    marginLeft: 4,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EditProfileScreen;