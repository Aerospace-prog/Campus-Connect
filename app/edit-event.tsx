import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { useRole } from '@/hooks/use-role';
import { EventService } from '@/services/event.service';
import { Event } from '@/types/models';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface FormErrors {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
}

/**
 * EditEventScreen - Modal for editing existing events
 */
export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const { isAdmin, loading: roleLoading } = useRole();

  // Create themed styles
  const themedStyles = useMemo(() => ({
    container: { ...styles.container, backgroundColor: colors.backgroundSecondary },
    loadingContainer: { ...styles.loadingContainer, backgroundColor: colors.backgroundSecondary },
    loadingText: { ...styles.loadingText, color: colors.textSecondary },
    statsCard: { 
      ...styles.statsCard, 
      backgroundColor: colors.surface,
      ...theme.shadows.md,
    },
    statValue: { ...styles.statValue, color: colors.primary },
    statLabel: { ...styles.statLabel, color: colors.textSecondary },
    statDivider: { ...styles.statDivider, backgroundColor: colors.border },
    label: { ...styles.label, color: colors.text },
    input: { 
      ...styles.input, 
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
    inputError: { borderColor: colors.error },
    errorText: { ...styles.errorText, color: colors.error },
    pickerButton: {
      ...styles.pickerButton,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    pickerButtonText: { ...styles.pickerButtonText, color: colors.text },
    saveButton: { 
      ...styles.saveButton, 
      backgroundColor: colors.primary,
      ...theme.shadows.md,
    },
    deleteButton: {
      ...styles.deleteButton,
      backgroundColor: colors.surface,
      borderColor: colors.error,
    },
    deleteButtonText: { ...styles.deleteButtonText, color: colors.error },
  }), [colors, theme]);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) {
      router.back();
      return;
    }

    const fetchEvent = async () => {
      if (!id) {
        Alert.alert('Error', 'Event ID is missing');
        router.back();
        return;
      }

      try {
        const eventData = await EventService.getEventById(id);
        
        // Check if user is the creator (Requirement 7.5)
        if (eventData.createdBy !== user?.uid) {
          Alert.alert('Error', 'You can only edit events you created');
          router.back();
          return;
        }
        
        setEvent(eventData);
        setTitle(eventData.title);
        setDescription(eventData.description);
        setDate(eventData.date.toDate());
        setLocation(eventData.location);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load event');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user, router, isAdmin, roleLoading]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;
    
    setSaving(true);
    
    try {
      await EventService.updateEvent(id, {
        title: title.trim(),
        description: description.trim(),
        date,
        location: location.trim(),
      });
      
      Alert.alert('Success', 'Event updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            
            setSaving(true);
            try {
              await EventService.deleteEvent(id);
              Alert.alert('Success', 'Event deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete event');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes());
      setDate(newDate);
      if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
    }
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (d: Date): string => {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (roleLoading || loading) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <KeyboardAvoidingView
      style={themedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {event && (
          <View style={themedStyles.statsCard}>
            <View style={styles.statItem}>
              <Text style={themedStyles.statValue}>{event.rsvps.length}</Text>
              <Text style={themedStyles.statLabel}>RSVPs</Text>
            </View>
            <View style={themedStyles.statDivider} />
            <View style={styles.statItem}>
              <Text style={themedStyles.statValue}>{event.checkedIn.length}</Text>
              <Text style={themedStyles.statLabel}>Checked In</Text>
            </View>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={themedStyles.label}>Event Title *</Text>
            <TextInput
              style={[themedStyles.input, errors.title && themedStyles.inputError]}
              placeholder="Enter event title"
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              maxLength={100}
            />
            {errors.title && <Text style={themedStyles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={themedStyles.label}>Description *</Text>
            <TextInput
              style={[themedStyles.input, styles.textArea, errors.description && themedStyles.inputError]}
              placeholder="Describe your event"
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) setErrors(prev => ({ ...prev, description: undefined }));
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.description && <Text style={themedStyles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={themedStyles.label}>Date *</Text>
            <TouchableOpacity
              style={[themedStyles.pickerButton, errors.date && themedStyles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={themedStyles.pickerButtonText}>📅 {formatDate(date)}</Text>
            </TouchableOpacity>
            {errors.date && <Text style={themedStyles.errorText}>{errors.date}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={themedStyles.label}>Time *</Text>
            <TouchableOpacity
              style={themedStyles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={themedStyles.pickerButtonText}>🕐 {formatTime(date)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={themedStyles.label}>Location *</Text>
            <TextInput
              style={[themedStyles.input, errors.location && themedStyles.inputError]}
              placeholder="Enter event location"
              placeholderTextColor={colors.placeholder}
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
              }}
              maxLength={100}
            />
            {errors.location && <Text style={themedStyles.errorText}>{errors.location}</Text>}
          </View>

          <TouchableOpacity
            style={[themedStyles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[themedStyles.deleteButton, saving && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={saving}
          >
            <Text style={themedStyles.deleteButtonText}>Delete Event</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
