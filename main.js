// Get document elements
const playArea = document.getElementById("play-area");
const canvas = document.getElementById("canvas");

// Initialize variables
let clickingMode = 'clickcount';
let clickTarget;
let timeCount;
let hits = 0;
let misses = 0;
let startDate = 0;
let timer;
let timerActive = false;
let starting = true;
let finished = false;

// Set up canvas
const rect = playArea.getBoundingClientRect();
canvas.width = rect.width * devicePixelRatio;
canvas.height = rect.height * devicePixelRatio;
canvas.style.width = rect.width + "px";
canvas.style.height = rect.height + "px";
const vw = rect.width;
const vh = rect.height;
let ctx = canvas.getContext("2d");
ctx.scale(devicePixelRatio, devicePixelRatio);
let currentTarget, previousTarget;
const len = 44;
const br = len * 0.04;

// Get cookies
getCookie('theme') === '' ? setTheme('light') : setTheme(getCookie('theme'));
getCookie('clickTarget') === '' ? setClickTarget(50) : setClickTarget(getCookie('clickTarget'));
getCookie('timeCount') === '' ? setTimeCount(60) : setTimeCount(getCookie('timeCount'));
getCookie('clickingMode') === '' ? setClickingMode('clickcount') : setClickingMode(getCookie('clickingMode'));

// Hit detection
canvas.addEventListener('click', function (event) {
  if (ctx.isPointInPath(currentTarget, event.offsetX * devicePixelRatio, event.offsetY * devicePixelRatio)) {
    if (starting) { startGame(); }
    else if (finished) { setStart(); return; }
    registerHit();
  }
  else if (!(starting || finished)) {
    registerMiss();
  }
});

canvas.addEventListener('mousemove', function (event) {
  if (ctx.isPointInPath(currentTarget, event.offsetX * devicePixelRatio, event.offsetY * devicePixelRatio)) {
    canvas.style.cursor = 'pointer';
  }
  else {
    canvas.style.cursor = '';
  }
});

function setStart() {
  timerActive = false;
  clearTimeout(timer);
  startDate = Date.now();
  starting = true;
  finished = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentTarget = new Path2D();
  currentTarget.roundRect((vw - len) / 2, (vh - len) / 2, len, len, br);
  ctx.fillStyle = 'black';
  ctx.fill(currentTarget);
  ctx.font = '30px Roboto Mono';
  ctx.textAlign = 'center';
  ctx.fillText("click to start", vw / 2, vh / 2 - len * 2);
}

function startGame() {
  switch (clickingMode) {
    case 'clickcount':
      startDate = Date.now();
      break;
    case 'time':
      console.log('timing');
  }
  starting = false;
  hits = 0;
  misses = 0;
}

function endGame() {
  finished = true;
  showResult();
}

