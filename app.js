let schedule = [];

const FIRST_DATE = new Date(2026, 8, 1); // 1 сентября 2026
const today = startOfDay(new Date());

const dayNames = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота"
];

const monthNames = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря"
];

const groupElement = document.getElementById("group");
const scheduleElement = document.getElementById("schedule");
const todayButton = document.getElementById("todayButton");

let loading = false;


/* ====================================
   ДАТЫ
==================================== */

function startOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}


function addDays(date, amount) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + amount
  );
}


function formatDate(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function isToday(date) {
  return formatDate(date) === formatDate(today);
}


/* ====================================
   HTML
==================================== */

function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}


/* ====================================
   СОХРАНЕНИЕ ЭМОДЗИ И ОЦЕНОК
==================================== */

function getLessonId(item) {
  return `${item.date}_${item.start}_${item.subject}`;
}


function getLessonData(item) {
  const id = getLessonId(item);

  try {
    return JSON.parse(
      localStorage.getItem(`lesson_${id}`)
    ) || {};
  } catch {
    return {};
  }
}


function saveLessonData(item, data) {
  const id = getLessonId(item);

  localStorage.setItem(
    `lesson_${id}`,
    JSON.stringify(data)
  );
}


/* ====================================
   КАРТОЧКА ПАРЫ
==================================== */

function createLesson(item) {

  const saved = getLessonData(item);

  const emoji =
    saved.emoji || "";

  const rating =
    saved.rating || 0;

  const stars = [1, 2, 3, 4, 5]
    .map(number => `
      <button
        class="rating-star ${
          number <= rating ? "active" : ""
        }"
        data-rating="${number}"
        aria-label="Оценка ${number}"
      >
        ★
      </button>
    `)
    .join("");

  return `
    <article
      class="lesson"
      data-lesson-id="${escapeHtml(
        getLessonId(item)
      )}"
    >

      <div class="lesson-main">

        <div class="lesson-time">
          ${escapeHtml(item.start)}
          <span>—</span>
          ${escapeHtml(item.end)}
        </div>

        <div class="lesson-subject">
          ${escapeHtml(item.subject)}
        </div>

      </div>


      <div class="lesson-tools">

        <button
          class="emoji-button"
          type="button"
          aria-label="Поставить эмодзи"
        >
          ${emoji || "＋"}
        </button>

        <div class="rating">
          ${stars}
        </div>

      </div>

    </article>
  `;
}


/* ====================================
   СОЗДАНИЕ ДНЯ
==================================== */

function createDay(date) {

  const dateString =
    formatDate(date);

  const lessons =
    schedule
      .filter(item =>
        item.date === dateString
      )
      .sort((a, b) =>
        String(a.start)
          .localeCompare(
            String(b.start)
          )
      );


  const todayClass =
    isToday(date)
      ? " today"
      : "";


  let lessonsHTML = "";


  if (lessons.length === 0) {

    lessonsHTML = `
      <div class="empty">
        Занятий нет
      </div>
    `;

  } else {

    lessonsHTML =
      lessons
        .map(createLesson)
        .join("");

  }


  return `
    <section
      class="day${todayClass}"
      data-date="${dateString}"
    >

      <div class="day-header">

        <div>

          <div class="day-name">
            ${dayNames[date.getDay()]}
          </div>

          <div class="day-date">
            ${date.getDate()}
            ${monthNames[date.getMonth()]}
          </div>

        </div>

        ${
          isToday(date)
            ? `
              <div class="today-badge">
                Сегодня
              </div>
            `
            : ""
        }

      </div>


      <div class="lessons">
        ${lessonsHTML}
      </div>

    </section>
  `;
}


/* ====================================
   НАЧАЛЬНАЯ ЗАГРУЗКА
==================================== */

