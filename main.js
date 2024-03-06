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
let starting = true;
let finished = false;
let missed = false;
let hovered = false;

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
ctx.font = '30px Roboto Mono';
ctx.textAlign = 'center';
let currentTarget;
let currentCoords;
let targets = [];
const len = 44;
const br = len * 0.04;

// Get cookies
getCookie('theme') === '' ? setTheme('light') : setTheme(getCookie('theme'));
getCookie('clickTarget') === '' ? setClickTarget(15) : setClickTarget(getCookie('clickTarget'));
getCookie('timeCount') === '' ? setTimeCount(30) : setTimeCount(getCookie('timeCount'));
getCookie('clickingMode') === '' ? setClickingMode('clickcount') : setClickingMode(getCookie('clickingMode'));

// Hit detection
canvas.addEventListener('click', function (event) {
  if (ctx.isPointInPath(currentTarget, event.offsetX * devicePixelRatio, event.offsetY * devicePixelRatio)) {
    if (starting) { startGame(); }
    else if (finished) { return; }
    registerHit();
  }
  else if (!(starting || finished)) {
    registerMiss();
  }
});

canvas.addEventListener('mousemove', function (event) {
  if (ctx.isPointInPath(currentTarget, event.offsetX * devicePixelRatio, event.offsetY * devicePixelRatio)) {
    canvas.style.cursor = 'pointer';
    hovered = true;
  }
  else {
    canvas.style.cursor = '';
    hovered = false;
  }
});

window.requestAnimationFrame(drawScreen);

function setStart() {
  startDate = Date.now();
  starting = true;
  finished = false;
  targets = [];
  if (timeCount) {
    clearInterval(timer);
    document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
  }

  currentTarget = new Path2D();
  const x = (vw - len) / 2;
  const y = (vh - len) / 2
  currentTarget.roundRect(x, y, len, len, br);
  currentCoords = { x: x, y: y };
}

function startGame() {
  switch (clickingMode) {
    case 'clickcount':
      startDate = Date.now();
      break;
    case 'time':
      startTimer(timeCount);
  }
  starting = false;
  hits = 0;
  misses = 0;
}

function endGame() {
  finished = true;
  showResult();

  if (clickingMode == 'time') {
    document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
  }
}

function startTimer(timeCount) {
  let time = timeCount;
  timer = setInterval(() => {
    time--;
    document.querySelector(`#tc-${timeCount}`).innerHTML = time;

    if (time <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

function registerHit() {
  missed = false;
  hovered = false;
  hits += 1;
  if (clickingMode == 'clickcount' && hits >= clickTarget) {
    endGame();
    return;
  }

  targets.push({ x: currentCoords.x, y: currentCoords.y, opacity: 1 });
  currentTarget = new Path2D();
  const x = Math.random() * (vw - (2 * len)) + len;
  const y = Math.random() * (vh - (2 * len)) + len;
  currentTarget.roundRect(x, y, len, len, br);
  currentCoords = { x: x, y: y };
}

function registerMiss() {
  misses += 1;
  missed = true;
  setTimeout(() => missed = false, 100);
}

function drawTarget(target) {
  ctx.beginPath();
  ctx.fillStyle = `rgba(0,200,0,${target.opacity})`;
  ctx.roundRect(target.x, target.y, len, len, br);
  ctx.fill();
}

function drawScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw past targets
  targets.forEach((target) => {
    drawTarget(target);
  });
  let newTargets = targets.filter((target) => target.opacity > 0).map((target) => {
    return { x: target.x, y: target.y, opacity: target.opacity - 0.01 }
  })
  targets = newTargets;

  // draw current target
  ctx.fillStyle = 'black';
  if (hovered && !starting) { ctx.fillStyle = 'purple' }
  if (missed) { ctx.fillStyle = 'red' }
  if (finished) { ctx.fillStyle = 'blue' }
  ctx.fill(currentTarget);

  if (starting) { ctx.fillText("click to start", vw / 2, vh / 2 - len * 2); }

  window.requestAnimationFrame(drawScreen);
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

function setClickTarget(cc) {
  setCookie('clickTarget', cc, 90);
  clickTarget = cc;
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


