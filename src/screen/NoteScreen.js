import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Keyboard,
  StyleSheet,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../database/supabase";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

const NoteScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null); // Track the expanded note
  const [notes, setNotes] = useState([]);
  const [isStarred, setIsStarred] = useState(false);

  const saveNote = async () => {
    if (description.trim().length === 0 && title.trim().length === 0) return;

    const noteTitle = title.trim() === "" ? "Untitled" : title;
  
    try {
      const user = JSON.parse(await AsyncStorage.getItem("user"));
      const currentTime = new Date().toISOString(); // Lấy thời gian hiện tại
  
      const { data, error } = await supabase
        .from("note")
        .insert([
          {
            Title: noteTitle,
            Description: description,
            AccID: user.AccID,
            Starred: isStarred,
            CreatedAt: currentTime, // Thêm thời gian
          },
        ]);
  
      if (error) {
        console.error("Error saving note to Supabase:", error);
        return;
      }
  
      console.log("Note saved");
      loadNotes();
      setTitle("");
      setDescription("");
      setIsStarred(false);
      setModalVisible(false);
      Keyboard.dismiss();
    } catch (e) {
      console.log("Error saving note:", e);
    }
  };
  

  const loadNotes = async () => {
    try {
      const user = JSON.parse(await AsyncStorage.getItem("user"));
      const { data, error } = await supabase
        .from("note")
        .select("*") // Đảm bảo lấy tất cả các cột, bao gồm CreatedAt
        .eq("AccID", user.AccID)
        .order("Starred", { ascending: false })
        .order("NoteID", { ascending: false });
  
      if (error) {
        console.error("Error loading notes from Supabase:", error);
        return;
      }
  
      setNotes(data || []);
    } catch (e) {
      console.log("Error loading notes:", e);
    }
  };
  

  const toggleStar = async (noteId, currentStarred) => {
    try {
      const { error } = await supabase
        .from("note")
        .update({ Starred: !currentStarred })
        .eq("NoteID", noteId);

      if (error) {
        console.error("Error toggling star:", error);
        return;
      }

      loadNotes();
    } catch (e) {
      console.log("Error toggling star:", e);
    }
  };

  const checkStar = async () => {
    if(isStarred == true) setIsStarred(false);
    else setIsStarred(true);
  };

  const deleteNote = async (noteId) => {
    try {
      const { error } = await supabase
        .from("note")
        .delete()
        .eq("NoteID", noteId);

      if (error) {
        console.error("Error deleting note from Supabase:", error);
        return;
      }

      setExpandedNoteId(null); // Reset expanded state
      loadNotes();
    } catch (e) {
      console.log("Error deleting note:", e);
    }
  };

