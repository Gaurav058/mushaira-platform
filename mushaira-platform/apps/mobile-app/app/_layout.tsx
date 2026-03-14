import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) router.replace('/(auth)');
    else if (isAuthenticated && inAuth) router.replace('/(main)');
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen
        name="event/[id]"
        options={{
          headerShown: true,
          title: 'Event Details',
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: { color: Colors.text.inverse, fontFamily: 'PlayfairDisplay_700Bold' },
          headerTintColor: Colors.text.inverse,
        }}
      />
      <Stack.Screen
        name="register/[eventId]"
        options={{
          headerShown: true,
          title: 'Register',
          presentation: 'modal',
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: { color: Colors.text.inverse, fontFamily: 'PlayfairDisplay_700Bold' },
          headerTintColor: Colors.text.inverse,
        }}
      />
      <Stack.Screen
        name="ticket/[id]"
        options={{
          headerShown: true,
          title: 'My Ticket',
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: { color: Colors.text.inverse, fontFamily: 'PlayfairDisplay_700Bold' },
          headerTintColor: Colors.text.inverse,
        }}
      />
      <Stack.Screen
        name="family"
        options={{
          headerShown: true,
          title: 'Family Members',
          presentation: 'modal',
          headerStyle: { backgroundColor: Colors.primary },
          headerTitleStyle: { color: Colors.text.inverse, fontFamily: 'PlayfairDisplay_700Bold' },
          headerTintColor: Colors.text.inverse,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <RootLayoutNav />
      </View>
    </AuthProvider>
  );
}
