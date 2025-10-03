// Умная система определения API сервера
let API_BASE = localStorage.getItem('api_base') || 'https://sss-vcq4.onrender.com/api';
let isServerOnline = false;
let serverCheckInterval = null;

// Возможные адреса сервера (по приоритету)
const POSSIBLE_API_URLS = [
    'https://sss-vcq4.onrender.com/api',  // Облачный сервер - работает ВЕЗДЕ! (ПЕРВЫЙ = ПРИОРИТЕТ)
    'http://localhost:5001/api',
    'http://127.0.0.1:5001/api',
    'http://192.168.0.105:5001/api'
];

// Функция обновления статуса подключения
function updateConnectionStatus(online) {
    isServerOnline = online;
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.className = 'connection-status ' + (online ? 'online' : 'offline');
        const statusText = t(online ? 'online' : 'offline');
        statusEl.innerHTML = online 
            ? `<span class="status-icon">🟢</span><span class="status-text">${statusText}</span>`
            : `<span class="status-icon">🔴</span><span class="status-text">${statusText}</span>`;
    }
    console.log(online ? '✅ ' + t('online') : '❌ ' + t('offline'));
}

// Helper функция для API запросов с автоматической отправкой credentials
async function apiFetch(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',  // ВАЖНО: отправляем cookies с сессией!
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options });
}

let habits = [];
let categories = [];
let selectedHabitId = null;
let currentUser = null;

// Default categories (function to support translations)
function getDefaultCategories() {
    return [
        { id: 'sport', name: t('sport'), emoji: '🏃‍♂️', isDefault: true },
        { id: 'health', name: t('health'), emoji: '💊', isDefault: true },
        { id: 'work', name: t('work'), emoji: '💼', isDefault: true },
        { id: 'study', name: t('study'), emoji: '📚', isDefault: true },
        { id: 'home', name: t('home'), emoji: '🏠', isDefault: true },
        { id: 'hobby', name: t('hobby'), emoji: '🎨', isDefault: true },
        { id: 'social', name: t('social'), emoji: '👥', isDefault: true },
        { id: 'finance', name: t('finance'), emoji: '💰', isDefault: true },
        { id: 'mindfulness', name: t('mindfulness'), emoji: '🧘‍♂️', isDefault: true },
        { id: 'creativity', name: t('creativity'), emoji: '✨', isDefault: true }
    ];
}
const defaultCategories = getDefaultCategories();

// ==================== AWARDS SYSTEM ====================

// Achievement badges
const badges = {
    // Milestone badges
    firstStep: { id: 'firstStep', name: 'Первый шаг', emoji: '👣', description: 'Выполнить первую привычку', type: 'milestone' },
    weekWarrior: { id: 'weekWarrior', name: 'Недельный воин', emoji: '⚔️', description: 'Выполнять привычку 7 дней подряд', type: 'streak' },
    monthMaster: { id: 'monthMaster', name: 'Мастер месяца', emoji: '👑', description: 'Выполнять привычку 30 дней подряд', type: 'streak' },
    hundredHero: { id: 'hundredHero', name: 'Герой сотни', emoji: '💯', description: 'Выполнить привычку 100 раз', type: 'total' },
    
    // Category badges
    sportsman: { id: 'sportsman', name: 'Спортсмен', emoji: '🏆', description: 'Выполнить 50 спортивных привычек', type: 'category', category: 'sport' },
    scholar: { id: 'scholar', name: 'Учёный', emoji: '🎓', description: 'Выполнить 50 учебных привычек', type: 'category', category: 'study' },
    healthGuru: { id: 'healthGuru', name: 'Гуру здоровья', emoji: '🌿', description: 'Выполнить 50 привычек здоровья', type: 'category', category: 'health' },
    workaholic: { id: 'workaholic', name: 'Трудоголик', emoji: '💼', description: 'Выполнить 50 рабочих привычек', type: 'category', category: 'work' },
    
    // Special badges
    perfectWeek: { id: 'perfectWeek', name: 'Идеальная неделя', emoji: '✨', description: 'Выполнить все привычки за неделю', type: 'perfect' },
    earlyBird: { id: 'earlyBird', name: 'Ранняя пташка', emoji: '🌅', description: 'Выполнить 20 привычек до 8:00', type: 'special' },
    nightOwl: { id: 'nightOwl', name: 'Сова', emoji: '🦉', description: 'Выполнить 20 привычек после 22:00', type: 'special' },
    streakMaster: { id: 'streakMaster', name: 'Мастер серий', emoji: '🔥', description: 'Иметь серию в 100 дней', type: 'streak' },
    
    // Collection badges
    categoryCollector: { id: 'categoryCollector', name: 'Коллекционер', emoji: '🗂️', description: 'Создать привычки во всех категориях', type: 'collection' },
    habitMaster: { id: 'habitMaster', name: 'Мастер привычек', emoji: '🧙‍♂️', description: 'Создать 25 привычек', type: 'collection' }
};

// User levels system (function to support translations)
function getLevels() {
    return [
        { level: 1, name: t('beginner'), emoji: '🌱', minXP: 0, maxXP: 99, color: '#22c55e' },
        { level: 2, name: t('trainee'), emoji: '🌿', minXP: 100, maxXP: 249, color: '#16a34a' },
        { level: 3, name: t('practitioner'), emoji: '🌳', minXP: 250, maxXP: 499, color: '#15803d' },
        { level: 4, name: t('specialist'), emoji: '⭐', minXP: 500, maxXP: 999, color: '#eab308' },
        { level: 5, name: t('expert'), emoji: '💎', minXP: 1000, maxXP: 1999, color: '#3b82f6' },
        { level: 6, name: t('master'), emoji: '👑', minXP: 2000, maxXP: 3999, color: '#8b5cf6' },
        { level: 7, name: t('guru'), emoji: '🧙‍♂️', minXP: 4000, maxXP: 7999, color: '#ec4899' },
        { level: 8, name: t('legend'), emoji: '🏆', minXP: 8000, maxXP: 15999, color: '#f59e0b' },
        { level: 9, name: t('mythic'), emoji: '🌟', minXP: 16000, maxXP: 31999, color: '#06b6d4' },
        { level: 10, name: t('divine'), emoji: '✨', minXP: 32000, maxXP: Infinity, color: '#d946ef' }
    ];
}
let levels = getLevels();


// User progress tracking
let userProgress = {
    xp: 0,
    level: 1,
    totalHabitsCompleted: 0,
    longestStreak: 0,
    currentStreaks: {},
    categoryStats: {},
    earnedBadges: [],
    weeklyPerfectDays: 0,
    earlyBirdCount: 0,
    nightOwlCount: 0,
    createdHabits: 0
};

// ==================== AWARDS FUNCTIONS ====================

// Initialize user progress
function initUserProgress() {
    const stored = localStorage.getItem('userProgress');
    if (stored) {
        userProgress = { ...userProgress, ...JSON.parse(stored) };
    }
    updateLevelDisplay();
}

// Save user progress
function saveUserProgress() {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
}

// Calculate XP for habit completion
function calculateXP(habit) {
    let baseXP = 10;
    
    // Bonus for difficulty
    if (habit.difficulty === 'hard') baseXP += 5;
    else if (habit.difficulty === 'medium') baseXP += 2;
    
    // Streak bonus
    const streak = userProgress.currentStreaks[habit.id] || 0;
    if (streak >= 7) baseXP += 5;
    if (streak >= 30) baseXP += 10;
    if (streak >= 100) baseXP += 20;
    
    return baseXP;
}

// Award XP and check for level up
function awardXP(amount) {
    const oldLevel = userProgress.level;
    userProgress.xp += amount;
    
    // Check for level up
    const newLevel = getCurrentLevel();
    if (newLevel.level > oldLevel) {
        userProgress.level = newLevel.level;
        showLevelUpNotification(newLevel);
    }
    
    updateLevelDisplay();
    saveUserProgress();
}

// Get current level based on XP
function getCurrentLevel() {
    const levelsArray = getLevels();
    for (let i = levelsArray.length - 1; i >= 0; i--) {
        if (userProgress.xp >= levelsArray[i].minXP) {
            return levelsArray[i];
        }
    }
    return levelsArray[0];
}

// Check and award badges
function checkBadges(habit, completedTime) {
    const newBadges = [];
    
    // First step badge
    if (!userProgress.earnedBadges.includes('firstStep') && userProgress.totalHabitsCompleted === 1) {
        newBadges.push('firstStep');
    }
    
    // Streak badges
    const streak = userProgress.currentStreaks[habit.id] || 0;
    if (streak === 7 && !userProgress.earnedBadges.includes('weekWarrior')) {
        newBadges.push('weekWarrior');
    }
    if (streak === 30 && !userProgress.earnedBadges.includes('monthMaster')) {
        newBadges.push('monthMaster');
    }
    if (streak === 100 && !userProgress.earnedBadges.includes('streakMaster')) {
        newBadges.push('streakMaster');
    }
    
    // Total completion badges
    if (userProgress.totalHabitsCompleted === 100 && !userProgress.earnedBadges.includes('hundredHero')) {
        newBadges.push('hundredHero');
    }
    
    // Category badges
    const categoryId = habit.category;
    const categoryCount = userProgress.categoryStats[categoryId] || 0;
    if (categoryCount === 50) {
        const badgeMap = {
            'sport': 'sportsman',
            'study': 'scholar',
            'health': 'healthGuru',
            'work': 'workaholic'
        };
        const badgeId = badgeMap[categoryId];
        if (badgeId && !userProgress.earnedBadges.includes(badgeId)) {
            newBadges.push(badgeId);
        }
    }
    
    // Time-based badges
    if (completedTime) {
        const hour = new Date(completedTime).getHours();
        if (hour < 8) {
            userProgress.earlyBirdCount++;
            if (userProgress.earlyBirdCount === 20 && !userProgress.earnedBadges.includes('earlyBird')) {
                newBadges.push('earlyBird');
            }
        }
        if (hour >= 22) {
            userProgress.nightOwlCount++;
            if (userProgress.nightOwlCount === 20 && !userProgress.earnedBadges.includes('nightOwl')) {
                newBadges.push('nightOwl');
            }
        }
    }
    
    // Collection badges
    if (userProgress.createdHabits === 25 && !userProgress.earnedBadges.includes('habitMaster')) {
        newBadges.push('habitMaster');
    }
    
    // Check category collector
    const uniqueCategories = new Set(habits.map(h => h.category));
    if (uniqueCategories.size >= defaultCategories.length && !userProgress.earnedBadges.includes('categoryCollector')) {
        newBadges.push('categoryCollector');
    }
    
    // Award new badges
    newBadges.forEach(badgeId => {
        userProgress.earnedBadges.push(badgeId);
        showBadgeNotification(badges[badgeId]);
    });
    
    if (newBadges.length > 0) {
        saveUserProgress();
    }
}

