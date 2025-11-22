import { StyleSheet, Text, View } from 'react-native';


export default function ScannerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>QR Code Scanner</Text>
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
    backgroundColor: '#000',
  },
  placeholder: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
