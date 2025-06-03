import DateTimePicker from '@react-native-community/datetimepicker';
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

type EditEventScreenRouteProp = RouteProp<BusinessStackParamList, 'EditEventScreen'>;
type EditEventScreenNavigationProp = StackNavigationProp<BusinessStackParamList, 'EditEventScreen'>;

interface Props {
  route: EditEventScreenRouteProp;
  navigation: EditEventScreenNavigationProp;
}

interface EventData {
  name: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
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
  minimumDate?: Date;
}> = ({ isVisible, date, mode, onConfirm, onCancel, minimumDate }) => {
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
              min={
                minimumDate && mode === 'date'
                  ? minimumDate.toISOString().split('T')[0]
                  : undefined
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
      minimumDate={minimumDate}
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

const EditEventScreen: React.FC<Props> = ({ route, navigation }) => {
  const { barId, eventId, barName, eventName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalEventData, setOriginalEventData] = useState<EventData | null>(null);
  const [eventData, setEventData] = useState<EventData>({
    name: '',
    description: '',
    location: '',
    start: new Date(),
    end: new Date(Date.now() + 3600000), // 1 hour later
    image: '',
    price: '0',
  });

  // Universal date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [updatedEventName, setUpdatedEventName] = useState('');

  useEffect(() => {
    loadEventData();
  }, []);

  const loadEventData = async () => {
    try {
      setLoading(true);
      console.log('Loading event data for eventId:', eventId);
      
      const response = await BusinessService.getEvent(barId, eventId);
      console.log('Event data response:', response.data);
      
      if (response && response.data) {
        let event;
        
        // Handle different response structures
        if (response.data.success && response.data.data) {
          event = response.data.data;
        } else if (response.data.success === false) {
          console.error('API returned success: false', response.data);
          return;
        } else {
          // Direct event data without success wrapper
          event = response.data;
        }
        
        if (event) {
          const eventInfo = {
            name: event.name || '',
            description: event.description || '',
            location: event.location || '',
            start: new Date(event.start || Date.now()),
            end: new Date(event.end || Date.now() + 3600000),
            image: event.image || '',
            price: event.price?.toString() || '0',
          };
          
          console.log('Processed event info:', eventInfo);
          
          // Save original data and current data
          setOriginalEventData(eventInfo);
          setEventData(eventInfo);
        } else {
          console.error('No event data found in response');
        }
      } else {
        console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error loading event data:', error);
      if (typeof error === 'object' && error !== null && 'response' in error) {
        // @ts-expect-error: dynamic error shape from axios or fetch
        console.error('Error details:', error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): string | null => {
    if (!eventData.name.trim()) {
      return 'Event name is required';
    }

    if (!eventData.description.trim()) {
      return 'Event description is required';
    }

    const price = parseFloat(eventData.price);
    if (isNaN(price) || price < 0) {
      return 'Price must be a positive number';
    }

    if (eventData.start >= eventData.end) {
      return 'End time must be after start time';
    }

    if (eventData.start < new Date()) {
      return 'Start time cannot be in the past';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        name: eventData.name.trim(),
        description: eventData.description.trim(),
        location: eventData.location.trim(),
        start: eventData.start,
        end: eventData.end,
        image: eventData.image.trim() || undefined,
        price: parseFloat(eventData.price),
      };

      const response = await BusinessService.updateEvent(barId, eventId, updateData);
      
      if (response.data && response.data.success) {
        setUpdatedEventName(eventData.name.trim());
        
        // For web/desktop, show custom success modal
        if (Platform.OS === 'web') {
          setShowSuccessModal(true);
        } else {
          // For mobile platforms, use native Alert
          Alert.alert(
            'Success',
            'Event updated successfully',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
          
          <Text style={styles.successTitle}>Event Updated Successfully!</Text>
          
          <Text style={styles.successMessage}>
            "{updatedEventName}" has been updated for {barName}.
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  return (
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
        <Text style={styles.headerTitle}>Edit Event</Text>
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
          <Text style={styles.barInfoLabel}>Editing event for:</Text>
          <Text style={styles.barName}>{barName}</Text>
          <Text style={styles.eventName}>{eventName}</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Name *</Text>
            <TextInput
              style={styles.input}
              value={eventData.name}
              onChangeText={(text) => setEventData(prev => ({ ...prev, name: text }))}
              placeholder="Enter event name"
              placeholderTextColor={colors.textMuted}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={eventData.description}
              onChangeText={(text) => setEventData(prev => ({ ...prev, description: text }))}
              placeholder="Describe the event..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {eventData.description.length}/500
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={eventData.location}
              onChangeText={(text) => setEventData(prev => ({ ...prev, location: text }))}
              placeholder="Event location"
              placeholderTextColor={colors.textMuted}
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={eventData.price}
              onChangeText={(text) => setEventData(prev => ({ ...prev, price: text }))}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Image URL</Text>
            <TextInput
              style={styles.input}
              value={eventData.image}
              onChangeText={(text) => setEventData(prev => ({ ...prev, image: text }))}
              placeholder="https://example.com/event-image.jpg"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          {/* Start Date/Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date & Time *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>
                  {eventData.start.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Icon name="access-time" size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>
                  {eventData.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* End Date/Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date & Time *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>
                  {eventData.end.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Icon name="access-time" size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>
                  {eventData.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Universal Date/Time Pickers */}
      <UniversalDatePicker
        isVisible={showStartDatePicker}
        date={eventData.start}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => {
          const newDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            eventData.start.getHours(),
            eventData.start.getMinutes()
          );
          setEventData(prev => ({ ...prev, start: newDate }));
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <UniversalDatePicker
        isVisible={showStartTimePicker}
        date={eventData.start}
        mode="time"
        onConfirm={(time) => {
          const newDate = new Date(
            eventData.start.getFullYear(),
            eventData.start.getMonth(),
            eventData.start.getDate(),
            time.getHours(),
            time.getMinutes()
          );
          setEventData(prev => ({ ...prev, start: newDate }));
          setShowStartTimePicker(false);
        }}
        onCancel={() => setShowStartTimePicker(false)}
      />

      <UniversalDatePicker
        isVisible={showEndDatePicker}
        date={eventData.end}
        mode="date"
        minimumDate={eventData.start}
        onConfirm={(date) => {
          const newDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            eventData.end.getHours(),
            eventData.end.getMinutes()
          );
          setEventData(prev => ({ ...prev, end: newDate }));
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />

      <UniversalDatePicker
        isVisible={showEndTimePicker}
        date={eventData.end}
        mode="time"
        onConfirm={(time) => {
          const newDate = new Date(
            eventData.end.getFullYear(),
            eventData.end.getMonth(),
            eventData.end.getDate(),
            time.getHours(),
            time.getMinutes()
          );
          setEventData(prev => ({ ...prev, end: newDate }));
          setShowEndTimePicker(false);
        }}
        onCancel={() => setShowEndTimePicker(false)}
      />

      {/* Success Modal for Web/Desktop */}
      <SuccessModal />
    </KeyboardAvoidingView>
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
  eventName: {
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
  // Date/time picker styles
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
  bottomPadding: {
    height: 50,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Web DatePicker Modal styles
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
  } as any,
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

export default EditEventScreen;