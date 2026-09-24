let activePlayers = [];
let currentPlayerIndex = 0;
let gameState = 'WAITING_FOR_ROLL';
let currentDiceValue = 0;
let isMoving = false;
let consecutiveSixesCount = 0;
const allTokens = {};
let winnersList = [];
let totalPlayersInGame = 0;
let pendingPlayerCount = 2;
let selectedLocalMode = 'classic'; 
let botColors = [];

const soundDice = new Audio('sounds/board game dice_2.mp3');
const soundMove = new Audio('sounds/ui pop_2.mp3');
const soundCut = new Audio('sounds/cartoon bonk.mp3');
const soundWin = new Audio('sounds/success chime_2.mp3');

function playAudioSafe(audio) {
    if (!audio) return;
    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {}
}

function showToast(msg) {
    let toast = document.getElementById("toast-msg");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-msg";
        toast.className = "toast-message";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.display = 'block';
    if (window._localToastTimer) clearTimeout(window._localToastTimer);
    window._localToastTimer = setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}

const playersData = {
    'red': { name: "Player 1", label: "Player 1", class: "red-text", startOffset: 0 },
    'green': { name: "Player 2", label: "Player 2", class: "green-text", startOffset: 13 },
    'yellow': { name: "Player 2", label: "Player 2", class: "yellow-text", startOffset: 26 },
    'blue': { name: "Player 4", label: "Player 4", class: "blue-text", startOffset: 39 }
};

const masterPath = [
    {r:6, c:1}, {r:6, c:2}, {r:6, c:3}, {r:6, c:4}, {r:6, c:5}, 
    {r:5, c:6}, {r:4, c:6}, {r:3, c:6}, {r:2, c:6}, {r:1, c:6}, {r:0, c:6}, {r:0, c:7}, {r:0, c:8}, 
    {r:1, c:8}, {r:2, c:8}, {r:3, c:8}, {r:4, c:8}, {r:5, c:8}, 
    {r:6, c:9}, {r:6, c:10}, {r:6, c:11}, {r:6, c:12}, {r:6, c:13}, {r:6, c:14}, {r:7, c:14}, {r:8, c:14}, 
    {r:8, c:13}, {r:8, c:12}, {r:8, c:11}, {r:8, c:10}, {r:8, c:9}, 
    {r:9, c:8}, {r:10, c:8}, {r:11, c:8}, {r:12, c:8}, {r:13, c:8}, {r:14, c:8}, {r:14, c:7}, {r:14, c:6}, 
    {r:13, c:6}, {r:12, c:6}, {r:11, c:6}, {r:10, c:6}, {r:9, c:6}, 
    {r:8, c:5}, {r:8, c:4}, {r:8, c:3}, {r:8, c:2}, {r:8, c:1}, {r:8, c:0}, {r:7, c:0} 
];

const safeZones = [
    {r:6, c:1}, {r:8, c:2}, {r:1, c:8}, {r:2, c:6}, 
    {r:8, c:13}, {r:6, c:12}, {r:13, c:6}, {r:12, c:8}  
];

const diceFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

document.addEventListener("DOMContentLoaded", () => {
    createBoard();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'bot') {
        setLocalGameMode('bot');
    }
});

function setLocalGameMode(mode) {
    selectedLocalMode = mode;
    ['classic', 'quick', 'team', 'bot'].forEach(m => {
        const el = document.getElementById(`mode-opt-${m}`);
        if (el) {
            if ((mode === 'team2v2' && m === 'team') || m === mode) {
                el.style.border = '2px solid #ffd700';
            } else {
                el.style.border = '1px solid rgba(255,255,255,0.15)';
            }
        }
    });
    const titleEl = document.getElementById('game-mode-title');
    if (titleEl) {
        if (mode === 'quick') titleEl.innerText = '⚡ QUICK LUDO';
        else if (mode === 'team2v2') titleEl.innerText = '🤝 2 vs 2 TEAM UP';
        else if (mode === 'bot') titleEl.innerText = '🤖 vs COMPUTER';
        else titleEl.innerText = 'PASS & PLAY';
    }
    const btn3p = document.getElementById('btn-3p');
    if (btn3p) {
        btn3p.style.display = (mode === 'team2v2') ? 'none' : 'block';
    }
}

