import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path, Circle, Ellipse } from 'react-native-svg';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import BeatsScreen from './src/screens/BeatsScreen';
import TimerScreen from './src/screens/TimerScreen';
import FlashcardsScreen from './src/screens/FlashcardsScreen';
import NotesScreen from './src/screens/NotesScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import ChatScreen from './src/screens/ChatScreen';

const Tab = createBottomTabNavigator();

// Sea creature icon components
const SeaCreatureIcon = ({ type, size = 24, color = '#64748b', focused = false }) => {
  const opacity = focused ? 1 : 0.6;
  const iconColor = focused ? '#2563eb' : color;
  
  const icons = {
    home: (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M 50 15 L 20 40 L 20 75 L 35 75 L 35 60 L 65 60 L 65 75 L 80 75 L 80 40 Z" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
        <Circle cx="42" cy="48" r="3" fill="#1a1a1a"/>
        <Circle cx="58" cy="48" r="3" fill="#1a1a1a"/>
        <Circle cx="42" cy="48" r="1.5" fill="#fff"/>
        <Circle cx="58" cy="48" r="1.5" fill="#fff"/>
        <Path d="M 50 55 Q 48 59, 50 63" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <Ellipse cx="38" cy="46" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
        <Ellipse cx="62" cy="46" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
      </Svg>
    ),
    beats: (
      <Svg width={size} height={size} viewBox="0 0 95 115">
        <Ellipse cx="47" cy="38" rx="35" ry="24" fill="#87CEEB"/>
        <Ellipse cx="47" cy="38" rx="28" ry="20" fill="#B0E0E6" opacity="0.8"/>
        <Circle cx="42" cy="35" r="3" fill="#1a1a1a"/>
        <Circle cx="52" cy="35" r="3" fill="#1a1a1a"/>
        <Circle cx="42" cy="35" r="1.5" fill="#fff"/>
        <Circle cx="52" cy="35" r="1.5" fill="#fff"/>
        <Path d="M 47 42 Q 45 46, 47 50" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <Ellipse cx="38" cy="33" rx="2.5" ry="2" fill="#FFB6C1" opacity="0.8"/>
        <Ellipse cx="56" cy="33" rx="2.5" ry="2" fill="#FFB6C1" opacity="0.8"/>
        <Path d="M 24 60 Q 29 70, 24 80 Q 29 90, 24 100 Q 29 110, 24 110" stroke="#87CEEB" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <Path d="M 47 60 Q 52 70, 47 80 Q 52 90, 47 100 Q 52 110, 47 110" stroke="#87CEEB" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <Path d="M 70 60 Q 65 70, 70 80 Q 65 90, 70 100 Q 65 110, 70 110" stroke="#87CEEB" strokeWidth="5" fill="none" strokeLinecap="round"/>
      </Svg>
    ),
    timer: (
      <Svg width={size} height={size} viewBox="0 0 100 115">
        <Ellipse cx="50" cy="48" rx="30" ry="24" fill="#9370DB"/>
        <Ellipse cx="50" cy="48" rx="25" ry="20" fill="#BA55D3" opacity="0.8"/>
        <Circle cx="45" cy="42" r="3.5" fill="#1a1a1a"/>
        <Circle cx="55" cy="42" r="3.5" fill="#1a1a1a"/>
        <Circle cx="45" cy="42" r="1.5" fill="#fff"/>
        <Circle cx="55" cy="42" r="1.5" fill="#fff"/>
        <Path d="M 50 50 Q 48 54, 50 58" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <Ellipse cx="40" cy="40" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
        <Ellipse cx="60" cy="40" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
        <Path d="M 28 58 L 18 68 L 23 73 L 33 63 Z" fill="#9370DB"/>
        <Path d="M 72 58 L 82 68 L 77 73 L 67 63 Z" fill="#9370DB"/>
        <Path d="M 23 68 L 13 78 L 18 83 L 28 73 Z" fill="#9370DB"/>
        <Path d="M 77 68 L 87 78 L 82 83 L 72 73 Z" fill="#9370DB"/>
        <Path d="M 33 78 L 23 88 L 28 93 L 38 83 Z" fill="#9370DB"/>
        <Path d="M 67 78 L 77 88 L 72 93 L 62 83 Z" fill="#9370DB"/>
        <Path d="M 38 88 L 28 98 L 33 103 L 43 93 Z" fill="#9370DB"/>
        <Path d="M 62 88 L 72 98 L 67 103 L 57 93 Z" fill="#9370DB"/>
      </Svg>
    ),
    flashcards: (
      <Svg width={size} height={size} viewBox="0 0 100 90">
        <Ellipse cx="50" cy="45" rx="34" ry="24" fill="#FF6347"/>
        <Ellipse cx="50" cy="45" rx="27" ry="20" fill="#FF7F50" opacity="0.7"/>
        <Circle cx="42" cy="41" r="4" fill="#1a1a1a"/>
        <Circle cx="58" cy="41" r="4" fill="#1a1a1a"/>
        <Circle cx="42" cy="41" r="1.5" fill="#fff"/>
        <Circle cx="58" cy="41" r="1.5" fill="#fff"/>
        <Path d="M 50 48 Q 48 52, 50 56" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <Ellipse cx="38" cy="39" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
        <Ellipse cx="62" cy="39" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
        <Path d="M 16 34 L 6 24 L 11 29 Z" fill="#FF6347"/>
        <Path d="M 84 34 L 94 24 L 89 29 Z" fill="#FF6347"/>
        <Path d="M 16 56 L 6 66 L 11 61 Z" fill="#FF6347"/>
        <Path d="M 84 56 L 94 66 L 89 61 Z" fill="#FF6347"/>
        <Path d="M 11 45 L 1 45" stroke="#FF6347" strokeWidth="7" strokeLinecap="round"/>
        <Path d="M 89 45 L 99 45" stroke="#FF6347" strokeWidth="7" strokeLinecap="round"/>
      </Svg>
    ),
    notes: (
      <Svg width={size} height={size} viewBox="0 0 75 115">
        <Path d="M 37 15 Q 42 25, 37 35 Q 32 45, 37 55 Q 42 65, 37 75 Q 32 85, 37 95 Q 42 105, 37 110" stroke="#FFD700" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <Circle cx="37" cy="20" r="6" fill="#FFD700"/>
        <Circle cx="35" cy="17" r="2.5" fill="#1a1a1a"/>
        <Circle cx="35" cy="17" r="1" fill="#fff"/>
        <Path d="M 37 28 L 42 33" stroke="#FFD700" strokeWidth="4" strokeLinecap="round"/>
        <Path d="M 37 28 L 32 33" stroke="#FFD700" strokeWidth="4" strokeLinecap="round"/>
        <Path d="M 37 48 Q 42 53, 37 58" stroke="#FFD700" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <Path d="M 37 68 Q 32 73, 37 78" stroke="#FFD700" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <Path d="M 37 88 Q 42 93, 37 98" stroke="#FFD700" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <Ellipse cx="33" cy="22" rx="2.5" ry="2" fill="#FFB6C1" opacity="0.8"/>
      </Svg>
    ),
    reminders: (
      <Svg width={size} height={size} viewBox="0 0 100 95">
        <Ellipse cx="50" cy="50" rx="40" ry="30" fill="#FFB6C1"/>
        <Ellipse cx="50" cy="50" rx="32" ry="24" fill="#FFC0CB" opacity="0.8"/>
        <Circle cx="42" cy="45" r="3.5" fill="#1a1a1a"/>
        <Circle cx="58" cy="45" r="3.5" fill="#1a1a1a"/>
        <Circle cx="42" cy="45" r="1.5" fill="#fff"/>
        <Circle cx="58" cy="45" r="1.5" fill="#fff"/>
        <Path d="M 50 53 Q 48 57, 50 61" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <Ellipse cx="38" cy="42" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
        <Ellipse cx="62" cy="42" rx="3" ry="2.5" fill="#FFB6C1" opacity="0.8"/>
        <Path d="M 50 25 L 50 15 L 55 20 Z" fill="#FFD700"/>
        <Circle cx="50" cy="20" r="3" fill="#FFD700"/>
        <Circle cx="50" cy="20" r="1.5" fill="#FFA500"/>
      </Svg>
    ),
    chat: (
      <Svg width={size} height={size} viewBox="0 0 90 80">
        <Path d="M 45 70 Q 35 60, 25 65 Q 35 70, 45 75 Q 55 70, 65 65 Q 55 60, 45 70" fill="#FFB6C1" stroke="#FFC0CB" strokeWidth="2"/>
        <Ellipse cx="45" cy="50" rx="30" ry="20" fill="#FFB6C1"/>
        <Ellipse cx="45" cy="50" rx="25" ry="17" fill="#FFC0CB" opacity="0.8"/>
        <Circle cx="38" cy="47" r="3" fill="#1a1a1a"/>
        <Circle cx="52" cy="47" r="3" fill="#1a1a1a"/>
        <Circle cx="38" cy="47" r="1.5" fill="#fff"/>
        <Circle cx="52" cy="47" r="1.5" fill="#fff"/>
        <Path d="M 45 52 Q 43 56, 45 60" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <Ellipse cx="35" cy="45" rx="2.5" ry="2" fill="#FFB6C1" opacity="0.8"/>
        <Ellipse cx="55" cy="45" rx="2.5" ry="2" fill="#FFB6C1" opacity="0.8"/>
      </Svg>
    ),
  };

  return <View style={{ opacity }}>{icons[type] || icons.home}</View>;
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconType;

            if (route.name === 'Home') {
              iconType = 'home';
            } else if (route.name === 'Beats') {
              iconType = 'beats';
            } else if (route.name === 'Timer') {
              iconType = 'timer';
            } else if (route.name === 'Flashcards') {
              iconType = 'flashcards';
            } else if (route.name === 'Notes') {
              iconType = 'notes';
            } else if (route.name === 'Reminders') {
              iconType = 'reminders';
            } else if (route.name === 'Chat') {
              iconType = 'chat';
            }

            return <SeaCreatureIcon type={iconType} size={size} color={color} focused={focused} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#f8fafc',
          },
          headerTintColor: '#0f172a',
          headerTitleStyle: {
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Beats" component={BeatsScreen} />
        <Tab.Screen name="Timer" component={TimerScreen} />
        <Tab.Screen name="Flashcards" component={FlashcardsScreen} />
        <Tab.Screen name="Notes" component={NotesScreen} />
        <Tab.Screen name="Reminders" component={RemindersScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}