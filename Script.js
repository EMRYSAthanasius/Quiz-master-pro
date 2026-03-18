// =============================================
// QUIZMASTER PRO — State Machine
// =============================================

const SUBJECTS = [
{ name: “History”,          icon: “🏛️”,  color: “#FF9F0A” },
{ name: “Science”,          icon: “🔬”,  color: “#30D158” },
{ name: “Geography”,        icon: “🌍”,  color: “#0A84FF” },
{ name: “Maths”,            icon: “📐”,  color: “#BF5AF2” },
{ name: “General Knowledge”,icon: “💡”,  color: “#FFD60A” },
{ name: “Philosophy”,       icon: “🧠”,  color: “#FF6961” },
{ name: “Chemistry”,        icon: “⚗️”,  color: “#5E5CE6” },
{ name: “English”,          icon: “📝”,  color: “#0A84FF” },
{ name: “Literature”,       icon: “📚”,  color: “#FF9F0A” },
{ name: “Biology”,          icon: “🧬”,  color: “#30D158” },
{ name: “Physics”,          icon: “⚡”,  color: “#FFD60A” },
{ name: “Fun Facts”,        icon: “🎯”,  color: “#FF6961” },
{ name: “Movies”,           icon: “🎬”,  color: “#BF5AF2” },
{ name: “Sports”,           icon: “🏆”,  color: “#0A84FF” },
{ name: “Music”,            icon: “🎵”,  color: “#5E5CE6” },
{ name: “Technology”,       icon: “💻”,  color: “#30D158” }
];

const TOTAL_LEVELS = 30;
const QUESTIONS_PER_LEVEL = 20;

// –– Game State ––
let gameState = {
currentSubject: null,
currentLevel: null,
currentQuestionIndex: 0,
score: 0,
questions: [],
answered: false,
unlockedLevels: {},   // { “History”: 1, “Science”: 3, … }
completedLevels: {}   // { “History”: [1,2], “Science”: [1], … }
};

// –– Load / Save Progress ––
function loadProgress() {
try {
const saved = localStorage.getItem(‘quizmaster_progress’);
if (saved) {
const parsed = JSON.parse(saved);
gameState.unlockedLevels  = parsed.unlockedLevels  || {};
gameState.completedLevels = parsed.completedLevels || {};
}
} catch(e) { /* ignore */ }
}

function saveProgress() {
try {
localStorage.setItem(‘quizmaster_progress’, JSON.stringify({
unlockedLevels:  gameState.unlockedLevels,
completedLevels: gameState.completedLevels
}));
} catch(e) { /* ignore */ }
}

function getUnlockedLevel(subject) {
return gameState.unlockedLevels[subject] || 1;
}

function isCompleted(subject, level) {
return (gameState.completedLevels[subject] || []).includes(level);
}

// –– Screen Management ––
function showScreen(id) {
document.querySelectorAll(’.screen’).forEach(s => s.classList.remove(‘active’));
document.getElementById(id).classList.add(‘active’);
window.scrollTo(0, 0);
}

// –– HOME SCREEN ––
function renderHome() {
const grid = document.getElementById(‘subject-grid’);
grid.innerHTML = ‘’;
SUBJECTS.forEach(subj => {
const tile = document.createElement(‘div’);
tile.className = ‘subject-tile’;
tile.style.setProperty(’–tile-color’, subj.color);
tile.innerHTML = `<span class="subject-icon">${subj.icon}</span> <span class="subject-name">${subj.name}</span>`;
tile.addEventListener(‘click’, () => openLevelSelect(subj.name));
grid.appendChild(tile);
});
}

function goHome() {
hideModal();
showScreen(‘screen-home’);
}

// –– LEVEL SELECT ––
function openLevelSelect(subject) {
gameState.currentSubject = subject;
const subj = SUBJECTS.find(s => s.name === subject);

document.getElementById(‘level-screen-title’).textContent =
`${subj ? subj.icon : ''} ${subject}`;

const grid = document.getElementById(‘level-grid’);
grid.innerHTML = ‘’;
const maxUnlocked = getUnlockedLevel(subject);

for (let i = 1; i <= TOTAL_LEVELS; i++) {
const tile = document.createElement(‘div’);
const locked    = i > maxUnlocked;
const completed = isCompleted(subject, i);

```
tile.className = `level-tile ${locked ? 'locked' : 'unlocked'} ${completed ? 'completed' : ''}`;
tile.textContent = i;

if (!locked) {
  tile.addEventListener('click', () => startLevel(subject, i));
}
grid.appendChild(tile);
```

}

showScreen(‘screen-levels’);
}

function exitToLevels() {
openLevelSelect(gameState.currentSubject);
}

// –– QUIZ SCREEN ––
function startLevel(subject, level) {
gameState.currentSubject      = subject;
gameState.currentLevel        = level;
gameState.currentQuestionIndex = 0;
gameState.score               = 0;
gameState.answered            = false;

// Get questions for this level from quizData
const subjectData = quizData[subject];
if (subjectData && subjectData[level] && subjectData[level].length > 0) {
gameState.questions = […subjectData[level]];
} else {
// Fallback: generate placeholder questions for levels beyond sample data
gameState.questions = generatePlaceholders(subject, level);
}

// Shuffle questions
gameState.questions = shuffleArray(gameState.questions).slice(0, QUESTIONS_PER_LEVEL);

const subj = SUBJECTS.find(s => s.name === subject);
document.getElementById(‘quiz-subject-label’).textContent =
`${subj ? subj.icon : ''} ${subject}`;
document.getElementById(‘quiz-level-label’).textContent = `Level ${level}`;
document.getElementById(‘score-display’).textContent = ‘0’;

showScreen(‘screen-quiz’);
renderQuestion();
}

function generatePlaceholders(subject, level) {
const qs = [];
for (let i = 1; i <= QUESTIONS_PER_LEVEL; i++) {
qs.push({
question: `${subject} — Level ${level}, Question ${i}: Replace with your real question here.`,
options: [“Option A”, “Option B”, “Option C”, “Option D”],
correct: 0
});
}
return qs;
}

function renderQuestion() {
const q   = gameState.questions[gameState.currentQuestionIndex];
const idx = gameState.currentQuestionIndex;
const total = gameState.questions.length;

// Progress
const pct = (idx / total) * 100;
document.getElementById(‘progress-bar’).style.width = pct + ‘%’;
document.getElementById(‘progress-text’).textContent = `${idx + 1} / ${total}`;
document.getElementById(‘question-number’).textContent = `Question ${idx + 1}`;
document.getElementById(‘question-text’).textContent = q.question;

// Options
const container = document.getElementById(‘options-container’);
container.innerHTML = ‘’;
const letters = [‘A’, ‘B’, ‘C’, ‘D’];
q.options.forEach((opt, i) => {
const btn = document.createElement(‘button’);
btn.className = ‘option-btn’;
btn.innerHTML = `<span class="option-letter">${letters[i]}</span>${opt}`;
btn.addEventListener(‘click’, () => selectAnswer(i, q.correct));
container.appendChild(btn);
});

document.getElementById(‘next-btn’).style.display = ‘none’;
gameState.answered = false;
}

function selectAnswer(selectedIndex, correctIndex) {
if (gameState.answered) return;
gameState.answered = true;

const buttons = document.querySelectorAll(’.option-btn’);
buttons.forEach((btn, i) => {
btn.classList.add(‘disabled’);
if (i === correctIndex)  btn.classList.add(‘correct’);
if (i === selectedIndex && selectedIndex !== correctIndex) btn.classList.add(‘incorrect’);
});

if (selectedIndex === correctIndex) {
gameState.score++;
document.getElementById(‘score-display’).textContent = gameState.score;
}

// Show next button
const nextBtn = document.getElementById(‘next-btn’);
const isLast  = gameState.currentQuestionIndex === gameState.questions.length - 1;
nextBtn.textContent = isLast ? ‘See Results →’ : ‘Next Question →’;
nextBtn.style.display = ‘block’;
}

function nextQuestion() {
if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
gameState.currentQuestionIndex++;
renderQuestion();
} else {
showLevelComplete();
}
}

// –– LEVEL COMPLETE ––
function showLevelComplete() {
const subject = gameState.currentSubject;
const level   = gameState.currentLevel;
const score   = gameState.score;
const total   = gameState.questions.length;
const pct     = Math.round((score / total) * 100);

// Mark as completed
if (!gameState.completedLevels[subject]) gameState.completedLevels[subject] = [];
if (!gameState.completedLevels[subject].includes(level)) {
gameState.completedLevels[subject].push(level);
}

// Unlock next level
const currentUnlocked = getUnlockedLevel(subject);
if (level >= currentUnlocked && level < TOTAL_LEVELS) {
gameState.unlockedLevels[subject] = level + 1;
}
saveProgress();

// Modal content
let icon  = ‘🏆’;
let title = ‘Level Clear!’;
if (pct === 100)      { icon = ‘⭐’; title = ‘Perfect Score!’; }
else if (pct >= 80)   { icon = ‘🥇’; title = ‘Excellent!’; }
else if (pct >= 60)   { icon = ‘✅’; title = ‘Level Clear!’; }
else                  { icon = ‘💪’; title = ‘Keep Practising!’; }

document.getElementById(‘modal-icon’).textContent  = icon;
document.getElementById(‘modal-title’).textContent = title;
document.getElementById(‘modal-score’).textContent =
`You scored ${score} / ${total} (${pct}%)`;

const nextBtn = document.getElementById(‘next-level-btn’);
if (level < TOTAL_LEVELS) {
nextBtn.style.display = ‘’;
nextBtn.textContent   = `Level ${level + 1} →`;
} else {
nextBtn.style.display = ‘none’;
}

document.getElementById(‘modal-overlay’).style.display = ‘flex’;
}

function hideModal() {
document.getElementById(‘modal-overlay’).style.display = ‘none’;
}

function retryLevel() {
hideModal();
startLevel(gameState.currentSubject, gameState.currentLevel);
}

function nextLevel() {
hideModal();
const nextLvl = gameState.currentLevel + 1;
if (nextLvl <= TOTAL_LEVELS) {
startLevel(gameState.currentSubject, nextLvl);
} else {
goHome();
}
}

// –– UTILITIES ––
function shuffleArray(arr) {
const a = […arr];
for (let i = a.length - 1; i > 0; i–) {
const j = Math.floor(Math.random() * (i + 1));
[a[i], a[j]] = [a[j], a[i]];
}
return a;
}

// –– INIT ––
loadProgress();
renderHome();