function choosePlayerCount(count) {
    pendingPlayerCount = count;
    const startupModal = document.getElementById("startup-modal");
    if (startupModal) startupModal.classList.add("hidden");
    // Start with 1 token already unlocked on track at Step 0 so goti moves immediately from Turn 1!
    startLocalGame(pendingPlayerCount, true);
}

function startLocalGame(playerCount, unlockOneToken) {
    if (playerCount === 2) {
        // 2 Players: Red (Player 1) vs Yellow (Player 2)
        activePlayers = ['red', 'yellow'];
        playersData['red'].name = "Player 1";
        playersData['yellow'].name = "Player 2";
    } else if (playerCount === 3) {
        activePlayers = ['red', 'green', 'yellow'];
        playersData['red'].name = "Player 1";
        playersData['green'].name = "Player 2";
        playersData['yellow'].name = "Player 3";
    } else {
        activePlayers = ['red', 'green', 'yellow', 'blue'];
        playersData['red'].name = "Player 1";
        playersData['green'].name = "Player 2";
        playersData['yellow'].name = "Player 3";
        playersData['blue'].name = "Player 4";
    }
    
    botColors = [];
    initGameSession(unlockOneToken);
}

function initGameSession(unlockOneToken) {
    winnersList = []; 
    totalPlayersInGame = activePlayers.length; 
    consecutiveSixesCount = 0;

    // Configure HUD Corners: Show only active player corners, hide inactive
    ['red', 'green', 'yellow', 'blue'].forEach(c => {
        let corner = document.getElementById(`corner-${c}`);
        let card = document.getElementById(`profile-${c}`);
        let dice = document.getElementById(`dice-${c}`);
        let nameEl = document.getElementById(`name-${c}`);
        let tagEl = document.getElementById(`tag-${c}`);
        let avatarEl = document.getElementById(`avatar-${c}`);

        if (activePlayers.includes(c)) {
            if (corner) corner.style.display = "flex";
            if (card) card.style.opacity = "0.5";
            if (dice) {
                dice.classList.add("visible");
                dice.innerText = "🎲";
            }
            if (nameEl && playersData[c]) nameEl.innerText = playersData[c].name;
            if (tagEl) tagEl.innerText = c.charAt(0).toUpperCase() + c.slice(1);
            if (avatarEl) {
                if (c === 'red') avatarEl.innerText = "1";
                else if (c === 'yellow' && activePlayers.length === 2) avatarEl.innerText = "2";
                else if (c === 'green') avatarEl.innerText = "2";
                else if (c === 'yellow') avatarEl.innerText = "3";
                else if (c === 'blue') avatarEl.innerText = "4";
            }
        } else {
            // Completely hide inactive corners in HUD!
            if (corner) corner.style.display = "none";
            if (dice) dice.classList.remove("visible");
        }
    });

    // Dim inactive bases on board
    ['red', 'green', 'yellow', 'blue'].forEach(c => {
        let baseEl = document.getElementById(`base-${c}`);
        if (baseEl) {
            if (activePlayers.includes(c)) {
                baseEl.classList.remove('base-inactive');
                baseEl.style.opacity = "1";
            } else {
                baseEl.classList.add('base-inactive');
                baseEl.style.opacity = "0.22";
            }
        }
    });

    currentPlayerIndex = 0;
    gameState = 'WAITING_FOR_ROLL';
    isMoving = false;
    
    // Spawn tokens: ONLY active players get tokens! Inactive houses have ZERO tokens!
    spawnTokens(unlockOneToken);
    updateTurnUI();
}

