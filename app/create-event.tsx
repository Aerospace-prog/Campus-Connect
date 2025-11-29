import { useAuth } from '@/contexts/auth.context';
import { useRole } from '@/hooks/use-role';
import { EventService } from '@/services/event.service';
import { CreateEventInput } from '@/types/models';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
 * CreateEventScreen - Modal for creating new events
 */
export default function CreateEventScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) {
      router.back();
    }
  }, [isAdmin, roleLoading, router]);

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
    
    if (date <= new Date()) {
      newErrors.date = 'Event date must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }
    
    setLoading(true);
    
    try {
      const eventInput: CreateEventInput = {
        title: title.trim(),
        description: description.trim(),
        date,
        location: location.trim(),
      };
      
      // Create event with createdBy set to current admin user ID (Requirement 7.3)
      await EventService.createEvent(eventInput, user.uid);
      
      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes());
      setDate(newDate);
      if (newDate > new Date()) {
        setErrors(prev => ({ ...prev, date: undefined }));
      }
    }
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
      if (newDate > new Date()) {
        setErrors(prev => ({ ...prev, date: undefined }));
      }
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

  if (roleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Enter event title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="Describe your event"
              placeholderTextColor="#9ca3af"
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
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.date && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerButtonText}>📅 {formatDate(date)}</Text>
            </TouchableOpacity>
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.pickerButtonText}>🕐 {formatTime(date)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="Enter event location"
              placeholderTextColor="#9ca3af"
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
              }}
              maxLength={100}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Event</Text>
            )}
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
