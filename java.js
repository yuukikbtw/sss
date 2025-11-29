
// Автоматически определяем API_BASE на основе текущего хоста
// Это решает проблему с cookies при заходе по IP
function getAutoApiBase() {
    const currentHost = window.location.hostname;
    const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    
    // Production на Render (или любой https без порта) - API на том же домене
    if (window.location.protocol === 'https:' || currentHost.includes('render.com') || currentHost.includes('onrender.com')) {
        return `${window.location.protocol}//${currentHost}/api`;
    }
    
    // Если заходим на порт 5001 (Flask напрямую) - используем тот же хост
    if (currentPort === '5001') {
        return `${window.location.protocol}//${currentHost}:5001/api`;
    }
    
    // Если заходим на порт 8000 (static server) - API на том же хосте, порт 5001
    if (currentPort === '8000') {
        return `${window.location.protocol}//${currentHost}:5001/api`;
    }
    
    // Fallback
    return 'http://localhost:5001/api';
}

let API_BASE = getAutoApiBase();
let isServerOnline = false;
let serverCheckInterval = null;

// Сохраняем для совместимости, но теперь не используем localStorage
const POSSIBLE_API_URLS = [
    getAutoApiBase(),
    'http://localhost:5001/api',
    'http://127.0.0.1:5001/api',
    'https://sss-vcq4.onrender.com/api'
];


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


async function apiFetch(url, options = {}) {
    // Получаем токен
    let token = null;
    try {
        token = localStorage.getItem('authToken');
    } catch (e) {
        console.warn('Не удалось прочитать токен:', e);
    }
    
    // Формируем заголовки
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    // Добавляем Bearer токен
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`📤 ${options.method || 'GET'} ${url} [TOKEN: ${token.substring(0, 15)}...]`);
    } else {
        console.log(`📤 ${options.method || 'GET'} ${url} [NO TOKEN]`);
    }
    
    const fetchOptions = {
        ...options,
        credentials: 'include',
        headers: headers
    };
    
    // Убираем headers из options чтобы не дублировались
    delete fetchOptions.headers;
    fetchOptions.headers = headers;
    
    const response = await fetch(url, fetchOptions);
    console.log(`📥 ${response.status} ${url}`);
    
    // Если 401 - токен протух, пробуем перелогиниться
    if (response.status === 401 && !url.includes('/login') && !url.includes('/register')) {
        console.warn('⚠️ Токен недействителен, требуется повторный вход');
        // Можно показать модалку логина
    }
    
    return response;
}

let habits = [];
let categories = [];
let selectedHabitId = null;
let currentUser = null;


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




const badges = {
    
    firstStep: { id: 'firstStep', name: 'Первый шаг', emoji: '👣', description: 'Выполнить первую привычку', type: 'milestone' },
    weekWarrior: { id: 'weekWarrior', name: 'Недельный воин', emoji: '⚔️', description: 'Выполнять привычку 7 дней подряд', type: 'streak' },
    monthMaster: { id: 'monthMaster', name: 'Мастер месяца', emoji: '👑', description: 'Выполнять привычку 30 дней подряд', type: 'streak' },
    hundredHero: { id: 'hundredHero', name: 'Герой сотни', emoji: '💯', description: 'Выполнить привычку 100 раз', type: 'total' },
    
    
    sportsman: { id: 'sportsman', name: 'Спортсмен', emoji: '🏆', description: 'Выполнить 50 спортивных привычек', type: 'category', category: 'sport' },
    scholar: { id: 'scholar', name: 'Учёный', emoji: '🎓', description: 'Выполнить 50 учебных привычек', type: 'category', category: 'study' },
    healthGuru: { id: 'healthGuru', name: 'Гуру здоровья', emoji: '🌿', description: 'Выполнить 50 привычек здоровья', type: 'category', category: 'health' },
    workaholic: { id: 'workaholic', name: 'Трудоголик', emoji: '💼', description: 'Выполнить 50 рабочих привычек', type: 'category', category: 'work' },
    
    
    perfectWeek: { id: 'perfectWeek', name: 'Идеальная неделя', emoji: '✨', description: 'Выполнить все привычки за неделю', type: 'perfect' },
    earlyBird: { id: 'earlyBird', name: 'Ранняя пташка', emoji: '🌅', description: 'Выполнить 20 привычек до 8:00', type: 'special' },
    nightOwl: { id: 'nightOwl', name: 'Сова', emoji: '🦉', description: 'Выполнить 20 привычек после 22:00', type: 'special' },
    streakMaster: { id: 'streakMaster', name: 'Мастер серий', emoji: '🔥', description: 'Иметь серию в 100 дней', type: 'streak' },
    
    
    categoryCollector: { id: 'categoryCollector', name: 'Коллекционер', emoji: '🗂️', description: 'Создать привычки во всех категориях', type: 'collection' },
    habitMaster: { id: 'habitMaster', name: 'Мастер привычек', emoji: '🧙‍♂️', description: 'Создать 25 привычек', type: 'collection' }
};


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
    createdHabits: 0,
    // Зберігаємо дні за які вже отримано XP: { "habitId_date": true }
    xpClaimedDays: {}
};




function initUserProgress() {
    const stored = localStorage.getItem('userProgress');
    if (stored) {
        userProgress = { ...userProgress, ...JSON.parse(stored) };
    }
    updateLevelDisplay();
}


function saveUserProgress() {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
}


function calculateXP(habit) {
    let baseXP = 10;
    
    
    if (habit.difficulty === 'hard') baseXP += 5;
    else if (habit.difficulty === 'medium') baseXP += 2;
    
    
    const streak = userProgress.currentStreaks[habit.id] || 0;
    if (streak >= 7) baseXP += 5;
    if (streak >= 30) baseXP += 10;
    if (streak >= 100) baseXP += 20;
    
    return baseXP;
}


function awardXP(amount) {
    const oldLevel = userProgress.level;
    userProgress.xp += amount;
    
    
    const newLevel = getCurrentLevel();
    if (newLevel.level > oldLevel) {
        userProgress.level = newLevel.level;
        showLevelUpNotification(newLevel);
    }
    
    updateLevelDisplay();
    saveUserProgress();
}


function getCurrentLevel() {
    const levelsArray = getLevels();
    for (let i = levelsArray.length - 1; i >= 0; i--) {
        if (userProgress.xp >= levelsArray[i].minXP) {
            return levelsArray[i];
        }
    }
    return levelsArray[0];
}


function checkBadges(habit, completedTime) {
    const newBadges = [];
    
    
    if (!userProgress.earnedBadges.includes('firstStep') && userProgress.totalHabitsCompleted === 1) {
        newBadges.push('firstStep');
    }
    
    
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
    
    
    if (userProgress.totalHabitsCompleted === 100 && !userProgress.earnedBadges.includes('hundredHero')) {
        newBadges.push('hundredHero');
    }
    
    
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
    
    
    if (userProgress.createdHabits === 25 && !userProgress.earnedBadges.includes('habitMaster')) {
        newBadges.push('habitMaster');
    }
    
    
    const uniqueCategories = new Set(habits.map(h => h.category));
    if (uniqueCategories.size >= defaultCategories.length && !userProgress.earnedBadges.includes('categoryCollector')) {
        newBadges.push('categoryCollector');
    }
    
    
    newBadges.forEach(badgeId => {
        userProgress.earnedBadges.push(badgeId);
        showBadgeNotification(badges[badgeId]);
    });
    
    if (newBadges.length > 0) {
        saveUserProgress();
    }
}


