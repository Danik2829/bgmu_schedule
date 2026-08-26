let schedule = [];

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


const groupElement =
  document.getElementById("group");

const scheduleElement =
  document.getElementById("schedule");

const todayButton =
  document.getElementById("todayButton");


// ------------------------------------
// ДАТЫ
// ------------------------------------

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

  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function isToday(date) {

  return (
    formatDate(date) ===
    formatDate(today)
  );

}


// ------------------------------------
// БЕЗОПАСНЫЙ ТЕКСТ
// ------------------------------------

function escapeHtml(value) {

  const div =
    document.createElement("div");

  div.textContent =
    value ?? "";

  return div.innerHTML;

}


// ------------------------------------
// СОЗДАНИЕ ОДНОГО ДНЯ
// ------------------------------------

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


  const today =
    isToday(date);


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
        .map(item => {

          return `
            <article class="lesson">

              <div class="lesson-time">
                ${escapeHtml(item.start)}
                <span>—</span>
                ${escapeHtml(item.end)}
              </div>

              <div class="lesson-subject">
                ${escapeHtml(item.subject)}
              </div>

            </article>
          `;

        })
        .join("");

  }


  return `

    <section
      class="day ${today ? "today" : ""}"
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
          today
            ? `<div class="today-badge">
                 Сегодня
               </div>`
            : ""
        }

      </div>


      <div class="lessons">

        ${lessonsHTML}

      </div>

    </section>

  `;

}


// ------------------------------------
// ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА
// ------------------------------------

function renderInitialSchedule() {

  let html = "";


  /*
   * Показываем:
   *
   * 7 дней назад
   * +
   * сегодня
   * +
   * 14 дней вперёд
   */

  let date =
    addDays(today, -7);

  const endDate =
    addDays(today, 14);


  while (date <= endDate) {

    html += createDay(date);

    date =
      addDays(date, 1);

  }


  scheduleElement.innerHTML =
    html;


  /*
   * Если расписание начинается
   * после сегодняшнего дня,
   * сегодняшний пустой день всё
   * равно остаётся в ленте.
   */

}


// ------------------------------------
// ДОБАВИТЬ ДНИ ВПЕРЁД
// ------------------------------------

function addFutureDays(count = 14) {

  const days =
    scheduleElement
      .querySelectorAll(".day");


  if (!days.length) {
    return;
  }


  const last =
    days[days.length - 1];


  let date =
    new Date(
      last.dataset.date + "T00:00:00"
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


// ------------------------------------
// ДОБАВИТЬ ДНИ НАЗАД
// ------------------------------------

function addPreviousDays(count = 14) {

  const days =
    scheduleElement
      .querySelectorAll(".day");


  if (!days.length) {
    return;
  }


  const first =
    days[0];


  let date =
    new Date(
      first.dataset.date + "T00:00:00"
    );


  date =
    addDays(date, -count);


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


  /*
   * Сохраняем положение экрана.
   */

  const oldHeight =
    document.documentElement
      .scrollHeight;


  scheduleElement.insertAdjacentHTML(
    "afterbegin",
    html
  );


  const newHeight =
    document.documentElement
      .scrollHeight;


  window.scrollBy(
    0,
    newHeight - oldHeight
  );

}


// ------------------------------------
// КНОПКА "СЕГОДНЯ"
// ------------------------------------

function goToToday() {

  const todayElement =
    scheduleElement
      .querySelector(".today");


  if (!todayElement) {
    return;
  }


  todayElement.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


// ------------------------------------
// ПОКАЗЫВАТЬ / СКРЫВАТЬ "СЕГОДНЯ"
// ------------------------------------

function updateTodayButton() {

  const todayElement =
    scheduleElement
      .querySelector(".today");


  if (!todayElement) {
    return;
  }


  const rect =
    todayElement
      .getBoundingClientRect();


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


// ------------------------------------
// БЕСКОНЕЧНЫЙ СКРОЛЛ
// ------------------------------------

let loading = false;


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
     * Почти низ страницы.
     */

    if (
      screenBottom >
      pageHeight - 1200
    ) {

      loading = true;

      addFutureDays(14);

      setTimeout(() => {
        loading = false;
      }, 50);

    }


    /*
     * Почти верх страницы.
     */

    if (
      scrollTop < 600
    ) {

      const first =
        scheduleElement
          .querySelector(".day");


      if (first) {

        const firstDate =
          new Date(
            first.dataset.date +
            "T00:00:00"
          );


        const minimumDate =
          addDays(today, -365);


        if (
          firstDate >
          minimumDate
        ) {

          loading = true;

          addPreviousDays(14);

          setTimeout(() => {
            loading = false;
          }, 50);

        }

      }

    }


    updateTodayButton();

  },
  {
    passive: true
  }
);


// ------------------------------------
// КНОПКА
// ------------------------------------

todayButton.addEventListener(
  "click",
  goToToday
);


// ------------------------------------
// ЗАГРУЗКА JSON
// ------------------------------------

async function loadSchedule() {

  try {

    console.log(
      "Загружаем расписание..."
    );


    const response =
      await fetch(
        "./data/schedule.json"
      );


    console.log(
      "Ответ сервера:",
      response.status,
      response.url
    );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "JSON загружен:",
      data
    );


    /*
     * Поддерживаем оба варианта:
     *
     * {
     *   "group": "8103",
     *   "lessons": [...]
     * }
     *
     * И просто [...]
     */

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

          Проверьте, что файл находится здесь:

          <br><br>

          <code>
            data/schedule.json
          </code>

          <br><br>

          Откройте консоль браузера
          (F12 → Console) для подробностей.

        </div>

      </div>

    `;

  }

}


// ------------------------------------
// START
// ------------------------------------

loadSchedule();