function renderInitialSchedule() {

  let html = "";

  /*
   * ВСЕГДА начинаем с 1 сентября.
   *
   * Если сегодня 2 сентября:
   * 1 сентября
   * 2 сентября ← сюда прокрутимся
   * 3 сентября
   * ...
   */

  let date =
    new Date(FIRST_DATE);


  /*
   * Сразу показываем первый месяц.
   * Потом остальные дни будут
   * добавляться автоматически.
   */

  const initialEnd =
    addDays(today, 14);


  while (date <= initialEnd) {

    html += createDay(date);

    date = addDays(date, 1);
  }


  scheduleElement.innerHTML = html;


  /*
   * После отрисовки прокручиваем
   * именно к сегодняшнему дню.
   */

  setTimeout(() => {

    const todayElement =
      scheduleElement.querySelector(
        ".today"
      );

    if (todayElement) {

      todayElement.scrollIntoView({
        behavior: "instant",
        block: "start"
      });

    } else {

      /*
       * Если расписание почему-то
       * ещё не началось — показываем
       * 1 сентября.
       */

      const first =
        scheduleElement.querySelector(
          ".day"
        );

      if (first) {

        first.scrollIntoView({
          behavior: "instant",
          block: "start"
        });

      }

    }

    updateTodayButton();

  }, 50);
}


/* ====================================
   ДОБАВЛЕНИЕ БУДУЩИХ ДНЕЙ
==================================== */

function addFutureDays(count = 14) {

  const days =
    scheduleElement.querySelectorAll(
      ".day"
    );


  if (!days.length) {
    return;
  }


  const last =
    days[days.length - 1];


  let date =
    new Date(
      last.dataset.date +
      "T00:00:00"
    );


  date =
    addDays(date, 1);


  let html = "";


  for (
    let i = 0;
    i < count;
    i++
  ) {

    html += createDay(date);

    date =
      addDays(date, 1);

  }


  scheduleElement.insertAdjacentHTML(
    "beforeend",
    html
  );
}


/* ====================================
   КНОПКА "СЕГОДНЯ"
==================================== */

function goToToday() {

  const todayElement =
    scheduleElement.querySelector(
      ".today"
    );


  if (!todayElement) {
    return;
  }


  todayElement.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* ====================================
   ПОКАЗ КНОПКИ "СЕГОДНЯ"
==================================== */

function updateTodayButton() {

  const todayElement =
    scheduleElement.querySelector(
      ".today"
    );


  if (!todayElement) {
    return;
  }


  const rect =
    todayElement.getBoundingClientRect();


  const visible =
    rect.top <
      window.innerHeight * 0.5
    &&
    rect.bottom >
      window.innerHeight * 0.2;


  todayButton.classList.toggle(
    "hidden",
    visible
  );

}


/* ====================================
   ЭМОДЗИ
==================================== */

const emojiList = [
  "😀",
  "😎",
  "🔥",
  "❤️",
  "👍",
  "👎",
  "😴",
  "🤯",
  "💀",
  "😭",
  "🤓",
  "💪",
  "🎯",
  "⭐",
  "❌"
];


function showEmojiPicker(item, button) {

  /*
   * Если уже открыт —
   * закрываем.
   */

  const old =
    document.querySelector(
      ".emoji-picker"
    );

  if (old) {
    old.remove();
  }


  const picker =
    document.createElement("div");

  picker.className =
    "emoji-picker";


  picker.innerHTML =
    emojiList
      .map(emoji => `
        <button
          type="button"
          class="emoji-option"
          data-emoji="${emoji}"
        >
          ${emoji}
        </button>
      `)
      .join("")
    +
    `
      <button
        type="button"
        class="emoji-option emoji-clear"
        data-emoji=""
      >
        ×
      </button>
    `;


  button.parentElement.appendChild(
    picker
  );


  picker.addEventListener(
    "click",
    event => {

      const option =
        event.target.closest(
          ".emoji-option"
        );

      if (!option) {
        return;
      }


      const emoji =
        option.dataset.emoji;


      const saved =
        getLessonData(item);


      saved.emoji =
        emoji;


      saveLessonData(
        item,
        saved
      );


      button.textContent =
        emoji || "＋";


      picker.remove();

    }
  );
}


/* ====================================
   КЛИКИ ПО ПАРАМ
==================================== */

scheduleElement.addEventListener(
  "click",
  event => {

    const lesson =
      event.target.closest(
        ".lesson"
      );


    if (!lesson) {
      return;
    }


    const lessonId =
      lesson.dataset.lessonId;


    const item =
      schedule.find(
        item =>
          getLessonId(item) ===
          lessonId
      );


    if (!item) {
      return;
    }


    /*
     * Эмодзи
     */

    const emojiButton =
      event.target.closest(
        ".emoji-button"
      );


    if (emojiButton) {

      showEmojiPicker(
        item,
        emojiButton
      );

      return;
    }


    /*
     * Оценка
     */

    const ratingButton =
      event.target.closest(
        ".rating-star"
      );


    if (ratingButton) {

      const rating =
        Number(
          ratingButton.dataset.rating
        );


      const saved =
        getLessonData(item);


      /*
       * Повторное нажатие
       * убирает оценку.
       */

      saved.rating =
        saved.rating === rating
          ? 0
          : rating;


      saveLessonData(
        item,
        saved
      );


      const stars =
        lesson.querySelectorAll(
          ".rating-star"
        );


      stars.forEach(star => {

        star.classList.toggle(
          "active",
          Number(
            star.dataset.rating
          ) <= saved.rating
        );

      });

    }

  }
);


/* ====================================
   КЛИК ВНЕ ЭМОДЗИ
==================================== */

document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        ".emoji-button"
      )
      &&
      !event.target.closest(
        ".emoji-picker"
      )
    ) {

      const picker =
        document.querySelector(
          ".emoji-picker"
        );

      if (picker) {
        picker.remove();
      }

    }

  }
);