function handleCornerDiceClick(color) {
    if (isMoving) return;
    let currentColor = activePlayers[currentPlayerIndex];
    if (color !== currentColor) return;
    
    if (gameState === 'WAITING_FOR_ROLL') {
        rollDice();
    } else if (gameState === 'WAITING_FOR_MOVE') {
        // If dice is tapped while waiting for move and only 1 token is movable, move it!
        let tokens = allTokens[currentColor];
        let movable = [];
        tokens.forEach((t, i) => {
            if (t.step === -1 && currentDiceValue === 6) movable.push(i);
            else if (t.step !== -1 && t.step + currentDiceValue <= 56) movable.push(i);
        });
        if (movable.length > 0) {
            moveToken(currentColor, movable[0]);
        }
    }
}

function handleSlotClick(color, index) {
    if (gameState !== 'WAITING_FOR_MOVE' || isMoving) return;
    let currentColor = activePlayers[currentPlayerIndex];
    if (color !== currentColor) return;
    moveToken(color, index);
}

function handleBaseClick(color) {
    if (gameState !== 'WAITING_FOR_MOVE' || isMoving) return;
    let currentColor = activePlayers[currentPlayerIndex];
    if (color !== currentColor) return;
    
    if (currentDiceValue === 6) {
        let baseTokens = allTokens[color].filter(t => t.step === -1);
        if (baseTokens.length > 0) {
            moveToken(color, baseTokens[0].index);
        }
    }
}

function handleCellClick(r, c) {
    if (gameState !== 'WAITING_FOR_MOVE' || isMoving) return;
    let currentColor = activePlayers[currentPlayerIndex];
    let tokens = allTokens[currentColor];
    if (!tokens) return;
    
    for (let t of tokens) {
        if (t.step !== -1 && t.step <= 51) {
            let globalIndex = (playersData[currentColor].startOffset + t.step) % 52;
            let coords = masterPath[globalIndex];
            if (coords && coords.r === r && coords.c === c) {
                moveToken(currentColor, t.index);
                return;
            }
        }
    }
}

function updateTurnUI() {
    if (activePlayers.length === 0) return;
    currentPlayerIndex = currentPlayerIndex % activePlayers.length;
    let currentColor = activePlayers[currentPlayerIndex];
    let pData = playersData[currentColor];
    
    let turnTextEl = document.getElementById("turn-text");
    if (turnTextEl) {
        turnTextEl.innerText = `${pData.name}'s Turn - Roll Dice!`;
        turnTextEl.className = `turn-indicator ${pData.class}`;
    }

    if (window.LudoKingMenu && typeof LudoKingMenu.updateTurnPill === 'function') {
        LudoKingMenu.updateTurnPill(pData.name, "Tap dice to roll", true);
    }
    
    ['red', 'green', 'yellow', 'blue'].forEach(c => {
        let card = document.getElementById(`profile-${c}`);
        let dice = document.getElementById(`dice-${c}`);
        if (c === currentColor) {
            if (card) {
                card.classList.add("active-turn");
                card.style.opacity = "1";
            }
            if (dice) dice.classList.add("active-dice");
        } else {
            if (card) {
                card.classList.remove("active-turn");
                if (activePlayers.includes(c)) card.style.opacity = "0.5";
            }
            if (dice) dice.classList.remove("active-dice");
        }
    });
}

function generateFairDiceRoll(color) {
    const tokens = allTokens[color];
    const allInBase = tokens && tokens.every(t => t.step === -1);
    
    if (consecutiveSixesCount >= 2) {
        return Math.floor(Math.random() * 5) + 1;
    }
    
    // Balanced excitement: if all tokens are in base, 35% chance to roll a 6
    if (allInBase && Math.random() < 0.35) {
        return 6;
    }
    
    return Math.floor(Math.random() * 6) + 1;
}

