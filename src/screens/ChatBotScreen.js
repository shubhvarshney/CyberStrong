import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ChatBotTitle from '../components/ChatBotTitle';
import ImageUploadButton from '../components/ImageUploadButton';
import { useTheme } from '../context/ThemeContext';

// Chatbot screen with Gemini integration, attempting a safe responses from the bot

const ChatBotScreen = () => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    { id: 'sys1', role: 'assistant', content: 'Hi! I\'m your cybersecurity assistant. I can answer your questions and verify whether an email you got is phishing! I am not a human.' }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const sendMessage = async () => {
    if ((!input.trim() && !image) || isSending) return;
    setError('');
    let content = input.trim();
    let userMsg = { id: `u-${Date.now()}`, role: 'user', content };

    if (image) {
      userMsg.image = image;
    }

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imageToSend = image;
    setImage(null);
    setShowImageUpload(false);

    if (!geminiApiKey) {
      const warn = { 
        id: `w-${Date.now()}`, 
        role: 'assistant', 
        content: 'Missing Gemini API key.' 
      };
      setMessages(prev => [...prev, warn]);
      return;
    }

    setIsSending(true);
    try {
      const parts = [];
      if (content) {
        parts.push({ text: content });
      }
      if (imageToSend) {
        const base64Data = imageToSend.split(',')[1];
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      }
      const requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gemini API error ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Sorry, I could not generate a response.';
      const reply = { id: `a-${Date.now()}`, role: 'assistant', content: replyText };
      setMessages(prev => [...prev, reply]);
    } catch (e) {
      setError(e?.message || 'Failed to get response');
      const reply = { 
        id: `e-${Date.now()}`, 
        role: 'assistant', 
        content: 'Failed to contact Gemini API.' 
      };
      setMessages(prev => [...prev, reply]);
    } finally {
      setIsSending(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]?.base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setShowImageUpload(false);
    }
  };
  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ChatBotTitle />
      <View style={[styles.mainContent, isLargeScreen && styles.mainContentRow]}>
        <View style={[styles.chatArea, isLargeScreen && styles.chatAreaLarge, isLargeScreen && { borderRightColor: theme.border }]}>
          <ScrollView style={[styles.messages, { backgroundColor: theme.background }]} ref={scrollRef} contentContainerStyle={{ padding: 16 }}>
            {messages.map(m => (
              <View key={m.id} style={[
                styles.message, 
                m.role === 'user' 
                  ? { backgroundColor: theme.messageUser, alignSelf: 'flex-end' } 
                  : { backgroundColor: theme.messageAssistant, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.border }
              ]}>
                {m.image && (
                  <Image source={{ uri: m.image }} style={styles.uploadedImage} />
                )}
                <Text style={[
                  styles.messageText,
                  { color: m.role === 'user' ? theme.messageUserText : theme.messageAssistantText }
                ]}>{m.content}</Text>
              </View>
            ))}
          </ScrollView>
          {error ? (
            <View style={[styles.errorBar, {  borderTopColor: theme.border }]}>
              <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {image && !isLargeScreen && (
            <View style={[styles.mobileImagePreview, {  borderTopColor: theme.border }]}>
              <Image source={{ uri: image }} style={styles.mobilePreviewImage} />
              <View style={styles.mobilePreviewInfo}>
                <View style={styles.previewBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.previewText}>Image ready</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.removeImageBtnMobile, { backgroundColor: theme.background }]}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.inputContainer, {  borderTopColor: theme.border }]}>
            {!isLargeScreen && (
              <TouchableOpacity 
                style={[styles.imageButton, { backgroundColor: theme.primary }]}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={20} color="#1a1a2e" />
              </TouchableOpacity>
            )}
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder }]}
              placeholder="Ask about security..."
              placeholderTextColor={theme.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.sendBtn, 
                { backgroundColor: theme.primary }, 
                ((!input.trim() && !image) || isSending) && { backgroundColor: theme.isDark ? '#374151' : '#d1d5db', opacity: 0.6 }
              ]} 
              onPress={sendMessage} 
              disabled={(!input.trim() && !image) || isSending}
            >
              {isSending ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="send" size={20} color="#000" />}
            </TouchableOpacity>
          </View>
        </View>
        {isLargeScreen && (
          <View style={[styles.uploadArea, {  borderTopColor: theme.border }, styles.uploadAreaLarge]}>
            <View style={[styles.uploadCard, {  borderColor: theme.border }]}>
              <Ionicons name="cloud-upload-outline" size={48} color="#4ade80" style={styles.uploadIcon} />
              <Text style={[styles.uploadTitle, { color: theme.text }]}>Image Analysis</Text>
              <Text style={[styles.uploadDescription, { color: theme.textMuted }]}>
                Upload security-related images for analysis
              </Text>
              {image && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <View style={styles.previewBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.previewText}>Ready to send</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.removeImageBtn, { backgroundColor: theme.background }]}
                    onPress={() => setImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              <ImageUploadButton onPress={pickImage} />
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default ChatBotScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  mainContentRow: {
    flexDirection: 'row',
  },
  chatArea: {
    flex: 1,
    flexDirection: 'column',
  },
  chatAreaLarge: {
    flex: 2,
    borderRightWidth: 1,
  },
  messages: { 
    flex: 1,
  },
  message: { 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10, 
    maxWidth: '85%' 
  },
  messageText: { 
    fontSize: 16 
  },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 12, 
    gap: 8, 
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: { 
    flex: 1, 
    minHeight: 44, 
    maxHeight: 120,
    paddingHorizontal: 12, 
    paddingVertical: 10,
    borderRadius: 10, 
    fontSize: 16,
    borderWidth: 1,
  },
  sendBtn: { 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 44,
    height: 44,
  },
  sendBtnDisabled: { 
    backgroundColor: '#374151' 
  },
  banner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  bannerText: { 
    color: '#f59e0b', 
    marginLeft: 6,
    flex: 1,
    fontSize: 13,
  },
  errorBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  errorText: { 
    color: '#ef4444', 
    marginLeft: 6,
    flex: 1,
    fontSize: 13,
  },
  imageButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  mobileImagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  mobilePreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  mobilePreviewInfo: {
    flex: 1,
  },
  removeImageBtnMobile: {
    padding: 4,
    borderRadius: 12,
  },
  uploadedImage: { 
    width: 120, 
    height: 80, 
    borderRadius: 8, 
    marginBottom: 6 
  },
  uploadArea: {
    padding: 16,
    borderTopWidth: 1,
  },
  uploadAreaLarge: {
    flex: 1,
    borderTopWidth: 0,
    minWidth: 300,
    maxWidth: 400,
  },
  uploadCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065f46',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  previewText: { 
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
  },
});
