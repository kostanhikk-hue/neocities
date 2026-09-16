# Архив Льва Орлова

Независимый статический сайт для Neocities. Он использует только HTML, CSS и vanilla JavaScript: нет npm, сборки, фреймворков, CDN или внешних шрифтов.

## Где менять доску

Редактируйте только `board-data.js`. Файл подключается обычным `<script>` перед `script.js`, поэтому сайт работает и с `file://`, и после прямой загрузки на Neocities.

```html
<script src="board-data.js"></script>
<script src="script.js"></script>
```

`script.js` отвечает только за отрисовку, pan/zoom и события. Массивы `evidence` и `links` не находятся в renderer-коде.

## Настройка фона

В `board-data.js` есть понятный блок `theme`. Он применяется runtime-скриптом к CSS-переменным, поэтому не нужно искать цвета по renderer-коду:

```js
theme: {
  board: {
    color: '#243b37',
    texture: 'url("images/cork-noise.png"), radial-gradient(#ffffff12 1px, transparent 1px)',
    image: 'images/board-dark.jpg',
    size: '420px 420px, 13px 13px'
  },
  reader: {
    background: '#d8d0bc',
    opacity: '.78',
    textColor: '#262720',
    accent: '#8c3028',
    width: 'min(900px, calc(100vw - 48px))'
  }
}
```

- `board.color` — базовый цвет доски.
- `board.texture` — CSS `background-image`: градиенты, `url(...)` или их список.
- `board.image` — путь к локальному изображению доски, например `images/cork-dark.jpg`. Путь относителен к `index.html` и подходит для Neocities.
- `board.size` — CSS `background-size` в том же порядке, что и слои `texture`/`image`.
- `reader.background` — фон листа читалки.
- `reader.opacity` — прозрачность затемнения за reader, от `0` до `1`.
- `reader.textColor` — основной цвет текста читалки.
- `reader.accent` — цвет крестика, byline и ссылки.
- `reader.width` — ширина панели, обычно `min(900px, calc(100vw - 48px))`.

Локальные пути не требуют сборки: просто загрузите `images/board-dark.jpg` и укажите его в `board-data.js`.

## Изображения и универсальные контейнеры

Изображение больше не привязано к `polaroid`: у любого материала можно независимо настроить `image` и `frame`. Старые поля `mode`, `frame`, `padding`, `ratio`, `fit` и `objectPosition` продолжают работать.

```js
{
  id: 'file-photo', material: 'image',
  image: {
    src: 'images/station.jpg',
    fit: 'cover', objectPosition: 'center 35%', opacity: '.92',
    filter: 'sepia(.25)', transform: 'rotate(-1deg)'
  },
  frame: { preset: 'file' },
  x: 280, y: 180, width: '260px', height: '180px',
  caption: 'Фото из дела', meta: 'вложение / 11'
}
```

`image` может быть короткой строкой (`image: 'images/photo.jpg'`) или объектом с `src`, `alt`, `fit`, `objectPosition`, `opacity`, `filter`, `transform`. `frame` может быть именем пресета или объектом `{ preset, className, style }`. Доступны пресеты `plain`, `polaroid`, `photo-frame`, `newspaper`, `file`, `torn`. `plain` убирает оформление, остальные задают разные контейнеры.

Для пользовательского контейнера используйте безопасный CSS-класс и разрешённые inline-свойства:

```js
frame: {
  preset: 'plain',
  className: 'my-metal-frame',
  style: {
    background: '#b7b0a0', border: '3px solid #4b5049',
    borderRadius: '8px', padding: '10px',
    boxShadow: '5px 7px 0 rgba(0,0,0,.3)',
    clipPath: 'inset(0 round 8px)'
  }
}
```

Также поддерживаются короткие поля `frameClass` и `frameStyle`. Renderer применяет только свойства `background`, `border`, `borderRadius`, `padding`, `boxShadow`, `clipPath`, `mask`, `opacity` у рамки и `fit`, `objectPosition`, `opacity`, `filter`, `transform` у изображения. Значения с HTML/CSS-разметкой (`;`, `{}`, `<`, `>`) отбрасываются; классы проходят проверку имени. Это позволяет добавлять оформление без вставки HTML-атрибутов из данных.