function rollDice() {
    if (gameState !== 'WAITING_FOR_ROLL' || isMoving) return;
    gameState = 'ROLLING';
    let currentColor = activePlayers[currentPlayerIndex];
    let diceEl = document.getElementById(`dice-${currentColor}`);
    currentDiceValue = generateFairDiceRoll(currentColor);

    const onRollFinished = () => {
        if (currentDiceValue === 6) {
            consecutiveSixesCount = (consecutiveSixesCount || 0) + 1;
        } else {
            consecutiveSixesCount = 0;
        }

        if (consecutiveSixesCount >= 3) {
            consecutiveSixesCount = 0;
            showToast("⚠️ 3 Consecutive Sixes! Turn passed.");
            setTimeout(() => switchTurn(false), 800);
            return;
        }

        gameState = 'WAITING_FOR_MOVE';
        checkAvailableMoves();
    };

    if (window.LudoAnimations && window.LudoAnimations.animateDiceRoll) {
        window.LudoAnimations.animateDiceRoll(diceEl, currentDiceValue, onRollFinished);
    } else {
        if (diceEl) {
            diceEl.innerText = diceFaces[currentDiceValue];
            diceEl.style.color = currentDiceValue === 6 ? "#ff3333" : "#111";
        }
        playAudioSafe(soundDice);
        onRollFinished();
    }
}

function checkAvailableMoves() {
    let currentColor = activePlayers[currentPlayerIndex];
    let tokens = allTokens[currentColor];
    let movableTokens = [];
    
    tokens.forEach((token, index) => {
        if (token.step === -1 && currentDiceValue === 6) movableTokens.push(index);
        else if (token.step !== -1 && token.step + currentDiceValue <= 56) movableTokens.push(index);
    });
    
    if (movableTokens.length === 0) {
        const allInBase = tokens.every(t => t.step === -1);
        if (allInBase) {
            showToast(`🎲 Rolled ${currentDiceValue} • Need a ⚅ 6 to open goti!`);
        } else {
            showToast(`🎲 Rolled ${currentDiceValue} • No valid moves available!`);
        }
        setTimeout(() => switchTurn(false), 900);
    } else if (movableTokens.length === 1) {
        // Exactly one move possible: highlight and auto-advance after brief delay
        tokens[movableTokens[0]].element.classList.add("highlight-move");
        setTimeout(() => {
            if (gameState === 'WAITING_FOR_MOVE' && !isMoving) {
                moveToken(currentColor, movableTokens[0]);
            }
        }, 320);
    } else {
        // Multiple choices: highlight all movable gotis
        movableTokens.forEach(idx => tokens[idx].element.classList.add("highlight-move"));
        showToast("👉 Tap a highlighted goti to move!");
    }
}

