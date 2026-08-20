// Generate 1000 progressive levels with massive difficulty escalation up to Level 1000
const levels = [];
const basicWords = ["fdsa", "jkl;", "asdf", "sad", "lad", "fall", "glass", "flask"];
const codeSyntax = ["function", "const", "return", "async", "await", "import", "export", "class", "extends", "constructor", "null", "undefined", "console.log()", "Math.sqrt()"];

for (let i = 1; i <= 1000; i++) {
    let tier = Math.floor((i - 1) / 250); 
    let wordCount = Math.min(6 + Math.floor(i / 50), 24);
    let words = [];

    for (let w = 0; w < wordCount; w++) {
        if (tier === 0) {
            words.push(basicWords[(i + w) % basicWords.length]);
        } else if (tier === 1) {
            words.push(i % 2 === 0 ? "quick" : "brown", "jump", "velocity", "keyboard", "precision", "rhythm");
        } else if (tier === 2) {
            words.push(codeSyntax[(i * w) % codeSyntax.length], "variable", "parameter", "callback");
        } else {
            // Nightmare level matrices (guarantees massive text blocks that test scrolling and multi-line wrapping)
            words.push(`sys.exec(${i});`, `let val_${i} = obj?.prop ?? ${i} * 3.14159;`, `{ status: 200, data: [${i}, ${i*2}], verify: true, code: "MATRIX_${i}" }`, `recursiveSearch(node.left, target_${i});`);
        }
    }

    levels.push({
        id: i,
        title: `Level ${i}: ${getTierTitle(tier)}`,
        desc: `Stage ${i} multi-line text conditioning drill. Maintain zero gaze deviation.`,
        text: words.join(" ")
    });
}

function getTierTitle(tier) {
    const titles = ["Home Row Foundations", "Velocity & Agility", "Programming Syntax", "Nightmare Hyper-Speed Matrix"];
    return titles[tier] || "Grandmaster Matrix";
}

function getLevelUnlockCost(levelId) {
    if (levelId <= 100) return 0;
    let block = Math.floor((levelId - 101) / 50);
    return 300 + (block * 250);
}

const fingerMap = {
    'q': 'Left Pinky', 'a': 'Left Pinky', 'z': 'Left Pinky',
    'w': 'Left Ring', 's': 'Left Ring', 'x': 'Left Ring',
    'e': 'Left Middle', 'd': 'Left Middle', 'c': 'Left Middle',
    'r': 'Left Index', 'f': 'Left Index', 'v': 'Left Index', 'g': 'Left Index', 't': 'Left Index', 'b': 'Left Index',
    'y': 'Right Index', 'h': 'Right Index', 'n': 'Right Index', 'u': 'Right Index', 'j': 'Right Index', 'm': 'Right Index',
    'i': 'Right Middle', 'k': 'Right Middle', ',': 'Right Middle',
    'o': 'Right Ring', 'l': 'Right Ring', '.': 'Right Ring',
    'p': 'Right Pinky', ';': 'Right Pinky', '/': 'Right Pinky',
    ' ': 'Both Thumbs'
};

let currentLevelIndex = 0;
let userCoins = parseInt(localStorage.getItem("kp_coins")) || 300;
let levelHistory = JSON.parse(localStorage.getItem("kp_history")) || {};
let errorTracker = {};
let unlockedLevels = JSON.parse(localStorage.getItem("kp_unlocked")) || {};
let hasMultiplier = localStorage.getItem("kp_mult") === "true";
let hasShield = localStorage.getItem("kp_shield") === "true";
let hasUniversalPass = localStorage.getItem("kp_passAll") === "true";
let currentStreak = parseInt(localStorage.getItem("kp_streak")) || 1;

let currentText = "";
let charIndex = 0;
let correctChars = 0;
let totalTyped = 0;
let mistakesInLevel = 0;
let startTime = null;
let isPlaying = false;
let isTimerMode = false;
let timerSecondsLeft = 30;
let timerInterval = null;
let isZenMode = false;

