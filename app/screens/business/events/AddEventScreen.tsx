import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { BusinessStackParamList } from '../../../navigation/userNavigation';
import BusinessService from '../../../services/BusinessService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isWeb = Platform.OS === 'web';

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
  inputBackground: '#27272a',
  modalBackground: 'rgba(0, 0, 0, 0.8)',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

type AddEventScreenRouteProp = RouteProp<BusinessStackParamList, 'AddEventScreen'>;
type AddEventScreenNavigationProp = StackNavigationProp<BusinessStackParamList>;

type AddEventScreenProps = {
  route: AddEventScreenRouteProp;
  navigation: AddEventScreenNavigationProp;
};

interface EventForm {
  name: string;
  description: string;
  location: string;
  startDate: Date | null;
  endDate: Date | null;
  image: string;
  price: string;
}

// Universal DatePicker Component
const UniversalDatePicker: React.FC<{
  isVisible: boolean;
  date: Date;
  mode: 'date' | 'time';
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}> = ({ isVisible, date, mode, onConfirm, onCancel }) => {
  const [tempDate, setTempDate] = useState(date);

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
              Select {mode === 'date' ? 'Date' : 'Time'}
            </Text>
            <input
              type={mode === 'date' ? 'date' : 'time'}
              value={
                mode === 'date'
                  ? tempDate.toISOString().split('T')[0]
                  : tempDate.toTimeString().slice(0, 5)
              }
              onChange={(e) => {
                if (mode === 'date') {
                  const newDate = new Date(e.target.value);
                  newDate.setHours(tempDate.getHours(), tempDate.getMinutes());
                  setTempDate(newDate);
                } else {
                  const [hours, minutes] = e.target.value.split(':');
                  const newDate = new Date(tempDate);
                  newDate.setHours(parseInt(hours), parseInt(minutes));
                  setTempDate(newDate);
                }
              }}
              style={styles.webDateInput}
            />
            <View style={styles.webDatePickerButtons}>
              <TouchableOpacity style={styles.webDatePickerButton} onPress={onCancel}>
                <Text style={styles.webDatePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.webDatePickerButton, styles.webDatePickerConfirmButton]} 
                onPress={() => onConfirm(tempDate)}
              >
                <Text style={[styles.webDatePickerButtonText, styles.webDatePickerConfirmText]}>
                  Confirm
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
      mode={mode}
      display="default"
      onChange={(event, selectedDate) => {
        if (selectedDate) {
          onConfirm(selectedDate);
        } else {
          onCancel();
        }
      }}
    />
  );
};

