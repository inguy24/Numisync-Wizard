---
layout: default
title: Руководство по установке
lang: ru
page_id: installation
---

# Руководство по установке

NumiSync Wizard доступен для **Windows**, **macOS** и **Linux**. Выберите вашу платформу ниже для получения инструкций по установке.

---

## Системные требования

### Все платформы
- **OpenNumismat** установлен ([opennumismat.github.io](https://opennumismat.github.io/))
- **API-ключ Numista** (бесплатно на [numista.com](https://www.numista.com/))
- **ОЗУ:** минимум 4 ГБ, рекомендуется 8 ГБ
- **Хранилище:** 200 МБ + место для кэша

### Windows
- **ОС:** Windows 10 (64-bit) или Windows 11
- **Процессор:** Intel Core i3 или аналогичный

### macOS
- **ОС:** macOS 10.13 High Sierra или новее
- **Архитектура:** Intel (x64) и Apple Silicon (M1/M2/M3 arm64)

### Linux
- **ОС:** Ubuntu 20.04+, Debian 10+, Fedora 32+ или совместимые
- **Архитектура:** x64
- **Сервер отображения:** X11 или Wayland

---

## Установка на Windows {#windows-installation}

### Вариант 1: Microsoft Store (скоро)

NumiSync Wizard отправлен на рассмотрение в Microsoft Store и ожидает сертификации. После одобрения вы сможете установить его прямо из Store с автоматическими обновлениями и без предупреждений SmartScreen.

### Вариант 2: Прямая загрузка

#### Шаг 1: Скачайте NumiSync Wizard

1. Перейдите на [страницу релизов](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Скачайте последний установщик:
   - **64-bit системы:** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32-bit системы:** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**Не знаете, какую версию выбрать?** Большинство современных систем Windows — 64-bit. Чтобы проверить:
- Щёлкните правой кнопкой **Этот компьютер** → **Свойства**
- Найдите «Тип системы» (например, «64-разрядная операционная система»)

#### Шаг 2: Запустите установщик

1. **Дважды щёлкните** загруженный установщик
2. Windows может показать предупреждение SmartScreen (неподписанный установщик)
   - Нажмите **«Подробнее»** → **«Всё равно запустить»**
3. Примите лицензионное соглашение (EULA)
4. Выберите папку установки (по умолчанию: `C:\Program Files\NumiSync Wizard`)
5. Нажмите **Установить**
6. Дождитесь завершения установки
7. Нажмите **Готово** для запуска NumiSync Wizard

#### Шаг 3: Первый запуск

При первом запуске NumiSync Wizard:
- Создаст папку кэша в `%LOCALAPPDATA%\numisync-wizard-cache`
- Загрузится без открытой коллекции

---

## Установка на macOS {#macos-installation}

**Важно:** NumiSync Wizard **не подписан** сертификатом разработчика Apple. macOS заблокирует его по умолчанию. Следуйте этим шагам для установки:

### Шаг 1: Скачайте NumiSync Wizard

1. Перейдите на [страницу релизов](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Скачайте последний DMG:
   - **Универсальный DMG:** `NumiSync-Wizard-1.0.0-universal.dmg` (работает как на Intel, так и на Apple Silicon)
   - **Только для Intel:** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon:** `NumiSync-Wizard-1.0.0-arm64.dmg`

**Большинству пользователей следует скачать Universal DMG.**

### Шаг 2: Установите приложение

1. **Откройте DMG**, дважды щёлкнув по нему
2. **Перетащите NumiSync Wizard** в папку Applications
3. **Извлеките DMG** (правая кнопка → Извлечь)

### Шаг 3: Обход Gatekeeper (обязательно)

Поскольку приложение не подписано, macOS заблокирует его. Используйте **Метод 1** (самый простой):

#### Метод 1: Открытие через правую кнопку мыши (рекомендуется)

1. **Перейдите в папку Applications** в Finder
2. **Щёлкните правой кнопкой** (или удерживая Control) на NumiSync Wizard
3. Выберите **«Открыть»** из меню
4. Нажмите **«Открыть»** в диалоге безопасности
5. Приложение запустится — **все последующие запуски работают обычно** (просто дважды щёлкните)

#### Метод 2: Переопределение в «Системных настройках»

1. Попробуйте открыть приложение обычным способом (оно будет заблокировано)
2. Перейдите в **Системные настройки** → **Безопасность и конфиденциальность** → **Основные**
3. Нажмите **«Всё равно открыть»** рядом с сообщением о заблокированном приложении
4. Нажмите **«Открыть»** в диалоге подтверждения

#### Метод 3: Переопределение через Terminal (для опытных пользователей)

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**Подробные инструкции по устранению неполадок смотрите в [Руководстве по установке на macOS](/macos-install).**

### Шаг 4: Первый запуск

При первом запуске NumiSync Wizard:
- Создаст папку кэша в `~/Library/Application Support/numisync-wizard-cache`
- Загрузится без открытой коллекции

---

## Установка на Linux {#linux-installation}

NumiSync Wizard доступен в трёх форматах для Linux. Выберите подходящий для вашего дистрибутива:

### Вариант 1: AppImage (Универсальный — рекомендуется)

**Подходит для:** Всех дистрибутивов

1. Скачайте `NumiSync-Wizard-1.0.0.AppImage` со [страницы релизов](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Сделайте файл исполняемым:
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. Запустите:
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**Дополнительно:** Интегрируйте с вашей рабочей средой с помощью [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

### Вариант 2: Debian/Ubuntu (.deb)

**Подходит для:** Debian, Ubuntu, Linux Mint, Pop!_OS

```bash
# Скачать .deb файл
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# Установить
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# Установить зависимости при необходимости
sudo apt-get install -f
```

Запустите из меню приложений или выполните:
```bash
numisync-wizard
```

### Вариант 3: Fedora/RHEL (.rpm)

**Подходит для:** Fedora, RHEL, CentOS, Rocky Linux

```bash
# Скачать .rpm файл
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# Установить
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# Или с dnf (рекомендуется)
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

Запустите из меню приложений или выполните:
```bash
numisync-wizard
```

### Первый запуск (Linux)

При первом запуске NumiSync Wizard:
- Создаст папку кэша в `~/.config/numisync-wizard-cache`
- Загрузится без открытой коллекции

---

## Начальная настройка

**Примечание:** Эти шаги одинаковы для всех платформ (Windows, macOS, Linux)

### 1. Добавьте ваш API-ключ Numista

1. Нажмите **Settings** (значок шестерёнки) или нажмите `Ctrl+,`
2. Перейдите на вкладку **API Settings**
3. Введите ваш API-ключ Numista
4. Нажмите **Save**

**Как получить API-ключ:**
1. Зайдите на [numista.com](https://www.numista.com/) и создайте бесплатный аккаунт
2. Войдите → Профиль → API Access
3. Запросите API-ключ (мгновенное одобрение для личного использования)
4. Скопируйте ключ и вставьте в NumiSync Wizard

### 2. Откройте вашу коллекцию

1. Нажмите **File → Open Collection** (горячая клавиша зависит от платформы)
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Перейдите к вашему файлу OpenNumismat `.db`
3. Выберите файл и нажмите **Open**
4. Ваши монеты загрузятся в главном окне

### 3. Настройте параметры данных (необязательно)

1. Перейдите в **Settings → Data Settings**
2. Выберите, какие данные синхронизировать:
   - **Basic** — Данные каталога на уровне типа (тираж, состав, правитель, дизайнер)
   - **Issue** — Данные конкретного выпуска (год, знак монетного двора, разновидности)
   - **Pricing** — Актуальные рыночные цены (UNC, XF, VF, F)
3. При необходимости настройте сопоставление полей (только для опытных пользователей)

---

## Проверка установки

### Тест базовой функциональности

1. Выберите несколько монет в коллекции
2. Нажмите кнопку **Search & Enrich**
3. NumiSync должен выполнить поиск в Numista и найти совпадения
4. Просмотрите совпадения в интерфейсе сравнения полей
5. Примите совпадение, чтобы проверить обновление данных

Если вы видите совпадения и можете обновлять данные монет — установка выполнена успешно!

---

## Устранение неполадок

### Проблемы на Windows

**Установщик не запускается:**
- Предупреждение SmartScreen: нажмите «Подробнее» → «Всё равно запустить»
- Антивирус блокирует: добавьте исключение для установщика
- Повреждённая загрузка: повторно скачайте и проверьте размер файла

**Приложение не запускается:**
- Проверьте средство просмотра событий: Журналы Windows → Приложение
- Отсутствуют зависимости: установите [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- Вмешательство антивируса: добавьте исключение для `NumiSync Wizard.exe`

### Проблемы на macOS

**«NumiSync Wizard повреждён и не может быть открыт»:**
- Удалите DMG и загрузите снова
- Проверьте, совпадает ли размер файла со страницей релизов
- Попробуйте Метод 1 (Щелчок правой кнопкой → Открыть)

**«Нет варианта "Открыть" в диалоге безопасности»:**
- Вы открыли двойным щелчком вместо правой кнопки мыши
- Используйте Метод 1 или Метод 2 из инструкций по установке выше

**Приложение сразу завершает работу:**
- Проверьте журналы сбоев в программе Console
- Сообщите о проблеме с указанием версии macOS и журнала сбоя

**Смотрите [Руководство по установке на macOS](/macos-install) для подробного устранения неполадок.**

### Проблемы на Linux

**AppImage не запускается:**
- Убедитесь, что файл исполняемый: `chmod +x *.AppImage`
- Установите FUSE: `sudo apt-get install fuse` (Ubuntu/Debian)
- Попробуйте запустить через терминал для просмотра сообщений об ошибках

**Установка .deb завершается ошибкой:**
- Установите зависимости: `sudo apt-get install -f`
- Проверьте системные требования (Ubuntu 20.04+)

**Установка .rpm завершается ошибкой:**
- Установите зависимости: `sudo dnf install <имя-пакета>`
- Проверьте системные требования (Fedora 32+)

**Отсутствуют библиотеки:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### Все платформы

**Не удаётся открыть коллекцию:**
- Убедитесь, что файл `.db` существует и не повреждён
- Проверьте права доступа для чтения/записи
- Закройте OpenNumismat, если коллекция открыта в нём
- Попробуйте File → Recent Collections

**API-ключ не работает:**
- Копируйте и вставляйте аккуратно (без лишних пробелов)
- Проверьте ограничения по скорости (120 запросов/минуту)
- Убедитесь, что аккаунт Numista активен
- Проверьте ключ на странице документации API Numista

**Проблемы с папкой кэша:**
- **Windows:** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS:** `~/Library/Application Support/numisync-wizard-cache`
- **Linux:** `~/.config/numisync-wizard-cache`
- Проверьте права на запись
- Очистите кэш при повреждении

---

## Удаление

### Windows

1. Перейдите в **Settings → Приложения → Приложения и компоненты**
2. Найдите «NumiSync Wizard»
3. Нажмите **Удалить**
4. Следуйте инструкциям деинсталлятора

**Ручная очистка (необязательно):**
- Удалить кэш: `%LOCALAPPDATA%\numisync-wizard-cache`
- Удалить настройки: `%APPDATA%\numisync-wizard`

### macOS

1. Закройте приложение
2. Удалите `NumiSync Wizard.app` из папки Applications
3. **Дополнительная очистка:**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage:** Просто удалите файл `.AppImage`

**Debian/Ubuntu (.deb):**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -e numisync-wizard
# Или с dnf
sudo dnf remove numisync-wizard
```

**Ручная очистка (весь Linux):**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## Обновление до новой версии

NumiSync Wizard проверяет наличие обновлений при запуске (если включено в Settings).

### Автоматическое обновление (при наличии)
1. Нажмите уведомление **«Update Available»**
2. Загрузка начнётся автоматически
3. Установка начнётся после завершения загрузки
4. Приложение перезапустится с новой версией

### Ручное обновление
1. Скачайте последний установщик со [страницы релизов](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. Запустите установщик
3. Он автоматически обнаружит и обновит существующую установку
4. Ваши настройки и кэш сохранятся

---

## Следующие шаги

- **[Руководство по быстрому старту](/ru/quickstart)** — Начните работу за 5 минут
- **[Руководство пользователя](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** — Полная документация по функциям
- **[Получите лицензию Supporter](#)** — Разблокируйте Fast Pricing Mode и Auto-Propagate

---

## Нужна помощь?

- **Проблемы:** [Сообщить на GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Обсуждения:** [Спросить сообщество](https://github.com/inguy24/numismat-enrichment/discussions)
- **Документация:** [Полная документация](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/ru/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← На главную</a>
  <a href="/ru/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">Далее: Быстрый старт →</a>
</div>