Размер `width`/`height` задаётся на карточке, а `image.fit` управляет заполнением области. Для горизонтальных и вертикальных кадров указывайте `height` и `aspectRatio`; `cover` обрежет лишнее, `contain` сохранит весь кадр. `objectPosition` вроде `center top` или `left 30%` управляет точкой обрезки.

### Добавление CSS-пресета

Добавьте класс в `styles.css`, затем включите его в whitelist `FRAME_PRESETS` в `script.js`, чтобы имя применялось как `frame-your-name`:

```css
.frame-enabled.frame-metal {
  padding: 8px;
  background: linear-gradient(#d7d2c5, #8c887c);
  border: 2px solid #403f3a;
  border-radius: 3px;
  box-shadow: 5px 7px 0 rgba(0,0,0,.3);
}
```

После этого используйте `frame: { preset: 'metal' }`. Псевдоэлементы, `clip-path` и `mask` задавайте в CSS-пресете, а не через HTML.

## Размеры материалов

Размер задаётся прямо в объекте материала. Старое поле `width` и старое `ratio` продолжают работать.

```js
{
  id: 'wide-photo', material: 'image', mode: 'framed',
  image: 'images/wide.jpg',
  x: 140, y: 180,
  width: '280px', height: '180px',
  frame: { preset: 'photo-frame' }, framePadding: '12px',
  fit: 'cover', objectPosition: 'center 40%',
  caption: 'Горизонтальный снимок'
}
```

- `width` и `height` принимают число (пиксели) или CSS-значение: `'280px'`, `'22vw'`, `'auto'`.
- Если задан только `width`, используйте `aspectRatio: '4 / 3'` (старое имя `ratio` тоже поддерживается).
- `fit` передаётся в `object-fit`: обычно `cover` для заполнения области или `contain` для полного изображения без обрезки.
- `objectPosition` передаётся в `object-position`, например `'center top'`, `'left 30%'`.
- `framePadding` задаёт внутренний отступ рамки; старое поле `padding` остаётся совместимым.
- `caption` и `meta` остаются под изображением внутри рамки.

Крупные изображения сжимаются до заданной области через `width/height`; маленькие масштабируются без искажения, потому что сохраняют пропорции через `aspectRatio` и `object-fit`.

### Portrait и landscape рамки

Для горизонтального кадра задайте `width: '280px', height: '180px', aspectRatio: '14 / 9'`. Для вертикального — `width: '170px', height: '250px', aspectRatio: '17 / 25'`. У `polaroid` рамка оборачивает именно заданную область изображения, а подпись остаётся внутри белого нижнего поля:

```js
{
  id: 'portrait-polaroid', material: 'polaroid',
  image: 'images/portrait.jpg',
  width: '170px', height: '250px',
  fit: 'contain', objectPosition: 'center',
  framePadding: '10px',
  caption: 'Свидетель', meta: 'плёнка / 1994',
  x: 760, y: 260, rotation: -4, pin: true
}
```

## Обложка в reader

Для `reader: 'panel'` добавьте `readerCover` в конфигурацию материала. Обложка автоматически скрыта, если объект отсутствует; при открытии материала передаются её `image`, размер, `fit` и `objectPosition`:

```js
{
  id: 'panel-story', material: 'tape', text: 'ОТКРЫТЬ ДЕЛО',
  href: 'stories/open-door.html', reader: 'panel',
  readerTitle: 'Открытая дверь',
  readerByline: 'Лев Орлов · рассказ 03',
  readerCover: {
    image: 'images/open-door-cover.jpg',
    width: '100%', height: '220px',
    fit: 'cover', objectPosition: 'center 30%'
  },
  readerBody: 'Первый абзац.\\n\\nВторой абзац.'
}
```

Можно использовать относительный путь `images/open-door-cover.jpg` или локальный SVG/data URI. Для режима `reader: 'page'` обложка не нужна: материал просто переходит по `href`.

## Параметры BOARD_DATA

Верхний объект имеет три поля:

