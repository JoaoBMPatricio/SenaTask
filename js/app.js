import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  createTask, removeTask, setTaskCompleted, subscribeToTasks, updateTask,
} from "./tasks.js";

const $ = (selector) => document.querySelector(selector);
const loginSection = $("#login-form").closest(".auth-card");
const registerSection = $("#register-section");
const tasksSection = $("#tasks-section");
const loginForm = $("#login-form");
const registerForm = $("#register-form");
const taskForm = $("#task-form");
const tasksList = $("#tasks-list");
const feedback = $("#feedback");
const formTitle = $("#task-form-title");
const submitTask = $("#task-submit-button");
const cancelEdit = $("#cancel-edit-button");
const filters = $("#task-filters");
const logoutButton = $("#logout-button");
let activeUser = null;
let unsubscribeTasks = null;
let tasks = [];
let filter = "all";
let editingId = null;

function notify(message, type = "success") {
  feedback.textContent = message;
  feedback.dataset.type = type;
}
function clearFeedback() {
  feedback.textContent = "";
  delete feedback.dataset.type;
}
function showScreen(screen) {
  loginSection.hidden = screen !== "login";
  registerSection.hidden = screen !== "register";
  tasksSection.hidden = screen !== "tasks";
}
function authError(error) {
  return {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  }[error.code] ?? "Não foi possível concluir a operação. Tente novamente.";
}
function taskData() {
  return {
    title: taskForm.elements.title.value.trim(),
    description: taskForm.elements.description.value.trim(),
    priority: taskForm.elements.priority.value,
    dueDate: taskForm.elements.dueDate.value,
  };
}
function resetTaskForm() {
  editingId = null;
  taskForm.reset();
  formTitle.textContent = "Nova tarefa";
  submitTask.textContent = "Adicionar tarefa";
  cancelEdit.hidden = true;
}
function formatDate(timestamp) {
  return timestamp?.toDate
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(timestamp.toDate())
    : "";
}
function renderTasks() {
  const visible = tasks.filter((task) =>
    filter === "all" || (filter === "completed" ? task.completed : !task.completed)
  );
  tasksList.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = tasks.length
      ? "Nenhuma tarefa corresponde a este filtro."
      : "Você ainda não tem tarefas. Adicione a primeira acima.";
    tasksList.append(empty);
    return;
  }
  const list = document.createElement("ul");
  list.className = "task-list";
  visible.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item";
    item.dataset.taskId = task.id;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", `Marcar ${task.title} como concluída`);
    const content = document.createElement("div");
    content.className = "task-content";
    const title = document.createElement("h3");
    title.textContent = task.title;
    title.classList.toggle("completed", Boolean(task.completed));
    content.append(title);
    if (task.description) {
      const description = document.createElement("p");
      description.textContent = task.description;
      content.append(description);
    }
    const metadata = document.createElement("div");
    metadata.className = "task-metadata";
    const priority = document.createElement("span");
    priority.className = `priority priority-${task.priority || "medium"}`;
    priority.textContent = `Prioridade: ${task.priority || "medium"}`;
    metadata.append(priority);
    const dueDate = formatDate(task.dueDate);
    if (dueDate) {
      const due = document.createElement("span");
      due.textContent = `Vence em: ${dueDate}`;
      metadata.append(due);
    }
    content.append(metadata);
    const actions = document.createElement("div");
    actions.className = "task-actions";
    [["Editar", "edit"], ["Excluir", "delete"]].forEach(([label, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.action = action;
      button.className = action === "delete" ? "button-danger" : "button-secondary";
      actions.append(button);
    });
    item.append(checkbox, content, actions);
    list.append(item);
  });
  tasksList.append(list);
}
function watchTasks(user) {
  unsubscribeTasks?.();
  tasks = [];
  renderTasks();
  notify("Carregando tarefas...");
  unsubscribeTasks = subscribeToTasks(user.uid, (updatedTasks) => {
    tasks = updatedTasks;
    renderTasks();
    clearFeedback();
  }, (error) => {
    console.error("Erro ao carregar tarefas:", error);
    notify("Não foi possível carregar as tarefas.", "error");
  });
}

$("#show-register").addEventListener("click", (event) => {
  event.preventDefault(); clearFeedback(); showScreen("register");
});
$("#show-login").addEventListener("click", (event) => {
  event.preventDefault(); clearFeedback(); showScreen("login");
});
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = registerForm.elements.password.value;
  if (password !== registerForm.elements["password-confirm"].value) {
    notify("As senhas não coincidem.", "error"); return;
  }
  try {
    await createUserWithEmailAndPassword(auth, registerForm.elements.email.value.trim(), password);
    registerForm.reset();
  } catch (error) {
    console.error("Erro no cadastro:", error); notify(authError(error), "error");
  }
});
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, loginForm.elements.email.value.trim(), loginForm.elements.password.value);
    loginForm.reset();
  } catch (error) {
    console.error("Erro no login:", error); notify(authError(error), "error");
  }
});
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try { await signOut(auth); }
  catch (error) { console.error("Erro ao sair:", error); notify("Não foi possível sair.", "error"); }
  finally { logoutButton.disabled = false; }
});
taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeUser) return;
  const data = taskData();
  if (!data.title) { notify("Informe o título da tarefa.", "error"); return; }
  submitTask.disabled = true;
  try {
    if (editingId) {
      await updateTask(activeUser.uid, editingId, data);
      notify("Tarefa atualizada.");
    } else {
      await createTask(activeUser.uid, data);
      notify("Tarefa adicionada.");
    }
    resetTaskForm();
  } catch (error) {
    console.error("Erro ao salvar tarefa:", error); notify("Não foi possível salvar a tarefa.", "error");
  } finally { submitTask.disabled = false; }
});
cancelEdit.addEventListener("click", resetTaskForm);
filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  renderTasks();
});
tasksList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || !activeUser) return;
  const taskId = button.closest("[data-task-id]").dataset.taskId;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (button.dataset.action === "edit") {
    editingId = task.id;
    taskForm.elements.title.value = task.title;
    taskForm.elements.description.value = task.description || "";
    taskForm.elements.priority.value = task.priority || "medium";
    taskForm.elements.dueDate.value = task.dueDate?.toDate ? task.dueDate.toDate().toISOString().slice(0, 10) : "";
    formTitle.textContent = "Editar tarefa";
    submitTask.textContent = "Salvar alterações";
    cancelEdit.hidden = false;
    taskForm.elements.title.focus();
  } else if (button.dataset.action === "delete" && window.confirm(`Excluir a tarefa “${task.title}”? `)) {
    try {
      await removeTask(activeUser.uid, task.id);
      if (editingId === task.id) resetTaskForm();
      notify("Tarefa excluída.");
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error); notify("Não foi possível excluir a tarefa.", "error");
    }
  }
});
tasksList.addEventListener("change", async (event) => {
  if (!event.target.matches('input[data-action="toggle"]') || !activeUser) return;
  const taskId = event.target.closest("[data-task-id]").dataset.taskId;
  try {
    await setTaskCompleted(activeUser.uid, taskId, event.target.checked);
    notify(event.target.checked ? "Tarefa concluída." : "Tarefa reaberta.");
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    event.target.checked = !event.target.checked;
    notify("Não foi possível atualizar a tarefa.", "error");
  }
});
onAuthStateChanged(auth, (user) => {
  clearFeedback();
  activeUser = user;
  if (user) { showScreen("tasks"); watchTasks(user); }
  else {
    unsubscribeTasks?.(); unsubscribeTasks = null; tasks = [];
    resetTaskForm(); showScreen("login");
  }
});
