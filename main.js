// Get document element
const textDisplay = document.querySelector('#text-display');
const inputField = document.querySelector('#input-field');

// Initialize typing mode variables
let clickingMode = 'clickcount';
let clickCount;
let timeCount;

// Initialize dynamic variables
let randomWords = [];
let wordList = [];
let currentWord = 0;
let correctKeys = 0;
let startDate = 0;
let timer;
let timerActive = false;

// Get cookies
getCookie('theme') === '' ? setTheme('light') : setTheme(getCookie('theme'));
getCookie('clickCount') === '' ? setClickCount(50) : setClickCount(getCookie('clickCount'));
getCookie('timeCount') === '' ? setTimeCount(60) : setTimeCount(getCookie('timeCount'));
getCookie('clickingMode') === '' ? setClickingMode('clickcount') : setClickingMode(getCookie('clickingMode'));

setLanguage('english')

// RESET
function setText() {
  currentWord = 0;
  correctKeys = 0;
  inputField.value = '';
  timerActive = false;
  clearTimeout(timer);
  textDisplay.style.display = 'block';
  inputField.className = '';

  switch (clickingMode) {
    case 'clickcount':
      textDisplay.style.height = 'auto';
      textDisplay.innerHTML = '';
      wordList = [];
      while (wordList.length < clickCount) {
        const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        if (wordList[wordList.length - 1] !== randomWord || wordList[wordList.length - 1] === undefined) {
          wordList.push(randomWord);
        }
      }
      break;

    case 'time':
      textDisplay.style.height = '3.2rem';
      document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
      textDisplay.innerHTML = '';
      wordList = [];
      for (i = 0; i < 500; i++) {
        let n = Math.floor(Math.random() * randomWords.length);
        wordList.push(randomWords[n]);
      }
  }

  showText();
  inputField.focus();
}

// DISPLAY RESET
function showText() {
  wordList.forEach(word => {
    let span = document.createElement('span');
    span.innerHTML = word + ' ';
    textDisplay.appendChild(span);
  });
  textDisplay.firstChild.classList.add('highlight');
}

// MAIN GAMEPLAY LOOP!
// Key is pressed in input field
inputField.addEventListener('keydown', e => {
  // Add wrong class to input field
  switch (clickingMode) {
    case 'clickcount':
      if (currentWord < wordList.length) inputFieldClass();
    case 'time':
      if (timerActive) inputFieldClass();
  }
  function inputFieldClass() {
    if (e.key >= 'a' && e.key <= 'z' || (e.key === `'` || e.key === ',' || e.key === '.' || e.key === ';')) {
      let inputWordSlice = inputField.value + e.key;
      let currentWordSlice = wordList[currentWord].slice(0, inputWordSlice.length);
      inputField.className = inputWordSlice === currentWordSlice ? '' : 'wrong';
    } else if (e.key === 'Backspace') {
      let inputWordSlice = e.ctrlKey ? '' : inputField.value.slice(0, inputField.value.length - 1);
      let currentWordSlice = wordList[currentWord].slice(0, inputWordSlice.length);
      inputField.className = inputWordSlice === currentWordSlice ? '' : 'wrong';
    } else if (e.key === ' ') {
      inputField.className = '';
    }
  }

  // If it is the first character entered
  if (currentWord === 0 && inputField.value === '') {
    switch (clickingMode) {
      case 'clickcount':
        startDate = Date.now();
        break;

      case 'time':
        if (!timerActive) {
          startTimer(timeCount);
          timerActive = true;
        }
        function startTimer(time) {
          if (time > 0) {
            document.querySelector(`#tc-${timeCount}`).innerHTML = time;
            timer = setTimeout(() => {
              time--;
              startTimer(time);
            }, 1000);
          } else {
            timerActive = false;
            textDisplay.style.display = 'none';
            inputField.className = '';
            document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
            showResult();
          }
        }
    }
  }

  // If it is the space key check the word and add correct/wrong class
  if (e.key === ' ') {
    e.preventDefault();

    if (inputField.value !== '') {
      // Scroll down text when reach new line
      if (clickingMode === 'time') {
        const currentWordPosition = textDisplay.childNodes[currentWord].getBoundingClientRect();
        const nextWordPosition = textDisplay.childNodes[currentWord + 1].getBoundingClientRect();
        if (currentWordPosition.top < nextWordPosition.top) {
          for (i = 0; i < currentWord + 1; i++) textDisplay.childNodes[i].style.display = 'none';
        }
      }

      // If it is not the last word increment currentWord,
      if (currentWord < wordList.length - 1) {
        if (inputField.value === wordList[currentWord]) {
          textDisplay.childNodes[currentWord].classList.add('correct');
          correctKeys += wordList[currentWord].length + 1;
        } else {
          textDisplay.childNodes[currentWord].classList.add('wrong');
        }
        textDisplay.childNodes[currentWord + 1].classList.add('highlight');
      } else if (currentWord === wordList.length - 1) {
        textDisplay.childNodes[currentWord].classList.add('wrong');
        showResult();
      }

      inputField.value = '';
      currentWord++;
    }

    // Else if it is the last word and input word is correct show the result
  } else if (currentWord === wordList.length - 1) {
    if (inputField.value + e.key === wordList[currentWord]) {
      textDisplay.childNodes[currentWord].classList.add('correct');
      correctKeys += wordList[currentWord].length;
      currentWord++;
      showResult();
    }
  }
});