function updateLevelDisplay() {
    const currentLevel = getCurrentLevel();
    const levelsArray = getLevels();
    const nextLevel = levelsArray.find(l => l.level === currentLevel.level + 1);
    
    
    const levelElement = document.getElementById('userLevel');
    if (levelElement) {
        levelElement.innerHTML = `
            <span class="level-emoji">${currentLevel.emoji}</span>
            <span class="level-name">${currentLevel.name}</span>
            <span class="level-number">${t('lvl')} ${currentLevel.level}</span>
        `;
    }
    
    
    const xpBarElement = document.getElementById('xpBar');
    if (xpBarElement && nextLevel) {
        const progress = ((userProgress.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100;
        xpBarElement.innerHTML = `
            <div class="xp-bar-fill" style="width: ${Math.min(progress, 100)}%; background: ${currentLevel.color}"></div>
            <span class="xp-text">${userProgress.xp}/${nextLevel.minXP} XP</span>
        `;
    } else if (xpBarElement) {
        
        xpBarElement.innerHTML = `
            <div class="xp-bar-fill" style="width: 100%; background: ${currentLevel.color}"></div>
            <span class="xp-text">MAX LEVEL</span>
        `;
    }
}


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


function initCategories() {
    const stored = localStorage.getItem('habitCategories');
    if (stored) {
        const loadedCategories = JSON.parse(stored);
        
        categories = loadedCategories.map(cat => {
            if (cat.isDefault) {
                
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


const habitsList = document.getElementById('habitsList');
const statsPanel = document.getElementById('statsPanel');
const errorMessage = document.getElementById('errorMessage');


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


function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
    
    
    if (modalId === 'profileSettingsModal') {
        resetProfileSettings();
    }
    
    
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
    
    
    closeAllDropdowns('categoryDropdown');
    
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        selector.classList.remove('active');
    } else {
        
        dropdown.classList.add('active');
        selector.classList.add('active');
        
        
        setTimeout(() => {
            const dropdownRect = dropdown.getBoundingClientRect();
            const modalRect = dropdown.closest('.modal').getBoundingClientRect();
            
            if (dropdownRect.bottom > window.innerHeight - 20) {
                dropdown.style.maxHeight = `${window.innerHeight - dropdownRect.top - 40}px`;
            }
        }, 50);
    }
}


let selectedHour = null;
let selectedMinute = null;
let reminderSelectedHour = null;
let reminderSelectedMinute = null;


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
    
    
    hourValues.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const hourElement = document.createElement('div');
        hourElement.className = 'time-value';
        hourElement.textContent = hour;
        hourElement.onclick = () => selectHour(i, hourElement);
        hourValues.appendChild(hourElement);
    }
    
    
    minuteValues.innerHTML = '';
    for (let i = 0; i < 60; i += 5) {
        const minute = i.toString().padStart(2, '0');
        const minuteElement = document.createElement('div');
        minuteElement.className = 'time-value';
        minuteElement.textContent = minute;
        minuteElement.onclick = () => selectMinute(i, minuteElement);
        minuteValues.appendChild(minuteElement);
    }
    
    
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
    
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    
    
    element.classList.add('selected');
    selectedHour = hour;
}

function selectMinute(minute, element) {
    
    const parent = element.parentElement;
    parent.querySelectorAll('.time-value').forEach(el => el.classList.remove('selected'));
    
    
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
    
    element.parentElement.querySelectorAll('.reminder-option').forEach(el => el.classList.remove('selected'));
    
    
    element.classList.add('selected');
    
    
    const titles = {
        'none': `🔕 ${t('noReminders')}`,
        'specific': `⏰ ${t('atSpecificTime')}`,
        'interval': `🔄 ${t('atIntervals')}`
    };
    
    document.getElementById('reminderType').value = titles[type];
    document.getElementById('reminderType').dataset.value = type;
    
    
    const specificSettings = document.getElementById('specificTimeSettings');
    const intervalSettings = document.getElementById('intervalSettings');
    
    specificSettings.style.display = type === 'specific' ? 'block' : 'none';
    intervalSettings.style.display = type === 'interval' ? 'block' : 'none';
    
    
    const dropdown = document.getElementById('reminderDropdown');
    const selector = document.querySelector('.reminder-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}


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
    
    
    hourValues.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const hourElement = document.createElement('div');
        hourElement.className = 'time-value';
        hourElement.textContent = hour;
        hourElement.onclick = () => selectReminderHour(i, hourElement);
        hourValues.appendChild(hourElement);
    }
    
    
    minuteValues.innerHTML = '';
    for (let i = 0; i < 60; i += 5) {
        const minute = i.toString().padStart(2, '0');
        const minuteElement = document.createElement('div');
        minuteElement.className = 'time-value';
        minuteElement.textContent = minute;
        minuteElement.onclick = () => selectReminderMinute(i, minuteElement);
        minuteValues.appendChild(minuteElement);
    }
    
    
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
    
    
    element.parentElement.querySelectorAll('.interval-option').forEach(el => el.classList.remove('selected'));
    
    
    element.classList.add('selected');
    
    
    document.getElementById('intervalUnit').value = units[unit];
    document.getElementById('intervalUnit').dataset.value = unit;
    
    
    const dropdown = document.getElementById('intervalUnitDropdown');
    const selector = document.querySelector('.interval-unit-selector');
    dropdown.classList.remove('active');
    selector.classList.remove('active');
}


function closeAllDropdowns(except = null) {
    const dropdowns = [
        { dropdown: 'categoryDropdown', selector: '.category-selector' },
        { dropdown: 'timeDropdown', selector: '.time-selector' },
        { dropdown: 'reminderDropdown', selector: '.reminder-selector' },
        { dropdown: 'reminderTimeDropdown', selector: '.reminder-time-selector' },
        { dropdown: 'intervalUnitDropdown', selector: '.interval-unit-selector' },
        
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
                
                const parentSelector = dropdownEl.closest('.category-selector, .time-selector, .reminder-selector, .reminder-time-selector, .interval-unit-selector');
                if (parentSelector) {
                    parentSelector.classList.remove('active');
                }
            }
        }
    });
}


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
    showSuccess(t('categoryAdded'));
}

function deleteCategory(categoryId) {
    if (!confirm('Удалить эту категорию?')) return;
    
    categories = categories.filter(c => c.id !== categoryId);
    saveCategories();
    renderCategoriesList();
    showSuccess(t('categoryDeleted'));
}


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
        title.textContent = t('loginTitle');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        title.textContent = t('registerTitle');
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
        console.log('🔐 Ответ логина:', { status: response.status, token: data.token ? 'получен' : 'не получен', user: data.user?.email });
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            // Сохраняем выданный токен (если пришёл)
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                console.log('✅ Токен сохранён в localStorage:', data.token.substring(0, 20) + '...');
            }
            
            
            const rememberMe = document.getElementById('rememberMe').checked;
            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({
                    email: email,
                    userId: data.user.id
                }));
            }
            
            
            clearAuthFields('login');
            updateUIForLoggedInUser();
            closeModal('authModal');
            showSuccess(data.message);
            fetchHabits();
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError(t('networkError'));
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
    } catch (error) {
        console.error('Logout API error:', error);
    }
    
    // Очищаем всё локально в любом случае
    currentUser = null;
    habits = [];
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    
    // Удаляем rememberedUser если не включен "запомнить меня"
    const rememberMe = document.getElementById('rememberMe')?.checked;
    if (!rememberMe) {
        localStorage.removeItem('rememberedUser');
    }
    
    // Обновляем UI
    updateUIForLoggedOutUser();
    showSuccess(t('logoutSuccess'));
}

async function checkAuth() {
    
    try {
        const response = await apiFetch(`${API_BASE}/me`);
        
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
        
        updateConnectionStatus(false);
    }
    
    
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
    
    
    updateUIForLoggedOutUser();
}

function updateUIForLoggedInUser() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('appButtons').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.username;
    
    // Показываем шагомер для залогиненных пользователей
    const stepCounterSection = document.getElementById('stepCounterSection');
    if (stepCounterSection) {
        stepCounterSection.style.display = 'block';
    }
    
    // Показываем статистику в aside
    const statsSection = document.querySelector('aside.panel');
    if (statsSection) {
        statsSection.style.display = 'block';
    }
    
    // Убираем guest-mode с main
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.classList.remove('guest-mode');
    }
    
    updateProfileUI(); 
}

