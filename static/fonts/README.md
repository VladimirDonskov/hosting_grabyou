# Шрифты GrabYou

Фирменная пара — **Cygre** (текст) и **Bulatov SP Demo** (дисплейные заголовки).
Оба распространяются по своим лицензиям, поэтому файлы в репозиторий не кладутся.

## Как подключить

Положите сюда лицензированные файлы с такими именами и добавьте соответствующий
относительный URL в `src` правила `@font-face` в `static/fonts/brand-fonts.css`.
Например: `src: local('Cygre Book'), url('./Cygre-Book.woff2') format('woff2');`.
Относительный путь работает и на отдельном домене, и в подпапке GitHub Pages.

```
static/fonts/
├── Cygre-Book.woff2      → font-weight: 400
├── Cygre-Medium.woff2    → font-weight: 500
├── Cygre-Bold.woff2      → font-weight: 700
├── Cygre-Black.woff2     → font-weight: 900
└── BulatovSP-Demo.woff2  → дисплейный, 400–900
```

Если шрифт уже установлен в системе дизайнера, он подхватится через `local()`
без файла.

## Пока файлов нет

Свободные шрифты из коллекции Google Fonts загружаются с домена сайта.
В `fallback-fonts.css` подключены кириллица, латиница и расширенная латиница
(включая знак рубля). Лицензии SIL Open Font License лежат рядом с файлами WOFF2.

| Роль       | Фирменный       | Свободный фолбэк |
| ---------- | --------------- | ---------------- |
| Дисплейный | Bulatov SP Demo | **Unbounded**    |
| Текст      | Cygre           | **Onest**        |
| Моно/цифры | —               | **JetBrains Mono** |

Подбирались по ширине и геометрии, чтобы вёрстка не разъезжалась при подмене.

## Конвертация в woff2

```bash
npx ttf2woff2 < Cygre-Book.ttf > Cygre-Book.woff2
```
