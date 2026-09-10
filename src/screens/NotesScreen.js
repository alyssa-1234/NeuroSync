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
} from 'react-native';
import { Canvas, Path, Skia } from 'react-native-skia';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const NotesScreen = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    try {
      const saved = await AsyncStorage.getItem('neurosync_notebooks');
      if (saved) {
        setNotebooks(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notebooks:', error);
    }
  };

  const saveNotebooks = async (newNotebooks) => {
    try {
      await AsyncStorage.setItem('neurosync_notebooks', JSON.stringify(newNotebooks));
      setNotebooks(newNotebooks);
    } catch (error) {
      console.error('Error saving notebooks:', error);
    }
  };

  const createNotebook = () => {
    Alert.prompt(
      'New Notebook',
      'Enter notebook name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (name) => {
            if (name && name.trim()) {
              const newNotebook = {
                id: Date.now().toString(),
                name: name.trim(),
                createdAt: new Date().toISOString(),
                notes: [],
              };
              const updated = [...notebooks, newNotebook];
              saveNotebooks(updated);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const createNote = () => {
    if (!selectedNotebook) {
      Alert.alert('Select a notebook first');
      return;
    }

    Alert.prompt(
      'New Note',
      'Enter note title:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (title) => {
            if (title && title.trim()) {
              const newNote = {
                id: Date.now().toString(),
                title: title.trim(),
                content: '',
                drawings: [],
                createdAt: new Date().toISOString(),
              };
              
              const updatedNotebooks = notebooks.map(nb => 
                nb.id === selectedNotebook.id 
                  ? { ...nb, notes: [...nb.notes, newNote] }
                  : nb
              );
              
              saveNotebooks(updatedNotebooks);
              setNotes([...notes, newNote]);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const startDrawing = (event) => {
    setIsDrawing(true);
    const newPath = {
      id: Date.now().toString(),
      points: [{ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }],
      color: '#000000',
      strokeWidth: 2,
    };
    setPaths([...paths, newPath]);
  };

  const continueDrawing = (event) => {
    if (!isDrawing) return;
    
    const newPoint = {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    };
    
    setPaths(prevPaths => {
      const updated = [...prevPaths];
      updated[updated.length - 1].points.push(newPoint);
      return updated;
    });
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setPaths([]);
  };

  const saveNote = async () => {
    if (!currentNote) return;
    
    const updatedNote = {
      ...currentNote,
      content: currentNote.content,
      drawings: paths,
    };
    
    const updatedNotebooks = notebooks.map(nb => 
      nb.id === selectedNotebook.id 
        ? { 
            ...nb, 
            notes: nb.notes.map(note => 
              note.id === currentNote.id ? updatedNote : note
            )
          }
        : nb
    );
    
    await saveNotebooks(updatedNotebooks);
    setCurrentNote(updatedNote);
  };

  if (selectedNotebook && currentNote) {
    return (
      <View style={styles.container}>
        <View style={styles.noteHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setCurrentNote(null);
              setPaths([]);
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.noteTitle}>{currentNote.title}</Text>
          <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteContent}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your notes here..."
            value={currentNote.content}
            onChangeText={(text) => setCurrentNote({...currentNote, content: text})}
            multiline
            textAlignVertical="top"
          />
          
          <View style={styles.canvasContainer}>
            <Canvas
              style={styles.canvas}
              onTouchStart={startDrawing}
              onTouchMove={continueDrawing}
              onTouchEnd={endDrawing}
            >
              {paths.map((path) => (
                <Path
                  key={path.id}
                  path={path.points.map((point, index) => 
                    index === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`
                  ).join(' ')}
                  color={path.color}
                  style="stroke"
                  strokeWidth={path.strokeWidth}
                />
              ))}
            </Canvas>
          </View>
        </View>

        <View style={styles.drawingControls}>
          <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital Notebooks</Text>
        <TouchableOpacity style={styles.createButton} onPress={createNotebook}>
          <Text style={styles.createButtonText}>+ New Notebook</Text>
        </TouchableOpacity>
      </View>

      {notebooks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No notebooks yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first notebook to start taking notes
          </Text>
        </View>
      ) : (
        <View style={styles.notebooksList}>
          {notebooks.map((notebook) => (
            <TouchableOpacity
              key={notebook.id}
              style={styles.notebookCard}
              onPress={() => {
                setSelectedNotebook(notebook);
                setNotes(notebook.notes);
              }}
            >
              <Text style={styles.notebookName}>{notebook.name}</Text>
              <Text style={styles.notebookNotes}>
                {notebook.notes.length} notes
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedNotebook && (
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>{selectedNotebook.name}</Text>
            <TouchableOpacity style={styles.addNoteButton} onPress={createNote}>
              <Text style={styles.addNoteButtonText}>+ Add Note</Text>
            </TouchableOpacity>
          </View>
          
          {notes.length === 0 ? (
            <Text style={styles.noNotes}>No notes in this notebook</Text>
          ) : (
            <View style={styles.notesList}>
              {notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  style={styles.noteCard}
                  onPress={() => {
                    setCurrentNote(note);
                    setPaths(note.drawings || []);
                  }}
                >
                  <Text style={styles.noteCardTitle}>{note.title}</Text>
                  <Text style={styles.noteCardDate}>
                    {new Date(note.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  notebooksList: {
    padding: 20,
  },
  notebookCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notebookName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  notebookNotes: {
    fontSize: 14,
    color: '#64748b',
  },
  notesSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  addNoteButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addNoteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noNotes: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
  notesList: {
    gap: 8,
  },
  noteCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  noteCardDate: {
    fontSize: 12,
    color: '#64748b',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noteContent: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  canvasContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  canvas: {
    flex: 1,
  },
  drawingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default NotesScreen;