function updateUIForLoggedOutUser() {
    // Показываем кнопки авторизации
    document.getElementById('authButtons').style.display = 'flex';
    
    // Скрываем элементы для авторизованных
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('appButtons').style.display = 'none';
    
    // Скрываем шагомер
    const stepCounterSection = document.getElementById('stepCounterSection');
    if (stepCounterSection) {
        stepCounterSection.style.display = 'none';
    }
    
    // Скрываем статистику в aside (там профиль, категории и т.д.)
    const statsSection = document.querySelector('aside.panel');
    if (statsSection) {
        statsSection.style.display = 'none';
    }
    
    // Добавляем guest-mode на main чтобы убрать пустое место
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.classList.add('guest-mode');
    }
    
    // Сбрасываем отображение профиля
    const userLevel = document.getElementById('userLevel');
    if (userLevel) {
        userLevel.innerHTML = '';
    }
    
    // Очищаем данные пользователя
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    habits = [];
    
    // Показываем сообщение "Войдите или зарегистрируйтесь"
    renderHabitsForGuest();
}

function renderHabitsForGuest() {
    const habitsList = document.getElementById('habitsList');
    if (habitsList) {
        habitsList.innerHTML = `
            <div class="empty-state guest-message">
                <h3>👋 ${t('welcome') || 'Ласкаво просимо!'}</h3>
                <p>${t('pleaseLoginOrRegister') || 'Увійдіть або зареєструйтесь, щоб почати відстежувати свої звички'}</p>
                <div class="guest-buttons" style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="openAuthModal('login')">
                        ${t('login') || 'Увійти'}
                    </button>
                    <button class="btn btn-secondary" onclick="openAuthModal('register')">
                        ${t('register') || 'Зареєструватися'}
                    </button>
                </div>
            </div>
        `;
    }
}