// DOM Elements
const onboardingModal = document.getElementById("onboarding-modal");
const startAcademyBtn = document.getElementById("start-academy-btn");
const levelNav = document.getElementById("level-nav");
const levelTitle = document.getElementById("level-title");
const levelDesc = document.getElementById("level-desc");
const wordDisplay = document.getElementById("word-display");
const typingCard = document.getElementById("typing-card");
const focusOverlay = document.getElementById("focus-overlay");
const wpmVal = document.getElementById("wpm-val");
const accVal = document.getElementById("acc-val");
const progVal = document.getElementById("prog-val");
const progressBarFill = document.getElementById("progress-bar-fill");
const restartBtn = document.getElementById("restart-btn");
const mobileInput = document.getElementById("mobile-input");
const coinCountElem = document.getElementById("coin-count");
const streakBadge = document.getElementById("streak-badge");
const jumpInput = document.getElementById("jump-input");
const jumpGoBtn = document.getElementById("jump-go-btn");
const targetFingerText = document.getElementById("target-finger-text");

// Modals
const shopModal = document.getElementById("shop-modal");
const analyzerModal = document.getElementById("analyzer-modal");
const timerModal = document.getElementById("timer-modal");
const summaryModal = document.getElementById("summary-modal");
const nextLevelBtn = document.getElementById("next-level-btn");
const adminModal = document.getElementById("admin-modal");
const customTextModal = document.getElementById("custom-text-modal");

startAcademyBtn.onclick = () => {
    onboardingModal.style.opacity = '0';
    setTimeout(() => {
        onboardingModal.style.display = 'none';
        typingCard.focus();
    }, 400);
};

function updateCoins(amount) {
    if (hasMultiplier && amount > 0) amount = Math.round(amount * 1.5);
    userCoins += amount;
    coinCountElem.textContent = userCoins;
    localStorage.setItem("kp_coins", userCoins);
    renderLevelNav();
}

function renderLevelNav() {
    levelNav.innerHTML = "";
    levels.forEach((lvl, index) => {
        let cost = getLevelUnlockCost(lvl.id);
        let isLocked = lvl.id > 100 && !hasUniversalPass && !unlockedLevels[lvl.id] && !levelHistory[index];
        const btn = document.createElement("button");
        btn.className = `level-btn ${index === currentLevelIndex ? 'active' : ''} ${isLocked ? 'locked' : ''}`;
        btn.innerHTML = `<span>Lvl ${lvl.id} ${isLocked ? `🔒 (${cost}c)` : ''}</span>`;
        btn.onclick = () => {
            if (isLocked) {
                if (confirm(`Level ${lvl.id} requires unlocking. Pay ${cost} coins?`)) {
                    if (userCoins >= cost) {
                        updateCoins(-cost);
                        unlockedLevels[lvl.id] = true;
                        localStorage.setItem("kp_unlocked", JSON.stringify(unlockedLevels));
                        currentLevelIndex = index;
                        loadLevel();
                    } else {
                        alert("Not enough coins! Redo earlier levels to earn more.");
                    }
                }
                return;
            }
            currentLevelIndex = index;
            loadLevel();
        };
        levelNav.appendChild(btn);
    });
}

function loadLevel() {
    renderLevelNav();
    const lvl = levels[currentLevelIndex];
    levelTitle.textContent = lvl.title;
    levelDesc.textContent = lvl.desc;
    currentText = lvl.text;

    wordDisplay.innerHTML = "";
    currentText.split("").forEach(char => {
        const span = document.createElement("span");
        span.textContent = char;
        wordDisplay.appendChild(span);
    });

    if (wordDisplay.firstChild) {
        wordDisplay.firstChild.classList.add("active");
        updateFingerPrompt(wordDisplay.firstChild.textContent);
    }

    charIndex = 0;
    correctChars = 0;
    totalTyped = 0;
    mistakesInLevel = 0;
    startTime = null;
    isPlaying = false;
    wpmVal.textContent = "0";
    accVal.textContent = "100%";
    progVal.textContent = "0%";
    progressBarFill.style.width = "0%";
    focusOverlay.classList.remove("hidden");
    if (timerInterval) clearInterval(timerInterval);
}

function updateFingerPrompt(char) {
    const finger = fingerMap[char.toLowerCase()] || 'Any Finger';
    targetFingerText.textContent = `${finger} (${char === " " ? "SPACE" : char.toUpperCase()})`;
}

function startSession() {
    if (!isPlaying) {
        isPlaying = true;
        startTime = new Date();
        focusOverlay.classList.add("hidden");
        if (isTimerMode) startCountdownTimer();
    }
}

function startCountdownTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerSecondsLeft > 0) {
            timerSecondsLeft--;
            levelDesc.textContent = `⏱️ TIME ATTACK: ${timerSecondsLeft}s remaining!`;
        } else {
            clearInterval(timerInterval);
            isPlaying = false;
            alert("Time's up! Level reset.");
            loadLevel();
        }
    }, 1000);
}

function handleCharacterInput(char) {
    if (!isPlaying) startSession();

    const charSpans = wordDisplay.querySelectorAll("span");

    if (char === "Backspace") {
        if (charIndex > 0) {
            charIndex--;
            charSpans[charIndex].classList.remove("correct", "incorrect");
            charSpans.forEach(s => s.classList.remove("active"));
            charSpans[charIndex].classList.add("active");
            updateFingerPrompt(charSpans[charIndex].textContent);
        }
        return;
    }

    if (char.length === 1 && charIndex < charSpans.length) {
        totalTyped++;
        const targetChar = charSpans[charIndex].textContent;
        charSpans[charIndex].classList.remove("active");

        if (char === targetChar) {
            charSpans[charIndex].classList.add("correct");
            correctChars++;
        } else {
            if (hasShield && mistakesInLevel === 0) {
                hasShield = false;
                localStorage.setItem("kp_shield", "false");
                alert("🛡️ Accuracy Shield absorbed your first mistake!");
                charSpans[charIndex].classList.add("correct");
                correctChars++;
            } else {
                charSpans[charIndex].classList.add("incorrect");
                mistakesInLevel++;
                errorTracker[targetChar] = (errorTracker[targetChar] || 0) + 1;
            }
        }

        charIndex++;

        const progressPct = Math.round((charIndex / charSpans.length) * 100);
        progVal.textContent = `${progressPct}%`;
        progressBarFill.style.width = `${progressPct}%`;

        if (charIndex < charSpans.length) {
            charSpans[charIndex].classList.add("active");
            updateFingerPrompt(charSpans[charIndex].textContent);
        } else {
            isPlaying = false;
            if (timerInterval) clearInterval(timerInterval);

            if (mistakesInLevel > 0) {
                focusOverlay.classList.remove("hidden");
                focusOverlay.querySelector(".overlay-inner h3").textContent = `⚠️ Mistakes Made (${mistakesInLevel})`;
                focusOverlay.querySelector(".overlay-inner p").textContent = "Zero mistakes required to advance. Retrying level...";
                setTimeout(() => loadLevel(), 2500);
            } else {
                const timeTakenSec = ((new Date() - startTime) / 1000).toFixed(1);
                let earnedCoins = Math.max(25, Math.round(250 / timeTakenSec * 15));
                if (isTimerMode) earnedCoins *= 2;
                updateCoins(earnedCoins);

                levelHistory[currentLevelIndex] = { wpm: wpmVal.textContent, time: timeTakenSec, acc: accVal.textContent };
                localStorage.setItem("kp_history", JSON.stringify(levelHistory));

                document.getElementById("sum-wpm").textContent = `${wpmVal.textContent} WPM`;
                document.getElementById("sum-acc").textContent = accVal.textContent;
                document.getElementById("sum-time").textContent = `${timeTakenSec}s`;
                document.getElementById("sum-coins").textContent = `+${earnedCoins} Coins`;
                summaryModal.classList.remove("hidden");
            }
        }

        const elapsedMin = (new Date() - startTime) / 60000;
        if (elapsedMin > 0) {
            const wpm = Math.round((correctChars / 5) / elapsedMin);
            wpmVal.textContent = wpm > 0 ? wpm : 0;
        }

        const accuracy = Math.round((correctChars / totalTyped) * 100);
        accVal.textContent = `${isNaN(accuracy) ? 100 : accuracy}%`;
    }
}

nextLevelBtn.onclick = () => {
    summaryModal.classList.add("hidden");
    if (currentLevelIndex < levels.length - 1) {
        currentLevelIndex++;
    } else {
        currentLevelIndex = 0;
    }
    loadLevel();
};

