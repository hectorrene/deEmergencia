import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Modal, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BusinessStackParamList } from '../../../navigation/userNavigation';
import BarService from '../../../services/BarService';
import BusinessService from '../../../services/BusinessService';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

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
  star: '#fbbf24',
  starEmpty: '#52525b',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

type BarDetailsScreenRouteProp = RouteProp<BusinessStackParamList, 'BusinessDetails'>;
type BarDetailsScreenNavigationProp = StackNavigationProp<BusinessStackParamList>;

type BarDetailsScreenProps = {
  route: BarDetailsScreenRouteProp;
  navigation: BarDetailsScreenNavigationProp;
};

interface Address {
  street?: string;
  city: string;
  state: string;
  zipCode?: string;
}

interface Bar {
  _id: string;
  name: string;
  description: string;
  photo?: string;
  address: Address;
  mapsUrl?: string;
  phone?: string;
  tags: string[];
  ratingAverage: number;
  ratingQuantity: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: 'food' | 'drinks' | 'alcohol';
  isAlcoholic?: boolean;
}

interface Review {
  _id: string;
  user: {
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
}

const BarDetailsScreen: React.FC<BarDetailsScreenProps> = ({ route, navigation }) => {
  const { barId } = route.params;
  
  const [bar, setBar] = useState<Bar | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'events' | 'reviews'>('menu');
  
  // Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteType, setDeleteType] = useState<'bar' | 'menuItem' | 'event'>('bar');
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [deleteItemName, setDeleteItemName] = useState<string>('');

  const fetchBarData = async () => {
    try {
      const barResponse = await BarService.getBarById(barId);
      setBar(barResponse.data);

      try {
        const foodResponse = await BarService.getFoodByBarId(barId);
        const drinksResponse = await BarService.getDrinksByBarId(barId);
        const alcoholResponse = await BarService.getAlcoholByBarId(barId);

        const allMenuItems = [
          ...(foodResponse.data?.items || []),
          ...(drinksResponse.data?.items || []),
          ...(alcoholResponse.data?.items || []),
        ];
        setMenu(allMenuItems);
      } catch (menuError) {
        console.error('Error fetching menu items:', menuError);
        setMenu([]);
      }
      
      try {
        const reviewsResponse = await BarService.getReviewsByBarId(barId);
        setReviews(reviewsResponse.data);
      } catch (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        setReviews([]);
      }

      try {
        const eventsResponse = await BarService.getEventsByBarId(barId);
        setEvents(eventsResponse.data);
      } catch (eventsError) {
        console.error('Error fetching events:', eventsError);
        setEvents([]);
      }

    } catch (error) {
      console.error('Error fetching bar data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBarData();
  }, [barId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBarData();
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMapsPress = (mapsUrl: string) => {
    Linking.openURL(mapsUrl);
  };

  const handleEditBar = () => {
    if (bar) {
      navigation.navigate('EditBarScreen', { barId: bar._id, barName: bar.name });
    }
  };

  const handleDeleteBar = () => {
    setDeleteType('bar');
    setDeleteItemId(barId);
    setDeleteItemName(bar?.name || '');
    setDeleteModalVisible(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    if (bar) {
      navigation.navigate('EditMenuItemScreen', { 
        barId: bar._id,
        itemId: item._id,
        barName: bar.name,
        itemName: item.name
      });
    }
  };

  const handleDeleteMenuItem = (item: MenuItem) => {
    setDeleteType('menuItem');
    setDeleteItemId(item._id);
    setDeleteItemName(item.name);
    setDeleteModalVisible(true);
  };

  const handleEditEvent = (event: Event) => {
    if (bar) {
      navigation.navigate('EditEventScreen', { 
        barId: bar._id,
        eventId: event._id,
        barName: bar.name,
        eventName: event.title
      });
    }
  };

  const handleDeleteEvent = (event: Event) => {
    setDeleteType('event');
    setDeleteItemId(event._id);
    setDeleteItemName(event.title);
    setDeleteModalVisible(true);
  };

  const handleAddMenuItem = () => {
    if (bar) {
      navigation.navigate('MenuListScreen', { 
        barId: bar._id,
        barName: bar.name
      });
    }
  };

  const handleAddEvent = () => {
    if (bar) {
      navigation.navigate('AddEventScreen', { 
        barId: bar._id,
        barName: bar.name
      });
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      
      switch (deleteType) {
        case 'bar':
          await BusinessService.deleteBar(deleteItemId);
          setDeleteModalVisible(false);
          navigation.navigate('BarListScreen');
          break;
        case 'menuItem':
          await BusinessService.deleteMenuItem(barId, deleteItemId);
          setDeleteModalVisible(false);
          fetchBarData(); // Refresh data
          break;
        case 'event':
          await BusinessService.deleteEvent(barId, deleteItemId);
          setDeleteModalVisible(false);
          fetchBarData(); // Refresh data
          break;
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { 
          color: i <= rating ? colors.star : colors.starEmpty,
          fontSize: size 
        }]}>
          ★
        </Text>
      );
    }
    return stars;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'restaurant';
      case 'drinks': return 'local-cafe';
      case 'alcohol': return 'wine-bar';
      default: return 'restaurant-menu';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <View style={styles.tabContent}>
            {menu.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="restaurant-menu" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>No menu items available</Text>
                <Text style={styles.emptyStateSubtext}>Create your first menu item</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleAddMenuItem}>
                  <Icon name="add" size={20} color={colors.text} />
                  <Text style={styles.createButtonText}>Add Menu Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.menuGrid}>
                <TouchableOpacity style={styles.addItemCard} onPress={handleAddMenuItem}>
                  <Icon name="add" size={32} color={colors.primary} />
                  <Text style={styles.addItemText}>Add Menu Item</Text>
                </TouchableOpacity>
                {menu.map((item) => (
                  <View key={item._id} style={styles.menuCard}>
                    <TouchableOpacity 
                      style={styles.menuCardContent}
                      onPress={() => handleEditMenuItem(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.menuCardHeader}>
                        <View style={styles.menuItemInfo}>
                          <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                          <Icon name={getCategoryIcon(item.category)} size={16} color={colors.text} />
                        </View>
                      </View>
                      {item.description && (
                        <Text style={styles.menuItemDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      {item.isAlcoholic && (
                        <View style={styles.alcoholBadge}>
                          <Text style={styles.alcoholBadgeText}>21+</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.itemActions}>
                      <TouchableOpacity 
                        style={styles.actionButtonSmall}
                        onPress={() => handleEditMenuItem(item)}
                      >
                        <Icon name="edit" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButtonSmall}
                        onPress={() => handleDeleteMenuItem(item)}
                      >
                        <Icon name="delete" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'events':
        return (
          <View style={styles.tabContent}>
            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="event" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>No upcoming events</Text>
                <Text style={styles.emptyStateSubtext}>Create your first event</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleAddEvent}>
                  <Icon name="add" size={20} color={colors.text} />
                  <Text style={styles.createButtonText}>Add Event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity style={styles.addEventButton} onPress={handleAddEvent}>
                  <Icon name="add" size={20} color={colors.primary} />
                  <Text style={styles.addEventButtonText}>Add New Event</Text>
                </TouchableOpacity>
                {events.map((event) => (
                  <View key={event._id} style={styles.eventCard}>
                    <TouchableOpacity 
                      style={styles.eventCardContent}
                      onPress={() => handleEditEvent(event)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.eventHeader}>
                        <View style={styles.eventDateBadge}>
                          <Text style={styles.eventDateText}>{formatDate(event.date)}</Text>
                          {event.time && (
                            <Text style={styles.eventTimeText}>{event.time}</Text>
                          )}
                        </View>
                        <Icon name="event" size={24} color={colors.primary} />
                      </View>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    </TouchableOpacity>
                    <View style={styles.itemActions}>
                      <TouchableOpacity 
                        style={styles.actionButtonSmall}
                        onPress={() => handleEditEvent(event)}
                      >
                        <Icon name="edit" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButtonSmall}
                        onPress={() => handleDeleteEvent(event)}
                      >
                        <Icon name="delete" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'reviews':
        return (
          <View style={styles.tabContent}>
            {reviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="rate-review" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>No reviews yet</Text>
                <Text style={styles.emptyStateSubtext}>Reviews will appear here when customers leave them</Text>
              </View>
            ) : (
              <>
                {reviews.slice(0, 5).map((review) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUserInfo}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userInitial}>
                            {review.user.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewUser}>{review.user.name}</Text>
                          <Text style={styles.reviewDate}>
                            {formatDate(review.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewRating}>
                        {renderStars(review.rating, 14)}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
                {reviews.length > 5 && (
                  <TouchableOpacity style={styles.moreReviewsButton}>
                    <Text style={styles.moreReviewsText}>
                      View all {reviews.length} reviews
                    </Text>
                    <Icon name="arrow-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return colors.success;
      case 'drinks': return colors.primary;
      case 'alcohol': return colors.accent;
      default: return colors.textMuted;
    }
  };

  const DeleteModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={deleteModalVisible}
      onRequestClose={() => setDeleteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Icon name="warning" size={32} color={colors.warning} />
            <Text style={styles.modalTitle}>
              Delete {deleteType === 'bar' ? 'Bar' : deleteType === 'menuItem' ? 'Menu Item' : 'Event'}
            </Text>
          </View>
          <Text style={styles.modalMessage}>
            Are you sure you want to delete "{deleteItemName}"? This action cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalDeleteButton}
              onPress={confirmDelete}
            >
              <Text style={styles.modalDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bar details...</Text>
      </SafeAreaView>
    );
  }

  if (!bar) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Icon name="error-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Bar not found</Text>
        <Text style={styles.errorSubtext}>The bar you're looking for doesn't exist</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Image with Overlay */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: bar.photo || 'https://via.placeholder.com/400x300?text=No+Image' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay}>
            <TouchableOpacity 
              style={styles.backIconButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEditBar}>
                <Icon name="edit" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDeleteBar}>
                <Icon name="delete" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bar Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.barName}>{bar.name}</Text>
          

          {/* Tags */}
          {bar.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {bar.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{bar.description}</Text>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {bar.mapsUrl && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleMapsPress(bar.mapsUrl!)}
              >
                <Icon name="map" size={20} color={colors.primary} />
                <Text style={styles.quickActionText}>Directions</Text>
              </TouchableOpacity>
            )}
            {bar.phone && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handlePhonePress(bar.phone!)}
              >
                <Icon name="phone" size={20} color={colors.success} />
                <Text style={styles.quickActionText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Icon name="location-on" size={24} color={colors.primary} />
              <Text style={styles.locationTitle}>Location</Text>
            </View>
            <Text style={styles.address}>
              {bar.address.street && `${bar.address.street}, `}
              {bar.address.city}, {bar.address.state}
              {bar.address.zipCode && ` ${bar.address.zipCode}`}
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsHeader}>
              {(['menu', 'events', 'reviews'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                  {tab === 'menu' && menu.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{menu.length}</Text>
                    </View>
                  )}
                  {tab === 'events' && events.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{events.length}</Text>
                    </View>
                  )}
                  {tab === 'reviews' && reviews.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{reviews.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {renderTabContent()}
          </View>
        </View>
      </ScrollView>

      <DeleteModal />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    position: 'relative',
    height: isTablet ? 300 : 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: colors.overlay,
  },
  backIconButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  ratingOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingBadgeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 20,
  },
  barName: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  address: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  tabsContainer: {
    marginTop: 8,
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuGrid: {
    gap: 16,
  },
  addItemCard: {
    backgroundColor: colors.surfaceVariant,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  addItemText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  menuCardContent: {
    padding: 16,
  },
  menuCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  categoryBadge: {
    borderRadius: 16,
    padding: 6,
  },
  menuItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  alcoholBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  alcoholBadgeText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  actionButtonSmall: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    padding: 8,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  addEventButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventCardContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDateBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  eventDateText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  eventTimeText: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  moreReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreReviewsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export { BarDetailsScreen };
export default BarDetailsScreen;