function registerHit() {
  hits += 1;
  if (hits == clickTarget) {
    endGame();
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTarget();
}

function registerMiss() {
  misses += 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fill(currentTarget);
  ctx.fillStyle = 'black';
}

function drawTarget() {
  const x = Math.random() * (vw - (2 * len)) + len;
  const y = Math.random() * (vh - (2 * len)) + len;

  currentTarget = new Path2D();
  currentTarget.roundRect(x, y, len, len, br);
  ctx.fill(currentTarget);
}

function showResult() {
  let minute;
  switch (clickingMode) {
    case 'clickcount':
      minute = (Date.now() - startDate) / 1000 / 60;
      break;
    case 'time':
      minute = timeCount / 60;
  }
  const cpm = Math.floor(hits / minute);
  const acc = Math.floor((hits / (hits + misses)) * 100);
  document.querySelector('#right-wing').innerHTML = `CPM: ${cpm} / ACC: ${acc}`;
}

// Actions
document.addEventListener('keydown', e => {
  if (!document.querySelector('#theme-center').classList.contains('hidden')) {
    if (e.key === 'Escape') {
      hideThemeCenter();
      inputField.focus();
    }
  } else if (e.key === 'Escape') {
    setStart();
  }
});

function setTheme(_theme) {
  const theme = _theme.toLowerCase();
  fetch(`themes/${theme}.css`)
    .then(response => {
      if (response.status === 200) {
        response
          .text()
          .then(css => {
            setCookie('theme', theme, 90);
            document.querySelector('#theme').setAttribute('href', `themes/${theme}.css`);
            setStart();
          })
          .catch(err => console.error(err));
      } else {
        console.log(`theme ${theme} is undefined`);
      }
    })
    .catch(err => console.error(err));
}

function setClickingMode(_mode) {
  const mode = _mode.toLowerCase();
  switch (mode) {
    case 'clickcount':
      clickingMode = mode;
      setCookie('clickingMode', mode, 90);
      document.querySelector('#click-count').style.display = 'inline';
      document.querySelector('#time-count').style.display = 'none';
      document.querySelectorAll('#clicking-mode > span').forEach(e => (e.style.borderBottom = ''));
      document.querySelector(`#clickcount`).style.borderBottom = '2px solid';
      setStart();
      break;
    case 'time':
      clickingMode = mode;
      setCookie('clickingMode', mode, 90);
      document.querySelector('#click-count').style.display = 'none';
      document.querySelector('#time-count').style.display = 'inline';
      document.querySelectorAll('#clicking-mode > span').forEach(e => (e.style.borderBottom = ''));
      document.querySelector(`#time`).style.borderBottom = '2px solid';
      setStart();
      break;
    default:
      console.error(`mode ${mode} is undefined`);
  }
}

function setClickTarget(wc) {
  setCookie('clickTarget', wc, 90);
  clickTarget = wc;
  document.querySelectorAll('#click-count > span').forEach(e => (e.style.borderBottom = ''));
  document.querySelector(`#cc-${clickTarget}`).style.borderBottom = '2px solid';
  setStart();
}

function setTimeCount(tc) {
  setCookie('timeCount', tc, 90);
  timeCount = tc;
  document.querySelectorAll('#time-count > span').forEach(e => {
    e.style.borderBottom = '';
    e.innerHTML = e.id.substring(3, 6);
  });
  document.querySelector(`#tc-${timeCount}`).style.borderBottom = '2px solid';
  setStart();
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

function getCookie(cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

showAllThemes();
function showAllThemes() {
  fetch(`themes/theme-list.json`)
    .then(response => {
      if (response.status === 200) {
        response
          .text()
          .then(body => {
            let themes = JSON.parse(body);
            let keys = Object.keys(themes);
            let i;
            for (i = 0; i < keys.length; i++) {

              let theme = document.createElement('div');
              theme.setAttribute('class', 'theme-button');
              theme.setAttribute('onClick', `setTheme('${keys[i]}')`);
              theme.setAttribute('id', keys[i]);

              // set tabindex to current theme index + 4 for the test page
              theme.setAttribute('tabindex', i + 5);
              theme.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                  setTheme(theme.id);
                  inputField.focus();

                }
              })

              if (themes[keys[i]]['customHTML'] != undefined) {
                theme.style.background = themes[keys[i]]['background'];
                theme.innerHTML = themes[keys[i]]['customHTML']
              } else {
                theme.textContent = keys[i];
                theme.style.background = themes[keys[i]]['background'];
                theme.style.color = themes[keys[i]]['color'];
              }
              document.getElementById('theme-area').appendChild(theme);
            }
          })
          .catch(err => console.error(err));
      } else {
        console.log(`Cant find theme-list.json`);
      }
    })
    .catch(err => console.error(err));
}

function showThemeCenter() {
  document.getElementById('theme-center').classList.remove('hidden');
  document.getElementById('command-center').classList.add('hidden');
}

function hideThemeCenter() {
  document.getElementById('theme-center').classList.add('hidden');
  document.getElementById('command-center').classList.remove('hidden');
}