- `board`: размеры бесконечной рабочей области и ограничения масштаба.
- `evidence`: массив материалов доски.
- `links`: массив пар `['id-источника', 'id-цели']`, между которыми рисуется красная нить.

Настройки `board`:

| Параметр | Значение |
| --- | --- |
| `width`, `height` | Размер виртуальной доски в пикселях. Позиции `x/y` лежат внутри этой области. |
| `minZoom`, `maxZoom` | Нижний и верхний предел масштаба. |

## Общие параметры материала

Каждый объект в `evidence` может иметь следующие поля:

| Параметр | Обязателен | Описание |
| --- | --- | --- |
| `id` | да | Уникальный идентификатор. Используется также в `links`. Не повторяйте его. |
| `material` | да | `image`, `clipping`, `manuscript`, `cover`, `polaroid`, `marker`, `tape` или `label`. |
| `x`, `y` | да | Положение левого верхнего угла материала на виртуальной доске. |
| `width` | нет | Ширина в пикселях. По умолчанию `210`. Высота вычисляется содержимым или `ratio`. |
| `rotation` | нет | Наклон в градусах, например `-5` или `3`. |
| `zIndex` | нет | Слой материала. Большие значения лежат выше маленьких. |
| `pin` | нет | `true` добавляет булавку сверху, `false` оставляет материал без неё. |
| `caption` | нет | Короткая подпись под изображением, не основной текст карточки. |
| `meta` | нет | Маленькая вторичная архивная строка под подписью. |
| `href` | нет | Относительный путь или полный URL. Клик и Enter/Space открывают его. `stories/example.html` подходит для Neocities. |
| `reader` | нет | `panel` открывает встроенный ящик чтения; `page` переходит по `href`. По умолчанию используется обычный переход. |
| `readerTitle`, `readerByline`, `readerBody` | для `panel` | Заголовок, авторская строка/метаданные и текст рассказа. Переносы строк в `readerBody` сохраняются. Старые `readerMeta`/`readerText` поддерживаются как запасной вариант. |
| `links` | нет | Необязательная локальная подсказка связей; основной список нитей хранится в `BOARD_DATA.links`. |
| `anchors` | нет | Именованные точки крепления объекта: нормализованные `[x, y]` от `0` до `1`. |

## Материалы

### `image`

Изображение поддерживает обычный вариант без рамки и независимые контейнеры:

- `frame: { preset: 'plain' }` — изображение без рамки, только с булавкой.
- `frame: { preset: 'photo-frame' }` — изображение в оформленном контейнере.
- `mode: 'plain'` и `mode: 'framed'` — совместимый старый синтаксис.

Пути должны быть относительными к `board-data.js`, например `images/station.jpg` или `../images/station.jpg` из подпапки. Для локальной демонстрации можно использовать `data:image/svg+xml,...`, как в примере ниже.

Параметры `image`:

- `image`: путь к локальному JPG/PNG/SVG или data URI.
- `mode`: `plain` или `framed`.
- `frame`: пресет или объект пресета; старое значение-цвет поддерживается как фон рамки.
- `padding`: размер внутренней рамки в пикселях, например `12`.
- `ratio`: CSS-соотношение сторон, например `'4/3'`, `'3/2'` или `'1/1'`.

```js
{
  id: 'station-photo',
  material: 'image',
  mode: 'plain',
  image: 'images/station.jpg',
  x: 240, y: 180, width: 260,
  rotation: -4, zIndex: 2, pin: true,
  caption: 'Станция после дождя',
  meta: 'плёнка / 1998',
  href: 'stories/last-train.html'
}
```

```js
{
  id: 'framed-map',
  material: 'image',
  mode: 'framed',
  image: 'images/map.svg',
  frame: '#e8dfc7', padding: 14, ratio: '1/1',
  x: 680, y: 320, width: 210,
  rotation: 5, pin: true,
  caption: 'Карта маршрута'
}
```

### `clipping`

Газетная вырезка или лист с вводимым текстом. Используйте `text` с `\n` для абзацев. Высота увеличивается автоматически от длины текста, поэтому короткие и длинные вырезки можно смешивать.