// Event Listeners with F2 Admin Shortcut (code: mordy)
document.addEventListener("keydown", (e) => {
    const keyElem = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
    if (keyElem) keyElem.classList.add("pressed");

    if (e.key === "F2") {
        const pass = prompt("Enter Master Admin Code:");
        if (pass === "mordy") {
            adminModal.classList.remove("hidden");
        } else if (pass !== null) {
            alert("Invalid access code.");
        }
        e.preventDefault();
        return;
    }

    if (document.activeElement !== mobileInput && onboardingModal.style.display === 'none' && summaryModal.classList.contains("hidden") && adminModal.classList.contains("hidden") && customTextModal.classList.contains("hidden")) {
        if (e.key === "Backspace") {
            handleCharacterInput("Backspace");
            e.preventDefault();
        } else if (e.key.length === 1) {
            handleCharacterInput(e.key.toLowerCase());
        }
    }
});

document.addEventListener("keyup", (e) => {
    const keyElem = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
    if (keyElem) keyElem.classList.remove("pressed");
});

mobileInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.length > 0) {
        handleCharacterInput(val[val.length - 1].toLowerCase());
        e.target.value = "";
    }
});

typingCard.addEventListener("click", () => {
    focusOverlay.classList.add("hidden");
    typingCard.focus();
    if (window.innerWidth <= 900) mobileInput.focus();
});

restartBtn.onclick = () => loadLevel();
jumpGoBtn.onclick = () => {
    const val = parseInt(jumpInput.value);
    if (val >= 1 && val <= levels.length) {
        currentLevelIndex = val - 1;
        loadLevel();
        jumpInput.value = "";
    }
};

// Zen Mode Toggle Feature
document.getElementById("zen-mode-btn").onclick = () => {
    isZenMode = !isZenMode;
    document.querySelector(".sidebar").style.display = isZenMode ? "none" : "flex";
    alert(isZenMode ? "Zen Mode enabled. Press button again to restore sidebar." : "Zen Mode disabled.");
};

// Custom Text Importer Feature
document.getElementById("custom-text-btn").onclick = () => customTextModal.classList.remove("hidden");
document.getElementById("load-custom-text-btn").onclick = () => {
    let customPayload = document.getElementById("custom-import-textarea").value.trim();
    if (customPayload) {
        levels.unshift({
            id: 0,
            title: "Custom Practice Arena",
            desc: "Custom imported text session.",
            text: customPayload
        });
        currentLevelIndex = 0;
        closeModals();
        loadLevel();
        alert("Custom practice arena loaded successfully!");
    } else {
        alert("Please paste text to import.");
    }
};

// Admin Panel Tabs & 10+ Advanced Features
function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel-content').forEach(c => c.classList.add('hidden'));
    
    if (tabName === 'economy') {
        document.querySelectorAll('.admin-tab')[0].classList.add('active');
        document.getElementById('admin-tab-economy').classList.remove('hidden');
    } else if (tabName === 'levels') {
        document.querySelectorAll('.admin-tab')[1].classList.add('active');
        document.getElementById('admin-tab-levels').classList.remove('hidden');
    } else {
        document.querySelectorAll('.admin-tab')[2].classList.add('active');
        document.getElementById('admin-tab-system').classList.remove('hidden');
    }
}

function adminGrantCoins() {
    const amt = parseInt(document.getElementById("admin-coin-input").value) || 99999;
    updateCoins(amt);
    alert(`Successfully injected ${amt} coins!`);
}

function adminUnlockEverything() {
    hasUniversalPass = true;
    localStorage.setItem("kp_passAll", "true");
    renderLevelNav();
    alert("All 1000 levels unlocked instantly!");
}

function adminSaveLevelText() {
    let lvlNum = parseInt(document.getElementById("admin-level-num").value);
    let txt = document.getElementById("admin-level-text").value;
    if (levels[lvlNum - 1] && txt) {
        levels[lvlNum - 1].text = txt;
        alert(`Level ${lvlNum} payload updated successfully!`);
        loadLevel();
    } else {
        alert("Please enter valid text and level number.");
    }
}

function adminAddNewLevel() {
    let customText = prompt("Enter text payload for the new level:");
    if (customText) {
        let newId = levels.length + 1;
        levels.push({
            id: newId,
            title: `Level ${newId}: Custom Admin Arena`,
            desc: `Custom user-injected practice level stage ${newId}.`,
            text: customText
        });
        renderLevelNav();
        alert(`New Level ${newId} created successfully!`);
    }
}

