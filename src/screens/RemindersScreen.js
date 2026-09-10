import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const RemindersScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    repeat: false,
    enabled: true,
  });

  useEffect(() => {
    loadReminders();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please enable notifications to use reminders.');
    }
  };

  const loadReminders = async () => {
    try {
      const saved = await AsyncStorage.getItem('neurosync_reminders');
      if (saved) {
        setReminders(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const saveReminders = async (newReminders) => {
    try {
      await AsyncStorage.setItem('neurosync_reminders', JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const scheduleNotification = async (reminder) => {
    const triggerDate = new Date(`${reminder.date}T${reminder.time}`);
    const now = new Date();
    
    if (triggerDate <= now) {
      Alert.alert('Invalid time', 'Please select a future date and time.');
      return false;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.description,
          sound: true,
        },
        trigger: {
          date: triggerDate,
          repeats: reminder.repeat,
        },
      });
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  };

  const addReminder = async () => {
    if (!newReminder.title.trim()) {
      Alert.alert('Title required', 'Please enter a reminder title.');
      return;
    }

    if (!newReminder.date || !newReminder.time) {
      Alert.alert('Date/Time required', 'Please select both date and time.');
      return;
    }

    const reminder = {
      id: Date.now().toString(),
      ...newReminder,
      createdAt: new Date().toISOString(),
    };

    if (reminder.enabled) {
      const scheduled = await scheduleNotification(reminder);
      if (!scheduled) return;
    }

    const updated = [...reminders, reminder];
    await saveReminders(updated);
    
    setNewReminder({
      title: '',
      description: '',
      date: '',
      time: '',
      repeat: false,
      enabled: true,
    });

    Alert.alert('Reminder added', 'Your reminder has been scheduled.');
  };

  const deleteReminder = async (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = reminders.filter(r => r.id !== id);
            await saveReminders(updated);
          },
        },
      ]
    );
  };

  const toggleReminder = async (id) => {
    const updated = reminders.map(reminder => 
      reminder.id === id 
        ? { ...reminder, enabled: !reminder.enabled }
        : reminder
    );
    await saveReminders(updated);
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Reminders</Text>
      </View>

      <View style={styles.addReminderCard}>
        <Text style={styles.cardTitle}>Add New Reminder</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Reminder title"
          value={newReminder.title}
          onChangeText={(text) => setNewReminder({...newReminder, title: text})}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          value={newReminder.description}
          onChangeText={(text) => setNewReminder({...newReminder, description: text})}
          multiline
        />

        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              // In a real app, you'd use a date picker
              Alert.prompt('Date', 'Enter date (YYYY-MM-DD):', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: (text) => setNewReminder({...newReminder, date: text}) }
              ]);
            }}
          >
            <Text style={styles.dateButtonText}>
              {newReminder.date || 'Select Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => {
              // In a real app, you'd use a time picker
              Alert.prompt('Time', 'Enter time (HH:MM):', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: (text) => setNewReminder({...newReminder, time: text}) }
              ]);
            }}
          >
            <Text style={styles.timeButtonText}>
              {newReminder.time || 'Select Time'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Repeat daily</Text>
          <Switch
            value={newReminder.repeat}
            onValueChange={(value) => setNewReminder({...newReminder, repeat: value})}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable notification</Text>
          <Switch
            value={newReminder.enabled}
            onValueChange={(value) => setNewReminder({...newReminder, enabled: value})}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addReminder}>
          <Text style={styles.addButtonText}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.remindersList}>
        <Text style={styles.sectionTitle}>Your Reminders</Text>
        
        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reminders yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first reminder to stay on track
            </Text>
          </View>
        ) : (
          <View style={styles.remindersContainer}>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderHeader}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <View style={styles.reminderActions}>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={() => toggleReminder(reminder.id)}
                    />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteReminder(reminder.id)}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {reminder.description && (
                  <Text style={styles.reminderDescription}>
                    {reminder.description}
                  </Text>
                )}
                
                <Text style={styles.reminderDateTime}>
                  {formatDateTime(reminder.date, reminder.time)}
                  {reminder.repeat && ' (Daily)'}
                </Text>
                
                <View style={styles.reminderStatus}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: reminder.enabled ? '#10b981' : '#ef4444' }
                  ]} />
                  <Text style={styles.statusText}>
                    {reminder.enabled ? 'Active' : 'Disabled'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  addReminderCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  dateButtonText: {
    color: '#64748b',
    textAlign: 'center',
  },
  timeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  timeButtonText: {
    color: '#64748b',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  remindersList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  remindersContainer: {
    gap: 12,
  },
  reminderCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  reminderDateTime: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  reminderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default RemindersScreen;


