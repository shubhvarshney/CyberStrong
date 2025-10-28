import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// The image upload button specifically for the web mode

const ImageUploadButton = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name="image-outline" size={24} color="#1a1a2e" />
      <Text style={styles.text}>Choose Image</Text>
    </TouchableOpacity>
  );
}

export default ImageUploadButton;

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
