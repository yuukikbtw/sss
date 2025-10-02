# 🤝 Contributing - Руководство для контрибьюторов

> Спасибо что хочешь улучшить Habit Tracker! Это руководство поможет тебе начать.

---

## 📋 Содержание

1. [Code of Conduct](#code-of-conduct)
2. [Как начать](#как-начать)
3. [Структура проекта](#структура-проекта)
4. [Git Workflow](#git-workflow)
5. [Style Guide](#style-guide)
6. [Тестирование](#тестирование)
7. [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

### Наши стандарты

✅ **Поощряется:**
- Дружелюбное и инклюзивное общение
- Уважение к разным точкам зрения
- Конструктивная критика
- Фокус на том что лучше для сообщества

❌ **Недопустимо:**
- Оскорбления, троллинг, личные атаки
- Публичные или приватные домогательства
- Публикация приватной информации других людей

---

## 🚀 Как начать

### 1. Fork проекта

```bash
# Жми "Fork" в правом верхнем углу GitHub
```

### 2. Clone к себе

```bash
git clone https://github.com/ваш-username/habit-tracker.git
cd habit-tracker
```

### 3. Добавь upstream

```bash
git remote add upstream https://github.com/original/habit-tracker.git
git fetch upstream
```

### 4. Создай ветку

```bash
git checkout -b feature/amazing-feature
# или
git checkout -b fix/bug-description
```

### 5. Установи зависимости

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # если есть dev зависимости
```

### 6. Запусти проект

```bash
.\start_all.bat  # Windows
python run_universal.py  # Linux/macOS
```

---

## 📁 Структура проекта

```
habit-tracker/
├── backend/
│   ├── py.py              # Главный Flask app
│   ├── models/            # Модели данных (если будут)
│   ├── routes/            # API routes (если будут разделены)
│   └── utils/             # Утилиты
│
├── frontend/
│   ├── index.html         # Главная страница
│   ├── java.js            # Вся логика
│   ├── css.css            # Стили
│   └── components/        # Компоненты (если будут разделены)
│
├── docs/
│   ├── README.md          # Основная документация
│   ├── INSTALL.md         # Инструкция по установке
│   ├── CHANGELOG.md       # История изменений
│   └── API.md             # API документация
│
├── tests/
│   ├── test_api.py        # Тесты API
│   ├── test_models.py     # Тесты моделей
│   └── test_utils.py      # Тесты утилит
│
└── scripts/
    ├── start_all.bat      # Скрипты запуска
    └── migrate.py         # Миграции БД
```

---

## 🔄 Git Workflow

### Названия веток

Используй префиксы:
- `feature/` - новые функции
- `fix/` - исправление багов
- `docs/` - изменения в документации
- `refactor/` - рефакторинг кода
- `test/` - добавление тестов
- `chore/` - рутинные задачи

Примеры:
```bash
feature/add-dark-theme
fix/login-session-bug
docs/update-readme
refactor/api-endpoints
test/add-auth-tests
chore/update-dependencies
```

### Commit Messages

Формат: `<type>(<scope>): <subject>`

**Типы:**
- `feat:` - новая функция
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `style:` - форматирование, точки с запятой и т.д.
- `refactor:` - рефакторинг кода
- `test:` - добавление тестов
- `chore:` - обновление зависимостей и т.д.

**Примеры:**
```bash
feat(auth): add email verification
fix(api): resolve session timeout issue
docs(readme): update installation guide
style(css): format glassmorphism styles
refactor(backend): split routes into modules
test(auth): add login unit tests
chore(deps): update flask to 3.2.0
```

### Workflow

1. **Sync с upstream:**
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Создай feature ветку:**
```bash
git checkout -b feature/your-feature
```

3. **Делай изменения и коммить:**
```bash
git add .
git commit -m "feat(feature): add new feature"
```

4. **Push в свой fork:**
```bash
git push origin feature/your-feature
```

5. **Создай Pull Request на GitHub**

---

## 🎨 Style Guide

### Python (Backend)

Следуем [PEP 8](https://peps.python.org/pep-0008/)

```python
# ✅ Good
def create_user(username: str, email: str, password: str) -> Dict:
    """Create a new user with hashed password."""
    user_doc = {
        "username": username.strip(),
        "email": email.strip().lower(),
        "password_hash": generate_password_hash(password),
        "created_at": date.today().isoformat()
    }
    return user_doc

# ❌ Bad
def CreateUser(u,e,p):
    userDoc={"username":u,"email":e,"password":p}
    return userDoc
```

**Ключевые моменты:**
- 4 пробела для отступов (не табы!)
- Максимум 100 символов в строке
- Docstrings для всех функций
- Type hints где возможно
- Осмысленные имена переменных

### JavaScript (Frontend)

Следуем [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

```javascript
// ✅ Good
async function fetchHabits() {
    try {
        const response = await fetch(`${API_BASE}/habits`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const habits = await response.json();
        return habits;
    } catch (error) {
        console.error('Failed to fetch habits:', error);
        showError('Ошибка загрузки привычек');
    }
}

// ❌ Bad
function fetchHabits(){
fetch(API_BASE+"/habits").then(function(r){return r.json()}).then(function(h){habits=h})
}
```

**Ключевые моменты:**
- 4 пробела для отступов
- `const`/`let` вместо `var`
- Arrow functions где уместно
- async/await вместо .then()
- JSDoc комментарии для сложных функций
- Осмысленные имена

### CSS

```css
/* ✅ Good */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    z-index: 1000;
}

/* ❌ Bad */
.modalOverlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.5);z-index:1000}
```

**Ключевые моменты:**
- 4 пробела
- kebab-case для классов
- Группировка связанных свойств
- Комментарии для секций
- CSS variables для цветов

---

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
pytest

# Конкретный файл
pytest tests/test_api.py

# С coverage
pytest --cov=. --cov-report=html

# Смотреть coverage
open htmlcov/index.html
```

### Написание тестов

**Backend (pytest):**
```python
def test_create_user():
    """Test user creation with valid data."""
    user = create_user("test", "test@example.com", "password123")
    
    assert user["username"] == "test"
    assert user["email"] == "test@example.com"
    assert "password_hash" in user
    assert "password" not in user  # Password должен быть хэширован
```

**Frontend (Jest - если добавим):**
```javascript
describe('fetchHabits', () => {
    it('should fetch habits successfully', async () => {
        const mockHabits = [{ id: '1', name: 'Test' }];
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockHabits)
            })
        );
        
        const habits = await fetchHabits();
        expect(habits).toEqual(mockHabits);
    });
});
```

### Что тестировать

**Обязательно:**
- ✅ Все API endpoints
- ✅ Валидация данных
- ✅ Аутентификация и авторизация
- ✅ CRUD операции
- ✅ Критичная бизнес логика

**Желательно:**
- ⭐ Edge cases
- ⭐ Error handling
- ⭐ UI компоненты
- ⭐ Интеграционные тесты

---

## 🔍 Pull Request Process

### Перед созданием PR

**Checklist:**
- [ ] Код соответствует style guide
- [ ] Все тесты проходят
- [ ] Добавлены новые тесты (если нужно)
- [ ] Обновлена документация
- [ ] Нет конфликтов с main веткой
- [ ] Коммиты осмысленные и атомарные
- [ ] Удалены console.log и debug код

### Создание PR

1. **Title:**
   ```
   feat: Add dark theme toggle
   fix: Resolve login session bug
   docs: Update API documentation
   ```

2. **Description template:**
   ```markdown
   ## Описание изменений
   Краткое описание что делает этот PR
   
   ## Тип изменения
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Как протестировать
   1. Шаг 1
   2. Шаг 2
   3. Ожидаемый результат
   
   ## Screenshots (если UI)
   ![Before](url)
   ![After](url)
   
   ## Checklist
   - [ ] Код проревьюен самостоятельно
   - [ ] Добавлены/обновлены тесты
   - [ ] Документация обновлена
   - [ ] Нет breaking changes (или указаны в описании)
   ```

### Review Process

1. **Auto checks** должны пройти (если настроены)
2. **Code review** от maintainer'а
3. **Requested changes** - исправь и push
4. **Approved** - PR будет смержен!

### После merge

```bash
# Обнови свой fork
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# Удали feature ветку
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

---

## 💡 Рекомендации

### Хорошие практики

**DO ✅**
- Делай маленькие, атомарные PR
- Пиши понятные commit messages
- Добавляй тесты для нового кода
- Обновляй документацию
- Комментируй сложную логику
- Используй meaningful variable names

**DON'T ❌**
- Не коммить большие файлы (images, videos)
- Не коммить secrets и API keys
- Не делай breaking changes без обсуждения
- Не смешивай разные изменения в одном PR
- Не игнорируй code review комментарии

### Tips

- 🔍 Используй `git diff` перед коммитом
- 📝 Пиши подробные PR descriptions
- 🎯 Один PR = одна фича/фикс
- 💬 Задавай вопросы в issues/discussions
- 📚 Читай существующий код перед изменениями

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Описание бага:**
Четкое описание что не работает

**Шаги для воспроизведения:**
1. Зайти на '...'
2. Кликнуть на '...'
3. Скроллить до '...'
4. Увидеть ошибку

**Ожидаемое поведение:**
Что должно было произойти

**Скриншоты:**
Если применимо, добавь скриншоты

**Окружение:**
- OS: [e.g. Windows 11, Ubuntu 22.04]
- Browser: [e.g. Chrome 120, Firefox 121]
- Python Version: [e.g. 3.11.5]
- Project Version: [e.g. 2.0.0]

**Дополнительный контекст:**
Любая другая информация о проблеме
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Описание фичи:**
Четкое описание что ты хочешь добавить

**Use case:**
Объясни зачем это нужно и кому поможет

**Предложенное решение:**
Опиши как это может быть реализовано

**Альтернативы:**
Альтернативные подходы которые ты рассматривал

**Дополнительный контекст:**
Mockups, примеры из других приложений и т.д.
```

---

## 📞 Контакты

- **GitHub Issues:** [создать issue](https://github.com/your-repo/issues)
- **GitHub Discussions:** [обсудить идеи](https://github.com/your-repo/discussions)
- **Email:** your-email@example.com (для приватных вопросов)

---

## 🎓 Ресурсы для изучения

### Git
- [Pro Git Book](https://git-scm.com/book/ru/v2)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/ru/)

### Python
- [PEP 8](https://peps.python.org/pep-0008/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [pytest Documentation](https://docs.pytest.org/)

### JavaScript
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [Airbnb Style Guide](https://github.com/airbnb/javascript)

---

## 🙏 Спасибо!

Спасибо за желание улучшить Habit Tracker! Каждый contribution ценен - будь то код, документация, bug reports или идеи для новых фич.

Happy coding! 🚀

---

<div align="center">

[⬆ Наверх](#-contributing---руководство-для-контрибьюторов)

</div>