/* ====================================
   БЕСКОНЕЧНЫЙ СКРОЛЛ ВНИЗ
==================================== */

window.addEventListener(
  "scroll",
  () => {

    if (loading) {
      return;
    }


    const scrollTop =
      window.scrollY;


    const screenBottom =
      scrollTop +
      window.innerHeight;


    const pageHeight =
      document.documentElement
        .scrollHeight;


    /*
     * Загружаем следующие 14 дней,
     * когда пользователь близко к низу.
     */

    if (
      screenBottom >
      pageHeight - 1200
    ) {

      loading = true;

      addFutureDays(14);


      setTimeout(() => {
        loading = false;
      }, 100);

    }


    updateTodayButton();

  },
  {
    passive: true
  }
);


/* ====================================
   КНОПКА
==================================== */

todayButton.addEventListener(
  "click",
  goToToday
);


/* ====================================
   ЗАГРУЗКА JSON
==================================== */

async function loadSchedule() {

  try {

    console.log(
      "Загружаем расписание..."
    );


    const response =
      await fetch(
        "./data/schedule.json"
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      Array.isArray(data)
    ) {

      schedule = data;

    } else {

      schedule =
        data.lessons || [];


      if (data.group) {

        groupElement.textContent =
          `Группа ${data.group}`;

      }

    }


    if (
      !Array.isArray(schedule)
    ) {

      throw new Error(
        "В JSON отсутствует массив lessons"
      );

    }


    /*
     * Дополнительная проверка:
     * убираем всё, что раньше 1 сентября.
     */

    schedule =
      schedule.filter(item =>
        item.date >=
        formatDate(FIRST_DATE)
      );


    console.log(
      `Загружено занятий: ${schedule.length}`
    );


    renderInitialSchedule();

  } catch (error) {

    console.error(
      "ОШИБКА:",
      error
    );


    groupElement.textContent =
      "Ошибка загрузки";


    scheduleElement.innerHTML = `

      <div class="error">

        <div class="error-title">
          Не удалось загрузить расписание
        </div>

        <div class="error-text">
          ${escapeHtml(
            error.message
          )}
        </div>

        <div class="error-help">

          Проверьте файл:

          <br><br>

          <code>
            data/schedule.json
          </code>

          <br><br>

          Откройте F12 → Console,
          чтобы посмотреть ошибку.

        </div>

      </div>

    `;

  }

}


/* ====================================
   SERVICE WORKER
==================================== */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .catch(console.error);

    }
  );

}


loadSchedule();