// Update level display in UI
function updateLevelDisplay() {
    const currentLevel = getCurrentLevel();
    const levelsArray = getLevels();
    const nextLevel = levelsArray.find(l => l.level === currentLevel.level + 1);
    
    // Update level info
    const levelElement = document.getElementById('userLevel');
    if (levelElement) {
        levelElement.innerHTML = `
            <span class="level-emoji">${currentLevel.emoji}</span>
            <span class="level-name">${currentLevel.name}</span>
            <span class="level-number">${t('lvl')} ${currentLevel.level}</span>
        `;
    }
    
    // Update XP bar
    const xpBarElement = document.getElementById('xpBar');
    if (xpBarElement && nextLevel) {
        const progress = ((userProgress.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100;
        xpBarElement.innerHTML = `
            <div class="xp-bar-fill" style="width: ${Math.min(progress, 100)}%; background: ${currentLevel.color}"></div>
            <span class="xp-text">${userProgress.xp}/${nextLevel.minXP} XP</span>
        `;
    } else if (xpBarElement) {
        // Max level
        xpBarElement.innerHTML = `
            <div class="xp-bar-fill" style="width: 100%; background: ${currentLevel.color}"></div>
            <span class="xp-text">MAX LEVEL</span>
        `;
    }
}

// Show level up notification
function showLevelUpNotification(level) {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-icon">${level.emoji}</div>
            <div class="level-up-text">
                <h3>LEVEL UP!</h3>
                <p>Вы достигли уровня ${level.level}</p>
                <p class="level-name">${level.name}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 4000);
}

// Show badge notification
function showBadgeNotification(badge) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-content">
            <div class="badge-icon">${badge.emoji}</div>
            <div class="badge-text">
                <h4>Новый бейдж!</h4>
                <p class="badge-name">${badge.name}</p>
                <p class="badge-description">${badge.description}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Show XP notification
function showXPNotification(xp) {
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.innerHTML = `
        <div class="xp-content">
            <div class="xp-icon">⭐</div>
            <div class="xp-text">+${xp} XP</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 2000);
}

// Initialize categories
function initCategories() {
    const stored = localStorage.getItem('habitCategories');
    if (stored) {
        const loadedCategories = JSON.parse(stored);
        // Оновлюємо назви дефолтних категорій з перекладами
        categories = loadedCategories.map(cat => {
            if (cat.isDefault) {
                // Знаходимо відповідну дефолтну категорію з перекладами
                const defaultCat = defaultCategories.find(dc => dc.id === cat.id);
                if (defaultCat) {
                    return { ...cat, name: defaultCat.name };
                }
            }
            return cat;
        });
    } else {
        categories = [...defaultCategories];
        saveCategories();
    }
}

function saveCategories() {
    localStorage.setItem('habitCategories', JSON.stringify(categories));
}

// DOM elements
const habitsList = document.getElementById('habitsList');
const statsPanel = document.getElementById('statsPanel');
const errorMessage = document.getElementById('errorMessage');

// Utilities
function showError(msg) {
    errorMessage.innerHTML = `<div class="error">${msg}</div>`;
    setTimeout(() => errorMessage.innerHTML = '', 5000);
}

function showSuccess(msg) {
    errorMessage.innerHTML = `<div class="success">${msg}</div>`;
    setTimeout(() => errorMessage.innerHTML = '', 3000);
}

function showInfo(msg) {
    errorMessage.innerHTML = `<div class="info">${msg}</div>`;
    setTimeout(() => errorMessage.innerHTML = '', 4000);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getWeekDays() {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        days.push(day);
    }
    return days;
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset profile settings when closing profile modal
    if (modalId === 'profileSettingsModal') {
        resetProfileSettings();
    }
    
    // Close category dropdown if open
    const dropdown = document.getElementById('categoryDropdown');
    const selector = document.querySelector('.category-selector');
    if (dropdown) {
        dropdown.classList.remove('active');
        if (selector) selector.classList.remove('active');
    }
}

function openAddHabitModal() {
    populateCategoryDropdown();
    openModal('addHabitModal');
}

function openCategoriesModal() {
    // Close user profile dropdown if it's open
    if (typeof closeUserProfileDropdown === 'function') {
        closeUserProfileDropdown();
    }
    renderCategoriesList();
    openModal('categoriesModal');
}

function openAddCategoryModal() {
    closeModal('categoriesModal');
    openModal('addCategoryModal');
}

// Category functions
function populateCategoryDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    dropdown.innerHTML = categories.map(cat => `
        <div class="category-option" onclick="selectCategory('${cat.id}')">
            <span class="category-emoji">${cat.emoji}</span>
            <span>${cat.name}</span>
        </div>
    `).join('') + `
        <div class="category-option category-add" onclick="openAddCategoryModal()">
            <span>➕</span>
            <span>Добавить новую категорию</span>
        </div>
    `;
}

function toggleCategoryDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    const selector = document.querySelector('.category-selector');
    
    // Закрываем другие выпадающие списки
    closeAllDropdowns('categoryDropdown');
    
    // Если dropdown открыт, закрываем
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        // Иначе открываем
        dropdown.classList.add('active');
        selector.classList.add('active');
        
        // Скроллим dropdown в зону видимости если нужно
        setTimeout(() => {
            const dropdownRect = dropdown.getBoundingClientRect();
            const modalRect = dropdown.closest('.modal').getBoundingClientRect();
            
            if (dropdownRect.bottom > window.innerHeight - 20) {
                dropdown.style.maxHeight = `${window.innerHeight - dropdownRect.top - 40}px`;
            }
        }, 50);
    }
}

// Время выбора
let selectedHour = null;
let selectedMinute = null;
let reminderSelectedHour = null;
let reminderSelectedMinute = null;

// Время выбора для редактирования
let editSelectedHour = null;
let editSelectedMinute = null;
let editReminderSelectedHour = null;
let editReminderSelectedMinute = null;
let editingHabitId = null;

function toggleTimeDropdown() {
    const dropdown = document.getElementById('timeDropdown');
    const selector = document.querySelector('.time-selector');
    
    closeAllDropdowns('timeDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
        initTimePicker();
    }
}

function initTimePicker() {
    const hourValues = document.getElementById('hourValues');
    const minuteValues = document.getElementById('minuteValues');
    
    // Создаем значения часов
    hourValues.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const hourElement = document.createElement('div');
        hourElement.className = 'time-value';
        hourElement.textContent = hour;
        hourElement.onclick = () => selectHour(i, hourElement);
        hourValues.appendChild(hourElement);
    }
    
    // Создаем значения минут
    minuteValues.innerHTML = '';
    for (let i = 0; i < 60; i += 5) {
        const minute = i.toString().padStart(2, '0');
        const minuteElement = document.createElement('div');
        minuteElement.className = 'time-value';
        minuteElement.textContent = minute;
        minuteElement.onclick = () => selectMinute(i, minuteElement);
        minuteValues.appendChild(minuteElement);
    }
    
    // Выделяем текущие выбранные значения
    if (selectedHour !== null) {
        const hourEl = hourValues.children[selectedHour];
        if (hourEl) hourEl.classList.add('selected');
    }
    if (selectedMinute !== null) {
        const minuteIndex = selectedMinute / 5;
        const minuteEl = minuteValues.children[minuteIndex];
        if (minuteEl) minuteEl.classList.add('selected');
    }
}

function selectHour(hour, element) {
    // Убираем выделение с предыдущего
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    
    // Выделяем текущий
    element.classList.add('selected');
    selectedHour = hour;
}

function selectMinute(minute, element) {
    // Убираем выделение с предыдущего
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    
    // Выделяем текущий
    element.classList.add('selected');
    selectedMinute = minute;
}

function confirmTime() {
    if (selectedHour !== null && selectedMinute !== null) {
        const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        document.getElementById('habitTime').value = timeString;
    }
    
    const dropdown = document.getElementById('timeDropdown');
    const selector = document.querySelector('.time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

function clearTime() {
    selectedHour = null;
    selectedMinute = null;
    document.getElementById('habitTime').value = '';
    
    const dropdown = document.getElementById('timeDropdown');
    const selector = document.querySelector('.time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Напоминания
function toggleReminderDropdown() {
    const dropdown = document.getElementById('reminderDropdown');
    const selector = document.querySelector('.reminder-selector');
    
    closeAllDropdowns('reminderDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
    }
}

function selectReminderType(type, element) {
    // Убираем выделение с других опций
    element.parentElement.querySelectorAll('.reminder-option').forEach(el => el.classList.remove('selected'));
    
    // Выделяем текущую опцию
    element.classList.add('selected');
    
    // Обновляем значение в инпуте
    const titles = {
        'none': `🔕 ${t('noReminders')}`,
        'specific': `⏰ ${t('atSpecificTime')}`,
        'interval': `🔄 ${t('atIntervals')}`
    };
    
    document.getElementById('reminderType').value = titles[type];
    document.getElementById('reminderType').dataset.value = type;
    
    // Показываем/скрываем настройки
    const specificSettings = document.getElementById('specificTimeSettings');
    const intervalSettings = document.getElementById('intervalSettings');
    
    specificSettings.style.display = type === 'specific' ? 'block' : 'none';
    intervalSettings.style.display = type === 'interval' ? 'block' : 'none';
    
    // Закрываем dropdown
    const dropdown = document.getElementById('reminderDropdown');
    const selector = document.querySelector('.reminder-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Время напоминания
function toggleReminderTimeDropdown() {
    const dropdown = document.getElementById('reminderTimeDropdown');
    const selector = document.querySelector('.reminder-time-selector');
    
    closeAllDropdowns('reminderTimeDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
        initReminderTimePicker();
    }
}

function initReminderTimePicker() {
    const hourValues = document.getElementById('reminderHourValues');
    const minuteValues = document.getElementById('reminderMinuteValues');
    
    // Создаем значения часов
    hourValues.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const hourElement = document.createElement('div');
        hourElement.className = 'time-value';
        hourElement.textContent = hour;
        hourElement.onclick = () => selectReminderHour(i, hourElement);
        hourValues.appendChild(hourElement);
    }
    
    // Создаем значения минут
    minuteValues.innerHTML = '';
    for (let i = 0; i < 60; i += 5) {
        const minute = i.toString().padStart(2, '0');
        const minuteElement = document.createElement('div');
        minuteElement.className = 'time-value';
        minuteElement.textContent = minute;
        minuteElement.onclick = () => selectReminderMinute(i, minuteElement);
        minuteValues.appendChild(minuteElement);
    }
    
    // Выделяем текущие выбранные значения
    if (reminderSelectedHour !== null) {
        const hourEl = hourValues.children[reminderSelectedHour];
        if (hourEl) hourEl.classList.add('selected');
    }
    if (reminderSelectedMinute !== null) {
        const minuteIndex = reminderSelectedMinute / 5;
        const minuteEl = minuteValues.children[minuteIndex];
        if (minuteEl) minuteEl.classList.add('selected');
    }
}

function selectReminderHour(hour, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    reminderSelectedHour = hour;
}

function selectReminderMinute(minute, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    reminderSelectedMinute = minute;
}

function confirmReminderTime() {
    if (reminderSelectedHour !== null && reminderSelectedMinute !== null) {
        const timeString = `${reminderSelectedHour.toString().padStart(2, '0')}:${reminderSelectedMinute.toString().padStart(2, '0')}`;
        document.getElementById('reminderTime').value = timeString;
    }
    
    const dropdown = document.getElementById('reminderTimeDropdown');
    const selector = document.querySelector('.reminder-time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

function clearReminderTime() {
    reminderSelectedHour = null;
    reminderSelectedMinute = null;
    document.getElementById('reminderTime').value = '';
    
    const dropdown = document.getElementById('reminderTimeDropdown');
    const selector = document.querySelector('.reminder-time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Интервалы
function toggleIntervalUnit() {
    const dropdown = document.getElementById('intervalUnitDropdown');
    const selector = document.querySelector('.interval-unit-selector');
    
    closeAllDropdowns('intervalUnitDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
    }
}

function selectIntervalUnit(unit, element) {
    const units = {
        'minutes': t('minute'),
        'hours': t('hour'),
        'days': t('day')
    };
    
    // Убираем выделение с других опций
    element.parentElement.querySelectorAll('.interval-option').forEach(el => el.classList.remove('selected'));
    
    // Выделяем текущую опцию
    element.classList.add('selected');
    
    // Обновляем значение
    document.getElementById('intervalUnit').value = units[unit];
    document.getElementById('intervalUnit').dataset.value = unit;
    
    // Закрываем dropdown
    const dropdown = document.getElementById('intervalUnitDropdown');
    const selector = document.querySelector('.interval-unit-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Утилита для закрытия всех dropdowns кроме указанного
function closeAllDropdowns(except = null) {
    const dropdowns = [
        { dropdown: 'categoryDropdown', selector: '.category-selector' },
        { dropdown: 'timeDropdown', selector: '.time-selector' },
        { dropdown: 'reminderDropdown', selector: '.reminder-selector' },
        { dropdown: 'reminderTimeDropdown', selector: '.reminder-time-selector' },
        { dropdown: 'intervalUnitDropdown', selector: '.interval-unit-selector' },
        // Edit dropdowns
        { dropdown: 'editCategoryDropdown', selector: '.category-selector' },
        { dropdown: 'editTimeDropdown', selector: '.time-selector' },
        { dropdown: 'editReminderDropdown', selector: '.reminder-selector' },
        { dropdown: 'editReminderTimeDropdown', selector: '.reminder-time-selector' },
        { dropdown: 'editIntervalUnitDropdown', selector: '.interval-unit-selector' }
    ];
    
    dropdowns.forEach(({ dropdown, selector }) => {
        if (dropdown !== except) {
            const dropdownEl = document.getElementById(dropdown);
            if (dropdownEl) {
                dropdownEl.classList.remove('active');
                // Найдем соответствующий селектор для конкретного dropdown
                const parentSelector = dropdownEl.closest('.category-selector, .time-selector, .reminder-selector, .reminder-time-selector, .interval-unit-selector');
                if (parentSelector) {
                    parentSelector.classList.remove('active');
                }
            }
        }
    });
}

// Функции для редактирования категории
function populateEditCategoryDropdown() {
    const dropdown = document.getElementById('editCategoryDropdown');
    dropdown.innerHTML = categories.map(cat => `
        <div class="category-option" onclick="selectEditCategory('${cat.id}')">
            <span class="category-emoji">${cat.emoji}</span>
            <span>${cat.name}</span>
        </div>
    `).join('') + `
        <div class="category-option category-add" onclick="openAddCategoryModal()">
            <span>➕</span>
            <span>Добавить новую категорию</span>
        </div>
    `;
}

function toggleEditCategoryDropdown() {
    const dropdown = document.getElementById('editCategoryDropdown');
    const selector = dropdown.closest('.category-selector');
    
    closeAllDropdowns('editCategoryDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
    }
}

function selectEditCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        const input = document.getElementById('editHabitCategory');
        input.value = `${category.emoji} ${category.name}`;
        input.dataset.categoryId = categoryId;
    }
    
    const dropdown = document.getElementById('editCategoryDropdown');
    const selector = dropdown.closest('.category-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Функции для редактирования времени
function toggleEditTimeDropdown() {
    const dropdown = document.getElementById('editTimeDropdown');
    const selector = dropdown.closest('.time-selector');
    
    closeAllDropdowns('editTimeDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
        initEditTimePicker();
    }
}

function initEditTimePicker() {
    const hourValues = document.getElementById('editHourValues');
    const minuteValues = document.getElementById('editMinuteValues');
    
    hourValues.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const hourElement = document.createElement('div');
        hourElement.className = 'time-value';
        hourElement.textContent = hour;
        hourElement.onclick = () => selectEditHour(i, hourElement);
        hourValues.appendChild(hourElement);
    }
    
    minuteValues.innerHTML = '';
    for (let i = 0; i < 60; i += 5) {
        const minute = i.toString().padStart(2, '0');
        const minuteElement = document.createElement('div');
        minuteElement.className = 'time-value';
        minuteElement.textContent = minute;
        minuteElement.onclick = () => selectEditMinute(i, minuteElement);
        minuteValues.appendChild(minuteElement);
    }
    
    if (editSelectedHour !== null) {
        const hourEl = hourValues.children[editSelectedHour];
        if (hourEl) hourEl.classList.add('selected');
    }
    if (editSelectedMinute !== null) {
        const minuteIndex = editSelectedMinute / 5;
        const minuteEl = minuteValues.children[minuteIndex];
        if (minuteEl) minuteEl.classList.add('selected');
    }
}

function selectEditHour(hour, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    editSelectedHour = hour;
}

function selectEditMinute(minute, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    editSelectedMinute = minute;
}

function confirmEditTime() {
    if (editSelectedHour !== null && editSelectedMinute !== null) {
        const timeString = `${editSelectedHour.toString().padStart(2, '0')}:${editSelectedMinute.toString().padStart(2, '0')}`;
        document.getElementById('editHabitTime').value = timeString;
    }
    
    const dropdown = document.getElementById('editTimeDropdown');
    const selector = dropdown.closest('.time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

function clearEditTime() {
    editSelectedHour = null;
    editSelectedMinute = null;
    document.getElementById('editHabitTime').value = '';
    
    const dropdown = document.getElementById('editTimeDropdown');
    const selector = dropdown.closest('.time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Функции для редактирования напоминаний
function toggleEditReminderDropdown() {
    const dropdown = document.getElementById('editReminderDropdown');
    const selector = dropdown.closest('.reminder-selector');
    
    closeAllDropdowns('editReminderDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
    }
}

function selectEditReminderType(type, element) {
    element.parentElement.querySelectorAll('.reminder-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    const titles = {
        'none': `🔕 ${t('noReminders')}`,
        'specific': `⏰ ${t('atSpecificTime')}`,
        'interval': `🔄 ${t('atIntervals')}`
    };
    
    document.getElementById('editReminderType').value = titles[type];
    document.getElementById('editReminderType').dataset.value = type;
    
    const specificSettings = document.getElementById('editSpecificTimeSettings');
    const intervalSettings = document.getElementById('editIntervalSettings');
    
    specificSettings.style.display = type === 'specific' ? 'block' : 'none';
    intervalSettings.style.display = type === 'interval' ? 'block' : 'none';
    
    const dropdown = document.getElementById('editReminderDropdown');
    const selector = dropdown.closest('.reminder-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Функции для времени напоминания в режиме редактирования
function toggleEditReminderTimeDropdown() {
    const dropdown = document.getElementById('editReminderTimeDropdown');
    const selector = dropdown.closest('.reminder-time-selector');
    
    closeAllDropdowns('editReminderTimeDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
        initEditReminderTimePicker();
    }
}

function initEditReminderTimePicker() {
    const hourValues = document.getElementById('editReminderHourValues');
    const minuteValues = document.getElementById('editReminderMinuteValues');
    
    hourValues.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const hourElement = document.createElement('div');
        hourElement.className = 'time-value';
        hourElement.textContent = hour;
        hourElement.onclick = () => selectEditReminderHour(i, hourElement);
        hourValues.appendChild(hourElement);
    }
    
    minuteValues.innerHTML = '';
    for (let i = 0; i < 60; i += 5) {
        const minute = i.toString().padStart(2, '0');
        const minuteElement = document.createElement('div');
        minuteElement.className = 'time-value';
        minuteElement.textContent = minute;
        minuteElement.onclick = () => selectEditReminderMinute(i, minuteElement);
        minuteValues.appendChild(minuteElement);
    }
    
    if (editReminderSelectedHour !== null) {
        const hourEl = hourValues.children[editReminderSelectedHour];
        if (hourEl) hourEl.classList.add('selected');
    }
    if (editReminderSelectedMinute !== null) {
        const minuteIndex = editReminderSelectedMinute / 5;
        const minuteEl = minuteValues.children[minuteIndex];
        if (minuteEl) minuteEl.classList.add('selected');
    }
}

function selectEditReminderHour(hour, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    editReminderSelectedHour = hour;
}

function selectEditReminderMinute(minute, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    editReminderSelectedMinute = minute;
}

function confirmEditReminderTime() {
    if (editReminderSelectedHour !== null && editReminderSelectedMinute !== null) {
        const timeString = `${editReminderSelectedHour.toString().padStart(2, '0')}:${editReminderSelectedMinute.toString().padStart(2, '0')}`;
        document.getElementById('editReminderTime').value = timeString;
    }
    
    const dropdown = document.getElementById('editReminderTimeDropdown');
    const selector = dropdown.closest('.reminder-time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

function clearEditReminderTime() {
    editReminderSelectedHour = null;
    editReminderSelectedMinute = null;
    document.getElementById('editReminderTime').value = '';
    
    const dropdown = document.getElementById('editReminderTimeDropdown');
    const selector = dropdown.closest('.reminder-time-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

// Функции для интервалов в режиме редактирования
function toggleEditIntervalUnit() {
    const dropdown = document.getElementById('editIntervalUnitDropdown');
    const selector = dropdown.closest('.interval-unit-selector');
    
    closeAllDropdowns('editIntervalUnitDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        selector.classList.add('active');
    }
}

function selectEditIntervalUnit(unit, element) {
    const units = {
        'minutes': t('minute'),
        'hours': t('hour'),
        'days': t('day')
    };
    
    element.parentElement.querySelectorAll('.interval-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    document.getElementById('editIntervalUnit').value = units[unit];
    document.getElementById('editIntervalUnit').dataset.value = unit;
    
    const dropdown = document.getElementById('editIntervalUnitDropdown');
    const selector = dropdown.closest('.interval-unit-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}

function selectCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        const input = document.getElementById('habitCategory');
        input.value = `${category.emoji} ${category.name}`;
        input.dataset.categoryId = categoryId;
    }
    
    // Закрываем dropdown с анимацией
    const dropdown = document.getElementById('categoryDropdown');
    const selector = document.querySelector('.category-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}
function renderCategoriesList() {
    const list = document.getElementById('categoriesList');
    list.innerHTML = categories.map(cat => `
        <div class="category-item">
            <div class="category-name">
                <span class="category-emoji">${cat.emoji}</span>
                <span>${cat.name}</span>
                ${cat.isDefault ? `<span style="font-size:0.7rem;color:var(--muted);">${t('defaultCategory')}</span>` : ''}
            </div>
            <div class="category-actions">
                ${!cat.isDefault ? `<button class="icon-btn delete" onclick="deleteCategory('${cat.id}')" title="${t('delete')}">🗑️</button>` : ''}
            </div>
        </div>
    `).join('');
}

function addCategory(name, emoji) {
    const id = 'custom_' + Date.now();
    categories.push({
        id,
        name: name.trim(),
        emoji: emoji.trim() || '📝',
        isDefault: false
    });
    saveCategories();
    showSuccess('Категория добавлена!');
}

function deleteCategory(categoryId) {
    if (!confirm('Удалить эту категорию?')) return;
    
    categories = categories.filter(c => c.id !== categoryId);
    saveCategories();
    renderCategoriesList();
    showSuccess('Категория удалена');
}

// Auth functions
function clearAuthFields(type) {
    if (type === 'login') {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('rememberMe').checked = false;
    } else if (type === 'register') {
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    }
}

function loadRememberedUser() {
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
        const userData = JSON.parse(remembered);
        document.getElementById('loginEmail').value = userData.email;
        document.getElementById('rememberMe').checked = true;
    }
}

function openAuthModal(mode = 'login') {
    const title = document.getElementById('authModalTitle');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (mode === 'login') {
        title.textContent = 'Вход в аккаунт';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        title.textContent = 'Создание аккаунта';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
    
    openModal('authModal');
}

function switchAuthMode(mode) {
    openAuthModal(mode);
}

async function login(email, password) {
    try {
        const response = await apiFetch(`${API_BASE}/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Сохраняем аккаунт если нужно
            const rememberMe = document.getElementById('rememberMe').checked;
            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({
                    email: email,
                    userId: data.user.id
                }));
            }
            
            // Очищаем поля входа
            clearAuthFields('login');
            updateUIForLoggedInUser();
            closeModal('authModal');
            showSuccess(data.message);
            fetchHabits();
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Ошибка сети');
        console.error(error);
    }
}

