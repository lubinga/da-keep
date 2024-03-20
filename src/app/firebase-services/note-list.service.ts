import { Injectable, inject } from '@angular/core';
import { Note } from '../interfaces/note.interface'
import {
  Firestore, collection, doc, collectionData,
  onSnapshot, addDoc, updateDoc, deleteDoc, query, limit, orderBy, where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {

  trashNotes: Note[] = [];
  normalNotes: Note[] = [];
  normalMarkedNotes: Note[] = [];

  unsubTrash;
  unsubNotes;
  unsubMarkedNotes;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubNotes = this.subNotesList();
    this.unsubMarkedNotes = this.subMarkedNotesList();
    this.unsubTrash = this.subTrashList();
  }

  async deleteNote(colId: "notes" | "trash", docId: string) {
    await deleteDoc(this.getSingleDoc(colId, docId)).catch(
      (err) => { console.error(err) }
    );
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getColIdFromNote(note);
      await updateDoc(this.getSingleDoc(docRef, note.id), this.getCleanJson(note)).catch(
        (err) => {
          console.error(err);
        }
      );
    }
  }

  getCleanJson(note: Note): {} {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked
    }
  }

  getColIdFromNote(note: Note) {
    if (note.type == 'note') {
      return 'notes'
    } else {
      return 'trash'
    }
  }

  async addNote(item: Note, colId: "notes" | "trash") {
    await addDoc(this.getCollection(colId), item).catch(
      (err) => { console.error(err) }
    ).then(
      (docRef) => { console.log("Document written with the ID: ", docRef?.id); }
    )
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach(element => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subNotesList() {
    const q = query(this.getNotesRef(), orderBy("title"), limit(100));
    return onSnapshot(q, (list) => {
      this.normalNotes = [];
      list.forEach(element => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
      list.docChanges().forEach((change) => {
        if(change.type === "added"){
          console.log("New note: ", change.doc.data());          
        }
        if(change.type === "modified"){
          console.log("Modified note: ", change.doc.data());          
        }
        if(change.type === "removed"){
          console.log("Removed note: ", change.doc.data());          
        }
      });
    });
  }

  subMarkedNotesList() {
    const q = query(this.getNotesRef(), where("marked", "==", true), orderBy("title"), limit(100));
    return onSnapshot(q, (list) => {
      this.normalMarkedNotes = [];
      list.forEach(element => {
        this.normalMarkedNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubNotes();
    this.unsubMarkedNotes();
    this.unsubTrash();
  }

  getCollection(colId: String) {
    if (colId === 'notes') {
      return collection(this.firestore, 'notes');
    } else {
      return collection(this.firestore, 'trash');
    }
  }

  getNotesRef() {
    return collection(this.firestore, 'notes');
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getSingleDoc(colId: string, docId: string) {
    return doc(this.firestore, colId, docId);
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id || "",
      type: obj.type || "note",
      title: obj.title || "",
      content: obj.content || "",
      marked: obj.marked || false
    }
  }
}
