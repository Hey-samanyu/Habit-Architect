// Credentials for Habit Architect
const SUPABASE_URL = 'https://isfqdvhtqeuyywwmyvpx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnFkdmh0cWV1eXl3d215dnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTE2OTEsImV4cCI6MjA3ODYyNzY5MX0.pvTd1KYakHfWUMrVmPyZ-XVZC2OlYX3Ueq9n3ns7jII';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Management
let currentUserId = null;
let currentMode = 'login'; // 'login' or 'signup'

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const nameField = document.getElementById('name-field');
const authSubmit = document.getElementById('auth-submit');
const syncStatus = document.getElementById('sync-indicator');
const habitList = document.getElementById('habit-list');

// Init
async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    currentUserId = session.user.id;
    showScreen('main');
    fetchHabits();
  } else {
    showScreen('auth');
  }
}

function showScreen(screen) {
  if (screen === 'auth') {
    authScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
  } else {
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
  }
}

// Tab Switching Logic
document.getElementById('tab-login').onclick = function() {
  currentMode = 'login';
  this.classList.add('active');
  document.getElementById('tab-signup').classList.remove('active');
  nameField.classList.add('hidden');
  authSubmit.innerText = 'SECURE ACCESS';
  authError.classList.add('hidden');
};

document.getElementById('tab-signup').onclick = function() {
  currentMode = 'signup';
  this.classList.add('active');
  document.getElementById('tab-login').classList.remove('active');
  nameField.classList.remove('hidden');
  authSubmit.innerText = 'ESTABLISH ACCOUNT';
  authError.classList.add('hidden');
};

// Auth Form Submission
authForm.onsubmit = async (e) => {
  e.preventDefault();
  authError.classList.add('hidden');
  authSubmit.disabled = true;
  authSubmit.innerText = 'PROCESSING...';

  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value;

  try {
    if (currentMode === 'signup') {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) throw error;
      if (data.user) {
        currentUserId = data.user.id;
        showScreen('main');
        fetchHabits();
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.user) {
        currentUserId = data.user.id;
        showScreen('main');
        fetchHabits();
      }
    }
  } catch (err) {
    authError.innerText = err.message;
    authError.classList.remove('hidden');
    authSubmit.innerText = currentMode === 'login' ? 'SECURE ACCESS' : 'ESTABLISH ACCOUNT';
  } finally {
    authSubmit.disabled = false;
  }
};

// Data Management
async function fetchHabits() {
  syncStatus.innerText = 'FETCHING...';
  
  try {
    const { data, error } = await supabaseClient
      .from('user_data')
      .select('content')
      .eq('user_id', currentUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      habitList.innerHTML = '<div class="loading">No data found. Open web dashboard to start.</div>';
      syncStatus.innerText = 'EMPTY';
      return;
    }

    const state = data.content;
    const today = new Date().toISOString().split('T')[0];
    const todayLog = state.logs[today] || { completedHabitIds: [] };

    renderHabits(state.habits, todayLog.completedHabitIds);
    syncStatus.innerText = 'SYNCED';
  } catch (err) {
    console.error(err);
    habitList.innerHTML = '<div class="loading">Sync Error. Please try again later.</div>';
    syncStatus.innerText = 'ERROR';
  }
}

function renderHabits(habits, completedIds) {
  habitList.innerHTML = '';

  const dailyHabits = (habits || []).filter(h => h.frequency === 'Daily');

  if (dailyHabits.length === 0) {
    habitList.innerHTML = '<div class="loading">No daily habits found.</div>';
    return;
  }

  dailyHabits.forEach(habit => {
    const isDone = completedIds.includes(habit.id);
    const item = document.createElement('div');
    item.className = `habit-item ${isDone ? 'completed' : ''}`;
    
    item.innerHTML = `
      <button class="check-btn" data-id="${habit.id}">
        ${isDone ? '✓' : ''}
      </button>
      <div class="habit-title">${habit.title}</div>
    `;

    const btn = item.querySelector('.check-btn');
    btn.onclick = () => toggleHabit(habit.id);

    habitList.appendChild(item);
  });
}

async function toggleHabit(id) {
  syncStatus.innerText = 'UPDATING...';

  try {
    const { data } = await supabaseClient
      .from('user_data')
      .select('content')
      .eq('user_id', currentUserId)
      .single();

    const state = data.content;
    const today = new Date().toISOString().split('T')[0];
    const todayLog = state.logs[today] || { date: today, completedHabitIds: [], goalProgress: {} };
    
    const isCompleted = todayLog.completedHabitIds.includes(id);
    
    if (isCompleted) {
      todayLog.completedHabitIds = todayLog.completedHabitIds.filter(hid => hid !== id);
      state.habits = state.habits.map(h => h.id === id ? { ...h, streak: Math.max(0, h.streak - 1) } : h);
    } else {
      todayLog.completedHabitIds.push(id);
      state.habits = state.habits.map(h => h.id === id ? { ...h, streak: h.streak + 1 } : h);
    }
    
    state.logs[today] = todayLog;

    await supabaseClient
      .from('user_data')
      .update({ content: state, updated_at: new Date().toISOString() })
      .eq('user_id', currentUserId);

    renderHabits(state.habits, todayLog.completedHabitIds);
    syncStatus.innerText = 'SAVED';
  } catch (err) {
    console.error(err);
    syncStatus.innerText = 'ERROR';
    setTimeout(fetchHabits, 2000); // Retry fetching if error
  }
}

// Utilities
document.getElementById('logout-btn').onclick = async () => {
  await supabaseClient.auth.signOut();
  currentUserId = null;
  showScreen('auth');
};

document.getElementById('open-web').onclick = () => {
  window.open('https://habit.samanyukots.online', '_blank');
};

init();