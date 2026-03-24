const gameState = {
    allData: null,
    currentSubject: null,
    currentLevel: 1,
    currentQuestionIdx: 0,
    score: 0,
    unlockedLevels: {}
};

// Initialize from localStorage if running in browser
if (typeof localStorage !== 'undefined') {
    gameState.unlockedLevels = JSON.parse(localStorage.getItem('quizProgression')) || {};
}

// Elements
const screens = {
    home: document.getElementById('home-screen'),
    levels: document.getElementById('level-screen'),
    game: document.getElementById('game-screen')
};

// 1. Load Data
async function initApp() {
    try {
        const response = await fetch('questions.json');
        gameState.allData = await response.json();
        renderSubjects();
        updateDashboardStats();
    } catch (e) {
        console.error("Data failed to load", e);
    }
}

// 2. Render Subjects
function renderSubjects() {
    const grid = document.getElementById('subject-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const subjects = Object.keys(gameState.allData);
    document.getElementById('subjects-count-text').innerText = `${subjects.length} subjects`;

    const subjectColors = {
        "History": "var(--color-history)",
        "Philosophy": "var(--color-philosophy)",
        "Maths": "var(--color-maths)",
        "General Knowledge": "var(--color-general)",
        "Geography": "var(--color-geography)",
        "Chemistry": "var(--color-chemistry)",
        "English": "var(--color-english)",
        "Literature": "var(--color-literature)",
        "Biology": "var(--color-biology)",
        "Physics": "var(--color-physics)",
        "Fun Facts": "var(--color-funfacts)",
        "Movies": "var(--color-movies)",
        "Sports": "var(--color-sports)",
        "Music": "var(--color-music)",
        "Technology": "var(--color-technology)"
    };

    subjects.forEach(subject => {
        const tile = document.createElement('div');
        tile.className = 'subject-tile';

        // Default color fallback
        let cssColor = subjectColors[subject] || "var(--color-general)";

        // Calculate progress
        const unlocked = gameState.unlockedLevels[subject] || 1; // Level 1 is always unlocked
        const totalLevels = Object.keys(gameState.allData[subject] || {}).length || 30; // Assuming 30 if no structure yet
        let levelsCompleted = unlocked - 1;

        const progressPercent = Math.min(100, Math.round((levelsCompleted / totalLevels) * 100));

        tile.innerHTML = `
            <div class="subject-icon-wrap" style="color: ${cssColor}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
            </div>
            <span class="subject-name">${subject}</span>
            <span class="subject-progress-text" style="color: ${cssColor}">${progressPercent}%</span>
            <div class="subject-progress-track">
                <div class="subject-progress-fill" style="width: ${progressPercent}%; background-color: ${cssColor}"></div>
            </div>
        `;
        tile.onclick = () => showLevels(subject);
        grid.appendChild(tile);
    });
}

function updateDashboardStats() {
    let totalLevelsDone = 0;
    let totalLevelsOverall = 0;

    if (gameState.allData) {
        Object.keys(gameState.allData).forEach(subject => {
            const unlocked = gameState.unlockedLevels[subject] || 1;
            totalLevelsDone += (unlocked - 1);
            totalLevelsOverall += Object.keys(gameState.allData[subject] || {}).length || 30;
        });

        const subjectsCount = Object.keys(gameState.allData).length;
        document.getElementById('stat-levels-done').innerText = totalLevelsDone;
        document.getElementById('stat-subjects').innerText = subjectsCount;
        document.getElementById('stat-total-levels').innerText = totalLevelsOverall;

        const overallProgress = totalLevelsOverall > 0 ? Math.round((totalLevelsDone / totalLevelsOverall) * 100) : 0;
        document.getElementById('overall-progress-text').innerText = `${overallProgress}%`;
        document.getElementById('overall-progress-bar').style.width = `${overallProgress}%`;
    }
}

// 3. Level Selection
function showLevels(subject) {
    gameState.currentSubject = subject;
    document.getElementById('selected-subject-name').innerText = subject;
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';

    for (let i = 1; i <= 30; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.innerText = i;

        // Logic: Level 1 is always open, others depend on progress
        const isUnlocked = i === 1 || (gameState.unlockedLevels[subject] >= i);
        btn.disabled = !isUnlocked;
        btn.onclick = () => startLevel(i);
        grid.appendChild(btn);
    }
    switchScreen('levels');
}

// 4. Game Loop
function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    gameState.currentQuestionIdx = 0;
    gameState.score = 0;
    switchScreen('game');
    showQuestion();
}

function showQuestion() {
    const questions = gameState.allData[gameState.currentSubject][`Level ${gameState.currentLevel}`];
    // Safety check if level has questions
    if (!questions || gameState.currentQuestionIdx >= questions.length) {
        finishLevel();
        return;
    }

    const q = questions[gameState.currentQuestionIdx];

    document.getElementById('question-text').innerText = q.question;
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';

    // Update Progress Bar
    const progress = ((gameState.currentQuestionIdx) / 20) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(idx, q.correct);
        optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selected, correct) {
    const btns = document.querySelectorAll('.option-btn');
    if (selected === correct) {
        gameState.score++;
        btns[selected].classList.add('correct');
    } else {
        btns[selected].classList.add('incorrect');
        btns[correct].classList.add('correct');
    }

    setTimeout(() => {
        gameState.currentQuestionIdx++;
        if (gameState.currentQuestionIdx < 20) {
            showQuestion();
        } else {
            finishLevel();
        }
    }, 800);
}

function finishLevel() {
    // Save progress: unlock next level
    if (gameState.score >= 15) { // Requirement to pass
        const nextLevel = gameState.currentLevel + 1;
        if (!gameState.unlockedLevels[gameState.currentSubject] || gameState.unlockedLevels[gameState.currentSubject] < nextLevel) {
            gameState.unlockedLevels[gameState.currentSubject] = nextLevel;
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('quizProgression', JSON.stringify(gameState.unlockedLevels));
            }
        }
    }

    document.getElementById('modal-score').innerText = `Score: ${gameState.score}/20`;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

// Helper: Navigation
function switchScreen(screenKey) {
    Object.values(screens).forEach(s => {
        if (s) s.classList.add('hidden');
    });
    if (screens[screenKey]) {
        screens[screenKey].classList.remove('hidden');
    }
}

// Attach event listeners safely
if (typeof document !== 'undefined') {
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.onclick = () => {
            document.getElementById('modal-overlay').classList.add('hidden');
            switchScreen('home');
        };
    }

    const backBtns = document.querySelectorAll('.back-btn');
    backBtns.forEach(btn => {
        btn.onclick = () => switchScreen('home');
    });

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.onclick = () => {
            document.getElementById('modal-overlay').classList.add('hidden');
            startLevel(gameState.currentLevel);
        };
    }

    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.onclick = () => {
            document.getElementById('modal-overlay').classList.add('hidden');
            startLevel(gameState.currentLevel + 1);
        };
    }

    initApp();
}
