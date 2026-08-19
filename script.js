// Automatically generate 200 progressive levels up to crazy-hard expert sentences and programming syntax
const levels = [];

const wordBanks = {
    beginner: ["fdsa", "jkl;", "ff jj", "asdf", "jkl;", "sad", "lad", "fall", "glass", "flask"],
    intermediate: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "practice", "makes", "perfect"],
    advanced: ["muscle", "memory", "consistency", "keyboard", "fingers", "velocity", "precision", "rhythm", "focus", "mastery"],
    hardcore: ["asynchronous", "javascript", "algorithm", "developer", "framework", "concurrency", "architecture", "encryption", "polymorphism"],
    nightmare: [
        "function computeVelocity(x, y) { return Math.sqrt(x*x + y*y); }",
        "The 50 quick zebras jumped over 25 lazy dogs while coding in C++!",
        "Rhythm & precision require strict adherence to home row mechanics without hesitation.",
        "An exquisite touch typist never glances downward; spatial awareness is absolute."
    ]
};

for (let i = 1; i <= 200; i++) {
    let tier = Math.floor((i - 1) / 40); // 5 tiers of 40 levels each
    let sentenceWords = [];
    let bankKey = tier === 0 ? "beginner" : tier === 1 ? "intermediate" : tier === 2 ? "advanced" : tier === 3 ? "hardcore" : "nightmare";
    let selectedBank = wordBanks[bankKey];

    let wordCount = Math.min(4 + Math.floor(i / 20), 12);
    for (let w = 0; w < wordCount; w++) {
        let randWord = selectedBank[(i * 3 + w) % selectedBank.length];
        sentenceWords.push(randWord);
    }

    let levelText = sentenceWords.join(" ");
    if (tier === 4) {
        // Nightmare levels use exact complex sentences
        levelText = selectedBank[(i - 161) % selectedBank.length];
    }

    levels.push({
        id: i,
        title: `Level ${i}: ${getTierTitle(tier)}`,
        desc: `Stage ${i} conditioning drill. Maintain absolute accuracy and zero look-down discipline.`,
        tip: `Level ${i} (${bankKey.toUpperCase()}): Keep wrists hovering slightly and snap your fingers straight back to home keys.`,
        text: levelText
    });
}

