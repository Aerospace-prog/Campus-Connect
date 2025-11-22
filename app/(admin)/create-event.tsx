import { StyleSheet, Text, View } from 'react-native';


export default function CreateEventScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Create Event Form</Text>
      <Text style={styles.note}>TO DO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  placeholder: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: '#6b7280',
  },
});