function moveToken(color, tokenIndex) {
    if (gameState !== 'WAITING_FOR_MOVE' || isMoving) return;
    let currentColor = activePlayers[currentPlayerIndex];
    if (color !== currentColor) return;
    
    let token = allTokens[color] ? allTokens[color][tokenIndex] : null;
    if (!token) return;
    
    if (token.step === -1 && currentDiceValue !== 6) {
        showToast("⚠️ Need a 6 to open goti from base!");
        return;
    }
    if (token.step !== -1 && token.step + currentDiceValue > 56) {
        showToast("⚠️ Roll exceeds home! Cannot move this goti.");
        return;
    }
    
    // Clear all highlights
    allTokens[color].forEach(t => t.element.classList.remove("highlight-move"));
    isMoving = true;
    
    // Unlock token from base onto starting square
    if (token.step === -1 && currentDiceValue === 6) {
        token.step = 0;
        playAudioSafe(soundMove);
        renderAllTokens();
        isMoving = false;
        showToast("🎉 Goti opened! Bonus turn for rolling 6!");
        setTimeout(() => switchTurn(true), 400);
        return;
    }
    
    // Hop along track square by square
    let startStep = token.step;
    let targetStep = token.step + currentDiceValue;
    
    function doHop(currentStep) {
        if (currentStep > targetStep) {
            if (window.LudoAnimations && window.LudoAnimations.animateTokenLanding) {
                window.LudoAnimations.animateTokenLanding(token);
            }
            isMoving = false;
            let extraTurn = (currentDiceValue === 6 || targetStep === 56);
            let cutEnemy = checkCapture(token);
            if (cutEnemy) {
                extraTurn = true;
                showToast("⚔️ Opponent goti captured! Bonus roll!");
            }
            if (targetStep === 56) {
                showToast("👑 Goti reached Home! Bonus roll!");
                playAudioSafe(soundWin);
            }
            if (checkPlayerWon(color)) {
                handlePlayerWin(color);
                return;
            }
            switchTurn(extraTurn);
            return;
        }
        
        token.step = currentStep;
        if (window.LudoAnimations && window.LudoAnimations.animateTokenHopStep) {
            window.LudoAnimations.animateTokenHopStep(token, renderAllTokens, () => {
                playAudioSafe(soundMove);
            });
        } else {
            renderAllTokens();
            playAudioSafe(soundMove);
        }
        setTimeout(() => doHop(currentStep + 1), 160);
    }
    
    doHop(startStep + 1);
}

function checkCapture(token) {
    if (token.step > 51) return false;
    let globalIndex = (playersData[token.color].startOffset + token.step) % 52;
    let currentCoords = masterPath[globalIndex];
    let isSafe = safeZones.some(z => z.r === currentCoords.r && z.c === currentCoords.c);
    if (isSafe) return false;
    
    let captured = false;
    activePlayers.forEach(enemyColor => {
        if (enemyColor !== token.color) {
            if (selectedLocalMode === 'team2v2') {
                const isTeammate = (token.color === 'red' && enemyColor === 'yellow') ||
                                   (token.color === 'yellow' && enemyColor === 'red') ||
                                   (token.color === 'green' && enemyColor === 'blue') ||
                                   (token.color === 'blue' && enemyColor === 'green');
                if (isTeammate) return;
            }
            allTokens[enemyColor].forEach(eToken => {
                if (eToken.step !== -1 && eToken.step <= 51) {
                    let enemyGlobal = (playersData[enemyColor].startOffset + eToken.step) % 52;
                    let enemyCoords = masterPath[enemyGlobal];
                    if (enemyCoords.r === currentCoords.r && enemyCoords.c === currentCoords.c) {
                        captured = true;
                        if (window.LudoAnimations && window.LudoAnimations.animateTokenCapture) {
                            window.LudoAnimations.animateTokenCapture(eToken, renderAllTokens, () => {
                                playAudioSafe(soundCut);
                            });
                        } else {
                            eToken.step = -1;
                            renderAllTokens();
                            playAudioSafe(soundCut);
                        }
                    }
                }
            });
        }
    });
    return captured;
}

function checkPlayerWon(color) {
    if (selectedLocalMode === 'team2v2') {
        const partner = (color === 'red') ? 'yellow' : (color === 'yellow') ? 'red' : (color === 'green') ? 'blue' : 'green';
        const myTeamWon = allTokens[color].every(t => t.step === 56) && (allTokens[partner] ? allTokens[partner].every(t => t.step === 56) : true);
        return myTeamWon;
    }
    if (selectedLocalMode === 'quick') {
        return allTokens[color].filter(t => t.step === 56).length >= 2;
    }
    return allTokens[color].every(t => t.step === 56);
}

function handlePlayerWin(playerColor) {
    if (!winnersList.includes(playerColor)) {
        winnersList.push(playerColor);
        activePlayers = activePlayers.filter(c => c !== playerColor);
        if (winnersList.length >= totalPlayersInGame - 1 || activePlayers.length <= 1) {
            endMatchWithPodium();
        } else {
            switchTurn(false);
        }
    }
}