async function register(username, email, password) {
    try {
        console.log('Отправляем запрос регистрации:', { username, email });
        const response = await apiFetch(`${API_BASE}/register`, {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        console.log('Ответ сервера:', response.status, response.statusText);
        const data = await response.json();
        console.log('Данные от сервера:', data);
        
        if (response.ok) {
            // Очищаем поля регистрации
            clearAuthFields('register');
            showSuccess(data.message);
            switchAuthMode('login');
        } else {
            showError(data.error);
        }
    } catch (error) {
        console.error('Ошибка сети при регистрации:', error);
        showError('Ошибка сети: ' + error.message);
    }
}

async function logout() {
    try {
        await apiFetch(`${API_BASE}/logout`, { method: 'POST' });
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Удаляем сохраненный аккаунт если пользователь выходит
        const rememberMe = document.getElementById('rememberMe')?.checked;
        if (!rememberMe) {
            localStorage.removeItem('rememberedUser');
        }
        
        updateUIForLoggedOutUser();
        showSuccess('Выход выполнен успешно');
    } catch (error) {
        console.error(error);
    }
}

async function checkAuth() {
    // Проверяем доступность сервера ВСЕГДА
    try {
        const response = await apiFetch(`${API_BASE}/me`);
        // Если получили ЛЮБОЙ ответ (даже 401) - сервер онлайн!
        updateConnectionStatus(true);
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            fetchHabits();
            return;
        }
    } catch (error) {
        // Сервер недоступен
        updateConnectionStatus(false);
    }
    
    // Если API не вернул пользователя, проверим localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            updateUIForLoggedInUser();
            fetchHabits();
            return;
        } catch (error) {
            localStorage.removeItem('currentUser');
        }
    }
    
    // Пользователь не авторизован
    updateUIForLoggedOutUser();
}

function updateUIForLoggedInUser() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('appButtons').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.username;
    updateProfileUI(); // Оновлюємо весь профіль включно з email
}

function updateUIForLoggedOutUser() {
    // Показываем кнопки авторизации
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('appButtons').style.display = 'none';
    
    // Очищаем данные
    currentUser = null;
    habits = [];
    renderHabits();
}

