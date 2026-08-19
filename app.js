/* Позиции плиток в сетке 5×5 (строка, колонка).
   Центральный блок занимает строки 2–4, колонки 2–4. */
const LAYOUT = {
  1:  [1, 1], 2:  [1, 2], 3:  [1, 3], 4:  [1, 4], 5:  [1, 5],
  6:  [2, 1],                                     7:  [2, 5],
  8:  [3, 1],                                     9:  [3, 5],
  10: [4, 1],                                     11: [4, 5],
  12: [5, 1], 13: [5, 2], 16: [5, 3],             14: [5, 4], 15: [5, 5],
};

const EMPTY_WITH_PHOTO = 'Это поздравление ещё в пути — совсем скоро оно будет здесь ✈️';
const EMPTY_NO_PHOTO   = 'Здесь скоро появится ещё один человек — и его поздравление';

const $ = (id) => document.getElementById(id);
const collage = $('collage');

/* ---------------- центральный блок ---------------- */
$('centerName').textContent  = POSTER.name;
$('centerAge').textContent   = POSTER.age;
$('centerQuote').textContent = POSTER.quote;
$('topDate').textContent     = POSTER.date;

/* ---------------- сборка коллажа ---------------- */
const kissSvg = '<svg viewBox="0 0 100 62"><use href="#kiss"/></svg>';
const gallery = [];           // только карточки с фото — для стрелок в модалке
let delay = 0;

for (const person of PEOPLE) {
  const cell = LAYOUT[person.id];
  if (!cell) continue;

  const tile = document.createElement(person.photo ? 'button' : 'div');
  tile.className = 'tile' + (person.photo ? '' : ' tile--empty');
  tile.style.setProperty('--r', cell[0]);
  tile.style.setProperty('--c', cell[1]);
  tile.style.setProperty('--d', (delay += 0.045).toFixed(3) + 's');

  if (person.photo) {
    tile.type = 'button';
    tile.innerHTML =
      `<img src="photos/thumbs/${person.photo}.jpg" alt="Поздравление №${person.id}"` +
      ` style="object-position:${person.focus || '50% 40%'}" loading="lazy">` +
      `<span class="tile__num">${person.id}</span>`;
    person.index = gallery.length;
    gallery.push(person);
  } else {
    tile.innerHTML = kissSvg + '<span>скоро</span>';
  }

  tile._person = person;
  collage.appendChild(tile);
}

/* ---------------- всплывающая карточка ---------------- */
const peek = $('peek');
const peekImg = $('peekImg');
const peekText = $('peekText');
const peekMore = $('peekMore');
const peekMedia = peek.querySelector('.peek__media');
let hideTimer = null;
let peekOwner = null;

function textOf(person) {
  if (person.text && person.text.trim()) return person.text.trim();
  return person.photo ? EMPTY_WITH_PHOTO : EMPTY_NO_PHOTO;
}

function showPeek(tile, person) {
  clearTimeout(hideTimer);
  if (peekOwner === tile && !peek.hidden) return;   // уже показана эта же карточка
  peekOwner = tile;

  if (person.photo) {
    peekMedia.hidden = false;
    peekImg.src = `photos/thumbs/${person.photo}.jpg`;
    peekImg.style.objectPosition = person.focus || '50% 40%';
  } else {
    peekMedia.hidden = true;
  }
  peekText.textContent = textOf(person);
  peekMore.hidden = !person.photo;

  peek.hidden = false;
  collage.classList.add('is-peeking');
  for (const el of collage.querySelectorAll('.tile.is-active')) el.classList.remove('is-active');
  tile.classList.add('is-active');

  // измеряем и позиционируем
  peek.style.left = '0px';
  peek.style.top = '0px';
  const t = tile.getBoundingClientRect();
  const p = peek.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight, m = 14;

  let left;
  if (t.right + 18 + p.width <= vw - m) left = t.right + 18;          // справа
  else if (t.left - 18 - p.width >= m)  left = t.left - 18 - p.width;  // слева
  else left = Math.max(m, Math.min(t.left + t.width / 2 - p.width / 2, vw - p.width - m));

  let top = t.top + t.height / 2 - p.height / 2;
  top = Math.max(m, Math.min(top, vh - p.height - m));

  peek.style.left = Math.round(left) + 'px';
  peek.style.top = Math.round(top) + 'px';
  requestAnimationFrame(() => peek.classList.add('is-on'));
}

