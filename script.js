let board = null;
let game = new Chess();
let multiTurnCheat = false;
let isBotTurn = false;
let coins = 100;
let wins = 0;
let losses = 0;

// Upgrades & Features state
let xrayActive = false;
let sandboxActive = false;
let sandboxSelectedPiece = null;
let timeFreezeActive = false;
let moveHistoryStack = [];
let autoPilotActive = false;
let autoPilotInterval = null;
let doubleCoinBoost = false;
let botStunned = false;
let masterBotEnabled = false;

// UI Elements
const startMenu = document.getElementById('start-menu');
const gameContainer = document.getElementById('game-container');
const playBtn = document.getElementById('play-btn');
const turnText = document.getElementById('turn-text');
const botStatus = document.getElementById('bot-status');
const coinCountEl = document.getElementById('coin-count');
const winCountEl = document.getElementById('win-count');
const lossCountEl = document.getElementById('loss-count');
const difficultyLabel = document.getElementById('difficulty-label');
const cheatPanel = document.getElementById('cheat-panel');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const restartBtn = document.getElementById('restart-btn');
const shopModal = document.getElementById('shop-modal');
const shopBtn = document.getElementById('shop-btn');
const closeShopBtn = document.getElementById('close-shop');
const hintBtn = document.getElementById('hint-btn');
const rematchBtn = document.getElementById('rematch-btn');
const boardWrapper = document.querySelector('.board-wrapper');

playBtn.addEventListener('click', () => {
    startMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    initBoard();
});

restartBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    game.reset();
    board.position('start');
    moveHistoryStack = [];
    turnText.innerText = "Your Turn";
    botStatus.innerText = "Ready";
});

rematchBtn.addEventListener('click', () => {
    game.reset();
    board.position('start');
    moveHistoryStack = [];
    turnText.innerText = "Your Turn";
    botStatus.innerText = "Ready";
    alert("Match restarted!");
});

shopBtn.addEventListener('click', () => shopModal.classList.remove('hidden'));
closeShopBtn.addEventListener('click', () => shopModal.classList.add('hidden'));

// Paid Shop (10 Items)
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        let item = e.target.getAttribute('data-item');
        let cost = parseInt(e.target.getAttribute('data-cost'));

        if (coins >= cost) {
            coins -= cost;
            updateCoins();
            shopModal.classList.add('hidden');

            switch(item) {
                case 'hints':
                    alert("Purchased +3 Hint Charges!");
                    break;
                case 'theme_neon':
                    boardWrapper.classList.remove('cyber-glow');
                    boardWrapper.classList.add('neon-glow');
                    alert("Neon Aura Theme applied!");
                    break;
                case 'theme_cyber':
                    boardWrapper.classList.remove('neon-glow');
                    boardWrapper.classList.add('cyber-glow');
                    alert("Cyberpunk Theme applied!");
                    break;
                case 'vip_badge':
                    alert("VIP Gold Badge activated on profile!");
                    break;
                case 'stun_charge':
                    botStunned = true;
                    alert("Bot Stun Charge purchased! The bot will skip its next turn.");
                    break;
                case 'coin_boost':
                    doubleCoinBoost = true;
                    alert("Double Coin Booster activated permanently!");
                    break;
                case 'crown_avatar':
                    alert("Crown Avatar equipped!");
                    break;
                case 'sound_pack':
                    alert("Sound FX Pack unlocked!");
                    break;
                case 'undo_bundle':
                    alert("Added 5 Undo tokens to reserve!");
                    break;
                case 'master_bot':
                    masterBotEnabled = true;
                    difficultyLabel.innerText = "Grandmaster";
                    alert("Grandmaster Bot AI unlocked and activated!");
                    break;
            }
        } else {
            alert("Insufficient coins! Win matches or use the secret F2 dev console to add coins.");
        }
    });
});

function updateCoins() {
    coinCountEl.innerText = coins;
}

function updateStats() {
    winCountEl.innerText = wins;
    lossCountEl.innerText = losses;
}