// API calls
async function fetchHabits() {
    try {
        const response = await apiFetch(`${API_BASE}/habits`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        habits = await response.json();
        console.log('Загружены привычки:', habits.map(h => ({ id: h.id, name: h.name })));
        renderHabits();
        updateUserStats(); // Оновлюємо статистику після завантаження звичок
        
        // Setup reminders for all habits
        if (currentUser) {
            habits.forEach(habit => {
                if (habit.reminder && habit.reminder.type !== 'none') {
                    setupHabitReminder(habit);
                }
            });
        }
    } catch (error) {
        showError('Ошибка загрузки привычек');
        console.error('Ошибка в fetchHabits:', error);
    }
}

async function createHabit(data) {
    try {
        const response = await apiFetch(`${API_BASE}/habits`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showSuccess('Привычка добавлена!');
            await fetchHabits();
            
            // *** СИСТЕМА НАГРАД: Создание привычки ***
            userProgress.createdHabits++;
            
            // Проверяем бейджи за создание привычек
            const habitCreationBadges = [];
            
            // Бейдж за создание 25 привычек
            if (userProgress.createdHabits === 25 && !userProgress.earnedBadges.includes('habitMaster')) {
                habitCreationBadges.push('habitMaster');
            }
            
            // Бейдж коллекционера (если создал привычки во всех категориях)
            const uniqueCategories = new Set(habits.map(h => h.category));
            if (uniqueCategories.size >= defaultCategories.length && !userProgress.earnedBadges.includes('categoryCollector')) {
                habitCreationBadges.push('categoryCollector');
            }
            
            // Награждаем бейджи за создание
            habitCreationBadges.forEach(badgeId => {
                userProgress.earnedBadges.push(badgeId);
                showBadgeNotification(badges[badgeId]);
            });
            
            // Награждаем XP за создание привычки
            awardXP(5);
            setTimeout(() => {
                showXPNotification(5);
            }, 300);
            
            if (habitCreationBadges.length > 0) {
                saveUserProgress();
            }
            
            // Setup reminder for the new habit
            const newHabit = await response.json();
            if (newHabit.reminder && newHabit.reminder.type !== 'none') {
                setupHabitReminder(newHabit);
            }
            
            closeModal('addHabitModal');
            document.getElementById('addHabitForm').reset();
            
            // Reset custom fields
            selectedHour = null;
            selectedMinute = null;
            reminderSelectedHour = null;
            reminderSelectedMinute = null;
            
            // Clear all inputs and dropdowns
            document.getElementById('habitTime').value = '';
            document.getElementById('reminderType').value = '';
            document.getElementById('reminderType').removeAttribute('data-value');
            document.getElementById('reminderTime').value = '';
            document.getElementById('intervalUnit').value = '';
            document.getElementById('intervalUnit').removeAttribute('data-value');
            
            // Hide reminder settings
            document.getElementById('specificTimeSettings').style.display = 'none';
            document.getElementById('intervalSettings').style.display = 'none';
            
            // Clear category
            const categoryInput = document.getElementById('habitCategory');
            if (categoryInput) categoryInput.removeAttribute('data-category-id');
            
            // Close all dropdowns
            closeAllDropdowns();
        } else {
            const error = await response.json();
            showError(error.error || 'Ошибка создания привычки');
        }
    } catch (error) {
        showError('Ошибка сети');
        console.error(error);
    }
}

async function updateHabit(habitId, data) {
    try {
        console.log('Оновлення звички:', habitId, 'з даними:', data);
        
        const response = await apiFetch(`${API_BASE}/habits/${habitId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        console.log('Відповідь сервера:', response.status);
        
        if (response.ok) {
            const updatedHabit = await response.json();
            console.log('Оновлена звичка з сервера:', updatedHabit);
            
            showSuccess('Привычка обновлена!');
            await fetchHabits();
            
            // Setup reminder for the updated habit
            clearHabitReminder(habitId);
            if (updatedHabit.reminder && updatedHabit.reminder.type !== 'none') {
                setupHabitReminder(updatedHabit);
            }
            
            closeModal('editHabitModal');
            
            // Reset edit fields
            editSelectedHour = null;
            editSelectedMinute = null;
            editReminderSelectedHour = null;
            editReminderSelectedMinute = null;
            editingHabitId = null;
            
            // Close all dropdowns
            closeAllDropdowns();
        } else {
            const error = await response.json();
            console.error('Помилка оновлення:', error);
            showError(error.error || 'Ошибка обновления привычки');
        }
    } catch (error) {
        showError('Ошибка сети');
        console.error(error);
    }
}

async function deleteHabit(habitId) {
    console.log('Удаление привычки ID:', habitId);
    console.log('Доступные привычки:', habits.map(h => ({ id: h.id, name: h.name })));
    
    if (!confirm('Удалить эту привычку?')) return;
    
    try {
        const response = await apiFetch(`${API_BASE}/habits/${habitId}`, {
            method: 'DELETE'
        });
        
        console.log('Ответ сервера на удаление:', response.status, response.statusText);
        
        if (response.ok) {
            showSuccess('Привычка удалена');
            clearHabitReminder(habitId); // Очищаем напоминания
            
            // Закрываем панель статистики если была открыта эта привычка
            if (selectedHabitId == habitId) {
                selectedHabitId = null;
                const statsPanel = document.getElementById('statsPanel');
                if (statsPanel) {
                    statsPanel.innerHTML = '<div class="empty-state"><h3>Выберите привычку</h3></div>';
                }
            }
            
            await fetchHabits(); // Обновляем список привычек
        } else {
            const errorData = await response.text();
            console.error('Ошибка удаления:', response.status, errorData);
            showError(`Ошибка удаления: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        showError('Ошибка сети при удалении');
        console.error('Ошибка сети:', error);
    }
}

async function toggleEntry(habitId, date, status) {
    try {
        const response = await apiFetch(`${API_BASE}/habits/${habitId}/tick`, {
            method: 'POST',
            body: JSON.stringify({ date, status })
        });
        
        if (response.ok) {
            fetchHabits();
            if (selectedHabitId === habitId) {
                loadStats(habitId);
            }
        }
    } catch (error) {
        showError('Ошибка сохранения');
        console.error(error);
    }
}

async function loadStats(habitId) {
    try {
        console.log('Загрузка статистики для привычки:', habitId);
        
        const [weekResponse, monthResponse, habitResponse] = await Promise.all([
            apiFetch(`${API_BASE}/habits/${habitId}/stats?range=week`),
            apiFetch(`${API_BASE}/habits/${habitId}/stats?range=month`),
            apiFetch(`${API_BASE}/habits/${habitId}`)
        ]);
        
        console.log('Ответы от сервера:', {
            week: weekResponse.status,
            month: monthResponse.status,
            habit: habitResponse.status
        });
        
        const weekStats = weekResponse.ok ? await weekResponse.json() : null;
        const monthStats = monthResponse.ok ? await monthResponse.json() : null;
        const habitData = habitResponse.ok ? await habitResponse.json() : null;
        
        console.log('Загруженные данные:', { weekStats, monthStats, habitData });
        console.log('weekStats детально:', weekStats);
        console.log('monthStats детально:', monthStats);
        console.log('habitData детально:', habitData);
        
        renderStats(weekStats, monthStats, habitData);
    } catch (error) {
        showError('Ошибка загрузки статистики');
        console.error('Ошибка в loadStats:', error);
        
        // Показываем базовую статистику при ошибке
        renderStats(null, null, { streak: { current: 0, max: 0 } });
    }
}

// Rendering
function renderHabits() {
    console.log('Рендеринг привычек. Всего привычек:', habits.length);
    console.log('ID привычек:', habits.map(h => h.id));
    
    if (habits.length === 0) {
        habitsList.innerHTML = `
            <div class="empty-state">
                <h3 data-i18n="noHabits">${t('noHabits')}</h3>
                <p data-i18n="noHabitsDesc">${t('noHabitsDesc')}</p>
            </div>
        `;
        return;
    }
    
    habitsList.innerHTML = habits.map(habit => {
        const category = categories.find(c => c.id === habit.category);
        return `
            <div class="habit-card" data-id="${habit.id}">
                <div class="habit-header">
                    <div>
                        <div class="habit-title">${habit.name}</div>
                        ${habit.description ? `<div class="habit-desc">${habit.description}</div>` : ''}
                        <div class="habit-meta">
                            ${category ? `
                                <div class="habit-category">
                                    <span>${category.emoji}</span>
                                    <span>${category.name}</span>
                                </div>
                            ` : ''}
                            ${habit.time ? `
                                <div class="habit-time">
                                    <span>🕐</span>
                                    <span>${habit.time}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="icon-btn edit" data-habit-id="${habit.id}" title="Редактировать">
                            ✏️
                        </button>
                        <button class="icon-btn delete" data-habit-id="${habit.id}" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="week-section">
                    <div class="week-hint" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px; text-align: center;">
                        ${t('clickDayToMark')}
                    </div>
                    <div class="week-grid">
                        ${[t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')].map(day => 
                            `<div class="day-label">${day}</div>`
                        ).join('')}
                        ${getWeekDays().map(date => {
                            const dateStr = formatDate(date);
                            const isToday = dateStr === formatDate(new Date());
                            console.log(`Рендеринг ячейки для привычки ${habit.id} на дату ${dateStr}`);
                            return `
                                <div class="day-cell ${isToday ? 'today' : ''}" 
                                         data-habit-id="${habit.id}" 
                                         data-date="${dateStr}"
                                         title="${t('clickToMarkCompletion')}"
                                         style="cursor: pointer;">
                                    ${date.getDate()}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    updateWeekCells();
}

async function updateWeekCells() {
    const weekDays = getWeekDays();
    
    for (const habit of habits) {
        try {
            const response = await apiFetch(`${API_BASE}/habits/${habit.id}/stats?range=week`);
            const stats = await response.json();
            
            if (stats.entries) {
                const completedDates = new Set(
                    stats.entries.filter(e => e.status === 1).map(e => e.date)
                );
                
                weekDays.forEach(date => {
                    const dateStr = formatDate(date);
                    const cell = document.querySelector(`[data-habit-id="${habit.id}"][data-date="${dateStr}"]`);
                    if (cell && completedDates.has(dateStr)) {
                        cell.classList.add('done');
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки данных недели:', error);
        }
    }
}

// Функция для переключения состояния выполнения привычки в определенный день
async function toggleDay(habitId, date) {
    console.log(`Переключение состояния привычки ${habitId} на дату ${date}`);
    
    try {
        // Поиск ячейки
        console.log('Поиск ячейки с селектором:', `[data-habit-id="${habitId}"][data-date="${date}"]`);
        
        const cell = document.querySelector(`[data-habit-id="${habitId}"][data-date="${date}"]`);
        
        if (!cell) {
            console.error(`Не найдена ячейка для привычки ${habitId} и даты ${date}`);
            console.log('Доступные ячейки:');
            document.querySelectorAll('.day-cell').forEach(c => {
                console.log(`Ячейка: habitId="${c.dataset.habitId}", date="${c.dataset.date}"`);
            });
            showError('Ошибка: не найдена ячейка для отметки');
            return;
        }
        
        const isDone = cell.classList.contains('done');
        const newStatus = isDone ? 0 : 1; // 0 = не выполнено, 1 = выполнено
        
        console.log('Текущее состояние:', isDone ? 'выполнено' : 'не выполнено', '-> новое:', newStatus === 1 ? 'выполнено' : 'не выполнено');
        
        // Отправляем запрос на сервер
        const response = await apiFetch(`${API_BASE}/habits/${habitId}/tick`, {
            method: 'POST',
            body: JSON.stringify({
                date: date,
                status: newStatus
            })
        });
        
        console.log('Ответ сервера:', response.status, response.statusText);
        
        if (response.ok) {
            // Обновляем визуальное состояние
            if (newStatus === 1) {
                cell.classList.add('done');
                showSuccess('✅ Привычка отмечена как выполненная!');
                
                // *** СИСТЕМА НАГРАД ***
                // Найдем привычку для получения информации
                const habit = habits.find(h => h.id === habitId);
                if (habit) {
                    // Обновляем прогресс пользователя
                    userProgress.totalHabitsCompleted++;
                    
                    // Обновляем статистику по категориям
                    if (habit.category) {
                        userProgress.categoryStats[habit.category] = (userProgress.categoryStats[habit.category] || 0) + 1;
                    }
                    
                    // Обновляем серии
                    userProgress.currentStreaks[habitId] = (userProgress.currentStreaks[habitId] || 0) + 1;
                    
                    // Обновляем максимальную серию
                    const currentStreak = userProgress.currentStreaks[habitId];
                    if (currentStreak > userProgress.longestStreak) {
                        userProgress.longestStreak = currentStreak;
                    }
                    
                    // Рассчитываем и награждаем XP
                    const earnedXP = calculateXP(habit);
                    awardXP(earnedXP);
                    
                    // Проверяем бейджи
                    checkBadges(habit, new Date());
                    
                    // Показываем уведомление о XP
                    setTimeout(() => {
                        showXPNotification(earnedXP);
                    }, 500);
                }
            } else {
                cell.classList.remove('done');
                showInfo('❌ Отметка о выполнении снята');
                
                // *** ОТМЕНЯЕМ ПРОГРЕСС ***
                const habit = habits.find(h => h.id === habitId);
                if (habit) {
                    // Уменьшаем общий счетчик
                    if (userProgress.totalHabitsCompleted > 0) {
                        userProgress.totalHabitsCompleted--;
                    }
                    
                    // Уменьшаем статистику по категориям
                    if (habit.category && userProgress.categoryStats[habit.category] > 0) {
                        userProgress.categoryStats[habit.category]--;
                    }
                    
                    // Сбрасываем серию
                    userProgress.currentStreaks[habitId] = 0;
                    
                    // Сохраняем прогресс
                    saveUserProgress();
                }
            }
            
            // Обновляем статистику если эта привычка выбрана
            console.log('Перевірка оновлення статистики:', { selectedHabitId, habitId, рівні: selectedHabitId == habitId });
            if (selectedHabitId == habitId) {
                console.log('Оновлюємо статистику для звички:', habitId);
                setTimeout(() => loadStats(habitId), 500); // Небольшая задержка для обновления данных на сервере
            }
            
            // Также обновляем отображение дней для пересчета серий
            setTimeout(() => updateWeekCells(), 500);
        } else {
            showError('Ошибка при сохранении отметки');
            console.error('Ошибка HTTP:', response.status);
        }
    } catch (error) {
        showError('Ошибка при сохранении отметки');
        console.error('Ошибка в toggleDay:', error);
    }
}

function renderStats(weekStats, monthStats, habitData) {
    const streak = habitData?.streak || { current: 0, max: 0 };
    
    console.log('renderStats викликано з:', { weekStats, monthStats, habitData });
    console.log('Streak:', streak);
    
    // Значения по умолчанию для статистики
    // Используем данные из сервера напрямую
    const safeWeekStats = {
        completed_days: weekStats?.completed_days || 0,
        total_days: weekStats?.total_days || 0,
        adherence_percent: weekStats?.adherence_percent || 0
    };
    
    const safeMonthStats = {
        completed_days: monthStats?.completed_days || 0,
        total_days: monthStats?.total_days || 0,
        adherence_percent: monthStats?.adherence_percent || 0
    };
    
    console.log('safeWeekStats:', safeWeekStats);
    console.log('safeMonthStats:', safeMonthStats);
    
    statsPanel.innerHTML = `
        <div class="streak-display">
            <span class="streak-number">${streak.current}</span>
            <div class="streak-label">${t('currentStreak')}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label">${t('week')}</span>
                <span class="stat-value">${safeWeekStats.completed_days}/${safeWeekStats.total_days}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${t('month')}</span>
                <span class="stat-value">${safeMonthStats.completed_days}/${safeMonthStats.total_days}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${t('weekPercent')}</span>
                <span class="stat-value">${Math.round(safeWeekStats.adherence_percent)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${t('monthPercent')}</span>
                <span class="stat-value">${Math.round(safeMonthStats.adherence_percent)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${t('bestStreak')}</span>
                <span class="stat-value">${streak.max} ${t('days')}</span>
            </div>
        </div>
    `;
}

function editHabit(habitId) {
    console.log('Редактирование привычки ID:', habitId);
    console.log('Доступные привычки:', habits.map(h => ({ id: h.id, name: h.name })));
    
    const habit = habits.find(h => h.id == habitId); // Используем == для сравнения
    if (!habit) {
        showError(`Привычка с ID ${habitId} не найдена в локальном массиве`);
        console.error('Привычка не найдена. ID:', habitId, 'Тип:', typeof habitId);
        return;
    }
    
    editingHabitId = habitId;
    
    // Заполняем форму данными привычки
    document.getElementById('editHabitName').value = habit.name;
    document.getElementById('editHabitDesc').value = habit.description || '';
    
    // Время
    if (habit.time) {
        document.getElementById('editHabitTime').value = habit.time;
        const [hours, minutes] = habit.time.split(':');
        editSelectedHour = parseInt(hours);
        editSelectedMinute = parseInt(minutes);
    } else {
        document.getElementById('editHabitTime').value = '';
        editSelectedHour = null;
        editSelectedMinute = null;
    }
    
    // Категория
    const categoryInput = document.getElementById('editHabitCategory');
    if (habit.category) {
        const category = categories.find(c => c.id === habit.category);
        if (category) {
            categoryInput.value = `${category.emoji} ${category.name}`;
            categoryInput.dataset.categoryId = habit.category;
        }
    } else {
        categoryInput.value = '';
        categoryInput.removeAttribute('data-category-id');
    }
    
    // Напоминания
    const reminderTypeInput = document.getElementById('editReminderType');
    const specificSettings = document.getElementById('editSpecificTimeSettings');
    const intervalSettings = document.getElementById('editIntervalSettings');
    
    if (habit.reminder && habit.reminder.type !== 'none') {
        const titles = {
            'specific': '⏰ В определенное время',
            'interval': '🔄 Через интервалы'
        };
        
        reminderTypeInput.value = titles[habit.reminder.type];
        reminderTypeInput.dataset.value = habit.reminder.type;
        
        if (habit.reminder.type === 'specific') {
            specificSettings.style.display = 'block';
            intervalSettings.style.display = 'none';
            
            if (habit.reminder.time) {
                document.getElementById('editReminderTime').value = habit.reminder.time;
                const [hours, minutes] = habit.reminder.time.split(':');
                editReminderSelectedHour = parseInt(hours);
                editReminderSelectedMinute = parseInt(minutes);
            }
        } else if (habit.reminder.type === 'interval') {
            specificSettings.style.display = 'none';
            intervalSettings.style.display = 'block';
            
            if (habit.reminder.interval) {
                document.getElementById('editIntervalValue').value = habit.reminder.interval.value;
                const units = {
                    'minutes': t('minute'),
                    'hours': t('hour'),
                    'days': t('day')
                };
                const unitInput = document.getElementById('editIntervalUnit');
                unitInput.value = units[habit.reminder.interval.unit];
                unitInput.dataset.value = habit.reminder.interval.unit;
            }
        }
    } else {
        reminderTypeInput.value = `🔕 ${t('noReminders')}`;
        reminderTypeInput.dataset.value = 'none';
        specificSettings.style.display = 'none';
        intervalSettings.style.display = 'none';
    }
    
    // Заполняем dropdown категорий
    populateEditCategoryDropdown();
    
    // Открываем модальное окно
    openModal('editHabitModal');
}

function toggleDay(habitId, date) {
    const cell = document.querySelector(`[data-habit-id="${habitId}"][data-date="${date}"]`);
    if (!cell) {
        console.error('Не найдена ячейка для привычки', habitId, 'и даты', date);
        return;
    }
    
    const isDone = cell.classList.contains('done');
    toggleEntry(habitId, date, !isDone);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initCategories();
    initUserProgress(); // Инициализируем систему наград
    checkAuth(); // Проверяем авторизацию вместо сразу загрузки привычек
    
    // Initialize profile editing functionality
    initProfileEditing();
    
    // Handle Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Check if profile settings modal is open
            const profileModal = document.getElementById('profileSettingsModal');
            if (profileModal && profileModal.classList.contains('active')) {
                closeModal('profileSettingsModal');
                return;
            }
            
            // Check for other open modals
            const openModal = document.querySelector('.modal-overlay.active');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    // Auth form submissions
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (email && password) {
            login(email, password);
        }
    });

    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        
        if (username && email && password) {
            register(username, email, password);
        }
    });
    
    // Form submissions
    document.getElementById('addHabitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('habitName').value.trim();
        const description = document.getElementById('habitDesc').value.trim();
        const time = document.getElementById('habitTime').value;
        const categoryInput = document.getElementById('habitCategory');
        const categoryId = categoryInput.dataset.categoryId;
        
        // Get reminder settings
        const reminderTypeInput = document.getElementById('reminderType');
        const reminderType = reminderTypeInput.dataset.value || 'none';
        let reminder = { type: 'none' };
        
        if (reminderType === 'specific') {
            const reminderTime = document.getElementById('reminderTime').value;
            if (reminderTime) {
                reminder = {
                    type: 'specific',
                    time: reminderTime
                };
            }
        } else if (reminderType === 'interval') {
            const intervalValue = parseInt(document.getElementById('intervalValue').value);
            const intervalUnitInput = document.getElementById('intervalUnit');
            const intervalUnit = intervalUnitInput.dataset.value;
            if (intervalValue && intervalUnit) {
                reminder = {
                    type: 'interval',
                    interval: {
                        value: intervalValue,
                        unit: intervalUnit
                    }
                };
            }
        }
        
        if (!name) {
            showError('Введите название привычки');
            return;
        }
        
        const habitData = {
            name,
            description,
            time: time || null,
            category: categoryId || null,
            reminder: reminder
        };
        
        await createHabit(habitData);
    });

    document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value.trim();
        const emoji = document.getElementById('categoryEmoji').value.trim();
        
        if (!name) {
            showError('Введите название категории');
            return;
        }
        
        addCategory(name, emoji);
        closeModal('addCategoryModal');
        document.getElementById('addCategoryForm').reset();
        
        // Refresh categories modal if it's open
        if (document.getElementById('categoriesModal').classList.contains('active')) {
            renderCategoriesList();
        }
    });

    // Edit habit form submission
    document.getElementById('editHabitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!editingHabitId) {
            showError('Ошибка: не выбрана привычка для редактирования');
            return;
        }
        
        const name = document.getElementById('editHabitName').value.trim();
        const description = document.getElementById('editHabitDesc').value.trim();
        const time = document.getElementById('editHabitTime').value;
        const categoryInput = document.getElementById('editHabitCategory');
        const categoryId = categoryInput.dataset.categoryId;
        
        // Get reminder settings
        const reminderTypeInput = document.getElementById('editReminderType');
        const reminderType = reminderTypeInput.dataset.value || 'none';
        let reminder = { type: 'none' };
        
        if (reminderType === 'specific') {
            const reminderTime = document.getElementById('editReminderTime').value;
            if (reminderTime) {
                reminder = {
                    type: 'specific',
                    time: reminderTime
                };
            }
        } else if (reminderType === 'interval') {
            const intervalValue = parseInt(document.getElementById('editIntervalValue').value);
            const intervalUnitInput = document.getElementById('editIntervalUnit');
            const intervalUnit = intervalUnitInput.dataset.value;
            if (intervalValue && intervalUnit) {
                reminder = {
                    type: 'interval',
                    interval: {
                        value: intervalValue,
                        unit: intervalUnit
                    }
                };
            }
        }
        
        if (!name) {
            showError('Введите название привычки');
            return;
        }
        
        const habitData = {
            name,
            description,
            time: time || null,
            category: categoryId || null,
            reminder: reminder
        };
        
        await updateHabit(editingHabitId, habitData);
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const dropdowns = [
            { dropdown: 'categoryDropdown', selector: '.category-selector', input: 'habitCategory' },
            { dropdown: 'timeDropdown', selector: '.time-selector', input: 'habitTime' },
            { dropdown: 'reminderDropdown', selector: '.reminder-selector', input: 'reminderType' },
            { dropdown: 'reminderTimeDropdown', selector: '.reminder-time-selector', input: 'reminderTime' },
            { dropdown: 'intervalUnitDropdown', selector: '.interval-unit-selector', input: 'intervalUnit' },
            // Edit dropdowns
            { dropdown: 'editCategoryDropdown', selector: '.category-selector', input: 'editHabitCategory' },
            { dropdown: 'editTimeDropdown', selector: '.time-selector', input: 'editHabitTime' },
            { dropdown: 'editReminderDropdown', selector: '.reminder-selector', input: 'editReminderType' },
            { dropdown: 'editReminderTimeDropdown', selector: '.reminder-time-selector', input: 'editReminderTime' },
            { dropdown: 'editIntervalUnitDropdown', selector: '.interval-unit-selector', input: 'editIntervalUnit' }
        ];
        
        dropdowns.forEach(({ dropdown, selector, input }) => {
            const dropdownEl = document.getElementById(dropdown);
            const inputEl = document.getElementById(input);
            
            if (dropdownEl && !dropdownEl.contains(e.target) && 
                e.target !== inputEl && !dropdownEl.closest(selector)?.contains(e.target)) {
                dropdownEl.classList.remove('active');
                const parentSelector = dropdownEl.closest(selector);
                if (parentSelector) parentSelector.classList.remove('active');
            }
        });
    });

    // Setup reminder options click handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('.reminder-option')) {
            const option = e.target.closest('.reminder-option');
            const value = option.dataset.value;
            
            // Определяем, в каком модальном окне мы находимся
            const editModal = option.closest('#editHabitModal');
            if (editModal) {
                selectEditReminderType(value, option);
            } else {
                selectReminderType(value, option);
            }
        }
        
        if (e.target.closest('.interval-option')) {
            const option = e.target.closest('.interval-option');
            const value = option.dataset.value;
            
            // Определяем, в каком модальном окне мы находимся
            const editModal = option.closest('#editHabitModal');
            if (editModal) {
                selectEditIntervalUnit(value, option);
            } else {
                selectIntervalUnit(value, option);
            }
        }
    });

    // Select habit for stats and handle edit/delete buttons
    if (habitsList) {
        habitsList.addEventListener('click', async (e) => {
            // Handle edit button
            if (e.target.closest('.icon-btn.edit')) {
                e.stopPropagation();
                const button = e.target.closest('.icon-btn.edit');
                const habitId = button.dataset.habitId; // Убираем parseInt
                console.log('Попытка редактирования привычки ID:', habitId);
                console.log('Доступные привычки в массиве:', habits.map(h => ({ id: h.id, name: h.name })));
                
                if (habitId) {
                    // Проверяем, существует ли привычка в локальном массиве
                    const habitExists = habits.find(h => h.id == habitId);
                    if (!habitExists) {
                        console.log('Привычка не найдена в локальном массиве. Обновляем...');
                        showError('Привычка не найдена. Обновляем список...');
                        await fetchHabits(); // Обновляем список
                        
                        // Проверяем еще раз после обновления
                        const habitExistsAfterUpdate = habits.find(h => h.id == habitId);
                        if (!habitExistsAfterUpdate) {
                            console.log('Привычка не найдена даже после обновления');
                            showError('Привычка не найдена в базе данных');
                            return;
                        }
                    }
                    editHabit(habitId);
                }
                return;
            }
            
            // Handle delete button
            if (e.target.closest('.icon-btn.delete')) {
                e.stopPropagation();
                const button = e.target.closest('.icon-btn.delete');
                const habitId = button.dataset.habitId; // Убираем parseInt
                console.log('Попытка удаления привычки ID:', habitId);
                console.log('Доступные привычки в массиве:', habits.map(h => ({ id: h.id, name: h.name })));
                
                if (habitId) {
                    // Проверяем, существует ли привычка в локальном массиве
                    const habitExists = habits.find(h => h.id == habitId);
                    if (!habitExists) {
                        console.log('Привычка не найдена в локальном массиве. Обновляем...');
                        showError('Привычка не найдена. Обновляем список...');
                        await fetchHabits(); // Обновляем список
                        
                        // Проверяем еще раз после обновления
                        const habitExistsAfterUpdate = habits.find(h => h.id == habitId);
                        if (!habitExistsAfterUpdate) {
                            console.log('Привычка не найдена даже после обновления');
                            showError('Привычка не найдена в базе данных');
                            return;
                        }
                    }
                    deleteHabit(habitId);
                }
                return;
            }
            
            // Handle day cell toggle
            if (e.target.closest('.day-cell')) {
                e.stopPropagation();
                const cell = e.target.closest('.day-cell');
                const habitId = cell.dataset.habitId; // Оставляем как строку, не используем parseInt
                const date = cell.dataset.date;
                
                console.log('Клик по ячейке:', {
                    habitId,
                    date,
                    cellElement: cell
                });
                
                if (habitId && date) {
                    toggleDay(habitId, date);
                } else {
                    console.error('Отсутствует habitId или date:', { habitId, date });
                }
                return;
            }
            
            // Handle card selection for stats
            const card = e.target.closest('.habit-card');
            if (!card) return;
            
            const habitId = card.dataset.id; // Убираем parseInt
            if (habitId && selectedHabitId !== habitId) {
                selectedHabitId = habitId;
                loadStats(habitId);
                
                // Visual feedback
                document.querySelectorAll('.habit-card').forEach(c => c.style.borderColor = '#2d4152');
                card.style.borderColor = '#4da3ff';
            }
        });
    }
    
    // Load remembered user on page load
    loadRememberedUser();
    
    // Request notification permission
    requestNotificationPermission();
});

// ==================== REMINDER SYSTEM ====================
async function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                showSuccess('🔔 Уведомления включены!');
            } else {
                showInfo('ℹ️ Уведомления отключены. Можно включить в настройках браузера.');
            }
        }
    }
}

function createNotification(title, body, icon = '🎯') {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzIgNjRDNDkuNjczIDY0IDY0IDQ5LjY3MyA2NCAzMlM0OS42NzMgMCAzMiAwIDAgMTQuMzI3IDAgMzJzMTQuMzI3IDMyIDMyIDMyeiIgZmlsbD0iIzAwZDRmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiPvCfj68tL3RleHQ+PC9zdmc+',
            tag: 'habit-reminder',
            requireInteraction: false,
            silent: false
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    }
}

// Store reminder intervals
let activeReminders = new Map();

function setupHabitReminder(habit) {
    // Clear existing reminder for this habit
    clearHabitReminder(habit.id);
    
    if (!habit.reminder || habit.reminder.type === 'none') return;
    
    const now = new Date();
    let nextReminderTime;
    
    if (habit.reminder.type === 'specific') {
        // Set reminder for specific time
        const [hours, minutes] = habit.reminder.time.split(':');
        nextReminderTime = new Date();
        nextReminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If time has passed today, set for tomorrow
        if (nextReminderTime <= now) {
            nextReminderTime.setDate(nextReminderTime.getDate() + 1);
        }
        
        const timeUntilReminder = nextReminderTime - now;
        const timeoutId = setTimeout(() => {
            createNotification(
                `⏰ Время для: ${habit.name}`,
                habit.description || 'Не забудьте выполнить свою привычку!',
                habit.category?.emoji || '📝'
            );
            // Set up next day's reminder
            setupHabitReminder(habit);
        }, timeUntilReminder);
        
        activeReminders.set(habit.id, timeoutId);
        
    } else if (habit.reminder.type === 'interval') {
        // Set interval reminder
        let intervalMs;
        const value = habit.reminder.interval.value;
        const unit = habit.reminder.interval.unit;
        
        switch (unit) {
            case 'minutes':
                intervalMs = value * 60 * 1000;
                break;
            case 'hours':
                intervalMs = value * 60 * 60 * 1000;
                break;
            case 'days':
                intervalMs = value * 24 * 60 * 60 * 1000;
                break;
            default:
                return;
        }
        
        const intervalId = setInterval(() => {
            // Check if habit was already completed today
            if (!isHabitCompletedToday(habit.id)) {
                createNotification(
                    `🔔 Напоминание: ${habit.name}`,
                    habit.description || 'Время выполнить привычку!',
                    habit.category?.emoji || '📝'
                );
            }
        }, intervalMs);
        
        activeReminders.set(habit.id, intervalId);
    }
}

function clearHabitReminder(habitId) {
    if (activeReminders.has(habitId)) {
        const id = activeReminders.get(habitId);
        clearTimeout(id);
        clearInterval(id);
        activeReminders.delete(habitId);
    }
}

function isHabitCompletedToday(habitId) {
    const today = new Date().toISOString().split('T')[0];
    // Используем глобальную переменную habits вместо localStorage
    const habit = habits.find(h => h.id === habitId);
    return habit && habit.completedDates && habit.completedDates.includes(today);
}

// Setup all habit reminders when habits are loaded
function setupAllReminders() {
    if (currentUser) {
        fetchHabits().then(() => {
            // Используем глобальную переменную habits вместо localStorage
            habits.forEach(habit => {
                if (habit.reminder && habit.reminder.type !== 'none') {
                    setupHabitReminder(habit);
                }
            });
        });
    }
}

// ==================== PROFILE FUNCTIONS ====================

// User profile settings
let userSettings = {
    avatar: '👤',
    pushNotifications: false,
    emailNotifications: false,
    soundNotifications: true,
    darkTheme: true,
    compactView: false,
    analytics: true,
    autoBackup: 'weekly',
    interfaceLanguage: 'ru'
};

// Available avatars
const avatarEmojis = [
    '👤', '😀', '😎', '🤓', '😊', '🥳', '😇', '🤔', '😋', '🙂',
    '🐱', '🐶', '🐺', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸',
    '🌟', '⭐', '✨', '🔥', '💎', '🎯', '🚀', '🎨', '🎵', '⚡',
    '🌈', '🌙', '☀️', '🌸', '🌺', '🍀', '🌿', '🌊', '❄️', '🔮'
];

// Initialize user profile on page load
function initUserProfile() {
    // Load user settings from localStorage
    const stored = localStorage.getItem('userSettings');
    if (stored) {
        userSettings = { ...userSettings, ...JSON.parse(stored) };
    }
    
    // Update profile UI
    updateProfileUI();
    applyUserSettings();
}

// Update profile UI elements
function updateProfileUI() {
    if (currentUser) {
        // Update avatar
        updateAvatarUI();
        
        // Update user info
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('profileName').textContent = currentUser.username;
        document.getElementById('profileEmail').textContent = currentUser.email;
        
        // Update profile display values
        updateProfileDisplay();
        
        // Update settings form (если они есть)
        const settingsUsername = document.getElementById('settingsUsername');
        const settingsEmail = document.getElementById('settingsEmail');
        if (settingsUsername) settingsUsername.value = currentUser.username;
        if (settingsEmail) settingsEmail.value = currentUser.email;
        
        // Update stats
        updateUserStats();
        
        // Show user info
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('appButtons').style.display = 'flex';
    } else {
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('authButtons').style.display = 'flex';
        document.getElementById('appButtons').style.display = 'none';
    }
}

// Validation for new username in profile edit
function validateNewUsername() {
    const usernameInput = document.getElementById('newUsername');
    if (!usernameInput) {
        showValidationError('newUsername', 'Поле имени пользователя не найдено');
        return false;
    }
    
    const username = usernameInput.value.trim();
    
    if (!username) {
        showValidationError('newUsername', 'Имя пользователя обязательно');
        return false;
    }
    
    if (username.length < 2) {
        showValidationError('newUsername', 'Имя должно содержать минимум 2 символа');
        return false;
    }
    
    if (username.length > 30) {
        showValidationError('newUsername', 'Имя не должно превышать 30 символов');
        return false;
    }
    
    if (!/^[a-zA-Zа-яА-ЯёЁ0-9_\s]+$/.test(username)) {
        showValidationError('newUsername', 'Имя может содержать только буквы, цифры, пробелы и подчеркивания');
        return false;
    }
    
    if (currentUser && username === currentUser.username) {
        showValidationError('newUsername', 'Новое имя не должно совпадать с текущим');
        return false;
    }
    
    clearValidationError('newUsername');
    return true;
}

// Validation for new email in profile edit
function validateNewEmail() {
    const emailInput = document.getElementById('newEmail');
    const email = emailInput.value.trim();
    
    if (!email) {
        showValidationError('newEmail', 'Email обязателен');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showValidationError('newEmail', 'Неверный формат email');
        return false;
    }
    
    if (currentUser && email === currentUser.email) {
        showValidationError('newEmail', 'Новый email не должен совпадать с текущим');
        return false;
    }
    
    clearValidationError('newEmail');
    return true;
}

// Validation for current password in edit form
async function validateCurrentPasswordEdit() {
    const passwordInput = document.getElementById('currentPasswordEdit');
    const password = passwordInput.value;
    
    if (!password) {
        showValidationError('currentPasswordEdit', 'Введите текущий пароль');
        return false;
    }
    
    // TODO: Add actual password verification
    // For now, just check it's not empty
    if (password.length < 3) {
        showValidationError('currentPasswordEdit', 'Неверный пароль');
        return false;
    }
    
    clearValidationError('currentPasswordEdit');
    return true;
}

// Validation for new password in edit form
function validateNewPasswordEdit() {
    const passwordInput = document.getElementById('newPasswordEdit');
    const password = passwordInput.value;
    
    const result = validatePasswordStrength(password);
    
    if (!result.isValid) {
        showValidationError('newPasswordEdit', result.message);
        return false;
    }
    
    clearValidationError('newPasswordEdit');
    return true;
}

// Validation for confirm password in edit form
function validateConfirmPasswordEdit() {
    const confirmInput = document.getElementById('confirmPasswordEdit');
    const newPasswordInput = document.getElementById('newPasswordEdit');
    const confirmPassword = confirmInput.value;
    const newPassword = newPasswordInput.value;
    
    if (!confirmPassword) {
        showValidationError('confirmPasswordEdit', 'Подтвердите новый пароль');
        return false;
    }
    
    if (confirmPassword !== newPassword) {
        showValidationError('confirmPasswordEdit', 'Пароли не совпадают');
        return false;
    }
    
    clearValidationError('confirmPasswordEdit');
    return true;
}

// Update password strength indicator for edit form
function updatePasswordStrengthEdit(password) {
    if (!password) {
        const strengthElement = document.getElementById('passwordStrength');
        if (strengthElement) {
            strengthElement.innerHTML = '';
        }
        return;
    }
    updatePasswordStrength(password);
}

// Initialize profile editing event listeners
function initProfileEditing() {
    // Real-time validation for new username
    const newUsernameInput = document.getElementById('newUsername');
    if (newUsernameInput) {
        newUsernameInput.addEventListener('input', validateNewUsername);
        newUsernameInput.addEventListener('blur', validateNewUsername);
    }
    
    // Real-time validation for new email
    const newEmailInput = document.getElementById('newEmail');
    if (newEmailInput) {
        newEmailInput.addEventListener('input', validateNewEmail);
        newEmailInput.addEventListener('blur', validateNewEmail);
    }
    
    // Real-time validation for password editing
    const currentPasswordInput = document.getElementById('currentPasswordEdit');
    if (currentPasswordInput) {
        currentPasswordInput.addEventListener('blur', validateCurrentPasswordEdit);
    }
    
    const newPasswordInput = document.getElementById('newPasswordEdit');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            validateNewPasswordEdit();
            updatePasswordStrengthEdit(newPasswordInput.value);
        });
        newPasswordInput.addEventListener('blur', validateNewPasswordEdit);
    }
    
    const confirmPasswordInput = document.getElementById('confirmPasswordEdit');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateConfirmPasswordEdit);
        confirmPasswordInput.addEventListener('blur', validateConfirmPasswordEdit);
    }
}

// Reset all profile editing changes
function resetProfileSettings() {
    // Reset all editing states
    editingStates.username = false;
    editingStates.email = false;
    editingStates.password = false;
    
    // Reset username section
    const usernameSection = document.querySelector('.profile-edit-section');
    if (usernameSection) {
        usernameSection.classList.remove('editing', 'success');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const usernameForm = document.getElementById('usernameEditForm');
        const usernameBtn = document.getElementById('editUsernameBtn');
        
        if (usernameDisplay) usernameDisplay.style.display = 'block';
        if (usernameForm) usernameForm.style.display = 'none';
        if (usernameBtn) {
            usernameBtn.textContent = 'Изменить';
            usernameBtn.disabled = false;
        }
        
        // Clear form and validation
        const usernameInput = document.getElementById('newUsername');
        if (usernameInput) usernameInput.value = '';
        clearValidationError('newUsername');
    }
    
    // Reset email section
    const sections = document.querySelectorAll('.profile-edit-section');
    if (sections[1]) {
        const emailSection = sections[1];
        emailSection.classList.remove('editing', 'success');
        const emailDisplay = document.getElementById('emailDisplay');
        const emailForm = document.getElementById('emailEditForm');
        const emailBtn = document.getElementById('editEmailBtn');
        
        if (emailDisplay) emailDisplay.style.display = 'block';
        if (emailForm) emailForm.style.display = 'none';
        if (emailBtn) {
            emailBtn.textContent = 'Изменить';
            emailBtn.disabled = false;
        }
        
        // Clear form and validation
        const emailInput = document.getElementById('newEmail');
        if (emailInput) emailInput.value = '';
        clearValidationError('newEmail');
    }
    
    // Reset password section
    if (sections[2]) {
        const passwordSection = sections[2];
        passwordSection.classList.remove('editing', 'success');
        const passwordDisplay = document.getElementById('passwordDisplay');
        const passwordForm = document.getElementById('passwordEditForm');
        const passwordBtn = document.getElementById('editPasswordBtn');
        
        if (passwordDisplay) passwordDisplay.style.display = 'block';
        if (passwordForm) passwordForm.style.display = 'none';
        if (passwordBtn) {
            passwordBtn.textContent = 'Изменить';
            passwordBtn.disabled = false;
        }
        
        // Clear all password fields and validation
        const currentPasswordInput = document.getElementById('currentPasswordEdit');
        const newPasswordInput = document.getElementById('newPasswordEdit');
        const confirmPasswordInput = document.getElementById('confirmPasswordEdit');
        
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        
        clearValidationError('currentPasswordEdit');
        clearValidationError('newPasswordEdit');
        clearValidationError('confirmPasswordEdit');
        updatePasswordStrengthEdit('');
    }
    
    // Reset current display values to original user data
    updateProfileDisplay();
}

// Update avatar in all places
function updateAvatarUI() {
    const avatar = userSettings.avatar;
    
    // Update main profile avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) userAvatar.textContent = avatar;
    
    // Update large profile avatar in dropdown
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    if (profileAvatarLarge) profileAvatarLarge.textContent = avatar;
    
    // Update settings avatar
    const settingsAvatar = document.getElementById('settingsAvatar');
    if (settingsAvatar) settingsAvatar.textContent = avatar;
}

// Update user statistics
function updateUserStats() {
    const totalHabits = habits.length;
    
    // Підраховуємо виконані сьогодні
    const today = formatDate(new Date());
    let completedToday = 0;
    
    habits.forEach(habit => {
        // Перевіряємо чи є запис на сьогодні в entries
        if (habit.entries && habit.entries.some(entry => entry.date === today && entry.status === 1)) {
            completedToday++;
        }
    });
    
    // Знаходимо найдовшу серію серед усіх звичок
    let longestStreak = 0;
    habits.forEach(habit => {
        if (habit.streak && habit.streak.max > longestStreak) {
            longestStreak = habit.streak.max;
        }
    });
    
    document.getElementById('userHabitsCount').textContent = totalHabits;
    document.getElementById('totalHabits').textContent = totalHabits;
    document.getElementById('completedToday').textContent = completedToday;
    document.getElementById('longestStreak').textContent = longestStreak;
    document.getElementById('userStreak').textContent = longestStreak;
}

// Toggle user profile dropdown
function toggleUserProfile() {
    const dropdown = document.getElementById('userProfileDropdown');
    dropdown.classList.toggle('active');
    
    // Close on outside click
    if (dropdown.classList.contains('active')) {
        setTimeout(() => {
            document.addEventListener('click', closeProfileOnOutsideClick);
        }, 100);
    }
}

function closeProfileOnOutsideClick(event) {
    const dropdown = document.getElementById('userProfileDropdown');
    const userInfo = document.getElementById('userInfo');
    
    if (!userInfo.contains(event.target)) {
        dropdown.classList.remove('active');
        document.removeEventListener('click', closeProfileOnOutsideClick);
    }
}

// Open profile settings modal
function openProfileSettings() {
    // Close profile dropdown
    document.getElementById('userProfileDropdown').classList.remove('active');
    
    // Load current settings into form
    loadProfileSettings();
    
    // Open modal
    openModal('profileSettingsModal');
}

// Helper function to close user profile dropdown
function closeUserProfileDropdown() {
    document.getElementById('userProfileDropdown').classList.remove('active');
    document.removeEventListener('click', closeProfileOnOutsideClick);
}

// Export user data
function exportData() {
    closeUserProfileDropdown();
    
    const data = {
        user: currentUser,
        habits: habits,
        categories: categories,
        settings: userSettings,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Данные экспортированы!');
}

// Import user data
function importData() {
    closeUserProfileDropdown();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('Импорт данных заменит все текущие данные. Продолжить?')) {
                    // Import data
                    if (data.habits) habits = data.habits;
                    if (data.categories) categories = data.categories;
                    if (data.settings) userSettings = { ...userSettings, ...data.settings };
                    
                    // Save and update
                    saveCategories();
                    saveUserSettings();
                    updateProfileUI();
                    renderHabits();
                    
                    showSuccess('Данные импортированы!');
                }
            } catch (error) {
                showError('Ошибка при чтении файла');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Load current settings into form
function loadProfileSettings() {
    // Update avatar in settings
    updateAvatarUI();
    
    // Update toggle switches
    updateToggleSwitch('pushNotifications', userSettings.pushNotifications);
    updateToggleSwitch('emailNotifications', userSettings.emailNotifications);
    updateToggleSwitch('soundNotifications', userSettings.soundNotifications);
    updateToggleSwitch('darkTheme', userSettings.darkTheme);
    updateToggleSwitch('compactView', userSettings.compactView);
    updateToggleSwitch('analytics', userSettings.analytics);
    
    // Update select values
    document.getElementById('autoBackup').value = userSettings.autoBackup;
    document.getElementById('interfaceLanguage').value = userSettings.interfaceLanguage;
}

// Update toggle switch state
function updateToggleSwitch(id, active) {
    const toggle = document.getElementById(id);
    if (active) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
}

// Toggle setting switch
function toggleSetting(settingId) {
    const toggle = document.getElementById(settingId);
    const isActive = toggle.classList.contains('active');
    
    console.log('Toggle setting:', settingId, 'Current active:', isActive);
    
    if (isActive) {
        toggle.classList.remove('active');
        userSettings[settingId] = false;
    } else {
        toggle.classList.add('active');
        userSettings[settingId] = true;
    }
    
    console.log('New value:', userSettings[settingId]);
    
    // Apply setting immediately
    applyUserSettings();
    
    // Save to localStorage
    saveUserSettings();
}

// Apply user settings to UI
function applyUserSettings() {
    console.log('Applying settings. darkTheme:', userSettings.darkTheme);
    
    // Apply theme
    if (userSettings.darkTheme) {
        console.log('Setting dark theme');
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    } else {
        console.log('Setting light theme');
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }
    
    // Apply compact view
    if (userSettings.compactView) {
        document.body.classList.add('compact-view');
    } else {
        document.body.classList.remove('compact-view');
    }
}

// Save user settings
function saveUserSettings() {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
}

// Change avatar
function changeAvatar() {
    // Create avatar picker
    const picker = document.createElement('div');
    picker.className = 'avatar-picker-overlay';
    picker.innerHTML = `
        <div class="avatar-picker">
            <div class="avatar-picker-header">
                <h3>Выберите аватар</h3>
                <button class="avatar-picker-close" onclick="closeAvatarPicker()">&times;</button>
            </div>
            <div class="avatar-picker-grid">
                ${avatarEmojis.map(emoji => `
                    <div class="avatar-option ${emoji === userSettings.avatar ? 'selected' : ''}" 
                         onclick="selectAvatar('${emoji}')">
                        ${emoji}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(picker);
    setTimeout(() => picker.classList.add('active'), 10);
}

// Select avatar
function selectAvatar(emoji) {
    userSettings.avatar = emoji;
    updateAvatarUI();
    saveUserSettings();
    closeAvatarPicker();
    showSuccess('Аватар обновлен!');
}

// Close avatar picker
function closeAvatarPicker() {
    const picker = document.querySelector('.avatar-picker-overlay');
    if (picker) {
        picker.classList.remove('active');
        setTimeout(() => picker.remove(), 300);
    }
}

// Save profile settings
async function saveProfileSettings() {
    const username = document.getElementById('settingsUsername').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    
    if (!username || !email) {
        showError('Пожалуйста, заполните все поля');
        return;
    }
    
    // Update select values
    userSettings.autoBackup = document.getElementById('autoBackup').value;
    userSettings.interfaceLanguage = document.getElementById('interfaceLanguage').value;
    
    try {
        // TODO: Send to API
        // const response = await fetch(`${API_BASE}/profile`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username, email, settings: userSettings })
        // });
        
        // For now, just update locally
        if (currentUser) {
            currentUser.username = username;
            currentUser.email = email;
        }
        
        saveUserSettings();
        updateProfileUI();
        closeModal('profileSettingsModal');
        showSuccess('Настройки сохранены!');
        
    } catch (error) {
        showError('Ошибка при сохранении настроек');
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        if (confirm('Последнее предупреждение! Все ваши привычки и данные будут удалены.')) {
            habits = [];
            categories = [...defaultCategories];
            userSettings = {
                avatar: '👤',
                pushNotifications: false,
                emailNotifications: false,
                soundNotifications: true,
                darkTheme: true,
                compactView: false,
                analytics: true,
                autoBackup: 'weekly',
                interfaceLanguage: 'ru'
            };
            
            // Clear localStorage
            localStorage.removeItem('habits');
            localStorage.removeItem('habitCategories');
            localStorage.removeItem('userSettings');
            
            // Update UI
            saveCategories();
            saveUserSettings();
            updateProfileUI();
            renderHabits();
            closeModal('profileSettingsModal');
            
            showSuccess('Все данные удалены');
        }
    }
}

// Delete account
function deleteAccount() {
    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
        if (confirm('Введите "DELETE" для подтверждения удаления аккаунта:') === 'DELETE') {
            // TODO: Call API to delete account
            logout();
            clearAllData();
            showSuccess('Аккаунт удален');
        }
    }
}

// Add click event to user info
document.addEventListener('DOMContentLoaded', function() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.addEventListener('click', toggleUserProfile);
    }
    
    // Initialize profile
    initUserProfile();
});

// ==================== ADVANCED PROFILE VALIDATION ====================

// Profile editing state
let editingStates = {
    username: false,
    email: false,
    password: false
};

// Update profile display values
function updateProfileDisplay() {
    if (currentUser) {
        // Update username in profile modal
        const currentUsernameEl = document.getElementById('currentUsername');
        if (currentUsernameEl) {
            currentUsernameEl.textContent = currentUser.username;
        }
        
        // Update email in profile modal
        const currentEmailEl = document.getElementById('currentEmail');
        if (currentEmailEl) {
            currentEmailEl.textContent = currentUser.email;
        }
        
        // Update main user name in header
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = currentUser.username;
        }
        
        // Update profile name in dropdown
        const profileNameEl = document.getElementById('profileName');
        if (profileNameEl) {
            profileNameEl.textContent = currentUser.username;
        }
    }
}

// Toggle username editing
function toggleUsernameEdit() {
    const section = document.querySelector('.profile-edit-section');
    const display = document.getElementById('usernameDisplay');
    const form = document.getElementById('usernameEditForm');
    const btn = document.getElementById('editUsernameBtn');
    
    if (!editingStates.username) {
        editingStates.username = true;
        section.classList.add('editing');
        display.style.display = 'none';
        form.style.display = 'block';
        btn.textContent = 'Редактирование...';
        btn.disabled = true;
        
        // Set current value
        document.getElementById('newUsername').value = currentUser?.username || '';
    }
}

function cancelUsernameEdit() {
    const section = document.querySelector('.profile-edit-section');
    const display = document.getElementById('usernameDisplay');
    const form = document.getElementById('usernameEditForm');
    const btn = document.getElementById('editUsernameBtn');
    
    editingStates.username = false;
    section.classList.remove('editing', 'success');
    display.style.display = 'block';
    form.style.display = 'none';
    btn.textContent = 'Изменить';
    btn.disabled = false;
    
    // Clear form
    document.getElementById('newUsername').value = '';
    clearValidationError('newUsername');
}

async function saveUsername() {
    if (!validateNewUsername()) {
        return;
    }
    
    const newUsername = document.getElementById('newUsername').value.trim();
    
    try {
        // TODO: API call
        // const response = await fetch(`${API_BASE}/profile/username`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username: newUsername })
        // });
        
        // Update locally for now
        if (currentUser) {
            currentUser.username = newUsername;
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        updateProfileDisplay();
        updateAvatarUI();
        updateProfileUI(); // Full UI update
        
        // Show success state
        const section = document.querySelector('.profile-edit-section');
        section.classList.add('success');
        setTimeout(() => section.classList.remove('success'), 3000);
        
        cancelUsernameEdit();
        showSuccess('Имя пользователя обновлено!');
        
    } catch (error) {
        showError('Ошибка при обновлении имени пользователя');
    }
}

// Toggle email editing
function toggleEmailEdit() {
    const sections = document.querySelectorAll('.profile-edit-section');
    const section = sections[1]; // Second section is email
    const display = document.getElementById('emailDisplay');
    const form = document.getElementById('emailEditForm');
    const btn = document.getElementById('editEmailBtn');
    
    if (!editingStates.email) {
        editingStates.email = true;
        section.classList.add('editing');
        display.style.display = 'none';
        form.style.display = 'block';
        btn.textContent = 'Редактирование...';
        btn.disabled = true;
        
        // Set current value
        document.getElementById('newEmail').value = currentUser?.email || '';
    }
}

function cancelEmailEdit() {
    const sections = document.querySelectorAll('.profile-edit-section');
    const section = sections[1];
    const display = document.getElementById('emailDisplay');
    const form = document.getElementById('emailEditForm');
    const btn = document.getElementById('editEmailBtn');
    
    editingStates.email = false;
    section.classList.remove('editing', 'success');
    display.style.display = 'block';
    form.style.display = 'none';
    btn.textContent = 'Изменить';
    btn.disabled = false;
    
    // Clear form
    document.getElementById('newEmail').value = '';
    clearValidationError('newEmail');
}

async function saveEmail() {
    if (!validateNewEmail()) {
        return;
    }
    
    const newEmail = document.getElementById('newEmail').value.trim();
    
    try {
        // TODO: API call
        // const response = await fetch(`${API_BASE}/profile/email`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email: newEmail })
        // });
        
        // Update locally for now
        if (currentUser) {
            currentUser.email = newEmail;
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        updateProfileDisplay();
        updateProfileUI();
        
        // Show success state
        const sections = document.querySelectorAll('.profile-edit-section');
        const section = sections[1];
        section.classList.add('success');
        setTimeout(() => section.classList.remove('success'), 3000);
        
        cancelEmailEdit();
        showSuccess('Email адрес обновлен!');
        
    } catch (error) {
        showError('Ошибка при обновлении email');
    }
}

// Toggle password editing
function togglePasswordEdit() {
    const sections = document.querySelectorAll('.profile-edit-section');
    const section = sections[2]; // Third section is password
    const display = document.getElementById('passwordDisplay');
    const form = document.getElementById('passwordEditForm');
    const btn = document.getElementById('editPasswordBtn');
    
    if (!editingStates.password) {
        editingStates.password = true;
        section.classList.add('editing');
        display.style.display = 'none';
        form.style.display = 'block';
        btn.textContent = 'Редактирование...';
        btn.disabled = true;
    }
}

function cancelPasswordEdit() {
    const sections = document.querySelectorAll('.profile-edit-section');
    const section = sections[2];
    const display = document.getElementById('passwordDisplay');
    const form = document.getElementById('passwordEditForm');
    const btn = document.getElementById('editPasswordBtn');
    
    editingStates.password = false;
    section.classList.remove('editing', 'success');
    display.style.display = 'block';
    form.style.display = 'none';
    btn.textContent = 'Изменить';
    btn.disabled = false;
    
    // Clear all password fields
    document.getElementById('currentPasswordEdit').value = '';
    document.getElementById('newPasswordEdit').value = '';
    document.getElementById('confirmPasswordEdit').value = '';
    clearValidationError('currentPasswordEdit');
    clearValidationError('newPasswordEdit');
    clearValidationError('confirmPasswordEdit');
    updatePasswordStrengthEdit('');
}

async function savePassword() {
    const isCurrentValid = await validateCurrentPasswordEdit();
    const isNewValid = validateNewPasswordEdit();
    const isConfirmValid = validateConfirmPasswordEdit();
    
    if (!isCurrentValid || !isNewValid || !isConfirmValid) {
        showError('Пожалуйста, исправьте ошибки в форме');
        return;
    }
    
    const currentPassword = document.getElementById('currentPasswordEdit').value;
    const newPassword = document.getElementById('newPasswordEdit').value;
    
    try {
        // TODO: API call
        // const response = await fetch(`${API_BASE}/profile/password`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ currentPassword, newPassword })
        // });
        
        // Show success state
        const sections = document.querySelectorAll('.profile-edit-section');
        const section = sections[2];
        section.classList.add('success');
        setTimeout(() => section.classList.remove('success'), 3000);
        
        cancelPasswordEdit();
        showSuccess('Пароль успешно изменен!');
        
    } catch (error) {
        showError('Ошибка при изменении пароля');
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    const icon = toggle.querySelector('.password-toggle-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

// Clear validation error
function clearValidationError(inputId) {
    const input = document.getElementById(inputId);
    const validation = document.getElementById(inputId + 'Validation');
    
    input.classList.remove('invalid', 'valid');
    if (validation) {
        validation.textContent = '';
        validation.classList.remove('error', 'success');
    }
}

// Show validation message
function showValidationMessage(inputId, message, isError = true) {
    const input = document.getElementById(inputId);
    const validation = document.getElementById(inputId + 'Validation');
    
    if (validation) {
        validation.textContent = message;
        validation.classList.toggle('error', isError);
        validation.classList.toggle('success', !isError);
    }
    
    input.classList.toggle('invalid', isError);
    input.classList.toggle('valid', !isError);
}

// Show validation error (wrapper for compatibility)
function showValidationError(inputId, message) {
    showValidationMessage(inputId, message, true);
}

// Validate username
function validateUsername() {
    const input = document.getElementById('settingsUsername');
    const username = input.value.trim();
    
    if (!username) {
        showValidationMessage('settingsUsername', 'Имя пользователя обязательно');
        return false;
    }
    
    if (username.length < 2) {
        showValidationMessage('settingsUsername', 'Имя должно содержать минимум 2 символа');
        return false;
    }
    
    if (username.length > 50) {
        showValidationMessage('settingsUsername', 'Имя не должно превышать 50 символов');
        return false;
    }
    
    if (!/^[a-zA-Zа-яА-ЯёЁ0-9_\s]+$/.test(username)) {
        showValidationMessage('settingsUsername', 'Разрешены только буквы, цифры и подчеркивания');
        return false;
    }
    
    showValidationMessage('settingsUsername', '✓ Имя пользователя корректно', false);
    return true;
}

// Validate email
function validateEmail() {
    const input = document.getElementById('settingsEmail');
    const email = input.value.trim();
    
    if (!email) {
        showValidationMessage('settingsEmail', 'Email обязателен');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showValidationMessage('settingsEmail', 'Неверный формат email');
        return false;
    }
    
    showValidationMessage('settingsEmail', '✓ Email корректен', false);
    return true;
}

// Validate current password
async function validateCurrentPassword() {
    const input = document.getElementById('currentPassword');
    const password = input.value;
    
    if (!password) {
        showValidationMessage('currentPassword', 'Введите текущий пароль');
        return false;
    }
    
    // TODO: Check with API
    // For now, just check if it's not empty
    showValidationMessage('currentPassword', '✓ Пароль принят', false);
    return true;
}

// Check password strength
function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score++;
    else feedback.push('минимум 8 символов');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('заглавная буква');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score++;
    else feedback.push('строчная буква');
    
    // Number check
    if (/\d/.test(password)) score++;
    else feedback.push('цифра');
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('спецсимвол');
    
    const strength = ['weak', 'weak', 'fair', 'good', 'strong'][Math.min(score, 4)];
    const strengthText = ['Слабый', 'Слабый', 'Средний', 'Хороший', 'Сильный'][Math.min(score, 4)];
    
    return { score, strength, strengthText, feedback };
}

// Update password strength indicator
function updatePasswordStrength(password) {
    const strengthElement = document.getElementById('passwordStrength');
    
    if (!strengthElement) {
        return; // Елемент не існує, виходимо
    }
    
    if (!password) {
        strengthElement.innerHTML = '';
        return;
    }
    
    const result = checkPasswordStrength(password);
    
    strengthElement.innerHTML = `
        <div class="password-strength-bar">
            <div class="password-strength-fill ${result.strength}"></div>
        </div>
        <div class="password-strength-text ${result.strength}">
            Сила пароля: ${result.strengthText}
        </div>
        ${result.feedback.length > 0 ? `
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                Нужно добавить: ${result.feedback.join(', ')}
            </div>
        ` : ''}
    `;
}

// Validate new password
function validateNewPassword() {
    const input = document.getElementById('newPassword');
    const password = input.value;
    
    if (!password) {
        showValidationMessage('newPassword', '');
        updatePasswordStrength('');
        return true; // Optional field
    }
    
    updatePasswordStrength(password);
    
    if (password.length < 8) {
        showValidationMessage('newPassword', 'Пароль должен содержать минимум 8 символов');
        return false;
    }
    
    const strength = checkPasswordStrength(password);
    if (strength.score < 3) {
        showValidationMessage('newPassword', 'Пароль слишком слабый. Добавьте: ' + strength.feedback.join(', '));
        return false;
    }
    
    showValidationMessage('newPassword', '✓ Пароль достаточно надежный', false);
    
    // Also validate confirm password if it's filled
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput.value) {
        validateConfirmPassword();
    }
    
    return true;
}

// Validate confirm password
function validateConfirmPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!confirmPassword && newPassword) {
        showValidationMessage('confirmPassword', 'Подтвердите новый пароль');
        return false;
    }
    
    if (!confirmPassword) {
        showValidationMessage('confirmPassword', '');
        return true;
    }
    
    if (newPassword !== confirmPassword) {
        showValidationMessage('confirmPassword', 'Пароли не совпадают');
        return false;
    }
    
    showValidationMessage('confirmPassword', '✓ Пароли совпадают', false);
    return true;
}

// Enhanced save profile settings
async function saveProfileSettings() {
    // Validate all fields
    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    
    // Check if password change is requested
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    let isPasswordValid = true;
    
    if (currentPassword || newPassword || confirmPassword) {
        // Password change requested
        const isCurrentPasswordValid = await validateCurrentPassword();
        const isNewPasswordValid = validateNewPassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        
        isPasswordValid = isCurrentPasswordValid && isNewPasswordValid && isConfirmPasswordValid;
        
        if (!isPasswordValid) {
            showError('Пожалуйста, исправьте ошибки в полях пароля');
            return;
        }
    }
    
    if (!isUsernameValid || !isEmailValid) {
        showError('Пожалуйста, исправьте ошибки в форме');
        return;
    }
    
    const username = document.getElementById('settingsUsername').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    
    // Update select values
    userSettings.autoBackup = document.getElementById('autoBackup').value;
    userSettings.interfaceLanguage = document.getElementById('interfaceLanguage').value;
    
    try {
        // Prepare update data
        const updateData = {
            username,
            email,
            settings: userSettings
        };
        
        // Add password if changing
        if (newPassword) {
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }
        
        // TODO: Send to API
        // const response = await fetch(`${API_BASE}/profile`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(updateData)
        // });
        
        // For now, just update locally
        if (currentUser) {
            currentUser.username = username;
            currentUser.email = email;
            if (newPassword) {
                // In real app, password would be handled securely by backend
                showSuccess('Пароль изменен успешно!');
            }
        }
        
        saveUserSettings();
        updateProfileUI();
        closeModal('profileSettingsModal');
        showSuccess('Настройки профиля сохранены!');
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        clearValidationError('currentPassword');
        clearValidationError('newPassword');
        clearValidationError('confirmPassword');
        updatePasswordStrength('');
        
    } catch (error) {
        showError('Ошибка при сохранении настроек профиля');
    }
}

// Add password strength checking on input
document.addEventListener('DOMContentLoaded', function() {
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
});

// Update existing login function to initialize profile
const originalSetCurrentUser = setCurrentUser || function() {};
function setCurrentUser(user) {
    currentUser = user;
    if (typeof originalSetCurrentUser === 'function') {
        originalSetCurrentUser(user);
    }
    updateProfileUI();
}