function hidePeek(now) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    peek.classList.remove('is-on');
    collage.classList.remove('is-peeking');
    for (const el of collage.querySelectorAll('.tile.is-active')) el.classList.remove('is-active');
    peekOwner = null;
    setTimeout(() => { if (!peek.classList.contains('is-on')) peek.hidden = true; }, 260);
  }, now ? 0 : 90);
}

/* НАВЕДЕНИЕ.
   Слушаем обычный mousemove на всей странице и сами определяем плитку под
   курсором. Это самый неприхотливый вариант: не зависит ни от медиа-запроса
   (hover:hover), ни от pointer-событий, ни от порядка enter/leave — их разные
   браузеры трактуют по-разному, и наведение отваливалось. */
let lastTouch = 0;
document.addEventListener('touchstart', () => { lastTouch = Date.now(); }, { passive: true });

function handleHover(e) {
  if (Date.now() - lastTouch < 800) return;        // «эхо» тапа на телефоне — не мышь
  if (!modal.hidden) return;                       // открыто большое фото
  if (window.innerWidth < 820) return;             // узкий экран: карточка накрыла бы само фото
  const target = e.target;
  if (!target || !target.closest) return;
  if (peek.contains(target)) { clearTimeout(hideTimer); return; }  // курсор на самой карточке

  const tile = target.closest('.tile');
  if (tile && tile._person) showPeek(tile, tile._person);
  else if (peekOwner) hidePeek();
}

/* mouseover срабатывает при входе в элемент, mousemove — при движении.
   Слушаем оба: разные браузеры и окна предпросмотра шлют то одно, то другое. */
document.addEventListener('mouseover', handleHover);
document.addEventListener('mousemove', handleHover);

/* Клавиатура: Tab по плиткам тоже открывает поздравление.
   Только по-настоящему клавиатурный фокус (:focus-visible) — иначе обычный клик
   мышью успевал раскрыть карточку поверх фото, и сам клик до фото не доходил. */
const keyboardFocus = (el) => {
  try { return el.matches(':focus-visible'); } catch (e) { return false; }
};
for (const tile of collage.querySelectorAll('.tile')) {
  tile.addEventListener('focus', () => { if (keyboardFocus(tile)) showPeek(tile, tile._person); });
  tile.addEventListener('blur', () => hidePeek());
}

peek.addEventListener('click', () => { if (peekOwner && peekOwner._person.photo) openModal(peekOwner._person.index); });
window.addEventListener('scroll', () => hidePeek(true), { passive: true });

/* ---------------- модальное окно ---------------- */
const modal = $('modal');
const modalImg = $('modalImg');
const modalText = $('modalText');
let current = 0;

function openModal(i) {
  current = (i + gallery.length) % gallery.length;
  const person = gallery[current];
  modalImg.src = `photos/${person.photo}.jpg`;
  modalImg.alt = `Поздравление №${person.id}`;
  modalText.textContent = textOf(person);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  hidePeek(true);
  requestAnimationFrame(() => modal.classList.add('is-on'));
}

function closeModal() {
  modal.classList.remove('is-on');
  document.body.style.overflow = '';
  setTimeout(() => { modal.hidden = true; }, 280);
}

collage.addEventListener('click', (e) => {
  const tile = e.target.closest('.tile');
  if (tile && tile._person && tile._person.photo) openModal(tile._person.index);
});

$('modalClose').addEventListener('click', closeModal);
$('modalPrev').addEventListener('click', () => openModal(current - 1));
$('modalNext').addEventListener('click', () => openModal(current + 1));
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.addEventListener('keydown', (e) => {
  if (modal.hidden) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') openModal(current - 1);
  if (e.key === 'ArrowRight') openModal(current + 1);
});