function adminForceAdvance() {
    let target = parseInt(prompt("Enter level number to teleport to:")) - 1;
    if (target >= 0 && target < levels.length) {
        currentLevelIndex = target;
        loadLevel();
        closeModals();
        alert(`Teleported to Level ${target + 1}`);
    }
}

function adminBroadcastAnnouncement() {
    let msg = prompt("Enter broadcast banner message:");
    if (msg) alert(`📢 SYSTEM ANNOUNCEMENT: ${msg}`);
}

function adminSimulateErrors() {
    errorTracker['e'] = (errorTracker['e'] || 0) + 15;
    errorTracker['r'] = (errorTracker['r'] || 0) + 12;
    alert("Simulated error spike injected into AI analyzer data.");
}

function adminExportSaveState() {
    let saveState = { coins: userCoins, history: levelHistory, unlocked: unlockedLevels };
    console.log(JSON.stringify(saveState, null, 2));
    alert("Save state exported to browser developer console (Press F12 to view JSON).");
}

function adminWipeDatabase() {
    if (confirm("Are you sure you want to completely wipe all game history and coin saves?")) {
        localStorage.clear();
        location.reload();
    }
}

// Shop, Analyzer & Timer triggers
document.getElementById("shop-open-btn").onclick = () => shopModal.classList.remove("hidden");
document.getElementById("timer-open-btn").onclick = () => timerModal.classList.remove("hidden");
document.getElementById("analyze-open-btn").onclick = () => {
    const body = document.getElementById("analyzer-content");
    let clearedCount = Object.keys(levelHistory).length;
    let avgWpm = clearedCount > 0 ? Math.round(Object.values(levelHistory).reduce((acc, cur) => acc + parseInt(cur.wpm), 0) / clearedCount) : 0;

    let html = `
        <div class="analyzer-dashboard">
            <div class="analyzer-gauges">
                <div class="gauge-box">
                    <span>Levels Cleared</span>
                    <strong>${clearedCount} / ${levels.length}</strong>
                </div>
                <div class="gauge-box">
                    <span>Average Speed</span>
                    <strong>${avgWpm} WPM</strong>
                </div>
            </div>
            <div class="analyzer-tips">
                <h4>💡 AI Typing Recommendations:</h4>
    `;

    let sortedErrors = Object.entries(errorTracker).sort((a,b) => b[1] - a[1]);
    if (sortedErrors.length === 0) {
        html += `<p>No errors recorded yet! Your keystroke precision is immaculate.</p>`;
    } else {
        html += `<p>You frequently miss key '<strong>${sortedErrors[0][0].toUpperCase()}</strong>' (${sortedErrors[0][1]} errors). Focus on isolating your finger extension.</p>`;
    }
    html += `</div></div>`;
    body.innerHTML = html;
    analyzerModal.classList.remove("hidden");
};

function closeModals() {
    shopModal.classList.add("hidden");
    analyzerModal.classList.add("hidden");
    timerModal.classList.add("hidden");
    adminModal.classList.add("hidden");
    customTextModal.classList.add("hidden");
}

function buyUpgrade(type, cost) {
    if (userCoins >= cost) {
        updateCoins(-cost);
        if (type === 'multiplier') {
            hasMultiplier = true;
            localStorage.setItem("kp_mult", "true");
            alert("Permanent Coin Multiplier activated!");
        } else if (type === 'shield') {
            hasShield = true;
            localStorage.setItem("kp_shield", "true");
            alert("Accuracy Shield purchased!");
        } else if (type === 'passAll') {
            hasUniversalPass = true;
            localStorage.setItem("kp_passAll", "true");
            alert("Universal Level Pass unlocked!");
            renderLevelNav();
        }
        closeModals();
    } else {
        alert("Not enough coins!");
    }
}

document.getElementById("start-timer-challenge").onclick = () => {
    timerSecondsLeft = parseInt(document.getElementById("timer-select").value);
    isTimerMode = true;
    closeModals();
    loadLevel();
};

// Initialize
coinCountElem.textContent = userCoins;
streakBadge.textContent = `🔥 ${currentStreak} Day Streak`;
renderLevelNav();
loadLevel();