import React, { useState } from 'react';
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
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BarService from '../../../services/BarService';

// Dark theme colors (same as BarDetailsScreen)
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
  star: '#fbbf24',
  starEmpty: '#52525b',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
  barId: string;
  barName: string;
  existingReview?: {
    _id: string;
    rating: number;
    comment: string;
  } | null;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  onReviewSubmitted,
  barId,
  barName,
  existingReview,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Error', 'Please write at least 10 characters in your review');
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        rating,
        comment: comment.trim(),
      };

      if (existingReview) {
        // Update existing review
        await BarService.updateReview(existingReview._id, reviewData);
        Alert.alert('Success', 'Your review has been updated!');
      } else {
        // Create new review
        await BarService.createReview(barId, reviewData);
        Alert.alert('Success', 'Thank you for your review!');
      }

      // Reset form
      setRating(0);
      setComment('');
      
      // Notify parent component
      onReviewSubmitted();
      onClose();

    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to submit review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    console.log('=== DELETE BUTTON PRESSED ===');
    console.log('existingReview:', existingReview);
    console.log('loading state:', loading);
    
    if (!existingReview || loading) {
      console.log('ERROR: No existing review found or loading in progress');
      return;
    }

    // For web/desktop, use custom confirmation modal
    if (Platform.OS === 'web') {
      setShowDeleteConfirmation(true);
      return;
    }

    // For mobile platforms, use native Alert
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review? This action cannot be undone.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('Delete cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(),
        },
      ],
      { 
        cancelable: true,
        userInterfaceStyle: 'dark'
      }
    );
  };

  const performDelete = async () => {
    if (!existingReview) return;
    
    console.log('Delete confirmed, starting deletion...');
    setLoading(true);
    
    try {
      console.log('Calling BarService.deleteReview with ID:', existingReview._id);
      await BarService.deleteReview(existingReview._id);
      
      console.log('Delete successful');
      
      // Reset form
      setRating(0);
      setComment('');
      
      // Notificar al componente padre y cerrar modal
      onReviewSubmitted();
      onClose();
      
      // Mostrar mensaje de éxito después de cerrar el modal
      setTimeout(() => {
        Alert.alert('Success', 'Your review has been deleted');
      }, 300);
      
    } catch (error) {
      console.error('Error deleting review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete review. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
          disabled={loading}
        >
          <Icon
            name="star"
            size={32}
            color={i <= rating ? colors.star : colors.starEmpty}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
      setShowDeleteConfirmation(false);
      onClose();
    }
  };

  // Custom Delete Confirmation Modal for Web/Desktop
  const DeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteConfirmation}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirmation(false)}
    >
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationModal}>
          <View style={styles.confirmationHeader}>
            <Icon name="warning" size={32} color={colors.warning} />
            <Text style={styles.confirmationTitle}>Delete Review</Text>
          </View>
          
          <Text style={styles.confirmationMessage}>
            Are you sure you want to delete your review? This action cannot be undone.
          </Text>
          
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.cancelButton]}
              onPress={() => setShowDeleteConfirmation(false)}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmationButton, styles.deleteConfirmButton]}
              onPress={performDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={styles.title}>
              {existingReview ? 'Edit Review' : 'Write a Review'}
            </Text>
            
            {/* Delete button with improved styling and functionality */}
            {existingReview ? (
              <TouchableOpacity
                onPress={() => {
                  console.log('Delete button touched!');
                  handleDeleteReview();
                }}
                style={styles.deleteButton}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Icon name="delete" size={24} color={colors.error} />
              </TouchableOpacity>
            ) : (
              <View style={styles.deleteButton} />
            )}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.barInfo}>
              <Text style={styles.barName}>{barName}</Text>
              <Text style={styles.subtitle}>
                {existingReview ? 'Update your experience' : 'Share your experience'}
              </Text>
            </View>

            {/* Rating Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating *</Text>
              <View style={styles.starsContainer}>
                {renderStars()}
              </View>
              <Text style={styles.ratingText}>
                {rating === 0 && 'Tap a star to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            </View>

            {/* Comment Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Review *</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={6}
                placeholder="Tell others about your experience at this bar. What did you like? What could be improved?"
                placeholderTextColor={colors.textMuted}
                value={comment}
                onChangeText={setComment}
                maxLength={500}
                editable={!loading}
              />
              <Text style={styles.characterCount}>
                {comment.length}/500 characters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || rating === 0 || comment.trim().length < 10) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || rating === 0 || comment.trim().length < 10}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {existingReview ? 'Update Review' : 'Submit Review'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Delete Confirmation Modal for Web */}
      <DeleteConfirmationModal />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  barInfo: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  barName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 120,
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  bottomSpacing: {
    height: 32,
  },
  // Custom confirmation modal styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  confirmationMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteConfirmButton: {
    backgroundColor: colors.error,
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default ReviewModal;