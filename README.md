# Neurosync - Study Better App

A comprehensive study app with neuroscience-based tools for enhanced learning and focus.

## Features

### 🧠 Binaural Beats
- Generate focus-enhancing audio with different brainwave frequencies
- Gamma, Beta, Alpha, Theta, and Delta wave options
- Customizable base frequency settings

### ⏰ Focus Timer
- Pomodoro-style study sessions
- Lock-in mode with beautiful backgrounds
- Session tracking and streak management

### 📚 Flashcards
- Education Perfect-style interface
- Create and manage card decks
- Interactive study mode with flip animations
- Progress tracking

### 📝 Digital Notes
- Apple Pencil support for handwritten notes
- Multiple notebooks organization
- Text and drawing capabilities
- Cloud sync ready

### 🔔 Smart Reminders
- Study session notifications
- Customizable reminder settings
- Daily/weekly repeat options

### 🤖 AI Study Advisor
- OpenAI-powered study tips
- Neuroscience-based advice
- Focus and memory optimization

### 📊 Progress Tracking
- Daily study streaks
- Weekly activity visualization
- Goal setting and achievement

## Getting Started

### Prerequisites
- Node.js 16+
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

## Configuration

### OpenAI API (for AI Advisor)
1. Get your API key from OpenAI
2. Enter it in the Chat section
3. Select your preferred model

### Notifications
The app will request notification permissions for reminders and study alerts.

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **React Navigation** - Navigation between screens
- **Expo Notifications** - Push notifications
- **AsyncStorage** - Local data persistence
- **React Native Skia** - Canvas drawing for notes
- **Expo Linear Gradient** - Beautiful gradients
- **Expo AV** - Audio for binaural beats

## Project Structure

```
src/
├── screens/
│   ├── HomeScreen.js          # Dashboard with streaks and quick actions
│   ├── BeatsScreen.js         # Binaural beats generator
│   ├── TimerScreen.js         # Focus timer with lock-in mode
│   ├── FlashcardsScreen.js    # Education Perfect-style flashcards
│   ├── NotesScreen.js         # Apple Pencil note-taking
│   ├── RemindersScreen.js     # Study reminders and notifications
│   └── ChatScreen.js          # AI study advisor
├── components/                 # Reusable UI components
├── utils/                     # Helper functions
└── constants/                 # App constants and themes
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues tab.


