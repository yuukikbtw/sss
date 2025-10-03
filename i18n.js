// 🌍 Internationalization - Інтернаціоналізація
const translations = {
    uk: {
        // ========== CATEGORIES ==========
        sport: 'Спорт',
        health: 'Здоров\'я',
        work: 'Робота',
        study: 'Навчання',
        home: 'Домашні справи',
        hobby: 'Хобі',
        social: 'Соціальне',
        finance: 'Фінанси',
        mindfulness: 'Усвідомленість',
        creativity: 'Творчість',
        categoryName: 'Назва категорії',
        categoryNamePlaceholder: 'Наприклад: Спорт',
        emojiOptional: 'Емодзі (опціонально)',
        defaultCategory: '(за замовчуванням)',
        
        // ========== HEADER ==========
        appTitle: '🎯 Трекер звичок',
        online: 'В мережі',
        offline: 'Не в мережі',
        
        // ========== USER INFO ==========
        userDefaultName: 'Користувач',
        beginner: 'Новачок',
        trainee: 'Стажер',
        practitioner: 'Практик',
        specialist: 'Спеціаліст',
        expert: 'Експерт',
        master: 'Майстер',
        guru: 'Гуру',
        legend: 'Легенда',
        mythic: 'Міфічний',
        divine: 'Божественний',
        lvl: 'Рівень',
        
        // ========== AUTH ==========
        login: 'Увійти',
        register: 'Реєстрація',
        logout: 'Вийти',
        email: 'Email',
        password: 'Пароль',
        username: "Ім'я користувача",
        rememberMe: "Запам'ятати мене",
        haveAccount: 'Вже є акаунт?',
        noAccount: 'Немає акаунту?',
        switchToLogin: 'Переключитися на вхід',
        switchToRegister: 'Переключитися на реєстрацію',
        
        // ========== NAVIGATION ==========
        myHabits: '📋 Мої звички',
        statistics: '📊 Статистика',
        addHabit: '➕ Додати звичку',
        categories: '📁 Категорії',
        awards: '🏆 Нагороди',
        settings: '⚙️ Налаштування',
        profile: 'Профіль',
        
        // ========== MODAL TITLES ==========
        addHabitTitle: 'Додати звичку',
        editHabitTitle: 'Редагувати звичку',
        manageCategoriesTitle: 'Управління категоріями',
        addCategoryTitle: 'Додати категорію',
        profileSettingsTitle: '⚙️ Налаштування профілю',
        
        // ========== HABIT FORM ==========
        habitName: 'Назва звички',
        habitNamePlaceholder: 'Наприклад: Ранкова зарядка',
        description: 'Опис',
        descriptionPlaceholder: 'Додаткова інформація про звичку...',
        category: 'Категорія',
        selectCategory: 'Оберіть категорію',
        addCategory: '+ Додати категорію',
        editHabit: 'Редагувати звичку',
        saveChanges: '✏️ Зберегти',
        time: 'Час',
        selectTime: 'Оберіть час',
        reminder: 'Нагадування',
        selectReminder: 'Обрати нагадування',
        selectReminderType: 'Оберіть тип нагадування',
        noReminders: 'Без нагадувань',
        noRemindersDesc: 'Відстеження без сповіщень',
        atSpecificTime: 'У певний час',
        atSpecificTimeDesc: 'Сповіщення у вибраний час',
        atIntervals: 'Через інтервали',
        atIntervalsDesc: 'Повторювані сповіщення',
        selectReminderTime: 'Оберіть час нагадування',
        hours: 'Година',
        minutes: 'Хвилини',
        clear: 'Очистити',
        done: 'Готово',
        every: 'Кожні',
        minute: 'хвилин',
        hour: 'годин',
        day: 'днів',
        
        // ========== TIME SETTINGS ==========
        anytime: 'Будь-коли',
        specificTime: 'Конкретний час',
        timeRange: 'Проміжок часу',
        morning: 'Ранок',
        day: 'День',
        evening: 'Вечір',
        night: 'Ніч',
        from: 'З',
        to: 'До',
        every: 'Кожні',
        hours: 'годин',
        minutes: 'хвилин',
        
        // ========== REMINDER TYPES ==========
        reminderNone: 'Без нагадування',
        reminderNoneDesc: 'Виконувати звичку без нагадувань',
        reminderOnce: 'Один раз на день',
        reminderOnceDesc: 'Нагадування в обраний час',
        reminderInterval: 'Через інтервал',
        reminderIntervalDesc: 'Повторювати нагадування кожні N годин',
        reminderMultiple: 'Декілька разів',
        reminderMultipleDesc: 'Нагадування у вибрані часи',
        
        // ========== CATEGORIES ==========
        sport: 'Спорт',
        health: "Здоров'я",
        work: 'Робота',
        study: 'Навчання',
        home: 'Домашні справи',
        hobby: 'Хобі',
        social: 'Соціальне',
        finance: 'Фінанси',
        mindfulness: 'Усвідомленість',
        creativity: 'Творчість',
        
        // ========== ACTIONS ==========
        save: 'Зберегти',
        cancel: 'Скасувати',
        delete: 'Видалити',
        edit: 'Редагувати',
        close: 'Закрити',
        add: 'Додати',
        apply: 'Застосувати',
        confirm: 'Підтвердити',
        
        // ========== MESSAGES ==========
        habitAdded: 'Звичку додано!',
        habitUpdated: 'Звичку оновлено!',
        habitDeleted: 'Звичку видалено!',
        categoryAdded: 'Категорію додано!',
        deleteConfirm: 'Видалити цю звичку?',
        loginSuccess: 'Успішний вхід!',
        registerSuccess: 'Реєстрація успішна!',
        logoutSuccess: 'Вихід виконано успішно',
        error: 'Помилка',
        authRequired: 'Потрібна авторізація',
        loadingError: 'Помилка завантаження звичок',
        networkError: 'Помилка мережі',
        
        // ========== STATS ==========
        currentStreak: 'Поточна серія',
        longestStreak: 'Найдовша серія',
        completionRate: 'Відсоток виконання',
        totalCompleted: 'Всього виконано',
        days: 'днів',
        times: 'разів',
        weekStats: 'Статистика за тиждень',
        monthStats: 'Статистика за місяць',
        allTimeStats: 'Вся статистика',
        
        // ========== CALENDAR ==========
        monday: 'Пн',
        tuesday: 'Вт',
        wednesday: 'Ср',
        thursday: 'Чт',
        friday: 'Пт',
        saturday: 'Сб',
        sunday: 'Нд',
        today: 'Сьогодні',
        yesterday: 'Вчора',
        thisWeek: 'Цього тижня',
        thisMonth: 'Цього місяця',
        clickDayToMark: 'Клікніть на день, щоб відмітити виконання',
        clickToMarkCompletion: 'Клікніть, щоб відмітити виконання',
        
        // ========== STATS ==========
        currentStreak: 'Поточна серія',
        bestStreak: 'Найкраща серія',
        week: 'Тиждень',
        month: 'Місяць',
        weekPercent: 'Тиждень %',
        monthPercent: 'Місяць %',
        days: 'днів',
        
        // ========== EMPTY STATES ==========
        noHabits: 'Немає звичок',
        noHabitsDesc: 'Додайте першу звичку, щоб почати відстеження',
        selectHabit: 'Оберіть звичку',
        selectHabitDesc: 'Клікніть на звичку зліва, щоб побачити статистику',
        loadingHabits: 'Завантаження звичок...',
        noCategories: 'Немає категорій',
        
        // ========== BADGES ==========
        firstStep: 'Перший крок',
        firstStepDesc: 'Виконати першу звичку',
        weekWarrior: 'Тижневий воїн',
        weekWarriorDesc: 'Виконувати звичку 7 днів поспіль',
        monthMaster: 'Майстер місяця',
        monthMasterDesc: 'Виконувати звичку 30 днів поспіль',
        hundredHero: 'Герой сотні',
        hundredHeroDesc: 'Виконати звичку 100 разів',
        sportsman: 'Спортсмен',
        sportsmanDesc: 'Виконати 50 спортивних звичок',
        scholar: 'Учений',
        scholarDesc: 'Виконати 50 навчальних звичок',
        healthGuru: 'Гуру здоров\'я',
        healthGuruDesc: 'Виконати 50 звичок здоров\'я',
        perfectWeek: 'Ідеальний тиждень',
        perfectWeekDesc: 'Виконати всі звички за тиждень',
        earlyBird: 'Рання пташка',
        earlyBirdDesc: 'Виконати 20 звичок до 8:00',
        nightOwl: 'Сова',
        nightOwlDesc: 'Виконати 20 звичок після 22:00',
        
        // ========== PROFILE SETTINGS ==========
        profileSettings: 'Налаштування профілю',
        profile: 'Профіль',
        manageCategoriesTitle: 'Управління категоріями',
        today: 'Сьогодні',
        accountInfo: 'Інформація акаунту',
        changeUsername: "Змінити ім'я",
        changeEmail: 'Змінити email',
        changePassword: 'Змінити пароль',
        currentName: 'Поточне ім\'я',
        enterNewName: 'Введіть нове ім\'я',
        usernameRequirements: '• Від 2 до 50 символів • Тільки літери, цифри та підкреслення',
        enterNewEmail: 'Введіть новий email',
        emailRequirements: '• Дійсна адреса електронної пошти • Буде використовуватись для входу',
        enterCurrentPassword: 'Введіть поточний пароль',
        enterNewPassword: 'Введіть новий пароль',
        repeatNewPassword: 'Повторіть новий пароль',
        passwordRequirementsDetails: '• Мінімум 8 символів • Велика літера • Цифра • Спецсимвол (!@#$%^&*)',
        changePasswordBtn: '🔒 Змінити пароль',
        avatarProfile: 'Аватар профілю',
        clickToSelectEmoji: 'Натисніть щоб вибрати емодзі',
        changeAvatar: 'Змінити аватар',
        username: "Ім'я користувача",
        emailAddress: 'Email адреса',
        currentPassword: 'Поточний пароль',
        newPassword: 'Новий пароль',
        confirmNewPassword: 'Підтвердіть новий пароль',
        passwordRequirements: 'Вимоги до пароля:',
        minCharacters: 'Мінімум 8 символів',
        uppercaseLetter: 'Велика літера',
        digit: 'Цифра',
        specialChar: 'Спецсимвол (!@#$%^&*)',
        appearance: 'Зовнішній вигляд',
        language: 'Мова інтерфейсу',
        theme: 'Тема',
        notifications: 'Сповіщення',
        pushNotifications: 'Push-сповіщення',
        pushNotificationsDesc: 'Отримувати нагадування про звички',
        emailNotifications: 'Email сповіщення',
        emailNotificationsDesc: 'Щотижневі звіти на пошту',
        soundNotifications: 'Звукові сповіщення',
        soundNotificationsDesc: 'Відтворювати звук при нагадуванні',
        personalization: 'Персоналізація',
        darkTheme: 'Темна тема',
        darkThemeDesc: 'Використовувати темне оформлення',
        compactView: 'Компактний вигляд',
        compactViewDesc: 'Зменшити відступи в інтерфейсі',
        dataAndPrivacy: 'Дані та приватність',
        analytics: 'Аналітика',
        analyticsDesc: 'Допомогти покращити додаток',
        autoBackup: 'Автоматичне резервне копіювання',
        daily: 'Щодня',
        weekly: 'Щотижня',
        monthly: 'Щомісяця',
        never: 'Ніколи',
        dangerZone: 'Небезпечна зона',
        dangerZoneDesc: 'Ці дії незворотні. Будь ласка, будьте обережні.',
        clearAllData: 'Очистити всі дані',
        enableNotifications: 'Увімкнути сповіщення',
        dataManagement: 'Керування даними',
        exportData: 'Експортувати дані',
        importData: 'Імпортувати дані',
        deleteAccount: 'Видалити акаунт',
        dangerZone: 'Небезпечна зона',
        
        // ========== AWARDS MODAL ==========
        myAwards: 'Мої нагороди',
        earnedBadges: 'Отримані значки',
        lockedBadges: 'Заблоковані значки',
        noAwards: 'Поки немає нагород',
        keepGoing: 'Продовжуйте виконувати звички!',
        
        // ========== OTHER ==========
        loading: 'Завантаження...',
        saving: 'Збереження...',
        deleting: 'Видалення...',
        processing: 'Обробка...',
        pleaseWait: 'Будь ласка, зачекайте...',
        success: 'Успіх!',
        completed: 'Виконано',
        pending: 'Очікується',
        active: 'Активна',
        inactive: 'Неактивна',
    },
    
    en: {
        // ========== CATEGORIES ==========
        sport: 'Sport',
        health: 'Health',
        work: 'Work',
        study: 'Study',
        home: 'Home',
        hobby: 'Hobby',
        social: 'Social',
        finance: 'Finance',
        mindfulness: 'Mindfulness',
        creativity: 'Creativity',
        categoryName: 'Category Name',
        categoryNamePlaceholder: 'E.g.: Sport',
        emojiOptional: 'Emoji (optional)',
        defaultCategory: '(default)',
        
        // ========== HEADER ==========
        appTitle: '🎯 Habit Tracker',
        online: 'Online',
        offline: 'Offline',
        
        // ========== USER INFO ==========
        userDefaultName: 'User',
        beginner: 'Beginner',
        trainee: 'Trainee',
        practitioner: 'Practitioner',
        specialist: 'Specialist',
        expert: 'Expert',
        master: 'Master',
        guru: 'Guru',
        legend: 'Legend',
        mythic: 'Mythic',
        divine: 'Divine',
        lvl: 'Level',
        
        // ========== AUTH ==========
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        username: 'Username',
        rememberMe: 'Remember me',
        haveAccount: 'Already have an account?',
        noAccount: 'Don\'t have an account?',
        switchToLogin: 'Switch to login',
        switchToRegister: 'Switch to register',
        
        // ========== NAVIGATION ==========
        myHabits: '📋 My Habits',
        statistics: '📊 Statistics',
        addHabit: '➕ Add Habit',
        categories: '📁 Categories',
        awards: '🏆 Awards',
        settings: '⚙️ Settings',
        profile: 'Profile',
        
        // ========== MODAL TITLES ==========
        addHabitTitle: 'Add Habit',
        editHabitTitle: 'Edit Habit',
        manageCategoriesTitle: 'Manage Categories',
        addCategoryTitle: 'Add Category',
        profileSettingsTitle: '⚙️ Profile Settings',
        
        // ========== HABIT FORM ==========
        habitName: 'Habit Name',
        habitNamePlaceholder: 'E.g.: Morning Exercise',
        description: 'Description',
        descriptionPlaceholder: 'Additional information about the habit...',
        category: 'Category',
        selectCategory: 'Select category',
        addCategory: '+ Add Category',
        editHabit: 'Edit Habit',
        saveChanges: '✏️ Save',
        time: 'Time',
        selectTime: 'Select time',
        reminder: 'Reminder',
        selectReminder: 'Select reminder',
        selectReminderType: 'Select reminder type',
        noReminders: 'No reminders',
        noRemindersDesc: 'Tracking without notifications',
        atSpecificTime: 'At specific time',
        atSpecificTimeDesc: 'Notification at selected time',
        atIntervals: 'At intervals',
        atIntervalsDesc: 'Repeating notifications',
        selectReminderTime: 'Select reminder time',
        hours: 'Hours',
        minutes: 'Minutes',
        clear: 'Clear',
        done: 'Done',
        every: 'Every',
        minute: 'minutes',
        hour: 'hours',
        day: 'days',
        
        // ========== TIME SETTINGS ==========
        anytime: 'Anytime',
        specificTime: 'Specific time',
        timeRange: 'Time range',
        morning: 'Morning',
        day: 'Day',
        evening: 'Evening',
        night: 'Night',
        from: 'From',
        to: 'To',
        every: 'Every',
        hours: 'hours',
        minutes: 'minutes',
        
        // ========== REMINDER TYPES ==========
        reminderNone: 'No reminder',
        reminderNoneDesc: 'Complete habit without reminders',
        reminderOnce: 'Once a day',
        reminderOnceDesc: 'Reminder at selected time',
        reminderInterval: 'By interval',
        reminderIntervalDesc: 'Repeat reminder every N hours',
        reminderMultiple: 'Multiple times',
        reminderMultipleDesc: 'Reminders at selected times',
        
        // ========== CATEGORIES ==========
        sport: 'Sport',
        health: 'Health',
        work: 'Work',
        study: 'Study',
        home: 'Home',
        hobby: 'Hobby',
        social: 'Social',
        finance: 'Finance',
        mindfulness: 'Mindfulness',
        creativity: 'Creativity',
        
        // ========== ACTIONS ==========
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        add: 'Add',
        apply: 'Apply',
        confirm: 'Confirm',
        
        // ========== MESSAGES ==========
        habitAdded: 'Habit added!',
        habitUpdated: 'Habit updated!',
        habitDeleted: 'Habit deleted!',
        categoryAdded: 'Category added!',
        deleteConfirm: 'Delete this habit?',
        loginSuccess: 'Login successful!',
        registerSuccess: 'Registration successful!',
        logoutSuccess: 'Logout successful',
        error: 'Error',
        authRequired: 'Authorization required',
        loadingError: 'Error loading habits',
        networkError: 'Network error',
        
        // ========== STATS ==========
        currentStreak: 'Current Streak',
        longestStreak: 'Longest Streak',
        completionRate: 'Completion Rate',
        totalCompleted: 'Total Completed',
        days: 'days',
        times: 'times',
        weekStats: 'Week Statistics',
        monthStats: 'Month Statistics',
        allTimeStats: 'All Time Statistics',
        
        // ========== CALENDAR ==========
        monday: 'Mon',
        tuesday: 'Tue',
        wednesday: 'Wed',
        thursday: 'Thu',
        friday: 'Fri',
        saturday: 'Sat',
        sunday: 'Sun',
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        clickDayToMark: 'Click on a day to mark completion',
        clickToMarkCompletion: 'Click to mark completion',
        
        // ========== STATS ==========
        currentStreak: 'Current Streak',
        bestStreak: 'Best Streak',
        week: 'Week',
        month: 'Month',
        weekPercent: 'Week %',
        monthPercent: 'Month %',
        
        // ========== EMPTY STATES ==========
        noHabits: 'No habits',
        noHabitsDesc: 'Add your first habit to start tracking',
        selectHabit: 'Select a habit',
        selectHabitDesc: 'Click on a habit on the left to view statistics',
        loadingHabits: 'Loading habits...',
        noCategories: 'No categories',
        
        // ========== BADGES ==========
        firstStep: 'First Step',
        firstStepDesc: 'Complete first habit',
        weekWarrior: 'Week Warrior',
        weekWarriorDesc: 'Complete habit 7 days in a row',
        monthMaster: 'Month Master',
        monthMasterDesc: 'Complete habit 30 days in a row',
        hundredHero: 'Hundred Hero',
        hundredHeroDesc: 'Complete habit 100 times',
        sportsman: 'Sportsman',
        sportsmanDesc: 'Complete 50 sport habits',
        scholar: 'Scholar',
        scholarDesc: 'Complete 50 study habits',
        healthGuru: 'Health Guru',
        healthGuruDesc: 'Complete 50 health habits',
        perfectWeek: 'Perfect Week',
        perfectWeekDesc: 'Complete all habits in a week',
        earlyBird: 'Early Bird',
        earlyBirdDesc: 'Complete 20 habits before 8:00',
        nightOwl: 'Night Owl',
        nightOwlDesc: 'Complete 20 habits after 22:00',
        
        // ========== PROFILE SETTINGS ==========
        profileSettings: 'Profile Settings',
        profile: 'Profile',
        manageCategoriesTitle: 'Manage Categories',
        today: 'Today',
        accountInfo: 'Account Information',
        changeUsername: 'Change username',
        changeEmail: 'Change email',
        changePassword: 'Change password',
        currentName: 'Current name',
        enterNewName: 'Enter new name',
        usernameRequirements: '• 2 to 50 characters • Letters, numbers and underscores only',
        enterNewEmail: 'Enter new email',
        emailRequirements: '• Valid email address • Will be used for login',
        enterCurrentPassword: 'Enter current password',
        enterNewPassword: 'Enter new password',
        repeatNewPassword: 'Repeat new password',
        passwordRequirementsDetails: '• Minimum 8 characters • Uppercase letter • Digit • Special character (!@#$%^&*)',
        changePasswordBtn: '🔒 Change Password',
        avatarProfile: 'Profile Avatar',
        clickToSelectEmoji: 'Click to select emoji',
        changeAvatar: 'Change Avatar',
        username: 'Username',
        emailAddress: 'Email Address',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        passwordRequirements: 'Password Requirements:',
        minCharacters: 'Minimum 8 characters',
        uppercaseLetter: 'Uppercase letter',
        digit: 'Digit',
        specialChar: 'Special character (!@#$%^&*)',
        appearance: 'Appearance',
        language: 'Interface Language',
        theme: 'Theme',
        notifications: 'Notifications',
        pushNotifications: 'Push Notifications',
        pushNotificationsDesc: 'Receive habit reminders',
        emailNotifications: 'Email Notifications',
        emailNotificationsDesc: 'Weekly reports via email',
        soundNotifications: 'Sound Notifications',
        soundNotificationsDesc: 'Play sound on reminder',
        personalization: 'Personalization',
        darkTheme: 'Dark Theme',
        darkThemeDesc: 'Use dark design',
        compactView: 'Compact View',
        compactViewDesc: 'Reduce interface spacing',
        dataAndPrivacy: 'Data and Privacy',
        analytics: 'Analytics',
        analyticsDesc: 'Help improve the app',
        autoBackup: 'Automatic Backup',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        never: 'Never',
        dangerZone: 'Danger Zone',
        dangerZoneDesc: 'These actions are irreversible. Please be careful.',
        clearAllData: 'Clear All Data',
        enableNotifications: 'Enable notifications',
        dataManagement: 'Data Management',
        exportData: 'Export data',
        importData: 'Import data',
        deleteAccount: 'Delete account',
        dangerZone: 'Danger Zone',
        
        // ========== AWARDS MODAL ==========
        myAwards: 'My Awards',
        earnedBadges: 'Earned Badges',
        lockedBadges: 'Locked Badges',
        noAwards: 'No awards yet',
        keepGoing: 'Keep completing habits!',
        
        // ========== OTHER ==========
        loading: 'Loading...',
        saving: 'Saving...',
        deleting: 'Deleting...',
        processing: 'Processing...',
        pleaseWait: 'Please wait...',
        success: 'Success!',
        completed: 'Completed',
        pending: 'Pending',
        active: 'Active',
        inactive: 'Inactive',
    }
};