function initBoard() {
    let config = {
        position: 'start',
        draggable: true,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    board = Chessboard('board', config);

    $('#board').on('click', '.square-55d63', function() {
        if (!sandboxActive) return;
        let square = $(this).attr('data-square');

        if (!sandboxSelectedPiece) {
            let piece = game.get(square);
            if (piece) {
                sandboxSelectedPiece = square;
                $(this).css('background', '#ef4444');
                alert(`Selected piece at ${square}. Click any target square to place it.`);
            }
        } else {
            let piece = game.get(sandboxSelectedPiece);
            game.remove(sandboxSelectedPiece);
            game.put(piece, square);
            board.position(game.fen());
            $('.square-55d63').css('background', '');
            sandboxSelectedPiece = null;
            alert(`Teleported piece to ${square}!`);
        }
    });
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (sandboxActive) return true;
    if (!multiTurnCheat && ((game.turn() === 'b') || isBotTurn)) return false;
    if (piece.search(/^b/) !== -1 && !multiTurnCheat) return false;
}

function onDrop(source, target) {
    moveHistoryStack.push(game.fen());
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    updateStatus();

    if (!game.game_over() && !multiTurnCheat && !autoPilotActive) {
        if (botStunned) {
            botStunned = false;
            botStatus.innerText = "Stunned ⚡";
            setTimeout(() => { botStatus.innerText = "Ready"; }, 1000);
            return;
        }
        if (!timeFreezeActive) {
            window.setTimeout(makeBotMove, 400);
        }
    }
}

function onSnapEnd() {
    board.position(game.fen());
    if (xrayActive) applyXRayVision();
}

function makeBotMove() {
    if (timeFreezeActive) return;
    isBotTurn = true;
    botStatus.innerText = "Thinking...";

    setTimeout(() => {
        let possibleMoves = game.moves();
        if (possibleMoves.length === 0) return;

        moveHistoryStack.push(game.fen());
        
        // Smart move handling if master bot is active
        let selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        if (masterBotEnabled) {
            let captureMove = possibleMoves.find(m => m.includes('x'));
            if (captureMove) selectedMove = captureMove;
        }

        game.move(selectedMove);

        board.position(game.fen());
        isBotTurn = false;
        botStatus.innerText = "Ready";
        updateStatus();
        if (xrayActive) applyXRayVision();
    }, masterBotEnabled ? 300 : 600);
}

function updateStatus() {
    if (game.in_checkmate()) {
        let isUserWinner = game.turn() === 'b';
        if (isUserWinner) {
            wins++;
            let reward = doubleCoinBoost ? 100 : 50;
            coins += reward;
            updateCoins();
            updateStats();
            showModal("Checkmate!", `You Win! (+${reward} Coins)`);
        } else {
            losses++;
            updateStats();
            showModal("Checkmate!", "Bot Wins!");
        }
        turnText.innerText = "Game Over";
        stopAutoPilot();
    } else if (game.in_draw()) {
        showModal("Draw", "The game is a draw.");
        turnText.innerText = "Draw";
        stopAutoPilot();
    } else {
        turnText.innerText = game.turn() === 'w' ? "Your Turn" : "Bot's Turn";
    }
}

function showModal(title, desc) {
    modalTitle.innerText = title;
    modalDesc.innerText = desc;
    modal.classList.remove('hidden');
}

hintBtn.addEventListener('click', () => {
    if (coins < 30) {
        alert("Not enough coins for a hint! (Requires 30 coins)");
        return;
    }
    coins -= 30;
    updateCoins();

    let moves = game.moves({ verbose: true });
    if (moves.length > 0) {
        let bestMove = moves[0];
        alert(`Hint: Move ${bestMove.piece.toUpperCase()} from ${bestMove.from} to ${bestMove.to}`);
    }
});

// --- SECRET CODE & CHEAT CONSOLE ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
        e.preventDefault();
        let code = prompt("Enter developer secret code:");
        if (code === "rick_dev") {
            cheatPanel.classList.toggle('hidden');
        } else if (code !== null) {
            alert("Incorrect secret code.");
        }
    }
});

// Coin Adder Cheat
document.getElementById('cheat-coins').addEventListener('click', () => {
    coins += 500;
    updateCoins();
    alert("Added +500 free developer coins!");
});

