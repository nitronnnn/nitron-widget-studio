import * as ImagePicker from 'expo-image-picker';

/**
 * Системный пикер медиа. quality: 1 + allowsEditing: false —
 * критично для GIF на Android (иначе вернётся первый кадр в PNG).
 */
export async function pickMediaUri(kind: 'image' | 'video'): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'image' ? ['images'] : ['videos'],
    allowsEditing: false,
    quality: 1,
  });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}
