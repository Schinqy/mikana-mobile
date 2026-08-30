import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function openWhatsAppChat(phoneNumber: string, text: string): Promise<boolean> {
  try {
    // Sanitize phone number (remove +, spaces, dashes, brackets)
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    const encodedText = encodeURIComponent(text);

    // Deep link scheme
    const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    const webFallbackUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
      return true;
    } else {
      await Linking.openURL(webFallbackUrl);
      return true;
    }
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    // Fallback: Copy to clipboard
    await Clipboard.setStringAsync(text);
    return false;
  }
}

export async function callPhoneNumber(phoneNumber: string): Promise<void> {
  try {
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Linking.openURL(`tel:${cleanPhone}`);
  } catch (error) {
    console.error('Error calling phone:', error);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;
  } catch (error) {
    return false;
  }
}

export const openWhatsAppDM = openWhatsAppChat;