document.getElementById('cheat-win').addEventListener('click', () => {
    game.load("r1bqkbnr/pppp1ppp/8/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4");
    game.move({ from: 'f3', to: 'f7', promotion: 'q' });
    board.position(game.fen());
    wins++;
    coins += doubleCoinBoost ? 100 : 50;
    updateCoins();
    updateStats();
    showModal("Cheat Activated", "Instant Checkmate! You Win!");
});

document.getElementById('cheat-multi').addEventListener('click', () => {
    multiTurnCheat = !multiTurnCheat;
    let btn = document.getElementById('cheat-multi');
    btn.style.background = multiTurnCheat ? "#22c55e" : "";
    alert(multiTurnCheat ? "Multi-Turn Enabled: You can move freely." : "Multi-Turn Disabled.");
});

document.getElementById('cheat-bot-win').addEventListener('click', () => {
    game.load("rnb1kbnr/pppp1ppp/8/4p3/4q3/8/PPPP1PPP/RNB1K1NR b KQkq - 1 3");
    board.position(game.fen());
    losses++;
    updateStats();
    showModal("Cheat Activated", "Bot forced quick checkmate.");
    turnText.innerText = "Game Over";
});

document.getElementById('cheat-xray').addEventListener('click', () => {
    xrayActive = !xrayActive;
    let btn = document.getElementById('cheat-xray');
    btn.style.background = xrayActive ? "#22c55e" : "";
    if (xrayActive) {
        applyXRayVision();
        alert("X-Ray Vision Enabled.");
    } else {
        $('.square-55d63').removeClass('highlight-square');
        alert("X-Ray Vision Disabled.");
    }
});

function applyXRayVision() {
    $('.square-55d63').removeClass('highlight-square');
    let moves = game.moves({ verbose: true });
    moves.forEach(m => {
        $(`.square-${m.to}`).addClass('highlight-square');
    });
}

document.getElementById('cheat-sandbox').addEventListener('click', () => {
    sandboxActive = !sandboxActive;
    let btn = document.getElementById('cheat-sandbox');
    btn.style.background = sandboxActive ? "#22c55e" : "";
    alert(sandboxActive ? "Sandbox Mode Enabled." : "Sandbox Mode Disabled.");
});

document.getElementById('cheat-freeze').addEventListener('click', () => {
    timeFreezeActive = !timeFreezeActive;
    let btn = document.getElementById('cheat-freeze');
    btn.style.background = timeFreezeActive ? "#22c55e" : "";
    botStatus.innerText = timeFreezeActive ? "Frozen ❄️" : "Ready";
    alert(timeFreezeActive ? "Bot Time Frozen." : "Bot Unfrozen.");
});

document.getElementById('cheat-undo').addEventListener('click', () => {
    if (moveHistoryStack.length > 0) {
        let previousFen = moveHistoryStack.pop();
        game.load(previousFen);
        board.position(game.fen());
        updateStatus();
        alert("Successfully undid last move!");
    } else {
        alert("No move history available.");
    }
});

document.getElementById('cheat-flip').addEventListener('click', () => {
    board.flip();
    alert("Board view flipped.");
});

function stopAutoPilot() {
    if (autoPilotInterval) {
        clearInterval(autoPilotInterval);
        autoPilotInterval = null;
    }
    autoPilotActive = false;
    let btn = document.getElementById('cheat-autopilot');
    if (btn) btn.style.background = "";
}

document.getElementById('cheat-autopilot').addEventListener('click', () => {
    autoPilotActive = !autoPilotActive;
    let btn = document.getElementById('cheat-autopilot');
    btn.style.background = autoPilotActive ? "#22c55e" : "";

    if (autoPilotActive) {
        alert("Auto-Pilot Activated.");
        autoPilotInterval = setInterval(() => {
            if (game.game_over()) {
                stopAutoPilot();
                return;
            }
            let possibleMoves = game.moves();
            if (possibleMoves.length === 0) return;
            moveHistoryStack.push(game.fen());
            let randomIdx = Math.floor(Math.random() * possibleMoves.length);
            game.move(possibleMoves[randomIdx]);
            board.position(game.fen());
            updateStatus();
        }, 800);
    } else {
        stopAutoPilot();
        alert("Auto-Pilot Deactivated.");
    }
});