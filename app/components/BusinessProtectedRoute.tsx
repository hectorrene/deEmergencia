import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

// Colores del tema oscuro (consistente con tu app)
const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceVariant: '#2a2a2a',
  primary: '#3b82f6',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  error: '#ef4444',
  warning: '#f59e0b',
  border: '#27272a',
};

interface BusinessProtectedRouteProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showUpgradeOption?: boolean;
}

// rutas de business
const BusinessProtectedRoute: React.FC<BusinessProtectedRouteProps> = ({
  children,
  fallbackMessage = "Esta función está disponible solo para cuentas de negocio",
  showUpgradeOption = true
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();

  console.log('🛡️ BusinessProtectedRoute - Checking access');
  console.log('🛡️ User:', user);
  console.log('🛡️ IsAuthenticated:', isAuthenticated);
  console.log('🛡️ User accountType:', user?.accountType);

  // mostrar mensaje de carga
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Icon name="hourglass-empty" size={48} color={colors.primary} />
          <Text style={styles.messageTitle}>Verificando acceso...</Text>
        </View>
      </View>
    );
  }

  // Si no está autenticado mostrar mensaje de login
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Icon name="lock" size={48} color={colors.warning} />
          <Text style={styles.messageTitle}>Acceso Restringido</Text>
          <Text style={styles.messageText}>
            Debes iniciar sesión para acceder a esta función
          </Text>
        </View>
      </View>
    );
  }

  // solo usuarios business pueden acceder
  if (user.accountType !== 'business') {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Icon name="business" size={48} color={colors.error} />
          <Text style={styles.messageTitle}>Cuenta Business Requerida</Text>
          <Text style={styles.messageText}>{fallbackMessage}</Text>
          
          {showUpgradeOption && (
            <View style={styles.upgradeSection}>
              <Text style={styles.upgradeText}>
                Actualmente tienes una cuenta de tipo: {user.accountType}
              </Text>              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => {
                    navigation.navigate('ProfileTab', { 
                    screen: 'EditProfile' 
                    });
                }}
              >
                <Icon name="upgrade" size={20} color={colors.text} />
                <Text style={styles.upgradeButtonText}>
                  Actualizar a Business
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.infoText}>
                Las cuentas business pueden gestionar bares, eventos y menús
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // si es usuario business, mostrar el contenido protegido
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  upgradeSection: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  upgradeText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BusinessProtectedRoute;