import { useAuth } from '@/contexts/auth.context';
import { EventService } from '@/services/event.service';
import { NotificationService } from '@/services/notification.service';
import { Event } from '@/types/models';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function SendNotificationScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { user } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [rsvpCount, setRsvpCount] = useState(0);

  // Load admin's events
  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.uid) return;
      
      try {
        const adminEvents = await EventService.getEventsByCreator(user.uid);
        setEvents(adminEvents);
        
        // If eventId was passed, set it as selected
        if (eventId) {
          setSelectedEventId(eventId);
        } else if (adminEvents.length > 0) {
          setSelectedEventId(adminEvents[0].id);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        Alert.alert('Error', 'Failed to load events');
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [user?.uid, eventId]);


  // Update RSVP count when selected event changes
  useEffect(() => {
    const updateRsvpCount = async () => {
      if (selectedEventId) {
        const count = await NotificationService.getRSVPCountForEvent(selectedEventId);
        setRsvpCount(count);
      } else {
        setRsvpCount(0);
      }
    };

    updateRsvpCount();
  }, [selectedEventId]);

  const handleSend = async () => {
    if (!selectedEventId) {
      Alert.alert('Error', 'Please select an event');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a notification title');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a notification message');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Send Notification',
      `Send notification to ${rsvpCount} attendee${rsvpCount !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await NotificationService.sendToEvent(
                selectedEventId,
                title.trim(),
                message.trim()
              );

              if (result.success) {
                // Build detailed message
                let statusMessage = `Notification sent to ${result.sentCount} user${result.sentCount !== 1 ? 's' : ''}`;
                
                const issues: string[] = [];
                if (result.failedCount > 0) {
                  issues.push(`${result.failedCount} delivery failed`);
                }
                if (result.noTokenCount && result.noTokenCount > 0) {
                  issues.push(`${result.noTokenCount} users have notifications disabled`);
                }
                
                if (issues.length > 0) {
                  statusMessage += `\n\n${issues.join('\n')}`;
                }

                // Log errors for debugging
                if (result.errors && result.errors.length > 0) {
                  console.log('Notification errors:', result.errors);
                }

                Alert.alert(
                  result.sentCount > 0 ? 'Sent' : 'Notice',
                  statusMessage,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('Error', 'Failed to send notifications. Please try again.');
              }
            } catch (error) {
              console.error('Error sending notification:', error);
              Alert.alert('Error', 'Failed to send notification. Check your connection and try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (loadingEvents) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No events found</Text>
        <Text style={styles.emptySubtext}>Create an event first to send notifications</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Event Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Event</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventSelector}>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventChip,
                  selectedEventId === event.id && styles.eventChipSelected,
                ]}
                onPress={() => setSelectedEventId(event.id)}
              >
                <Text
                  style={[
                    styles.eventChipText,
                    selectedEventId === event.id && styles.eventChipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* RSVP Count Display */}
        {selectedEvent && (
          <View style={styles.rsvpInfo}>
            <Text style={styles.rsvpCount}>{rsvpCount}</Text>
            <Text style={styles.rsvpLabel}>
              attendee{rsvpCount !== 1 ? 's' : ''} will receive this notification
            </Text>
          </View>
        )}

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Enter your message to attendees"
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{message.length}/500</Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send Notification</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  eventSelector: {
    flexDirection: 'row',
  },
  eventChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: 150,
  },
  eventChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  eventChipText: {
    fontSize: 14,
    color: '#4b5563',
  },
  eventChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  rsvpInfo: {
    backgroundColor: '#eef2ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  rsvpCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  rsvpLabel: {
    fontSize: 14,
    color: '#4f46e5',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  messageInput: {
    height: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
