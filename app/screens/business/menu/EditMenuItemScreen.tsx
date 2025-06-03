import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BusinessStackParamList } from '../../../navigation/userNavigation';
import BusinessService from '../../../services/BusinessService';

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
  overlay: 'rgba(0, 0, 0, 0.8)',
};

type EditMenuItemScreenRouteProp = RouteProp<BusinessStackParamList, 'EditMenuItemScreen'>;
type EditMenuItemScreenNavigationProp = StackNavigationProp<BusinessStackParamList, 'EditMenuItemScreen'>;

interface Props {
  route: EditMenuItemScreenRouteProp;
  navigation: EditMenuItemScreenNavigationProp;
}

interface MenuItemData {
  name: string;
  description: string;
  price: string;
  photo: string;
  type: 'alcohol' | 'comida' | 'bebida';
  alcoholPercentage: string;
  volume: string;
}

const EditMenuItemScreen: React.FC<Props> = ({ route, navigation }) => {
  const { barId, itemId, barName, itemName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalItemData, setOriginalItemData] = useState<MenuItemData | null>(null);
  const [itemData, setItemData] = useState<MenuItemData>({
    name: '',
    description: '',
    price: '0',
    photo: '',
    type: 'comida',
    alcoholPercentage: '0',
    volume: '0',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [updatedItemName, setUpdatedItemName] = useState('');

  useEffect(() => {
    loadMenuItemData();
  }, []);

  const loadMenuItemData = async () => {
    try {
      setLoading(true);
      console.log('Loading menu item data for itemId:', itemId);
      
      const response = await BusinessService.getMyBarMenu(barId);
      const item = response.data.find((menuItem: any) => menuItem._id === itemId);
      console.log('Menu item data response:', item);
      
      if (!item) {
        console.error('Menu item not found');
        Alert.alert('Error', 'Menu item not found');
        return;
      }
      
      const itemInfo = {
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '0',
        photo: item.photo || '',
        type: item.type || 'comida',
        alcoholPercentage: item.alcoholPercentage?.toString() || '0',
        volume: item.volume?.toString() || '0',
      };
      
      console.log('Processed item info:', itemInfo);
      
      // Save original data and current data
      setOriginalItemData(itemInfo);
      setItemData(itemInfo);
    } catch (error) {
      console.error('Error loading menu item data:', error);
      if (typeof error === 'object' && error !== null && 'response' in error) {
        // @ts-expect-error: dynamic error shape from axios or fetch
        console.error('Error details:', error.response?.data);
      }
      Alert.alert('Error', 'Could not load menu item information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!itemData.name.trim()) {
      Alert.alert('Error', 'Item name is required');
      return false;
    }

    if (!itemData.description.trim()) {
      Alert.alert('Error', 'Item description is required');
      return false;
    }

    const price = parseFloat(itemData.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Price must be a positive number');
      return false;
    }

    if (itemData.type === 'alcohol') {
      const alcoholPercentage = parseFloat(itemData.alcoholPercentage);
      if (isNaN(alcoholPercentage) || alcoholPercentage <= 0 || alcoholPercentage > 100) {
        Alert.alert('Error', 'Alcohol percentage must be between 0 and 100 for alcoholic items');
        return false;
      }
    }

    if (itemData.volume.trim()) {
      const volume = parseFloat(itemData.volume);
      if (isNaN(volume) || volume < 0) {
        Alert.alert('Error', 'Volume must be a positive number');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const updateData = {
        name: itemData.name.trim(),
        description: itemData.description.trim(),
        price: parseFloat(itemData.price),
        photo: itemData.photo.trim() || undefined,
        type: itemData.type,
        alcoholPercentage: itemData.type === 'alcohol' ? parseFloat(itemData.alcoholPercentage) : 0,
        volume: itemData.volume ? parseFloat(itemData.volume) : 0,
      };

      const response = await BusinessService.updateMenuItem(barId, itemId, updateData);
      
      if (response.data && response.data.success) {
        setUpdatedItemName(itemData.name.trim());
        // Show success modal for all platforms
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', 'Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      Alert.alert('Error', 'Could not update menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const navigateToMainPage = () => {
    setShowSuccessModal(false);
    // Navigate to the main business dashboard or menu management screen
    navigation.navigate('BusinessDashboard'); // Adjust this route name as needed
  };

  const renderTypeOption = (type: 'alcohol' | 'comida' | 'bebida', label: string, icon: string) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.typeOption,
        itemData.type === type && styles.typeOptionSelected,
      ]}
      onPress={() => setItemData(prev => ({ ...prev, type }))}
    >
      <Icon name={icon} size={24} color={itemData.type === type ? colors.text : colors.textMuted} />
      <Text style={[
        styles.typeOptionText,
        itemData.type === type && styles.typeOptionTextSelected,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Success Modal Component
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSuccessModalClose}
    >
      <View style={styles.successOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIconContainer}>
            <Icon name="check-circle" size={64} color={colors.success} />
          </View>
          
          <Text style={styles.successTitle}>Item Modified Successfully!</Text>
          
          <Text style={styles.successMessage}>
            "{updatedItemName}" has been updated in {barName}'s menu.
          </Text>
          
          <View style={styles.successButtons}>
            <TouchableOpacity
              style={[styles.successButton, styles.successBackButton]}
              onPress={handleSuccessModalClose}
            >
              <Icon name="arrow-back" size={20} color={colors.text} />
              <Text style={styles.backButtonText}>Back to Menu</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.successButton, styles.mainPageButton]}
              onPress={navigateToMainPage}
            >
              <Icon name="home" size={20} color={colors.text} />
              <Text style={styles.mainPageButtonText}>Main Page</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu item...</Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Menu Item</Text>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Bar Info */}
          <View style={styles.barInfoContainer}>
            <Text style={styles.barInfoLabel}>Editing item for:</Text>
            <Text style={styles.barName}>{barName}</Text>
            <Text style={styles.itemName}>{itemName}</Text>
          </View>

          {/* Item Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Type</Text>
            <View style={styles.typeOptionsContainer}>
              {renderTypeOption('comida', 'Food', 'restaurant')}
              {renderTypeOption('bebida', 'Drink', 'local-cafe')}
              {renderTypeOption('alcohol', 'Alcohol', 'wine-bar')}
            </View>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                value={itemData.name}
                onChangeText={(text) => setItemData(prev => ({ ...prev, name: text }))}
                placeholder="Enter item name"
                placeholderTextColor={colors.textMuted}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={itemData.description}
                onChangeText={(text) => setItemData(prev => ({ ...prev, description: text }))}
                placeholder="Describe the item..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {itemData.description.length}/500
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={itemData.price}
                onChangeText={(text) => setItemData(prev => ({ ...prev, price: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photo URL</Text>
              <TextInput
                style={styles.input}
                value={itemData.photo}
                onChangeText={(text) => setItemData(prev => ({ ...prev, photo: text }))}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Alcohol-specific fields */}
          {itemData.type === 'alcohol' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alcohol Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Alcohol Percentage *</Text>
                <TextInput
                  style={styles.input}
                  value={itemData.alcoholPercentage}
                  onChangeText={(text) => setItemData(prev => ({ ...prev, alcoholPercentage: text }))}
                  placeholder="0-100"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.helperText}>
                  Required for alcoholic beverages (0-100%)
                </Text>
              </View>
            </View>
          )}

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Volume (ml/g)</Text>
              <TextInput
                style={styles.input}
                value={itemData.volume}
                onChangeText={(text) => setItemData(prev => ({ ...prev, volume: text }))}
                placeholder="Optional"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>
                Volume in milliliters for drinks or grams for food
              </Text>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal />
    </>
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
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  barInfoContainer: {
    padding: 16,
    backgroundColor: colors.surfaceVariant,
    marginTop: 16,
    borderRadius: 12,
  },
  barInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  barName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  typeOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  typeOptionTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  bottomPadding: {
    height: 50,
  },
  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  successButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
  },
  successBackButton: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  mainPageButton: {
    backgroundColor: colors.primary,
  },
  mainPageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
});

export default EditMenuItemScreen;