function endMatchWithPodium() {
    playAudioSafe(soundWin);
    let podiumDiv = document.getElementById("victory-podium");
    if (podiumDiv) {
        podiumDiv.innerHTML = "";
        winnersList.forEach((col, idx) => {
            let badge = idx === 0 ? "🥇 1st Place" : idx === 1 ? "🥈 2nd Place" : "🥉 3rd Place";
            podiumDiv.innerHTML += `<div style="padding: 6px; font-weight: bold; color: #ffd700;">${badge}: ${playersData[col].name} (${col.toUpperCase()})</div>`;
        });
        if (activePlayers.length > 0) {
            podiumDiv.innerHTML += `<div style="padding: 6px; color: #94a3b8;">Runner Up: ${playersData[activePlayers[0]].name} (${activePlayers[0].toUpperCase()})</div>`;
        }
    }
    const victoryModal = document.getElementById("victory-modal");
    if (victoryModal) victoryModal.classList.remove("hidden");
}

function switchTurn(extraTurn) {
    if (!extraTurn) {
        currentPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
        consecutiveSixesCount = 0;
    }
    gameState = 'WAITING_FOR_ROLL';
    updateTurnUI();
}

function spawnTokens(unlockOneToken) {
    // Remove existing tokens
    document.querySelectorAll('.token').forEach(el => el.remove());
    
    // ONLY spawn tokens for ACTIVE PLAYERS!
    ['red', 'green', 'yellow', 'blue'].forEach(color => {
        allTokens[color] = [];
        if (!activePlayers.includes(color)) return;
        
        for (let i = 0; i < 4; i++) {
            let tokenEl = document.createElement("div");
            tokenEl.classList.add("token", `token-${color}`);
            tokenEl.setAttribute("data-color", color);
            tokenEl.setAttribute("data-index", i);
            tokenEl.innerHTML = `<span class="token-pip">${i + 1}</span>`;
            
            tokenEl.addEventListener("click", (e) => {
                e.stopPropagation();
                moveToken(color, i);
            });
            tokenEl.addEventListener("touchend", (e) => {
                e.preventDefault();
                e.stopPropagation();
                moveToken(color, i);
            }, { passive: false });
            
            // Token 0 starts unlocked on track at Step 0
            let initialStep = (unlockOneToken && i === 0) ? 0 : -1;
            let tokenObj = { color, index: i, step: initialStep, element: tokenEl };
            allTokens[color].push(tokenObj);
            
            const board = document.getElementById("ludo-board");
            if (board) board.appendChild(tokenEl);
        }
    });
    
    // Position tokens on board
    setTimeout(() => {
        renderAllTokens();
    }, 50);
}

function getTargetElementForToken(token) {
    if (token.step === -1) {
        return document.getElementById(`slot-${token.color}-${token.index}`);
    } else if (token.step <= 51) {
        let globalIndex = (playersData[token.color].startOffset + token.step) % 52;
        let coords = masterPath[globalIndex];
        return document.getElementById(`cell-${coords.r}-${coords.c}`);
    } else {
        let homeIndex = token.step - 52;
        if (homeIndex < 5) {
            if (token.color === 'red') return document.getElementById(`cell-7-${homeIndex + 1}`);
            if (token.color === 'green') return document.getElementById(`cell-${homeIndex + 1}-7`);
            if (token.color === 'yellow') return document.getElementById(`cell-7-${13 - homeIndex}`);
            if (token.color === 'blue') return document.getElementById(`cell-${13 - homeIndex}-7`);
        } else {
            return document.getElementById(`cell-7-7`);
        }
    }
    return null;
}