```js
{
  id: 'short-clipping',
  material: 'clipping',
  text: 'ВЕЧЕРНИЕ НОВОСТИ\\n\\nСвет в окне горел всю ночь.',
  x: 300, y: 500, width: 230,
  rotation: -2, pin: true,
  caption: 'Вырезка из газеты', meta: 'стр. 4'
}
```

### `manuscript`

Рукописный лист. `text` становится крупной рукописной надписью, переносы сохраняются.

```js
{
  id: 'handwritten', material: 'manuscript',
  text: 'Не ищи дверь.\\n\\nИщи того, кто её открыл.',
  x: 920, y: 180, width: 190, rotation: 4,
  pin: true, caption: 'Лист 04'
}
```

### `cover`

Обложка рассказа или книги. Текст `text` размещается внутри обложки.

```js
{
  id: 'story-cover', material: 'cover',
  text: 'ПОСЛЕДНИЙ\\nПОЕЗД',
  x: 1120, y: 720, width: 190,
  rotation: 6, zIndex: 3, pin: true,
  caption: 'Обложка рассказа', href: 'stories/last-train.html'
}
```

### `polaroid`

Фотография с белой полароидной рамкой. Укажите `image`, а при необходимости `ratio`.

### `marker`

Яркая метка/стикер с коротким `text`. Подходит для номера, приоритета или места, к которому сходятся нити.

### `tape` / `label`

Компактная полоска скотча или бумажная лента. Высота вычисляется содержимым, ширина задаётся `width`.

- `text`: текст на ленте.
- `color`: базовый цвет ленты.
- `texture`: `fibers`, `grain` или `paper`.
- `pin`, `x`, `y`, `rotation`, `zIndex`, `caption`, `href` и `links` работают как у остальных материалов.

```js
{
  id: 'red-tape', material: 'tape',
  text: 'НЕ ЗАБЫТЬ: спросить про фонарь',
  color: '#a33a2e', texture: 'fibers',
  x: 820, y: 35, width: 260, rotation: -3,
  zIndex: 8, pin: true,
  links: ['receipt', 'blue-note']
}
```

## Встроенное чтение

Материал с `href` может открывать встроенный reader или отдельную страницу:

```js
{
  id: 'panel-story', material: 'tape', text: 'ОТКРЫТЬ ДЕЛО',
  href: 'stories/open-door.html', reader: 'panel',
  readerTitle: 'Открытая дверь',
  readerByline: 'Лев Орлов · дело № 07 / рассказ 03',
  readerBody: 'Дом стоял на месте...\\n\\nОн вошёл, потому что на ручке остался тёплый след.'
}
```

- `reader: 'panel'` открывает drawer поверх доски. Затемнение, крестик, клик по фону и `Escape` закрывают его. Позиция и масштаб доски сохраняются, потому что перехода со страницы не происходит.
- `reader: 'page'` оставляет обычное поведение: браузер переходит по `href` на HTML-страницу рассказа.
- В panel-режиме ссылка «открыть отдельную страницу» всё равно ведёт на `href`.

### Кастомизация текста рассказа

Откройте `board-data.js` и изменяйте три поля материала с `reader: 'panel'`:

- `readerTitle` — крупный заголовок.
- `readerByline` — автор, дата или номер дела.
- `readerBody` — основной текст.

Используйте `\\n\\n` между абзацами и `\\n` для одиночного переноса. Панель выводит безопасный plain text: HTML-теги не исполняются.

```js
{
  id: 'my-reading', material: 'tape', text: 'ЧИТАТЬ',
  color: '#c8ad6b', x: 520, y: 980, width: 210,
  href: 'stories/my-story.html', reader: 'panel',
  readerTitle: 'Название рассказа',
  readerByline: 'Имя автора · короткая заметка',
  readerBody: 'Первый абзац.\\n\\nВторой абзац.\\n\\nФинальная строка.'
}
```

Поддерживаются обычный текст, кириллица, кавычки, тире и переносы. HTML, Markdown, `<em>`, `<blockquote>` и ссылки внутри `readerBody` намеренно не интерпретируются. Для сложной разметки используйте `reader: 'page'` и отдельный HTML-файл в `stories/`.

### Настройка внешнего вида читалки