const editNote = async () => {
  if (!selectedNote) return;
  if (title.trim().length === 0 && description.trim().length === 0) {
    return;
  }

  const noteTitle = title.trim() === "" ? "Untitled" : title;

  try {
    const { error } = await supabase
      .from("note")
      .update({
        Title: noteTitle, 
        Description: description.trim(), 
      })
      .eq("NoteID", selectedNote.NoteID); 

    if (error) {
      console.error("Error updating note:", error);
      return;
    }

    console.log("Note updated");
    setEditModalVisible(false);
    setSelectedNote(null); 
    setTitle("");
    setDescription(""); 
    loadNotes();
  } catch (e) {
    console.log("Error editing note:", e);
  }
};

  const handleNotePress = (noteId) => {
    setExpandedNoteId((prevId) => (prevId === noteId ? null : noteId)); // Toggle expansion
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const confirmDeleteNote = (noteId) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNote(noteId), // Gọi hàm xóa note
        },
      ]
    );
  };




  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.headerText}>Duck Notes</Text>
        <TouchableOpacity style={styles.PlusIcon} onPress={() => setModalVisible(true)}>
          <Icon name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Add Note Modal */}
      <Modal
        style={styles.Modal}
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          Keyboard.dismiss();
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalView}>
            <Pressable onPress={() => {}} style={styles.modalContent}>
              <View style={{ flexDirection: "row", justifyContent: "space-between"}}>
              <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", flex: 1, paddingLeft: "7%" }}>New Note</Text>
              <TouchableOpacity onPress={() => checkStar()}>
                <FontAwesome name={isStarred ? "star" : "star-o"} size={24} color="#f7ca02" flex={1} />
              </TouchableOpacity>
              </View>

              <View style={styles.inputTitle}>
                <TextInput
                  placeholder="Enter title..."
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputDescription}>
                <TextInput
                  placeholder="Enter description..."
                  value={description}
                  onChangeText={setDescription}
                  style={styles.input}
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
                <Text style={styles.saveButtonText}>Save Note</Text>
              </TouchableOpacity>
              
            </Pressable>
          </View>
        </Pressable>
      </Modal>


        

      <View style={styles.listview}>
        {notes.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 21, color: "#636e72" }}>Seem you don't have any note.</Text>
            <Text style={{ fontSize: 21, color: "#636e72" }}>Let's start by clicking on "+".</Text>
          </View>
        ) : (
          <FlatList
            style={{ flex: 0.5 }}
            data={notes}
            keyExtractor={(item) => item.NoteID.toString()}
            renderItem={({ item }) => (
              <View>
                <TouchableOpacity onPress={() => handleNotePress(item.NoteID)}>
                  <View style={styles.noteItem}>
                    <View style={styles.noteTextContainer}>
                      <Text style={styles.noteTitle}>{item.Title}</Text>
                      <Text style={styles.noteDescription}>{item.Description}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleStar(item.NoteID, item.Starred)}>
                      <FontAwesome name={item.Starred ? "star" : "star-o"} size={24} color="#f7ca02" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                {expandedNoteId === item.NoteID && (
                  <View style={styles.noteExpanded}>
                    <Text style={styles.noteTime}>
                      {new Date(item.CreatedAt).toLocaleDateString("vi-VN")}{" "}
                      {new Date(item.CreatedAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <View style={styles.noteActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedNote(item);
                          setTitle(item.Title);
                          setDescription(item.Description);
                          setEditModalVisible(true);
                        }}
                      >
                        <FontAwesome name="edit" size={20} color="#4CAF50" style={{ marginRight: 15 }} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDeleteNote(item.NoteID)}>
                      <FontAwesome name="trash" size={20} color="#eb4d4b" />
                    </TouchableOpacity>
                    </View>
                  </View>
                )}

              </View>
            )}
          />
        )}
      </View>

{/* Edit Note Modal */}
<Modal
  style={styles.Modal}
  animationType="fade"
  transparent={true}
  visible={editModalVisible}
  onRequestClose={() => {
    setEditModalVisible(false);
    setSelectedNote(null);
    setTitle(""); // Clear the title
    setDescription(""); // Clear the description
  }}
>
  <Pressable
    style={styles.modalOverlay}
    onPress={() => {
      setEditModalVisible(false);
      setSelectedNote(null);
      setTitle(""); // Clear the title
      setDescription(""); // Clear the description
    }}
  >
    <View style={styles.modalView}>
      <Pressable onPress={() => {}} style={styles.modalContent}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Edit Your Note</Text>

        <View style={styles.inputTitle}>
          <TextInput
            placeholder="Edit title..."
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
        </View>

        <View style={styles.inputDescription}>
          <TextInput
            placeholder="Edit description..."
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={editNote}>
          <Text style={styles.saveChangesButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </Pressable>
    </View>
  </Pressable>
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  top: {
    justifyContent: "space-between",
    flexDirection: "row",
    flex: 0.14,
  },
  PlusIcon: {
    backgroundColor: "#FFEBCC",
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFC300",
    position: "absolute",
    bottom: 30,
    right: 0,
  },
  headerText: {
    alignSelf: "center",
    paddingTop: 5,
    paddingLeft: 10,
    color: "#000000",
    fontSize: 39,
    fontWeight: "bold",
    backgroundColor: "#fed97a",
    borderRadius: 20,
    width: 230,
    height: 70,
  },
  modalView: {
    margin: 20,
    width: 320,
    height: 320,
    borderWidth: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inputTitle: {
    marginTop: 16,
    paddingLeft: 8,
    width: 250,
    height: 45,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  inputDescription: {
    marginTop: 16, 
    paddingLeft: 8,
    width: 250,
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  input: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#FEDB81",
    marginTop: 16,
    padding: 16,
    borderRadius: 35,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 21,
  },
  saveChangesButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
  },
  noteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    marginTop: 10,
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    borderColor: "#000000",
    borderWidth: 1,
  },
  noteTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noteDescription: {
    fontSize: 14,
    color: "#636e72",
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",

  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    height: 320,
    borderRadius: 10,
    alignItems: 'center',
  },
  listview: {
    flex: 0.75,
  },
  noteExpanded: {
    alignItems:'center',
    justifyContent:'space-between',
    flexDirection:'row',
    borderRadius: 10,
    paddingTop:5,
    paddingHorizontal:10,

  },
  noteTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  
});

export default NoteScreen;
