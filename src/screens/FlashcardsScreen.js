import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const FlashcardsScreen = () => {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyStats, setStudyStats] = useState({ correct: 0, total: 0 });
  const [flipAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const saved = await AsyncStorage.getItem('neurosync_decks');
      if (saved) {
        setDecks(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading decks:', error);
    }
  };

  const saveDecks = async (newDecks) => {
    try {
      await AsyncStorage.setItem('neurosync_decks', JSON.stringify(newDecks));
      setDecks(newDecks);
    } catch (error) {
      console.error('Error saving decks:', error);
    }
  };

  const createDeck = () => {
    Alert.prompt(
      'New Deck',
      'Enter deck name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (name) => {
            if (name && name.trim()) {
              const newDeck = {
                id: Date.now().toString(),
                name: name.trim(),
                cards: [],
                createdAt: new Date().toISOString(),
              };
              const updated = [...decks, newDeck];
              saveDecks(updated);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const addCard = () => {
    if (!selectedDeck) {
      Alert.alert('Select a deck first');
      return;
    }

    Alert.prompt(
      'Add Card',
      'Enter question:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (question) => {
            if (question && question.trim()) {
              Alert.prompt(
                'Add Card',
                'Enter answer:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Add',
                    onPress: (answer) => {
                      if (answer && answer.trim()) {
                        const newCard = {
                          id: Date.now().toString(),
                          question: question.trim(),
                          answer: answer.trim(),
                        };
                        
                        const updatedDecks = decks.map(deck => 
                          deck.id === selectedDeck.id 
                            ? { ...deck, cards: [...deck.cards, newCard] }
                            : deck
                        );
                        
                        saveDecks(updatedDecks);
                        setSelectedDeck({...selectedDeck, cards: [...selectedDeck.cards, newCard]});
                      }
                    },
                  },
                ],
                'plain-text'
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const startStudy = () => {
    if (!selectedDeck || selectedDeck.cards.length === 0) {
      Alert.alert('No cards', 'Add some cards to this deck first');
      return;
    }
    
    setStudyMode(true);
    setCurrentCard(0);
    setShowAnswer(false);
    setStudyStats({ correct: 0, total: 0 });
  };

  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: showAnswer ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowAnswer(!showAnswer);
  };

  const handleAnswer = (correct) => {
    const newStats = {
      correct: studyStats.correct + (correct ? 1 : 0),
      total: studyStats.total + 1,
    };
    setStudyStats(newStats);

    if (currentCard < selectedDeck.cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
      flipAnimation.setValue(0);
    } else {
      // Study session complete
      Alert.alert(
        'Study Complete!',
        `You got ${newStats.correct}/${newStats.total} correct (${Math.round((newStats.correct / newStats.total) * 100)}%)`,
        [
          {
            text: 'Study Again',
            onPress: () => {
              setCurrentCard(0);
              setShowAnswer(false);
              setStudyStats({ correct: 0, total: 0 });
              flipAnimation.setValue(0);
            },
          },
          {
            text: 'Done',
            onPress: () => setStudyMode(false),
          },
        ]
      );
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (studyMode && selectedDeck) {
    const card = selectedDeck.cards[currentCard];
    
    return (
      <View style={styles.studyContainer}>
        <View style={styles.studyHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setStudyMode(false)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.studyTitle}>
            {currentCard + 1} of {selectedDeck.cards.length}
          </Text>
          <View style={styles.studyStats}>
            <Text style={styles.statsText}>
              {studyStats.correct}/{studyStats.total}
            </Text>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={flipCard}>
            <Animated.View
              style={[
                styles.cardFace,
                styles.cardFront,
                { transform: [{ rotateY: frontInterpolate }] },
              ]}
            >
              <Text style={styles.cardText}>{card.question}</Text>
              <Text style={styles.cardHint}>Tap to reveal answer</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.cardFace,
                styles.cardBack,
                { transform: [{ rotateY: backInterpolate }] },
              ]}
            >
              <Text style={styles.cardText}>{card.answer}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {showAnswer && (
          <View style={styles.answerButtons}>
            <TouchableOpacity
              style={[styles.answerButton, styles.wrongButton]}
              onPress={() => handleAnswer(false)}
            >
              <Text style={styles.answerButtonText}>Wrong</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.answerButton, styles.correctButton]}
              onPress={() => handleAnswer(true)}
            >
              <Text style={styles.answerButtonText}>Correct</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flashcards</Text>
        <TouchableOpacity style={styles.createButton} onPress={createDeck}>
          <Text style={styles.createButtonText}>+ New Deck</Text>
        </TouchableOpacity>
      </View>

      {decks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No decks yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first deck to start studying
          </Text>
        </View>
      ) : (
        <View style={styles.decksList}>
          {decks.map((deck) => (
            <TouchableOpacity
              key={deck.id}
              style={[
                styles.deckCard,
                selectedDeck?.id === deck.id && styles.selectedDeckCard,
              ]}
              onPress={() => setSelectedDeck(deck)}
            >
              <View style={styles.deckHeader}>
                <Text style={styles.deckName}>{deck.name}</Text>
                <Text style={styles.deckCards}>{deck.cards.length} cards</Text>
              </View>
              
              {selectedDeck?.id === deck.id && (
                <View style={styles.deckActions}>
                  <TouchableOpacity style={styles.addCardButton} onPress={addCard}>
                    <Text style={styles.addCardButtonText}>+ Add Card</Text>
                  </TouchableOpacity>
                  
                  {deck.cards.length > 0 && (
                    <TouchableOpacity style={styles.studyButton} onPress={startStudy}>
                      <LinearGradient
                        colors={['#2563eb', '#1d4ed8']}
                        style={styles.studyGradient}
                      >
                        <Text style={styles.studyButtonText}>Study</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  decksList: {
    padding: 20,
  },
  deckCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDeckCard: {
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  deckCards: {
    fontSize: 14,
    color: '#64748b',
  },
  deckActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addCardButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addCardButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  studyButton: {
    flex: 1,
  },
  studyGradient: {
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  studyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  studyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
  },
  studyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  studyStats: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardFront: {
    backgroundColor: '#2563eb',
  },
  cardBack: {
    backgroundColor: '#10b981',
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  cardHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  answerButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  wrongButton: {
    backgroundColor: '#ef4444',
  },
  correctButton: {
    backgroundColor: '#10b981',
  },
  answerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FlashcardsScreen;