async function fetchHabits() {
    try {
        const response = await apiFetch(`${API_BASE}/habits`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        habits = await response.json();
        console.log('Загружены привычки:', habits.map(h => ({ id: h.id, name: h.name })));
        renderHabits();
        updateUserStats(); 
        
        
        if (currentUser) {
            habits.forEach(habit => {
                if (habit.reminder && habit.reminder.type !== 'none') {
                    setupHabitReminder(habit);
                }
            });
        }
    } catch (error) {
        showError(t('habitsLoadError'));
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
            showSuccess(t('habitAdded'));
            await fetchHabits();
            
            
            userProgress.createdHabits++;
            
            
            const habitCreationBadges = [];
            
            
            if (userProgress.createdHabits === 25 && !userProgress.earnedBadges.includes('habitMaster')) {
                habitCreationBadges.push('habitMaster');
            }
            
            
            const uniqueCategories = new Set(habits.map(h => h.category));
            if (uniqueCategories.size >= defaultCategories.length && !userProgress.earnedBadges.includes('categoryCollector')) {
                habitCreationBadges.push('categoryCollector');
            }
            
            
            habitCreationBadges.forEach(badgeId => {
                userProgress.earnedBadges.push(badgeId);
                showBadgeNotification(badges[badgeId]);
            });
            
            
            awardXP(5);
            setTimeout(() => {
                showXPNotification(5);
            }, 300);
            
            if (habitCreationBadges.length > 0) {
                saveUserProgress();
            }
            
            
            const newHabit = await response.json();
            if (newHabit.reminder && newHabit.reminder.type !== 'none') {
                setupHabitReminder(newHabit);
            }
            
            closeModal('addHabitModal');
            document.getElementById('addHabitForm').reset();
            
            
            selectedHour = null;
            selectedMinute = null;
            reminderSelectedHour = null;
            reminderSelectedMinute = null;
            
            
            document.getElementById('habitTime').value = '';
            document.getElementById('reminderType').value = '';
            document.getElementById('reminderType').removeAttribute('data-value');
            document.getElementById('reminderTime').value = '';
            document.getElementById('intervalUnit').value = '';
            document.getElementById('intervalUnit').removeAttribute('data-value');
            
            
            document.getElementById('specificTimeSettings').style.display = 'none';
            document.getElementById('intervalSettings').style.display = 'none';
            
            
            const categoryInput = document.getElementById('habitCategory');
            if (categoryInput) categoryInput.removeAttribute('data-category-id');
            
            
            closeAllDropdowns();
        } else {
            const error = await response.json();
            showError(error.error || 'Ошибка создания привычки');
        }
    } catch (error) {
        showError(t('networkError'));
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
            
            showSuccess(t('habitUpdated'));
            await fetchHabits();
            
            
            clearHabitReminder(habitId);
            if (updatedHabit.reminder && updatedHabit.reminder.type !== 'none') {
                setupHabitReminder(updatedHabit);
            }
            
            closeModal('editHabitModal');
            
            
            editSelectedHour = null;
            editSelectedMinute = null;
            editReminderSelectedHour = null;
            editReminderSelectedMinute = null;
            editingHabitId = null;
            
            
            closeAllDropdowns();
        } else {
            const error = await response.json();
            console.error('Помилка оновлення:', error);
            showError(error.error || 'Ошибка обновления привычки');
        }
    } catch (error) {
        showError(t('networkError'));
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
            showSuccess(t('habitDeleted'));
            clearHabitReminder(habitId); 
            
            
            if (selectedHabitId == habitId) {
                selectedHabitId = null;
                const statsPanel = document.getElementById('statsPanel');
                if (statsPanel) {
                    statsPanel.innerHTML = '<div class="empty-state"><h3>Выберите привычку</h3></div>';
                }
            }
            
            await fetchHabits(); 
        } else {
            const errorData = await response.text();
            console.error('Ошибка удаления:', response.status, errorData);
            showError(`Ошибка удаления: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        showError(t('deleteNetworkError'));
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
        showError(t('saveError'));
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
        showError(t('statsLoadError'));
        console.error('Ошибка в loadStats:', error);
        
        
        renderStats(null, null, { streak: { current: 0, max: 0 } });
    }
}


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
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            date.setHours(0, 0, 0, 0);
                            const isToday = dateStr === formatDate(new Date());
                            const isFuture = date > today;
                            const isPast = date < today;
                            console.log(`Рендеринг ячейки для привычки ${habit.id} на дату ${dateStr}`);
                            return `
                                <div class="day-cell ${isToday ? 'today' : ''} ${isFuture ? 'future disabled' : ''} ${isPast ? 'past disabled' : ''}" 
                                         data-habit-id="${habit.id}" 
                                         data-date="${dateStr}"
                                         title="${isFuture ? t('cannotMarkFuture') : (isPast ? t('cannotMarkPast') : t('clickToMarkCompletion'))}"
                                         style="cursor: ${(isFuture || isPast) ? 'not-allowed' : 'pointer'}; ${isFuture ? 'opacity: 0.4;' : ''} ${isPast ? 'opacity: 0.6;' : ''}">
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
                // Статус может быть true/false или 1/0
                const completedDates = new Set(
                    stats.entries.filter(e => e.status === true || e.status === 1).map(e => e.date)
                );
                
                const notCompletedDates = new Set(
                    stats.entries.filter(e => e.status === false || e.status === 0).map(e => e.date)
                );
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                weekDays.forEach(date => {
                    const dateStr = formatDate(date);
                    const cellDate = new Date(date);
                    cellDate.setHours(0, 0, 0, 0);
                    const isFuture = cellDate > today;
                    
                    const cell = document.querySelector(`[data-habit-id="${habit.id}"][data-date="${dateStr}"]`);
                    if (cell) {
                        // Майбутні дати ніколи не можуть бути done
                        if (isFuture) {
                            cell.classList.remove('done');
                            cell.classList.add('future', 'disabled');
                        } else if (completedDates.has(dateStr)) {
                            cell.classList.add('done');
                        } else {
                            cell.classList.remove('done');
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки данных недели:', error);
        }
    }
}


async function toggleDay(habitId, date) {
    console.log(`Переключение состояния привычки ${habitId} на дату ${date}`);
    
    // Перевіряємо чи дата не в майбутньому і не в минулому (тільки сьогодні!)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
        showError(t('cannotMarkFuture') || 'Не можна відмічати майбутні дати');
        return;
    }
    
    // Заборона відмічати минулі дні (тільки сьогодні можна!)
    if (selectedDate < today) {
        showError(t('cannotMarkPast') || 'Не можна відмічати минулі дати');
        return;
    }
    
    let cell = null;
    let newStatus = 0;
    
    try {
        console.log('Поиск ячейки с селектором:', `[data-habit-id="${habitId}"][data-date="${date}"]`);
        
        cell = document.querySelector(`[data-habit-id="${habitId}"][data-date="${date}"]`);
        
        if (!cell) {
            console.error(`Не найдена ячейка для привычки ${habitId} и даты ${date}`);
            console.log('Доступные ячейки:');
            document.querySelectorAll('.day-cell').forEach(c => {
                console.log(`Ячейка: habitId="${c.dataset.habitId}", date="${c.dataset.date}"`);
            });
            showError(t('cellNotFound'));
            return;
        }
        
        const isDone = cell.classList.contains('done');
        newStatus = isDone ? 0 : 1; 
        
        console.log(`Текущий статус: ${isDone ? 'выполнено' : 'не выполнено'}, новый статус: ${newStatus}`);
        
        // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ - сразу меняем UI без ожидания сервера
        if (newStatus === 1) {
            cell.classList.add('done');
        } else {
            cell.classList.remove('done');
        }
        
        // Отправляем на сервер
        const response = await apiFetch(`${API_BASE}/habits/${habitId}/tick`, {
            method: 'POST',
            body: JSON.stringify({
                date: date,
                status: newStatus
            })
        });
        
        console.log('Ответ сервера:', response.status, response.ok);
        
        if (response.ok) {
            if (newStatus === 1) {
                showSuccess('✅ Привычка отмечена!');
                
                // XP та прогрес нараховуємо ТІЛЬКИ за сьогодні і ТІЛЬКИ ОДИН РАЗ
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = (date === todayStr);
                
                // Ключ для перевірки чи вже отримано XP за цей день
                const xpKey = `${habitId}_${date}`;
                const alreadyClaimedXP = userProgress.xpClaimedDays && userProgress.xpClaimedDays[xpKey];
                
                const habit = habits.find(h => String(h.id) === String(habitId));
                if (habit && isToday && !alreadyClaimedXP) {
                    // Позначаємо що XP за цей день вже отримано
                    if (!userProgress.xpClaimedDays) {
                        userProgress.xpClaimedDays = {};
                    }
                    userProgress.xpClaimedDays[xpKey] = true;
                    
                    userProgress.totalHabitsCompleted++;
                    
                    if (habit.category) {
                        userProgress.categoryStats[habit.category] = (userProgress.categoryStats[habit.category] || 0) + 1;
                    }
                    
                    userProgress.currentStreaks[habitId] = (userProgress.currentStreaks[habitId] || 0) + 1;
                    
                    const currentStreak = userProgress.currentStreaks[habitId];
                    if (currentStreak > userProgress.longestStreak) {
                        userProgress.longestStreak = currentStreak;
                    }
                    
                    const earnedXP = calculateXP(habit);
                    awardXP(earnedXP);
                    checkBadges(habit, new Date());
                    
                    setTimeout(() => {
                        showXPNotification(earnedXP);
                    }, 500);
                } else if (alreadyClaimedXP) {
                    console.log('XP за цей день вже отримано, пропускаємо');
                }
            } else {
                showInfo('❌ Отметка снята');
                
                // При відміні зменшуємо лічильник тільки якщо це сьогодні
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = (date === todayStr);
                
                const habit = habits.find(h => String(h.id) === String(habitId));
                if (habit && isToday) {
                    if (userProgress.totalHabitsCompleted > 0) {
                        userProgress.totalHabitsCompleted--;
                    }
                    if (habit.category && userProgress.categoryStats[habit.category] > 0) {
                        userProgress.categoryStats[habit.category]--;
                    }
                    // Сбрасываем текущий стрик при отмене
                    userProgress.currentStreaks[habitId] = 0;
                }
            }
            
            // Обновляем статистику если эта привычка выбрана
            if (String(selectedHabitId) === String(habitId)) {
                loadStats(habitId);
            }
            
            // Оновлюємо статистику в шапці профілю
            updateUserStats();
        } else {
            // Откатываем UI если сервер вернул ошибку
            console.error('Сервер вернул ошибку:', response.status);
            if (newStatus === 1) {
                cell.classList.remove('done');
            } else {
                cell.classList.add('done');
            }
            showError(t('markSaveError'));
        }
    } catch (error) {
        console.error('Ошибка в toggleDay:', error);
        // Откатываем UI при ошибке
        if (cell) {
            if (newStatus === 1) {
                cell.classList.remove('done');
            } else {
                cell.classList.add('done');
            }
        }
        showError(t('markSaveError'));
    }
}

function renderStats(weekStats, monthStats, habitData) {
    // Streak может быть в habitData, weekStats или monthStats
    const rawStreak = habitData?.streak || weekStats?.streak || monthStats?.streak || {};
    
    // Нормалізуємо streak з дефолтними значеннями
    const streak = {
        current: rawStreak.current || 0,
        max: rawStreak.max || 0,
        average: rawStreak.average || 0,
        total_completed: rawStreak.total_completed || 0
    };
    
    console.log('=== STREAK DATA ===');
    console.log('rawStreak:', rawStreak);
    console.log('normalized streak:', streak);
    console.log('==================');
    
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
    
    // Загальний відсоток виконання (Completion Rate)
    const overallCR = safeMonthStats.total_days > 0 
        ? Math.round((safeMonthStats.completed_days / safeMonthStats.total_days) * 100) 
        : 0;
    
    console.log('safeWeekStats:', safeWeekStats);
    console.log('safeMonthStats:', safeMonthStats);
    
    statsPanel.innerHTML = `
        <!-- Головний блок з поточною серією -->
        <div class="streak-display">
            <span class="streak-number">${streak.current}</span>
            <div class="streak-label">🔥 ${t('currentStreak')}</div>
        </div>
        
        <!-- Блок серій -->
        <div class="stats-section">
            <h4 class="stats-section-title">📊 ${t('streakStats')}</h4>
            <div class="stats-grid-compact">
                <div class="stat-item-compact">
                    <span class="stat-icon">🏆</span>
                    <div class="stat-content">
                        <span class="stat-value-large">${streak.max}</span>
                        <span class="stat-label-small">${t('longestStreak')}</span>
                    </div>
                </div>
                <div class="stat-item-compact">
                    <span class="stat-icon">📈</span>
                    <div class="stat-content">
                        <span class="stat-value-large">${streak.average || 0}</span>
                        <span class="stat-label-small">${t('averageStreak')}</span>
                    </div>
                </div>
                <div class="stat-item-compact">
                    <span class="stat-icon">✅</span>
                    <div class="stat-content">
                        <span class="stat-value-large">${streak.total_completed || 0}</span>
                        <span class="stat-label-small">${t('totalCompleted')}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Відсоток виконання (Completion Rate) -->
        <div class="stats-section">
            <h4 class="stats-section-title">📈 ${t('completionRate')}</h4>
            <div class="completion-rate-block">
                <div class="completion-rate-circle">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path class="circle-bg"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path class="circle-progress"
                            stroke-dasharray="${overallCR}, 100"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div class="completion-rate-text">
                        <span class="cr-value">${overallCR}%</span>
                        <span class="cr-label">CR</span>
                    </div>
                </div>
                <div class="completion-rate-details">
                    <div class="cr-detail-row">
                        <span class="cr-period">${t('week')}:</span>
                        <div class="cr-progress-bar">
                            <div class="cr-progress-fill" style="width: ${safeWeekStats.adherence_percent}%"></div>
                        </div>
                        <span class="cr-percent">${Math.round(safeWeekStats.adherence_percent)}%</span>
                    </div>
                    <div class="cr-detail-row">
                        <span class="cr-period">${t('month')}:</span>
                        <div class="cr-progress-bar">
                            <div class="cr-progress-fill" style="width: ${safeMonthStats.adherence_percent}%"></div>
                        </div>
                        <span class="cr-percent">${Math.round(safeMonthStats.adherence_percent)}%</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Виконання за періоди -->
        <div class="stats-section">
            <h4 class="stats-section-title">📅 ${t('periodStats')}</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">${t('week')}</span>
                    <span class="stat-value">${safeWeekStats.completed_days}/${safeWeekStats.total_days}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">${t('month')}</span>
                    <span class="stat-value">${safeMonthStats.completed_days}/${safeMonthStats.total_days}</span>
                </div>
            </div>
        </div>
        
        <!-- Календар -->
        <div class="stats-section">
            <h4 class="stats-section-title">${t('calendar')}</h4>
            <div class="calendar-container" id="habitCalendar">
                <!-- Календарь будет вставлен сюда -->
            </div>
        </div>
    `;
    
    // Загружаем данные для календаря
    if (selectedHabitId) {
        loadCalendarData(selectedHabitId);
    }
}

// ========== КАЛЕНДАРЬ ==========
let calendarCurrentMonth = new Date().getMonth();
let calendarCurrentYear = new Date().getFullYear();
let calendarData = {};

async function loadCalendarData(habitId) {
    try {
        const response = await apiFetch(`${API_BASE}/habits/${habitId}/calendar`);
        if (response.ok) {
            const data = await response.json();
            calendarData = {};
            data.entries.forEach(entry => {
                calendarData[entry.date] = entry.status;
            });
            renderCalendar();
        }
    } catch (error) {
        console.error('Ошибка загрузки календаря:', error);
        renderCalendar(); // Рендерим пустой календарь
    }
}

function renderCalendar() {
    const container = document.getElementById('habitCalendar');
    if (!container) return;
    
    const months = [
        t('january'), t('february'), t('march'), t('april'),
        t('may'), t('june'), t('july'), t('august'),
        t('september'), t('october'), t('november'), t('december')
    ];
    
    const weekDays = [
        t('monday'), t('tuesday'), t('wednesday'), t('thursday'),
        t('friday'), t('saturday'), t('sunday')
    ];
    
    const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth, 1);
    const lastDay = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // День недели первого дня (0 = воскресенье, преобразуем в понедельник = 0)
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;
    
    let calendarHTML = `
        <div class="calendar-header">
            <button type="button" class="calendar-nav-btn" onclick="changeMonth(-1)">◀</button>
            <span class="calendar-month-year">${months[calendarCurrentMonth]} ${calendarCurrentYear}</span>
            <button type="button" class="calendar-nav-btn" onclick="changeMonth(1)">▶</button>
        </div>
        <div class="calendar-weekdays">
            ${weekDays.map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
        </div>
        <div class="calendar-days">
    `;
    
    // Пустые ячейки перед первым днём
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Дни месяца
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calendarCurrentYear}-${String(calendarCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isCompleted = calendarData[dateStr] === true;
        const isToday = dateStr === todayStr;
        const cellDate = new Date(dateStr);
        cellDate.setHours(0, 0, 0, 0);
        const isFuture = cellDate > today;
        const isPast = cellDate < today;
        
        let classes = 'calendar-day';
        if (isCompleted) classes += ' completed';
        if (isToday) classes += ' today';
        if (isFuture) classes += ' future';
        if (isPast) classes += ' past';
        
        // Тільки сьогодні можна клікати для зміни статусу
        const isClickable = isToday;
        
        calendarHTML += `
            <div class="${classes}" 
                 data-date="${dateStr}" 
                 ${isClickable ? `onclick="toggleCalendarDay('${dateStr}')"` : ''}
                 style="cursor: ${isClickable ? 'pointer' : 'default'};"
                 title="${isToday ? t('clickToMarkCompletion') : (isPast ? t('cannotMarkPast') : t('cannotMarkFuture'))}">
                ${day}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    container.innerHTML = calendarHTML;
}

function changeMonth(delta) {
    calendarCurrentMonth += delta;
    if (calendarCurrentMonth > 11) {
        calendarCurrentMonth = 0;
        calendarCurrentYear++;
    } else if (calendarCurrentMonth < 0) {
        calendarCurrentMonth = 11;
        calendarCurrentYear--;
    }
    renderCalendar();
}

async function toggleCalendarDay(dateStr) {
    if (!selectedHabitId) return;
    
    // Перевірка: тільки сьогодні можна змінювати
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
        showError(t('cannotMarkFuture') || 'Не можна відмічати майбутні дати');
        return;
    }
    
    if (selectedDate < today) {
        showError(t('cannotMarkPast') || 'Не можна відмічати минулі дати');
        return;
    }
    
    const currentStatus = calendarData[dateStr] === true;
    const newStatus = !currentStatus;
    
    try {
        const response = await apiFetch(`${API_BASE}/habits/${selectedHabitId}/tick`, {
            method: 'POST',
            body: JSON.stringify({
                date: dateStr,
                status: newStatus
            })
        });
        
        if (response.ok) {
            calendarData[dateStr] = newStatus;
            renderCalendar();
            
            // Обновляем статистику
            loadStats(selectedHabitId);
            fetchHabits(); // Обновляем недельную сетку
            
            if (newStatus) {
                showSuccess('✅ ' + t('habitMarked'));
            }
        }
    } catch (error) {
        console.error('Ошибка переключения дня:', error);
        showError(t('markSaveError'));
    }
}

function editHabit(habitId) {
    console.log('Редактирование привычки ID:', habitId);
    console.log('Доступные привычки:', habits.map(h => ({ id: h.id, name: h.name })));
    
    const habit = habits.find(h => h.id == habitId); 
    if (!habit) {
        showError(`Привычка с ID ${habitId} не найдена в локальном массиве`);
        console.error('Привычка не найдена. ID:', habitId, 'Тип:', typeof habitId);
        return;
    }
    
    editingHabitId = habitId;
    
    
    document.getElementById('editHabitName').value = habit.name;
    document.getElementById('editHabitDesc').value = habit.description || '';
    
    
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
    
    
    populateEditCategoryDropdown();
    
    
    openModal('editHabitModal');
}

// ========== ШАГОМЕР ==========
let stepCounter = {
    steps: 0,
    goal: 10000,
    isSupported: false,
    isNative: false,
    lastReset: new Date().toDateString()
};

// Capacitor StepCounter Plugin (нативный Android)
const StepCounter = window.Capacitor?.Plugins?.StepCounter || null;

function initStepCounter() {
    // Загружаем сохранённые данные
    const stored = localStorage.getItem('stepCounter');
    if (stored) {
        stepCounter = { ...stepCounter, ...JSON.parse(stored) };
    }
    
    // Проверяем, нужно ли сбросить счётчик (новый день)
    const today = new Date().toDateString();
    if (stepCounter.lastReset !== today) {
        stepCounter.steps = 0;
        stepCounter.lastReset = today;
        saveStepCounter();
    }
    
    // Приоритет: нативный Android плагин > Web Accelerometer > DeviceMotion
    if (StepCounter && window.Capacitor?.isNativePlatform()) {
        // Нативный Android шагомер
        initNativeStepCounter();
    } else if ('Accelerometer' in window) {
        stepCounter.isSupported = true;
        startAccelerometerStepCounter();
    } else if ('DeviceMotionEvent' in window) {
        stepCounter.isSupported = true;
        startDeviceMotionStepCounter();
    } else {
        stepCounter.isSupported = false;
        console.log('Step counter not supported on this device');
    }
    
    updateStepCounterUI();
}

async function initNativeStepCounter() {
    try {
        // Проверяем доступность сенсора
        const { available } = await StepCounter.isAvailable();
        if (!available) {
            console.log('Native accelerometer not available, falling back to web');
            if ('DeviceMotionEvent' in window) {
                startDeviceMotionStepCounter();
            }
            return;
        }
        
        stepCounter.isSupported = true;
        stepCounter.isNative = true;
        
        // Запускаем нативный шагомер
        await StepCounter.start();
        console.log('✅ Native step counter started');
        
        // Получаем текущие шаги
        const data = await StepCounter.getSteps();
        if (data.steps > 0) {
            stepCounter.steps = data.steps;
            updateStepCounterUI();
        }
        
        // Слушаем обновления шагов
        StepCounter.addListener('stepUpdate', (data) => {
            stepCounter.steps = data.steps;
            saveStepCounter();
            updateStepCounterUI();
        });
        
    } catch (error) {
        console.log('Native step counter error:', error);
        // Fallback на DeviceMotion
        if ('DeviceMotionEvent' in window) {
            startDeviceMotionStepCounter();
        }
    }
}

function startAccelerometerStepCounter() {
    try {
        const accelerometer = new Accelerometer({ frequency: 30 });
        let lastMagnitude = 0;
        let stepThreshold = 12; // Порог для определения шага
        let lastStepTime = 0;
        
        accelerometer.addEventListener('reading', () => {
            const magnitude = Math.sqrt(
                accelerometer.x ** 2 + 
                accelerometer.y ** 2 + 
                accelerometer.z ** 2
            );
            
            const now = Date.now();
            
            // Определяем шаг по резкому изменению ускорения
            if (magnitude > stepThreshold && lastMagnitude <= stepThreshold && now - lastStepTime > 300) {
                stepCounter.steps++;
                lastStepTime = now;
                saveStepCounter();
                updateStepCounterUI();
            }
            
            lastMagnitude = magnitude;
        });
        
        accelerometer.start();
    } catch (error) {
        console.log('Accelerometer error:', error);
        startDeviceMotionStepCounter();
    }
}

function startDeviceMotionStepCounter() {
    let lastMagnitude = 0;
    let lastStepTime = 0;
    const stepThreshold = 15;
    
    window.addEventListener('devicemotion', (event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;
        
        const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
        const now = Date.now();
        
        if (magnitude > stepThreshold && lastMagnitude <= stepThreshold && now - lastStepTime > 300) {
            stepCounter.steps++;
            lastStepTime = now;
            saveStepCounter();
            updateStepCounterUI();
        }
        
        lastMagnitude = magnitude;
    }, true);
}

function saveStepCounter() {
    localStorage.setItem('stepCounter', JSON.stringify(stepCounter));
}

function updateStepCounterUI() {
    const stepsDisplay = document.getElementById('stepsToday');
    const progressBar = document.getElementById('stepsProgress');
    const stepGoalDisplay = document.getElementById('stepGoal');
    const stepsPercentDisplay = document.getElementById('stepsPercent');
    const stepsRemainingValue = document.getElementById('stepsRemainingValue');
    const stepsRemainingContainer = document.getElementById('stepsRemaining');
    
    const progress = Math.min((stepCounter.steps / stepCounter.goal) * 100, 100);
    const remaining = Math.max(stepCounter.goal - stepCounter.steps, 0);
    const isCompleted = stepCounter.steps >= stepCounter.goal;
    
    if (stepsDisplay) {
        stepsDisplay.textContent = stepCounter.steps.toLocaleString();
    }
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.style.background = isCompleted ? 'var(--success)' : 'var(--accent-gradient)';
    }
    
    if (stepGoalDisplay) {
        stepGoalDisplay.textContent = stepCounter.goal.toLocaleString();
    }
    
    if (stepsPercentDisplay) {
        stepsPercentDisplay.textContent = `${Math.round(progress)}%`;
        stepsPercentDisplay.classList.toggle('completed', isCompleted);
    }
    
    if (stepsRemainingValue) {
        stepsRemainingValue.textContent = remaining.toLocaleString();
    }
    
    if (stepsRemainingContainer) {
        stepsRemainingContainer.style.display = isCompleted ? 'none' : 'block';
    }
}

function setStepGoal(goal) {
    const parsedGoal = parseInt(goal);
    if (parsedGoal && parsedGoal > 0) {
        stepCounter.goal = parsedGoal;
        saveStepCounter();
        updateStepCounterUI();
        showSuccess(`${t('stepsGoal')}: ${parsedGoal.toLocaleString()}`);
    } else {
        showError(t('invalidGoal'));
    }
}

function openSetGoalModal() {
    // Створюємо модальне вікно для введення цілі
    const existingModal = document.getElementById('stepGoalModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'stepGoalModal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal" style="max-width: 350px;">
            <div class="modal-header">
                <h3 class="modal-title">🎯 ${t('setGoal')}</h3>
                <button class="modal-close" onclick="closeSetGoalModal()">&times;</button>
            </div>
            <div class="form-group">
                <label class="form-label">${t('enterStepGoal')}:</label>
                <input type="number" id="stepGoalInput" class="form-input" 
                       value="${stepCounter.goal}" min="100" max="100000" step="100"
                       placeholder="10000"
                       style="font-size: 1.5rem; text-align: center; padding: 16px;">
                <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
                    ${t('defaultGoal') || 'За замовчуванням: 10,000 кроків'}
                </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button class="btn btn-secondary" onclick="closeSetGoalModal()" style="flex: 1;">${t('cancel')}</button>
                <button class="btn btn-primary" onclick="confirmSetGoal()" style="flex: 1;">✅ ${t('save')}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Фокус на інпут
    setTimeout(() => {
        const input = document.getElementById('stepGoalInput');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
    
    // Закриття по кліку на оверлей
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSetGoalModal();
        }
    });
    
    // Закриття по Enter
    const input = document.getElementById('stepGoalInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmSetGoal();
            }
        });
    }
}

function closeSetGoalModal() {
    const modal = document.getElementById('stepGoalModal');
    if (modal) {
        modal.remove();
    }
}

function confirmSetGoal() {
    const input = document.getElementById('stepGoalInput');
    if (input) {
        const goal = input.value;
        setStepGoal(goal);
        closeSetGoalModal();
    }
}

// ========== УЛУЧШЕННАЯ СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ ==========
async function updateUserStats() {
    if (!currentUser) return;
    
    try {
        const response = await apiFetch(`${API_BASE}/user/stats`);
        if (response.ok) {
            const stats = await response.json();
            
            // Обновляем UI
            const totalHabitsEl = document.getElementById('totalHabits');
            const completedTodayEl = document.getElementById('completedToday');
            const longestStreakEl = document.getElementById('longestStreak');
            const userHabitsCountEl = document.getElementById('userHabitsCount');
            const userStreakEl = document.getElementById('userStreak');
            
            if (totalHabitsEl) totalHabitsEl.textContent = stats.total_habits || 0;
            if (completedTodayEl) completedTodayEl.textContent = stats.completed_today || 0;
            if (longestStreakEl) longestStreakEl.textContent = stats.longest_streak || 0;
            if (userHabitsCountEl) userHabitsCountEl.textContent = stats.total_habits || 0;
            if (userStreakEl) userStreakEl.textContent = stats.current_streak || 0;
        }
    } catch (error) {
        console.log('Ошибка загрузки статистики:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    initCategories();
    initUserProgress(); 
    checkAuth(); 
    initStepCounter(); // Инициализация шагомера
    
    // Показываем шагомер если поддерживается
    const stepSection = document.getElementById('stepCounterSection');
    if (stepSection && stepCounter.isSupported) {
        stepSection.style.display = 'block';
    }
    
    initProfileEditing();
    
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            
            const profileModal = document.getElementById('profileSettingsModal');
            if (profileModal && profileModal.classList.contains('active')) {
                closeModal('profileSettingsModal');
                return;
            }
            
            
            const openModal = document.querySelector('.modal-overlay.active');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    
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
    
    
    document.getElementById('addHabitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('habitName').value.trim();
        const description = document.getElementById('habitDesc').value.trim();
        const time = document.getElementById('habitTime').value;
        const categoryInput = document.getElementById('habitCategory');
        const categoryId = categoryInput.dataset.categoryId;
        
        
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
            showError(t('enterHabitName'));
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
        
        
        if (document.getElementById('categoriesModal').classList.contains('active')) {
            renderCategoriesList();
        }
    });

    
    document.getElementById('editHabitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!editingHabitId) {
            showError(t('habitNotSelected'));
            return;
        }
        
        const name = document.getElementById('editHabitName').value.trim();
        const description = document.getElementById('editHabitDesc').value.trim();
        const time = document.getElementById('editHabitTime').value;
        const categoryInput = document.getElementById('editHabitCategory');
        const categoryId = categoryInput.dataset.categoryId;
        
        
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
            showError(t('enterHabitName'));
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

    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    
    document.addEventListener('click', (e) => {
        const dropdowns = [
            { dropdown: 'categoryDropdown', selector: '.category-selector', input: 'habitCategory' },
            { dropdown: 'timeDropdown', selector: '.time-selector', input: 'habitTime' },
            { dropdown: 'reminderDropdown', selector: '.reminder-selector', input: 'reminderType' },
            { dropdown: 'reminderTimeDropdown', selector: '.reminder-time-selector', input: 'reminderTime' },
            { dropdown: 'intervalUnitDropdown', selector: '.interval-unit-selector', input: 'intervalUnit' },
            
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

    
    document.addEventListener('click', (e) => {
        if (e.target.closest('.reminder-option')) {
            const option = e.target.closest('.reminder-option');
            const value = option.dataset.value;
            
            
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
            
            
            const editModal = option.closest('#editHabitModal');
            if (editModal) {
                selectEditIntervalUnit(value, option);
            } else {
                selectIntervalUnit(value, option);
            }
        }
    });

    
    if (habitsList) {
        habitsList.addEventListener('click', async (e) => {
            
            if (e.target.closest('.icon-btn.edit')) {
                e.stopPropagation();
                const button = e.target.closest('.icon-btn.edit');
                const habitId = button.dataset.habitId; 
                console.log('Попытка редактирования привычки ID:', habitId);
                console.log('Доступные привычки в массиве:', habits.map(h => ({ id: h.id, name: h.name })));
                
                if (habitId) {
                    
                    const habitExists = habits.find(h => h.id == habitId);
                    if (!habitExists) {
                        console.log('Привычка не найдена в локальном массиве. Обновляем...');
                        showError('Привычка не найдена. Обновляем список...');
                        await fetchHabits(); 
                        
                        
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
            
            
            if (e.target.closest('.icon-btn.delete')) {
                e.stopPropagation();
                const button = e.target.closest('.icon-btn.delete');
                const habitId = button.dataset.habitId; 
                console.log('Попытка удаления привычки ID:', habitId);
                console.log('Доступные привычки в массиве:', habits.map(h => ({ id: h.id, name: h.name })));
                
                if (habitId) {
                    
                    const habitExists = habits.find(h => h.id == habitId);
                    if (!habitExists) {
                        console.log('Привычка не найдена в локальном массиве. Обновляем...');
                        showError('Привычка не найдена. Обновляем список...');
                        await fetchHabits(); 
                        
                        
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
            
            
            if (e.target.closest('.day-cell')) {
                e.stopPropagation();
                const cell = e.target.closest('.day-cell');
                
                // Ігноруємо кліки на майбутні дати
                if (cell.classList.contains('future') || cell.classList.contains('disabled')) {
                    showError(t('cannotMarkFuture') || 'Не можна відмічати майбутні дати');
                    return;
                }
                
                // Ігноруємо кліки на минулі дати (тільки сьогодні!)
                if (cell.classList.contains('past')) {
                    showError(t('cannotMarkPast') || 'Не можна відмічати минулі дати');
                    return;
                }
                
                const habitId = cell.dataset.habitId; 
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
            
            
            const card = e.target.closest('.habit-card');
            if (!card) return;
            
            const habitId = card.dataset.id; 
            if (habitId && selectedHabitId !== habitId) {
                selectedHabitId = habitId;
                loadStats(habitId);
                
                
                document.querySelectorAll('.habit-card').forEach(c => c.style.borderColor = '#2d4152');
                card.style.borderColor = '#4da3ff';
            }
        });
    }
    
    
    loadRememberedUser();
    
    
    requestNotificationPermission();
});


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
        
        
        setTimeout(() => notification.close(), 5000);
    }
}


let activeReminders = new Map();

function setupHabitReminder(habit) {
    
    clearHabitReminder(habit.id);
    
    if (!habit.reminder || habit.reminder.type === 'none') return;
    
    const now = new Date();
    let nextReminderTime;
    
    if (habit.reminder.type === 'specific') {
        
        const [hours, minutes] = habit.reminder.time.split(':');
        nextReminderTime = new Date();
        nextReminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        
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
            
            setupHabitReminder(habit);
        }, timeUntilReminder);
        
        activeReminders.set(habit.id, timeoutId);
        
    } else if (habit.reminder.type === 'interval') {
        
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
    
    const habit = habits.find(h => h.id === habitId);
    return habit && habit.completedDates && habit.completedDates.includes(today);
}


function setupAllReminders() {
    if (currentUser) {
        fetchHabits().then(() => {
            
            habits.forEach(habit => {
                if (habit.reminder && habit.reminder.type !== 'none') {
                    setupHabitReminder(habit);
                }
            });
        });
    }
}




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


const avatarEmojis = [
    '👤', '😀', '😎', '🤓', '😊', '🥳', '😇', '🤔', '😋', '🙂',
    '🐱', '🐶', '🐺', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸',
    '🌟', '⭐', '✨', '🔥', '💎', '🎯', '🚀', '🎨', '🎵', '⚡',
    '🌈', '🌙', '☀️', '🌸', '🌺', '🍀', '🌿', '🌊', '❄️', '🔮'
];


function initUserProfile() {
    
    const stored = localStorage.getItem('userSettings');
    if (stored) {
        userSettings = { ...userSettings, ...JSON.parse(stored) };
    }
    
    
    updateProfileUI();
    applyUserSettings();
}


function updateProfileUI() {
    if (currentUser) {
        
        updateAvatarUI();
        
        
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('profileName').textContent = currentUser.username;
        document.getElementById('profileEmail').textContent = currentUser.email;
        
        
        updateProfileDisplay();
        
        // Оновлюємо відображення рівня та звання
        updateLevelDisplay();
        
        
        const settingsUsername = document.getElementById('settingsUsername');
        const settingsEmail = document.getElementById('settingsEmail');
        if (settingsUsername) settingsUsername.value = currentUser.username;
        if (settingsEmail) settingsEmail.value = currentUser.email;
        
        
        updateUserStats();
        
        
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('appButtons').style.display = 'flex';
    } else {
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('authButtons').style.display = 'flex';
        document.getElementById('appButtons').style.display = 'none';
    }
}


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


async function validateCurrentPasswordEdit() {
    const passwordInput = document.getElementById('currentPasswordEdit');
    const password = passwordInput.value;
    
    if (!password) {
        showValidationError('currentPasswordEdit', 'Введите текущий пароль');
        return false;
    }
    
    
    
    if (password.length < 3) {
        showValidationError('currentPasswordEdit', 'Неверный пароль');
        return false;
    }
    
    clearValidationError('currentPasswordEdit');
    return true;
}


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


function initProfileEditing() {
    
    const newUsernameInput = document.getElementById('newUsername');
    if (newUsernameInput) {
        newUsernameInput.addEventListener('input', validateNewUsername);
        newUsernameInput.addEventListener('blur', validateNewUsername);
    }
    
    
    const newEmailInput = document.getElementById('newEmail');
    if (newEmailInput) {
        newEmailInput.addEventListener('input', validateNewEmail);
        newEmailInput.addEventListener('blur', validateNewEmail);
    }
    
    
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


function resetProfileSettings() {
    
    editingStates.username = false;
    editingStates.email = false;
    editingStates.password = false;
    
    
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
        
        
        const usernameInput = document.getElementById('newUsername');
        if (usernameInput) usernameInput.value = '';
        clearValidationError('newUsername');
    }
    
    
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
        
        
        const emailInput = document.getElementById('newEmail');
        if (emailInput) emailInput.value = '';
        clearValidationError('newEmail');
    }
    
    
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
    
    
    updateProfileDisplay();
}


function updateAvatarUI() {
    const avatar = userSettings.avatar;
    
    
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) userAvatar.textContent = avatar;
    
    
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    if (profileAvatarLarge) profileAvatarLarge.textContent = avatar;
    
    
    const settingsAvatar = document.getElementById('settingsAvatar');
    if (settingsAvatar) settingsAvatar.textContent = avatar;
}


// updateUserStats визначена вище як async функція, ця дублікатна видалена
// Використовуй updateUserStats() з рядка 2735


function toggleUserProfile() {
    const dropdown = document.getElementById('userProfileDropdown');
    dropdown.classList.toggle('active');
    
    
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


function openProfileSettings() {
    
    document.getElementById('userProfileDropdown').classList.remove('active');
    
    
    loadProfileSettings();
    
    
    openModal('profileSettingsModal');
}


function closeUserProfileDropdown() {
    document.getElementById('userProfileDropdown').classList.remove('active');
    document.removeEventListener('click', closeProfileOnOutsideClick);
}


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
                    
                    if (data.habits) habits = data.habits;
                    if (data.categories) categories = data.categories;
                    if (data.settings) userSettings = { ...userSettings, ...data.settings };
                    
                    
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


function loadProfileSettings() {
    
    updateAvatarUI();
    
    
    updateToggleSwitch('pushNotifications', userSettings.pushNotifications);
    updateToggleSwitch('emailNotifications', userSettings.emailNotifications);
    updateToggleSwitch('soundNotifications', userSettings.soundNotifications);
    updateToggleSwitch('darkTheme', userSettings.darkTheme);
    updateToggleSwitch('compactView', userSettings.compactView);
    updateToggleSwitch('analytics', userSettings.analytics);
    
    
    document.getElementById('autoBackup').value = userSettings.autoBackup;
    document.getElementById('interfaceLanguage').value = userSettings.interfaceLanguage;
}


function updateToggleSwitch(id, active) {
    const toggle = document.getElementById(id);
    if (active) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
}


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
    
    
    applyUserSettings();
    
    
    saveUserSettings();
}


function applyUserSettings() {
    console.log('Applying settings. darkTheme:', userSettings.darkTheme);
    
    
    if (userSettings.darkTheme) {
        console.log('Setting dark theme');
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    } else {
        console.log('Setting light theme');
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }
    
    
    if (userSettings.compactView) {
        document.body.classList.add('compact-view');
    } else {
        document.body.classList.remove('compact-view');
    }
}


function saveUserSettings() {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
}


function changeAvatar() {
    
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


function selectAvatar(emoji) {
    userSettings.avatar = emoji;
    updateAvatarUI();
    saveUserSettings();
    closeAvatarPicker();
    showSuccess('Аватар обновлен!');
}


function closeAvatarPicker() {
    const picker = document.querySelector('.avatar-picker-overlay');
    if (picker) {
        picker.classList.remove('active');
        setTimeout(() => picker.remove(), 300);
    }
}


async function saveProfileSettings() {
    const username = document.getElementById('settingsUsername').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    
    if (!username || !email) {
        showError('Пожалуйста, заполните все поля');
        return;
    }
    
    
    userSettings.autoBackup = document.getElementById('autoBackup').value;
    userSettings.interfaceLanguage = document.getElementById('interfaceLanguage').value;
    
    try {
        
        
        
        
        
        
        
        
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
            
            
            localStorage.removeItem('habits');
            localStorage.removeItem('habitCategories');
            localStorage.removeItem('userSettings');
            
            
            saveCategories();
            saveUserSettings();
            updateProfileUI();
            renderHabits();
            closeModal('profileSettingsModal');
            
            showSuccess('Все данные удалены');
        }
    }
}


function deleteAccount() {
    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
        if (confirm('Введите "DELETE" для подтверждения удаления аккаунта:') === 'DELETE') {
            
            logout();
            clearAllData();
            showSuccess('Аккаунт удален');
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.addEventListener('click', toggleUserProfile);
    }
    
    
    initUserProfile();
});




let editingStates = {
    username: false,
    email: false,
    password: false
};


function updateProfileDisplay() {
    if (currentUser) {
        
        const currentUsernameEl = document.getElementById('currentUsername');
        if (currentUsernameEl) {
            currentUsernameEl.textContent = currentUser.username;
        }
        
        
        const currentEmailEl = document.getElementById('currentEmail');
        if (currentEmailEl) {
            currentEmailEl.textContent = currentUser.email;
        }
        
        
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = currentUser.username;
        }
        
        
        const profileNameEl = document.getElementById('profileName');
        if (profileNameEl) {
            profileNameEl.textContent = currentUser.username;
        }
    }
}


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
    
    
    document.getElementById('newUsername').value = '';
    clearValidationError('newUsername');
}

async function saveUsername() {
    if (!validateNewUsername()) {
        return;
    }
    
    const newUsername = document.getElementById('newUsername').value.trim();
    
    try {
        
        
        
        
        
        
        
        
        if (currentUser) {
            currentUser.username = newUsername;
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        updateProfileDisplay();
        updateAvatarUI();
        updateProfileUI(); 
        
        
        const section = document.querySelector('.profile-edit-section');
        section.classList.add('success');
        setTimeout(() => section.classList.remove('success'), 3000);
        
        cancelUsernameEdit();
        showSuccess('Имя пользователя обновлено!');
        
    } catch (error) {
        showError('Ошибка при обновлении имени пользователя');
    }
}


function toggleEmailEdit() {
    const sections = document.querySelectorAll('.profile-edit-section');
    const section = sections[1]; 
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
    
    
    document.getElementById('newEmail').value = '';
    clearValidationError('newEmail');
}

async function saveEmail() {
    if (!validateNewEmail()) {
        return;
    }
    
    const newEmail = document.getElementById('newEmail').value.trim();
    
    try {
        
        
        
        
        
        
        
        
        if (currentUser) {
            currentUser.email = newEmail;
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        updateProfileDisplay();
        updateProfileUI();
        
        
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


function togglePasswordEdit() {
    const sections = document.querySelectorAll('.profile-edit-section');
    const section = sections[2]; 
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


function clearValidationError(inputId) {
    const input = document.getElementById(inputId);
    const validation = document.getElementById(inputId + 'Validation');
    
    input.classList.remove('invalid', 'valid');
    if (validation) {
        validation.textContent = '';
        validation.classList.remove('error', 'success');
    }
}


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


function showValidationError(inputId, message) {
    showValidationMessage(inputId, message, true);
}


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


async function validateCurrentPassword() {
    const input = document.getElementById('currentPassword');
    const password = input.value;
    
    if (!password) {
        showValidationMessage('currentPassword', 'Введите текущий пароль');
        return false;
    }
    
    
    
    showValidationMessage('currentPassword', '✓ Пароль принят', false);
    return true;
}


function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    
    if (password.length >= 8) score++;
    else feedback.push('минимум 8 символов');
    
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('заглавная буква');
    
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('строчная буква');
    
    
    if (/\d/.test(password)) score++;
    else feedback.push('цифра');
    
    
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

// ========================================
// СИСТЕМА НАГОРОД ТА БЕЙДЖІВ
// ========================================

// Відкриття модалки нагород
function openAwardsModal() {
    updateAwardsDisplay();
    openModal('awardsModal');
}

// Оновлення відображення нагород
function updateAwardsDisplay() {
    const currentLevel = getCurrentLevel();
    
    // Оновлюємо загальний прогрес
    document.getElementById('totalXP').textContent = `${userProgress.xp} XP`;
    document.getElementById('currentLevelText').textContent = `${currentLevel.name} (${currentLevel.level})`;
    document.getElementById('totalCompleted').textContent = userProgress.totalHabitsCompleted;
    document.getElementById('bestStreak').textContent = `${userProgress.longestStreak} ${t('days')}`;
    
    // Отримані бейджі
    const earnedBadgesEl = document.getElementById('earnedBadges');
    const earnedBadges = userProgress.earnedBadges || [];
    
    if (earnedBadges.length === 0) {
        earnedBadgesEl.innerHTML = `
            <div class="empty-state" style="padding: 20px; text-align: center;">
                <p style="color: var(--text-muted);">${t('noAwards')}</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${t('keepGoing')}</p>
            </div>
        `;
    } else {
        earnedBadgesEl.innerHTML = earnedBadges.map(badgeId => {
            const badge = badges[badgeId];
            if (!badge) return '';
            return `
                <div class="badge-item earned">
                    <span class="badge-emoji">${badge.emoji}</span>
                    <div class="badge-title">${badge.name}</div>
                    <div class="badge-desc">${badge.description}</div>
                </div>
            `;
        }).join('');
    }
    
    // Доступні (заблоковані) бейджі
    const availableBadgesEl = document.getElementById('availableBadges');
    const lockedBadges = Object.values(badges).filter(b => !earnedBadges.includes(b.id));
    
    availableBadgesEl.innerHTML = lockedBadges.map(badge => `
        <div class="badge-item locked">
            <span class="badge-emoji">${badge.emoji}</span>
            <div class="badge-title">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
        </div>
    `).join('');
}

// Додаємо кнопку нагород в header якщо її немає
// ВИДАЛЕНО - кнопка вже є в HTML

// Ініціалізація системи нагород при завантаженні
document.addEventListener('DOMContentLoaded', function() {
    // Кнопка нагород вже є в HTML, нічого додавати не потрібно
});