function renderAllTokens() {
    const board = document.getElementById("ludo-board");
    if (!board) return;
    const boardRect = board.getBoundingClientRect();

    // Group active tokens by target element id to handle stacking
    const groups = {};
    activePlayers.forEach(c => {
        if (!allTokens[c]) return;
        allTokens[c].forEach(token => {
            const targetEl = getTargetElementForToken(token);
            if (!targetEl) return;
            const tid = targetEl.id;
            if (!groups[tid]) groups[tid] = [];
            groups[tid].push({ token, targetEl });
        });
    });

    // Render with smart offsets for stacked tokens on same cell
    Object.keys(groups).forEach(tid => {
        const list = groups[tid];
        list.forEach((item, idx) => {
            const { token, targetEl } = item;
            const rect = targetEl.getBoundingClientRect();
            let left = (rect.left - boardRect.left) + (rect.width / 2) - 12;
            let top = (rect.top - boardRect.top) + (rect.height / 2) - 12;
            
            if (list.length > 1 && token.step !== -1) {
                const angle = (idx / list.length) * (2 * Math.PI);
                const radius = 5;
                left += Math.cos(angle) * radius;
                top += Math.sin(angle) * radius;
                token.element.style.transform = `scale(0.85)`;
            } else {
                token.element.style.transform = `none`;
            }
            
            token.element.style.left = `${left}px`;
            token.element.style.top = `${top}px`;
        });
    });
}

window.addEventListener('resize', () => {
    renderAllTokens();
});

function createBoard() {
    const board = document.getElementById("ludo-board");
    if (!board) return;
    board.innerHTML = "";
    
    const bases = [
        { class: 'red-base', color: 'red' },
        { class: 'green-base', color: 'green' },
        { class: 'blue-base', color: 'blue' },
        { class: 'yellow-base', color: 'yellow' }
    ];
    
    bases.forEach(b => {
        let baseEl = document.createElement("div");
        baseEl.classList.add("base", b.class);
        baseEl.id = `base-${b.color}`;
        baseEl.addEventListener("click", () => handleBaseClick(b.color));
        
        let inner = document.createElement("div");
        inner.classList.add("inner-base");
        for (let i = 0; i < 4; i++) {
            let slot = document.createElement("div");
            slot.classList.add("token-slot");
            slot.id = `slot-${b.color}-${i}`;
            slot.addEventListener("click", (e) => {
                e.stopPropagation();
                handleSlotClick(b.color, i);
            });
            inner.appendChild(slot);
        }
        baseEl.appendChild(inner);
        board.appendChild(baseEl);
    });

    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) continue;
            let cell = document.createElement("div");
            cell.classList.add("ludo-cell");
            cell.id = `cell-${r}-${c}`;
            cell.style.gridArea = `${r + 1} / ${c + 1} / ${r + 2} / ${c + 2}`;
            cell.addEventListener("click", () => handleCellClick(r, c));

            // Home paths color
            if (r === 7 && c > 0 && c < 6) cell.style.backgroundColor = "var(--red-main)";
            if (c === 7 && r > 0 && r < 6) cell.style.backgroundColor = "var(--green-main)";
            if (r === 7 && c > 8 && c < 14) cell.style.backgroundColor = "var(--yellow-main)";
            if (c === 7 && r > 8 && r < 14) cell.style.backgroundColor = "var(--blue-main)";

            // Start cells color
            if (r === 6 && c === 1) cell.style.backgroundColor = "var(--red-main)";
            if (r === 1 && c === 8) cell.style.backgroundColor = "var(--green-main)";
            if (r === 8 && c === 13) cell.style.backgroundColor = "var(--yellow-main)";
            if (r === 13 && c === 6) cell.style.backgroundColor = "var(--blue-main)";

            // Safe zones stars
            safeZones.forEach(z => {
                if (z.r === r && z.c === c) {
                    let star = document.createElement("span");
                    star.classList.add("safe-zone-icon");
                    star.innerText = "⭐";
                    cell.appendChild(star);
                }
            });
            board.appendChild(cell);
        }
    }
}