function getTierTitle(tier) {
    const titles = [
        "Home Row Foundations",
        "Core Word Flow",
        "Velocity & Agility",
        "Hardcore Speed Drills",
        "Nightmare Expert Matrix"
    ];
    return titles[tier] || "Elite Challenge";
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
let currentText = "";
let charIndex = 0;
let correctChars = 0;
let totalTyped = 0;
let startTime = null;
let isPlaying = false;

// DOM Elements
const levelNav = document.getElementById("level-nav");
const levelTitle = document.getElementById("level-title");
const levelDesc = document.getElementById("level-desc");
const memoryTipText = document.getElementById("memory-tip-text");
const wordDisplay = document.getElementById("word-display");
const typingCard = document.getElementById("typing-card");
const focusOverlay = document.getElementById("focus-overlay");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const progressVal = document.getElementById("progress-val");
const restartBtn = document.getElementById("restart-btn");
const mobileInput = document.getElementById("mobile-hidden-input");
const levelJumpInput = document.getElementById("level-jump-input");
const jumpBtn = document.getElementById("jump-btn");
const targetKeyBox = document.getElementById("target-key-box");
const targetFingerBox = document.getElementById("target-finger-box");

function renderLevelNav() {
    levelNav.innerHTML = "";
    levels.forEach((lvl, index) => {
        const btn = document.createElement("button");
        btn.className = `level-btn ${index === currentLevelIndex ? 'active' : ''}`;
        btn.innerHTML = `<span>Lvl ${lvl.id}</span> <span style="font-size:0.7rem; color:var(--text-muted);">${lvl.title.split(':')[1] || ''}</span>`;
        btn.onclick = () => {
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
    memoryTipText.textContent = lvl.tip;
    currentText = lvl.text;

    wordDisplay.innerHTML = "";
    currentText.split("").forEach(char => {
        const span = document.createElement("span");
        span.textContent = char;
        wordDisplay.appendChild(span);
    });

    if (wordDisplay.firstChild) {
        wordDisplay.firstChild.classList.add("active");
        updateHandGuide(wordDisplay.firstChild.textContent);
    }

    charIndex = 0;
    correctChars = 0;
    totalTyped = 0;
    startTime = null;
    isPlaying = false;
    wpmDisplay.textContent = "0";
    accuracyDisplay.textContent = "100%";
    progressVal.textContent = "0%";
    focusOverlay.classList.remove("hidden");
}

function updateHandGuide(char) {
    const finger = fingerMap[char.toLowerCase()] || 'Any Finger';
    targetKeyBox.textContent = char === " " ? "SPACE" : char.toUpperCase();
    targetFingerBox.textContent = finger;
}

function startSession() {
    if (!isPlaying) {
        isPlaying = true;
        startTime = new Date();
        focusOverlay.classList.add("hidden");
    }
}

function handleCharacterInput(char) {
    if (!isPlaying) {
        startSession();
    }

    const charSpanElements = wordDisplay.querySelectorAll("span");

    if (char === "Backspace") {
        if (charIndex > 0) {
            charIndex--;
            charSpanElements[charIndex].classList.remove("correct", "incorrect");
            charSpanElements.forEach(s => s.classList.remove("active"));
            charSpanElements[charIndex].classList.add("active");
            updateHandGuide(charSpanElements[charIndex].textContent);
        }
        return;
    }

    if (char.length === 1 && charIndex < charSpanElements.length) {
        totalTyped++;
        const targetChar = charSpanElements[charIndex].textContent;
        charSpanElements[charIndex].classList.remove("active");

        if (char === targetChar) {
            charSpanElements[charIndex].classList.add("correct");
            correctChars++;
        } else {
            charSpanElements[charIndex].classList.add("incorrect");
        }

        charIndex++;

        const progress = Math.round((charIndex / charSpanElements.length) * 100);
        progressVal.textContent = `${progress}%`;

        if (charIndex < charSpanElements.length) {
            charSpanElements[charIndex].classList.add("active");
            updateHandGuide(charSpanElements[charIndex].textContent);
        } else {
            isPlaying = false;
            focusOverlay.classList.remove("hidden");
            focusOverlay.querySelector(".overlay-content h3").textContent = `🎉 Level ${levels[currentLevelIndex].id} Completed!`;
            focusOverlay.querySelector(".overlay-content p").textContent = "Phenomenal focus! Advancing...";
            
            if (currentLevelIndex < levels.length - 1) {
                currentLevelIndex++;
            } else {
                currentLevelIndex = 0; 
            }
            setTimeout(() => {
                loadLevel();
                focusOverlay.querySelector(".overlay-content h3").textContent = "Tap here or start typing to begin";
                focusOverlay.querySelector(".overlay-content p").textContent = "Keep your eyes on the screen and hands on the home row!";
            }, 2500);
        }

        const timeElapsedMinutes = (new Date() - startTime) / 60000;
        if (timeElapsedMinutes > 0) {
            const wpm = Math.round((correctChars / 5) / timeElapsedMinutes);
            wpmDisplay.textContent = wpm > 0 ? wpm : 0;
        }

        const accuracy = Math.round((correctChars / totalTyped) * 100);
        accuracyDisplay.textContent = `${isNaN(accuracy) ? 100 : accuracy}%`;
    }
}

// Event Listeners
document.addEventListener("keydown", (e) => {
    const keyElem = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
    if (keyElem) {
        keyElem.classList.add("pressed");
    }

    if (document.activeElement !== mobileInput && document.activeElement !== levelJumpInput) {
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
    if (keyElem) {
        keyElem.classList.remove("pressed");
    }
});

mobileInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.length > 0) {
        const lastChar = val[val.length - 1].toLowerCase();
        handleCharacterInput(lastChar);
        e.target.value = "";
    }
});

typingCard.addEventListener("click", () => {
    focusOverlay.classList.add("hidden");
    typingCard.focus();
    if (window.innerWidth <= 900) {
        mobileInput.focus();
    }
});

restartBtn.addEventListener("click", () => {
    loadLevel();
});

jumpBtn.addEventListener("click", () => {
    const val = parseInt(levelJumpInput.value);
    if (val >= 1 && val <= 200) {
        currentLevelIndex = val - 1;
        loadLevel();
        levelJumpInput.value = "";
    }
});

levelJumpInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        jumpBtn.click();
    }
});

// Initialize on page load
loadLevel();