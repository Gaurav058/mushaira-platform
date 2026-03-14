import * as FileSystem from 'expo-file-system';
import { offlineCache, CACHE_KEYS, CACHE_TTL } from './offline-cache';

/**
 * Downloads a QR pass image to the local filesystem cache so it's
 * available offline. Returns the local `file://` URI.
 */
export async function cacheQrImage(
  imageUrl: string,
  registrationId: string,
): Promise<string> {
  const localUri = `${FileSystem.cacheDirectory}qr_${registrationId}.png`;

  // Check if already downloaded and file still exists on disk
  const saved = await offlineCache.get<string>(
    CACHE_KEYS.QR_LOCAL_URI(registrationId),
  );
  if (saved) {
    const info = await FileSystem.getInfoAsync(saved);
    if (info.exists) return saved;
    // File was cleared by OS — re-download below
  }

  // Download the image
  const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);

  // Persist the local path in cache
  await offlineCache.set(
    CACHE_KEYS.QR_LOCAL_URI(registrationId),
    uri,
    CACHE_TTL.FOREVER,
  );

  return uri;
}

/**
 * Retrieves the locally cached QR image URI without downloading.
 * Returns null if not cached or file was deleted.
 */
export async function getCachedQrUri(registrationId: string): Promise<string | null> {
  const saved = await offlineCache.getStale<string>(
    CACHE_KEYS.QR_LOCAL_URI(registrationId),
  );
  if (!saved) return null;

  const info = await FileSystem.getInfoAsync(saved);
  return info.exists ? saved : null;
}