// Calculate and display result -- will need to be heavily edited
function showResult() {
  let clicks, minute, acc;
  switch (clickingMode) {
    case 'clickcount':
      clicks = correctKeys / 5;
      minute = (Date.now() - startDate) / 1000 / 60;
      let totalKeys = -1;
      wordList.forEach(e => (totalKeys += e.length + 1));
      acc = Math.floor((correctKeys / totalKeys) * 100);
      break;

    case 'time':
      clicks = correctKeys / 5;
      minute = timeCount / 60;
      let sumKeys = -1;
      for (i = 0; i < currentWord; i++) {
        sumKeys += wordList[i].length + 1;
      }
      acc = acc = Math.min(Math.floor((correctKeys / sumKeys) * 100), 100);
  }
  let wpm = Math.floor(clicks / minute);
  document.querySelector('#right-wing').innerHTML = `WPM: ${wpm} / ACC: ${acc}`;
}

// Command actions
document.addEventListener('keydown', e => {
  if (!document.querySelector('#theme-center').classList.contains('hidden')) {
    if (e.key === 'Escape'){
      hideThemeCenter();
      inputField.focus();
    }
  } else if (e.key === 'Escape') {
    setText();
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
            setText();
          })
          .catch(err => console.error(err));
      } else {
        console.log(`theme ${theme} is undefine`);
      }
    })
    .catch(err => console.error(err));
}

// to be removed
function setLanguage(_lang) {
  const lang = _lang.toLowerCase();
  fetch('./texts/random.json')
    .then(response => response.json())
    .then(json => {
      if (typeof json[lang] !== 'undefined') {
        randomWords = json[lang];
        setCookie('language', lang, 90);

        if (lang === "arabic") {
            textDisplay.style.direction = "rtl"
            inputField.style.direction = "rtl"
        } else {
            textDisplay.style.direction = "ltr"
            inputField.style.direction = "ltr"
        }

        setText();
      } else {
        console.error(`language ${lang} is undefined`);
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
      setText();
      break;
    case 'time':
      clickingMode = mode;
      setCookie('clickingMode', mode, 90);
      document.querySelector('#click-count').style.display = 'none';
      document.querySelector('#time-count').style.display = 'inline';
      document.querySelectorAll('#clicking-mode > span').forEach(e => (e.style.borderBottom = ''));
      document.querySelector(`#time`).style.borderBottom = '2px solid';
      setText();
      break;
    default:
      console.error(`mode ${mode} is undefined`);
  }
}

function setClickCount(wc) {
  setCookie('clickCount', wc, 90);
  clickCount = wc;
  document.querySelectorAll('#click-count > span').forEach(e => (e.style.borderBottom = ''));
  document.querySelector(`#cc-${clickCount}`).style.borderBottom = '2px solid';
  setText();
}

function setTimeCount(tc) {
  setCookie('timeCount', tc, 90);
  timeCount = tc;
  document.querySelectorAll('#time-count > span').forEach(e => {
    e.style.borderBottom = '';
    e.innerHTML = e.id.substring(3, 6);
  });
  document.querySelector(`#tc-${timeCount}`).style.borderBottom = '2px solid';
  setText();
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
function showAllThemes(){
    fetch(`themes/theme-list.json`)
    .then(response => {
      if (response.status === 200) {
        response
          .text()
          .then(body => {
            let themes = JSON.parse(body);
            let keys = Object.keys(themes);
            let i;
            for(i = 0;i < keys.length; i ++){

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

              if(themes[keys[i]]['customHTML'] != undefined){
                theme.style.background = themes[keys[i]]['background'];
                theme.innerHTML = themes[keys[i]]['customHTML']
              }else{
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

// enter to open theme area
document.getElementById('show-themes').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    showThemeCenter();
    inputField.focus();
  }
});

function showThemeCenter() {
  document.getElementById('theme-center').classList.remove('hidden');
  document.getElementById('command-center').classList.add('hidden');
}

function hideThemeCenter() {
  document.getElementById('theme-center').classList.add('hidden');
  document.getElementById('command-center').classList.remove('hidden');
}


