import React, { useContext } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Book, PlusCircle, Award } from 'lucide-react-native';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { LanguageProvider, LanguageContext } from './src/context/LanguageContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import KhataScreen from './src/screens/KhataScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import SchemesScreen from './src/screens/SchemesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0f1016',
    card: '#1a1c23',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.05)',
  },
};

function MainTabs() {
  const { t } = useContext(LanguageContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#1a1c23',
          borderTopColor: 'rgba(255,255,255,0.05)',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          let iconSize = size;
          if (route.name === t('Home') || route.name === 'Home') IconComponent = Home;
          else if (route.name === t('Khata') || route.name === 'Khata') IconComponent = Book;
          else if (route.name === t('Add Product') || route.name === 'Add Product') {
            IconComponent = PlusCircle;
            iconSize = 32;
          }
          else if (route.name === t('Schemes') || route.name === 'Schemes') IconComponent = Award;

          if (route.name === t('Add Product') || route.name === 'Add Product') {
            return (
              <View style={{ backgroundColor: focused ? 'rgba(236, 72, 153, 0.2)' : 'transparent', padding: 4, borderRadius: 20, marginTop: -10 }}>
                <IconComponent color={focused ? '#ec4899' : color} size={iconSize} />
              </View>
            );
          }
          return <IconComponent color={color} size={iconSize} />;
        },
      })}
    >
      <Tab.Screen name="Home" options={{ title: t('Home') }} component={HomeScreen} />
      <Tab.Screen name="Khata" options={{ title: t('Khata') }} component={KhataScreen} />
      <Tab.Screen name="Add Product" options={{ title: t('Add Product') }} component={AddProductScreen} />
      <Tab.Screen name="Schemes" options={{ title: t('Schemes') }} component={SchemesScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1016'}}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={customDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
}
