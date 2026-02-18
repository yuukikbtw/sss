// 🧪 NOTIFICATIONS TEST SCRIPT
// Скопируйте этот код в Chrome DevTools Console для быстрой проверки

console.log('='.repeat(60));
console.log('🧪 HABIT NOTIFICATIONS TEST SCRIPT');
console.log('='.repeat(60));

// ТЕСТ 1: Проверка наличия необходимого функции
console.group('✅ TEST 1: Проверка функций');
const hasScheduleNotificationCapacitor = typeof scheduleNotificationCapacitor === 'function';
const hasCreateNotification = typeof createNotification === 'function';
const hasDiagnosticNotifications = typeof diagnosticNotifications === 'function';
console.log('✓ scheduleNotificationCapacitor:', hasScheduleNotificationCapacitor ? '✅' : '❌');
console.log('✓ createNotification:', hasCreateNotification ? '✅' : '❌');
console.log('✓ diagnosticNotifications:', hasDiagnosticNotifications ? '✅' : '❌');
console.groupEnd();

// ТЕСТ 2: Проверка Notification API
console.group('✅ TEST 2: Notification API');
console.log('✓ API доступен:', 'Notification' in window ? '✅' : '❌');
console.log('✓ Permission:', Notification?.permission || 'N/A');
if (Notification?.permission === 'default') {
    console.warn('⚠️ Нужно дать разрешение на уведомления!');
}
console.groupEnd();

// ТЕСТ 3: Проверка Capacitor
console.group('✅ TEST 3: Capacitor Integration');
console.log('✓ Capacitor доступен:', !!window.Capacitor ? '✅' : '❌');
if (window.Capacitor?.Plugins?.LocalNotifications) {
    console.log('✓ LocalNotifications Plugin:', '✅ READY');
} else {
    console.log('✓ LocalNotifications Plugin:', '❌ NOT AVAILABLE (normal for web)');
}
console.groupEnd();

// ТЕСТ 4: Проверка Service Worker
console.group('✅ TEST 4: Service Worker');
if (navigator.serviceWorker?.controller) {
    console.log('✓ SW Status:', '✅ ACTIVE');
    console.log('✓ SW Scope:', navigator.serviceWorker.controller.scope);
} else {
    console.log('✓ SW Status:', '❌ INACTIVE (will add support later)');
}
console.groupEnd();

// ТЕСТ 5: Проверка активных напоминаний
console.group('✅ TEST 5: Active Reminders');
console.log('Total active reminders:', activeReminders?.size || 0);
if (activeReminders?.size > 0) {
    console.log('Reminders list:');
    activeReminders.forEach((id, habitId) => {
        const habit = habits.find(h => h.id === habitId);
        console.log(`  • ${habit?.name || habitId} (ID: ${id})`);
    });
} else {
    console.log('⚠️ Нет активных напоминаний (создайте привычку с напоминанием)');
}
console.groupEnd();

// ТЕСТ 6: Тестовое уведомление
console.group('✅ TEST 6: Send Test Notification');
console.log('Отправляю тестовое уведомление...');
createNotification(
    '🧪 Тестовое уведомление',
    'Это сообщение от системы тестирования. Если вы это видите - всё работает!',
    '📝'
);
console.log('✓ Если появилось уведомление - всё работает!');
console.groupEnd();

// ИТОГОВАЯ СВОДКА
console.group('📊 ИТОГОВЫЙ ОТЧЁТ');
const allOk = hasScheduleNotificationCapacitor && hasCreateNotification && 
              hasDiagnosticNotifications && ('Notification' in window);
if (allOk) {
    console.log('%c✅ ВСЁ ГОТОВО К ИСПОЛЬЗОВАНИЮ!', 'color: green; font-size: 14px; font-weight: bold');
    console.log('Система уведомлений работает корректно');
    console.log('Создайте привычку с напоминанием для тестирования');
} else {
    console.log('%c⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ', 'color: red; font-size: 14px; font-weight: bold');
    console.log('Проверьте вывод выше');
}
console.log('');
console.log('💡 Для полной диагностики запустите: diagnosticNotifications()');
console.groupEnd();

console.log('='.repeat(60));
