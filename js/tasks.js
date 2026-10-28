import { db } from "./firebase.js";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

function tasksCollection(userId) {
  return collection(db, "users", userId, "tasks");
}

function toDueDate(value) {
  return value ? Timestamp.fromDate(new Date(`${value}T00:00:00`)) : null;
}

export function createTask(userId, task) {
  return addDoc(tasksCollection(userId), {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: toDueDate(task.dueDate),
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToTasks(userId, onChange, onError) {
  const tasksQuery = query(tasksCollection(userId), orderBy("createdAt", "desc"));

  return onSnapshot(
    tasksQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((task) => ({ id: task.id, ...task.data() })));
    },
    onError,
  );
}

export function updateTask(userId, taskId, task) {
  return updateDoc(doc(db, "users", userId, "tasks", taskId), {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: toDueDate(task.dueDate),
    updatedAt: serverTimestamp(),
  });
}

export function setTaskCompleted(userId, taskId, completed) {
  return updateDoc(doc(db, "users", userId, "tasks", taskId), {
    completed,
    updatedAt: serverTimestamp(),
  });
}

export function removeTask(userId, taskId) {
  return deleteDoc(doc(db, "users", userId, "tasks", taskId));
}