const AddEventScreen: React.FC<AddEventScreenProps> = ({ route, navigation }) => {
  const { barId, barName } = route.params;

  const [form, setForm] = useState<EventForm>({
    name: '',
    description: '',
    location: '',
    startDate: null,
    endDate: null,
    image: '',
    price: '0',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EventForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [imageUrlModalVisible, setImageUrlModalVisible] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEventName, setCreatedEventName] = useState('');
  
  // Universal date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventForm, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (form.price.trim() && (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)) {
      newErrors.price = 'Price must be a positive number';
    }

    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Validate image URL if provided
    if (form.image && !isValidUrl(form.image)) {
      newErrors.image = 'Please enter a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const eventData = {
        bar: barId,
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim() || undefined,
        start: form.startDate || undefined,
        end: form.endDate || undefined,
        image: form.image || undefined,
        price: parseFloat(form.price) || 0,
      };

      await BusinessService.createEvent(barId, eventData);
      
      setCreatedEventName(form.name.trim());
      
      // For web/desktop, show custom success modal
      if (Platform.OS === 'web') {
        setShowSuccessModal(true);
      } else {
        // For mobile platforms, use native Alert
        Alert.alert(
          'Success',
          'Event created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleImageUrl = () => {
    if (tempImageUrl.trim()) {
      if (isValidUrl(tempImageUrl.trim())) {
        setForm({ ...form, image: tempImageUrl.trim() });
        setImageUrlModalVisible(false);
        setTempImageUrl('');
      } else {
        Alert.alert('Invalid URL', 'Please enter a valid image URL');
      }
    }
  };

  // Success Modal Component for Web/Desktop
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
          
          <Text style={styles.successTitle}>Event Created Successfully!</Text>
          
          <Text style={styles.successMessage}>
            "{createdEventName}" has been created for {barName}.
          </Text>
          
          <TouchableOpacity
            style={styles.successButton}
            onPress={handleSuccessModalClose}
          >
            <Icon name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.successButtonText}>Return to Previous Screen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView style={styles.scrollView}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Event</Text>
              <View style={styles.headerRight} />
            </View>

            <View style={styles.barInfoContainer}>
              <Text style={styles.barInfoLabel}>Creating event for:</Text>
              <Text style={styles.barName}>{barName}</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Event Image URL */}
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>Event Image (Optional)</Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter image URL (https://...)"
                    placeholderTextColor={colors.textMuted}
                    value={form.image}
                    onChangeText={(text) => setForm({ ...form, image: text })}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
                </View>
              </View>

              {/* Basic Info */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Event Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Event Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    placeholderTextColor={colors.textMuted}
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter event description"
                    placeholderTextColor={colors.textMuted}
                    value={form.description}
                    onChangeText={(text) => setForm({ ...form, description: text })}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter event location (optional)"
                    placeholderTextColor={colors.textMuted}
                    value={form.location}
                    onChangeText={(text) => setForm({ ...form, location: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={form.price}
                    onChangeText={(text) => setForm({ ...form, price: text })}
                    keyboardType="decimal-pad"
                  />
                  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>
              </View>

              {/* Date and Time */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Date & Time</Text>
                
                {/* Start Date/Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Date & Time</Text>
                  <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Icon name="calendar-today" size={20} color={colors.primary} />
                      <Text style={styles.dateTimeText}>
                        {form.startDate ? form.startDate.toLocaleDateString() : 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Icon name="access-time" size={20} color={colors.primary} />
                      <Text style={styles.dateTimeText}>
                        {form.startDate ? form.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Date/Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Date & Time</Text>
                  <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Icon name="calendar-today" size={20} color={colors.primary} />
                      <Text style={styles.dateTimeText}>
                        {form.endDate ? form.endDate.toLocaleDateString() : 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Icon name="access-time" size={20} color={colors.primary} />
                      <Text style={styles.dateTimeText}>
                        {form.endDate ? form.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
                </View>

                {/* Clear dates button */}
                <TouchableOpacity
                  style={styles.clearDatesButton}
                  onPress={() => setForm({ ...form, startDate: null, endDate: null })}
                >
                  <Icon name="clear" size={16} color={colors.textMuted} />
                  <Text style={styles.clearDatesText}>Clear Dates</Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Event</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Universal Date/Time Pickers */}
        <UniversalDatePicker
          isVisible={showStartDatePicker}
          date={form.startDate || new Date()}
          mode="date"
          onConfirm={(date) => {
            const currentStartDate = form.startDate || new Date();
            const newDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              currentStartDate.getHours(),
              currentStartDate.getMinutes()
            );
            setForm({ ...form, startDate: newDate });
            setShowStartDatePicker(false);
          }}
          onCancel={() => setShowStartDatePicker(false)}
        />

        <UniversalDatePicker
          isVisible={showStartTimePicker}
          date={form.startDate || new Date()}
          mode="time"
          onConfirm={(time) => {
            const currentStartDate = form.startDate || new Date();
            const newDate = new Date(
              currentStartDate.getFullYear(),
              currentStartDate.getMonth(),
              currentStartDate.getDate(),
              time.getHours(),
              time.getMinutes()
            );
            setForm({ ...form, startDate: newDate });
            setShowStartTimePicker(false);
          }}
          onCancel={() => setShowStartTimePicker(false)}
        />

        <UniversalDatePicker
          isVisible={showEndDatePicker}
          date={form.endDate || new Date()}
          mode="date"
          onConfirm={(date) => {
            const currentEndDate = form.endDate || new Date();
            const newDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              currentEndDate.getHours(),
              currentEndDate.getMinutes()
            );
            setForm({ ...form, endDate: newDate });
            setShowEndDatePicker(false);
          }}
          onCancel={() => setShowEndDatePicker(false)}
        />

        <UniversalDatePicker
          isVisible={showEndTimePicker}
          date={form.endDate || new Date()}
          mode="time"
          onConfirm={(time) => {
            const currentEndDate = form.endDate || new Date();
            const newDate = new Date(
              currentEndDate.getFullYear(),
              currentEndDate.getMonth(),
              currentEndDate.getDate(),
              time.getHours(),
              time.getMinutes()
            );
            setForm({ ...form, endDate: newDate });
            setShowEndTimePicker(false);
          }}
          onCancel={() => setShowEndTimePicker(false)}
        />
      </SafeAreaView>

      {/* Success Modal for Web/Desktop */}
      <SuccessModal />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  barInfoContainer: {
    padding: 16,
    backgroundColor: colors.surfaceVariant,
    marginBottom: 16,
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
  formContainer: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTimeText: {
    color: colors.text,
    marginLeft: 8,
    fontSize: 16,
  },
  clearDatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearDatesText: {
    color: colors.textMuted,
    marginLeft: 4,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Web DatePicker Modal
  webDatePickerContainer: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  webDatePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  webDateInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    width: '100%',
  } as any, // Se usa 'as any' para permitir el estilo web del input
  webDatePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  webDatePickerButton: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  webDatePickerButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  webDatePickerConfirmButton: {
    backgroundColor: colors.primary,
  },
  webDatePickerConfirmText: {
    color: colors.text,
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
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
});

export { AddEventScreen };
export default AddEventScreen;