// Текущий язык (по умолчанию украинский)
let currentLang = localStorage.getItem('language') || 'uk';

// Функция получения перевода
function t(key) {
    return translations[currentLang]?.[key] || key;
}

// Функция переключения языка
function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        
        // Обновляем select в настройках профиля
        const langSelect = document.getElementById('interfaceLanguage');
        if (langSelect) langSelect.value = lang;
        
        // Перезагружаем категории и уровни с новыми переводами
        if (typeof getDefaultCategories === 'function') {
            categories = getDefaultCategories();
        }
        if (typeof getLevels === 'function') {
            levels = getLevels();
        }
        
        updateAllTexts();
        if (typeof renderHabits === 'function') {
            renderHabits();
        }
        if (typeof renderCategoriesList === 'function') {
            renderCategoriesList();
        }
        if (typeof updateLevelDisplay === 'function') {
            updateLevelDisplay();
        }
        if (typeof updateProfileDisplay === 'function') {
            updateProfileDisplay();
        }
    }
}

// Обновление всех текстов на странице
function updateAllTexts() {
    // Обновляем все элементы с data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        
        // Пропускаем элементы с пользовательскими данными
        if (el.id === 'profileName' || el.classList.contains('user-data')) {
            return;
        }
        
        const translation = t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.placeholder !== undefined) {
                el.placeholder = translation;
            }
        } else {
            el.textContent = translation;
        }
    });
    
    // Обновляем placeholder атрибуты
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    // Обновляем title атрибуты
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });
    
    // Обновляем value для кнопок
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
        const key = el.getAttribute('data-i18n-value');
        el.value = t(key);
    });
}

// Функция для замены текстов в сообщениях
function showSuccess(messageKey) {
    const message = t(messageKey) || messageKey;
    // Используем существующую функцию показа уведомлений
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showError(messageKey) {
    const message = t(messageKey) || messageKey;
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Инициализация при загрузке
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Установить выбранный язык в select
        const langSelect = document.getElementById('interfaceLanguage');
        if (langSelect) langSelect.value = currentLang;
        
        updateAllTexts();
    });
}
