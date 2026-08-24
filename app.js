let schedule = [];
let currentDate = startOfDay(new Date());
const today = startOfDay(new Date());

const dayNames = [
  "Воскресенье", "Понедельник", "Вторник", "Среда",
  "Четверг", "Пятница", "Суббота"
];

const monthNames = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const els = {
  group: document.getElementById("group"),
  dayName: document.getElementById("dayName"),
  date: document.getElementById("date"),
  schedule: document.getElementById("schedule"),
  todayButton: document.getElementById("todayButton"),
  todayBadge: document.getElementById("todayBadge"),
  previousDay: document.getElementById("previousDay"),
  nextDay: document.getElementById("nextDay"),
  dateButton: document.getElementById("dateButton")
};

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isToday(date) {
  return formatISO(date) === formatISO(today);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function render(offset = 0) {
  const dateString = formatISO(currentDate);
  const lessons = schedule
    .filter(item => item.date === dateString)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  els.dayName.textContent = dayNames[currentDate.getDay()];
  els.date.textContent =
    `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`;

  const todayNow = isToday(currentDate);
  els.todayBadge.classList.toggle("visible", todayNow);
  els.todayButton.classList.toggle("hidden", todayNow);

  if (!lessons.length) {
    els.schedule.innerHTML = '<div class="empty">Занятий нет</div>';
  } else {
    els.schedule.innerHTML = lessons.map(item => `
      <article class="lesson">
        <div class="lesson-time">
          ${escapeHtml(item.start)}<br>${escapeHtml(item.end)}
        </div>
        <div class="lesson-subject">${escapeHtml(item.subject)}</div>
      </article>
    `).join("");
  }

  els.schedule.style.setProperty("--day-offset", `${offset}px`);
  els.schedule.classList.remove("day-change");
  void els.schedule.offsetWidth;
  els.schedule.classList.add("day-change");
}

function changeDay(days) {
  currentDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() + days
  );
  render(days > 0 ? 18 : -18);
}

function goToday() {
  currentDate = startOfDay(new Date());
  render();
}

async function loadSchedule() {
  try {
    const response = await fetch("data/schedule.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("schedule.json not found");

    const data = await response.json();
    schedule = Array.isArray(data) ? data : (data.lessons || []);

    if (!Array.isArray(schedule)) throw new Error("Invalid schedule format");

    if (data.group) {
      els.group.textContent = `Группа ${data.group}`;
    }

    render();
  } catch (error) {
    console.error(error);
    els.schedule.innerHTML = `
      <div class="error">
        Не удалось загрузить расписание.<br>
        Проверьте файл data/schedule.json.
      </div>
    `;
  }
}

els.previousDay.addEventListener("click", () => changeDay(-1));
els.nextDay.addEventListener("click", () => changeDay(1));
els.todayButton.addEventListener("click", goToday);
els.dateButton.addEventListener("click", goToday);

let touchStartX = 0;
let touchStartY = 0;

els.schedule.addEventListener("touchstart", event => {
  if (event.touches.length !== 1) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });

els.schedule.addEventListener("touchend", event => {
  if (!touchStartX) return;

  const dx = event.changedTouches[0].clientX - touchStartX;
  const dy = event.changedTouches[0].clientY - touchStartY;

  touchStartX = 0;
  touchStartY = 0;

  if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.25) return;

  if (dx < 0) changeDay(1);
  else changeDay(-1);
}, { passive: true });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  });
}

loadSchedule();
