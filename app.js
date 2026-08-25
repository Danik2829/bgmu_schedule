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

const els = {
  group: document.getElementById("group"),
  schedule: document.getElementById("schedule"),
  todayButton: document.getElementById("todayButton")
};

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

function formatISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isToday(date) {
  return formatISO(date) === formatISO(today);
}

function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}

/*
 * Создаёт один день расписания
 */
function renderDay(date) {

  const dateString = formatISO(date);

  const lessons = schedule
    .filter(item => item.date === dateString)
    .sort((a, b) =>
      String(a.start).localeCompare(String(b.start))
    );

  const todayClass = isToday(date)
    ? "day today"
    : "day";

  const todayBadge = isToday(date)
    ? `<div class="today-badge">Сегодня</div>`
    : "";

  let lessonsHTML = "";

  if (lessons.length === 0) {

    lessonsHTML = `
      <div class="empty">
        Занятий нет
      </div>
    `;

  } else {

    lessonsHTML = lessons.map(item => `
      <article class="lesson">

        <div class="lesson-time">
          ${escapeHtml(item.start)}<br>
          ${escapeHtml(item.end)}
        </div>

        <div class="lesson-subject">
          ${escapeHtml(item.subject)}
        </div>

      </article>
    `).join("");

  }

  return `
    <section
      class="${todayClass}"
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

        ${todayBadge}

      </div>

      <div class="lessons">
        ${lessonsHTML}
      </div>

    </section>
  `;
}

/*
 * Первоначально показываем
 * неделю назад + две недели вперёд.
 */
function renderInitialDays() {

  let html = "";

  const startDate = addDays(today, -7);
  const endDate = addDays(today, 14);

  let date = startDate;

  while (date <= endDate) {

    html += renderDay(date);

    date = addDays(date, 1);
  }

  els.schedule.innerHTML = html;

  scrollToToday(false);
}

/*
 * Добавляет следующие дни
 */
function loadNextDays(amount = 14) {

  const days = els.schedule.querySelectorAll(".day");

  if (!days.length) {
    return;
  }

  const lastDay = days[days.length - 1];

  let date = new Date(
    `${lastDay.dataset.date}T00:00:00`
  );

  date = addDays(date, 1);

  let html = "";

  for (let i = 0; i < amount; i++) {

    html += renderDay(date);

    date = addDays(date, 1);
  }

  els.schedule.insertAdjacentHTML(
    "beforeend",
    html
  );
}

/*
 * Добавляет предыдущие дни.
 */
function loadPreviousDays(amount = 14) {

  const days = els.schedule.querySelectorAll(".day");

  if (!days.length) {
    return;
  }

  const firstDay = days[0];

  let date = new Date(
    `${firstDay.dataset.date}T00:00:00`
  );

  date = addDays(date, -amount);

  let html = "";

  for (let i = 0; i < amount; i++) {

    html += renderDay(date);

    date = addDays(date, 1);
  }

  /*
   * Сохраняем положение экрана,
   * чтобы при добавлении дней сверху
   * пользователя не телепортировало.
   */
  const oldHeight = els.schedule.scrollHeight;

  els.schedule.insertAdjacentHTML(
    "afterbegin",
    html
  );

  const newHeight = els.schedule.scrollHeight;

  window.scrollBy(
    0,
    newHeight - oldHeight
  );
}

/*
 * Возвращение к сегодняшнему дню
 */
function goToday() {

  const todayElement =
    els.schedule.querySelector(".day.today");

  if (!todayElement) {
    return;
  }

  todayElement.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/*
 * Проверяем, достаточно ли далеко
 * пользователь прокрутил страницу.
 */
let scrollTimeout = null;

window.addEventListener(
  "scroll",
  () => {

    if (scrollTimeout) {
      return;
    }

    scrollTimeout = setTimeout(() => {

      const scrollTop = window.scrollY;

      const windowBottom =
        window.innerHeight + scrollTop;

      const pageHeight =
        document.documentElement.scrollHeight;

      /*
       * Почти дошли до конца —
       * добавляем ещё 14 дней.
       */
      if (
        windowBottom >
        pageHeight - 1000
      ) {

        loadNextDays(14);
      }

      /*
       * Почти дошли до начала —
       * добавляем предыдущие 14 дней.
       */
      if (scrollTop < 800) {

        const firstDay =
          els.schedule.querySelector(".day");

        if (firstDay) {

          const firstDate =
            new Date(
              `${firstDay.dataset.date}T00:00:00`
            );

          /*
           * Не даём бесконечно загружать
           * слишком далёкое прошлое.
           */
          const minimumDate =
            addDays(today, -365);

          if (firstDate > minimumDate) {

            loadPreviousDays(14);
          }
        }
      }

      scrollTimeout = null;

    }, 100);

  },
  {
    passive: true
  }
);

/*
 * Определяем текущий день,
 * когда пользователь листает страницу.
 *
 * Если сегодня ушли далеко —
 * появляется кнопка "Сегодня".
 */
window.addEventListener(
  "scroll",
  () => {

    const todayElement =
      els.schedule.querySelector(".day.today");

    if (!todayElement) {
      return;
    }

    const rect =
      todayElement.getBoundingClientRect();

    const isVisible =
      rect.top < window.innerHeight * 0.45 &&
      rect.bottom > window.innerHeight * 0.25;

    els.todayButton.classList.toggle(
      "hidden",
      isVisible
    );
  },
  {
    passive: true
  }
);

els.todayButton.addEventListener(
  "click",
  goToday
);

/*
 * Загрузка расписания
 */
async function loadSchedule() {

  try {

    const response = await fetch(
      "data/schedule.json",
      {
        cache: "no-cache"
      }
    );

    if (!response.ok) {
      throw new Error(
        "schedule.json not found"
      );
    }

    const data =
      await response.json();

    schedule =
      Array.isArray(data)
        ? data
        : data.lessons || [];

    if (!Array.isArray(schedule)) {

      throw new Error(
        "Invalid schedule format"
      );
    }

    if (data.group) {

      els.group.textContent =
        `Группа ${data.group}`;
    }

    renderInitialDays();

  } catch (error) {

    console.error(error);

    els.schedule.innerHTML = `
      <div class="error">

        Не удалось загрузить расписание.

        <br><br>

        Проверьте файл
        <b>data/schedule.json</b>.

      </div>
    `;
  }
}

/*
 * Service Worker
 */
if ("serviceWorker" in navigator) {

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