| Селектор | Что меняет |
| --- | --- |
| `.reader-drawer` | ширину, поля, фон, тень и вертикальный scroll; desktop по умолчанию `min(900px, calc(100vw - 48px))`. |
| `.reader-drawer > *` | комфортную ширину строки, по умолчанию `72ch`. |
| `.reader-drawer h2` | шрифт, размер и line-height заголовка. |
| `.reader-kicker` | цвет, размер и межбуквенное расстояние byline. |
| `.reader-text` | шрифт, размер, цвет и `line-height`. |
| `.reader-page-link` | цвет, размер и стиль ссылки. |
| `.reader-rule` | разделительная линия. |

Готовая настройка текста:

```css
.reader-text {
  max-width: 68ch;
  color: #302f29;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 19px;
  line-height: 1.78;
}
```

На экранах до `700px` читалка становится почти полноэкранной, уменьшает поля и размер текста, сохраняя вертикальный scroll. Escape, крестик и клик по затемнённому фону закрывают её, а панорамирование и масштаб доски не сбрасываются.

## Связи

Старый короткий формат остаётся рабочим:

```js
links: [
  ['station-photo', 'short-clipping'],
  ['short-clipping', 'handwritten']
]
```

Renderer сам проведёт между центрами материалов красные SVG-кривые с разным провисанием. Если карточка переименована, обновите все её пары в `links`.

### Точки крепления и провисание

У материала можно назвать точки крепления. `[0, 0]` — левый верхний угол, `[1, 1]` — правый нижний угол:

```js
{
  id: 'station-photo', material: 'image',
  x: 100, y: 200, width: 240,
  anchors: {
    top: [.5, 0], right: [1, .5],
    bottom: [.5, 1], left: [0, .5],
    custom: [.82, .24]
  }
}
```

Для связи используйте объект вместо короткого массива. `fromAnchor` и `toAnchor` выбирают именованные точки, `fromPoint` и `toPoint` позволяют задать точку прямо, а `sag` задаёт величину и направление провисания в пикселях:

```js
links: [
  { from: 'station-photo', to: 'framed-map', fromAnchor: 'right', toAnchor: 'left', sag: 92 },
  { from: 'framed-map', to: 'red-tape', fromPoint: [.5, 0], toPoint: [.2, 1], sag: -58 }
]
```

Без anchor renderer автоматически берёт безопасную точку около центра. Кривые рисуются cubic Bezier поверх материалов, но SVG-слой имеет `pointer-events: none`, поэтому нить не блокирует клик, фокус или переход объекта. Старые пары `['from-id', 'to-id']` продолжают работать. Для item-level `links` можно указать массив id или объектов связей.

## Управление

- Перетаскивайте пустое место мышью или пальцем.
- Используйте колесо мыши или `+`/`−` для масштаба.
- Кнопка «сбросить вид» и клавиша `R` возвращают исходную позицию.
- Нажмите на материал, либо сфокусируйте его и нажмите Enter/Space, чтобы открыть `href`.

## Публикация на Neocities

Загрузите `index.html`, `styles.css`, `board-data.js`, `script.js`, `README.md` и нужные папки `stories/` и `images/`. Не добавляйте `node_modules`, package-файлы или команды сборки. Относительные ссылки вроде `images/photo.jpg` и `stories/story.html` сохранятся на домене Neocities.

### Как открыть сайт для проверки

Не открывайте GitHub-страницу вида `github.com/kostanhikk-hue/neocities/blob/main/index.html`: GitHub показывает там исходный код и не исполняет HTML как сайт. Кнопка **Raw** также отдаёт файл как текст и не является адресом сайта.

Открывайте адрес опубликованного хостинга Neocities, например `https://ИМЯ-САЙТА.neocities.org/`, после загрузки файлов в панель Neocities. Если сайт ещё не опубликован, для локальной проверки запускайте простой HTTP-сервер из корня проекта:

```bash
python3 -m http.server 4173
```

Затем откройте `http://localhost:4173/index.html`. HTTP-сервер предпочтительнее двойного клика по файлу: он повторяет поведение статического хостинга и корректно обслуживает относительные ресурсы.
