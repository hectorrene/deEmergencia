import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BusinessStackParamList } from '../../../navigation/userNavigation';
import BusinessService from '../../../services/BusinessService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

// Dark theme colors
const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceVariant: '#2a2a2a',
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
};

type BusinessBarNavigationProp = StackNavigationProp<BusinessStackParamList, 'BusinessDashboard'>;

interface Bar {
  _id: string;
  name: string;
  description?: string;
  photo?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone?: string;
  type?: string[];
  ratingAverage?: number;
  ratingQuantity?: number;
}

const BarListScreen: React.FC = () => {
  const navigation = useNavigation<BusinessBarNavigationProp>();
  const [bars, setBars] = useState<Bar[]>([]);
  const [filteredBars, setFilteredBars] = useState<Bar[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar bares al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadBars();
    }, [])
  );

  const loadBars = async () => {
    try {
      setLoading(true);
      const response = await BusinessService.getMyBars();
      const barsData = response.data || [];
      setBars(barsData);
      setFilteredBars(barsData);
    } catch (error) {
      console.error('Error cargando bares:', error);
      Alert.alert('Error', 'No se pudieron cargar los bares');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBars();
    setRefreshing(false);
  };

  // Search bar
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBars(bars);
    } else {
      const filtered = bars.filter(bar =>
        bar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bar.type?.some(type => type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        bar.address?.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBars(filtered);
    }
  }, [searchQuery, bars]);

const handleBarPress = (bar: Bar) => {
    navigation.navigate('BusinessDetails', { barId: bar._id, barName: bar.name });
};

  const handleCreateBar = () => {
    navigation.navigate('CreateBarScreen');
  };

  const getCardWidth = () => {
    if (isDesktop) {
      return (width - 64) / 3 - 16; // 3 columns on desktop
    } else if (isTablet) {
      return (width - 48) / 2 - 12; // 2 columns on tablet
    }
    return width - 32; // Full width on mobile
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tus bares...</Text>
      </SafeAreaView>
    );
  }

  if (filteredBars.length === 0 && bars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Panel de Negocios</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateBar}>
            <Icon name="add" size={20} color={colors.text} />
            <Text style={styles.addButtonText}>Crear Bar</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="store" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>¡Bienvenido a tu Panel de Negocios!</Text>
          <Text style={styles.errorSubtext}>
            Aún no tienes bares registrados.{'\n'}
            Crea tu primer bar para comenzar.
          </Text>
          <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateBar}>
            <Text style={styles.createFirstButtonText}>Crear Mi Primer Bar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (filteredBars.length === 0 && bars.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Bares</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateBar}>
            <Icon name="add" size={20} color={colors.text} />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar bares, tipos, ciudades..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Icon name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="search-off" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>No se encontraron bares</Text>
          <Text style={styles.errorSubtext}>
            Intenta ajustar los términos de búsqueda
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Bares</Text>
          <Text style={styles.headerSubtitle}>{filteredBars.length} bares encontrados</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateBar}>
          <Icon name="add" size={20} color={colors.text} />
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar bares, tipos, ciudades..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
        <View style={[styles.listContainer, isDesktop && styles.desktopGrid, isTablet && !isDesktop && styles.tabletGrid]}>
          {filteredBars.map((bar) => (
            <TouchableOpacity 
              key={bar._id} 
              style={[
                styles.barCard,
                { width: getCardWidth() },
                isDesktop && styles.desktopCard,
                isTablet && !isDesktop && styles.tabletCard
              ]}
              onPress={() => handleBarPress(bar)}
              activeOpacity={0.8}
            >
              {/* Bar Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: bar.photo || 'https://via.placeholder.com/400x200?text=Mi+Bar' }}
                  style={styles.barImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  {bar.ratingAverage && (
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={14} color={colors.star} />
                      <Text style={styles.ratingBadgeText}>{bar.ratingAverage.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Bar Info */}
              <View style={styles.barInfoContainer}>
                <Text style={styles.barName} numberOfLines={1}>{bar.name}</Text>
                


                {/* Tags/Types */}
                {bar.type && bar.type.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {bar.type.slice(0, 3).map((type, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{type}</Text>
                      </View>
                    ))}
                    {bar.type.length > 3 && (
                      <View style={styles.tagMore}>
                        <Text style={styles.tagMoreText}>+{bar.type.length - 3}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Description */}
                {bar.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {bar.description}
                  </Text>
                )}

                {/* Location */}
                {bar.address && (
                  <View style={styles.locationContainer}>
                    <Icon name="location-on" size={16} color={colors.textMuted} />
                    <Text style={styles.address} numberOfLines={1}>
                      {[bar.address.city, bar.address.state].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  barCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  desktopCard: {
    marginBottom: 24,
  },
  tabletCard: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  barImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  barInfoContainer: {
    padding: 20,
  },
  barName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
  },
  ratingText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  tagMore: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagMoreText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 6,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  phoneButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});

export default BarListScreen;