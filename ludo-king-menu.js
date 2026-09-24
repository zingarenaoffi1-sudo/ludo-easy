window.LudoKingMenu = (function () {
    let _mode = 'bot';
    let _soundMuted = false;

    function init(options = {}) {
        _mode = options.mode || 'bot';
        injectBottomBar();
        injectMenuModal();
        injectChatModal();
        updateAudioButtonStates();
    }

    function injectBottomBar() {
        if (document.getElementById('ludo-king-bottom-bar')) return;

        const bar = document.createElement('div');
        bar.id = 'ludo-king-bottom-bar';
        bar.className = 'ludo-king-bottom-bar';
        bar.innerHTML = `
            <button class="lk-bar-btn lk-menu-trigger" id="lk-menu-btn" title="Game Menu" onclick="LudoKingMenu.openMenu()">
                <div class="lk-hamburger-icon">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </button>
            <div class="lk-center-pill" id="lk-status-pill">
                <span id="lk-status-title">YOUR TURN</span>
                <span id="lk-status-sub">Tap dice to roll</span>
            </div>
            <div class="lk-right-actions">
                <button class="lk-bar-btn" id="lk-chat-btn" title="Quick Chat" onclick="LudoKingMenu.openChat()">
                    💬
                </button>
            </div>
        `;
        document.body.appendChild(bar);
    }

    function injectMenuModal() {
        if (document.getElementById('lk-in-game-menu-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'lk-in-game-menu-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content lk-menu-content">
                <div class="lk-menu-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 24px;">👑</span>
                        <h3 style="margin: 0; color: #ffd700; font-size: 18px; font-weight: 900;">GAME MENU</h3>
                    </div>
                    <button class="lk-close-circle" onclick="LudoKingMenu.closeMenu()">✕</button>
                </div>
                <div class="lk-menu-list">
                    <button class="lk-menu-item" id="lk-music-toggle-btn" onclick="LudoKingMenu.toggleMusic()">
                        <span class="lk-item-icon">🎵</span>
                        <div class="lk-item-texts">
                            <div class="lk-item-title">Background Music</div>
                            <div class="lk-item-sub" id="lk-music-status-text">Music ON</div>
                        </div>
                        <span class="lk-item-state" id="lk-music-badge">ON</span>
                    </button>
                    <button class="lk-menu-item" id="lk-sound-toggle-btn" onclick="LudoKingMenu.toggleSound()">
                        <span class="lk-item-icon">🔊</span>
                        <div class="lk-item-texts">
                            <div class="lk-item-title">Sound Effects</div>
                            <div class="lk-item-sub" id="lk-sound-status-text">Dice & token audio</div>
                        </div>
                        <span class="lk-item-state" id="lk-sound-badge">ON</span>
                    </button>
                    <button class="lk-menu-item" onclick="LudoKingMenu.showRules()">
                        <span class="lk-item-icon">📖</span>
                        <div class="lk-item-texts">
                            <div class="lk-item-title">Rules & Guide</div>
                            <div class="lk-item-sub">How to play & token moves</div>
                        </div>
                        <span style="color: #ffd700; font-weight: 800;">❯</span>
                    </button>
                    <button class="lk-menu-item" onclick="LudoKingMenu.restartGame()">
                        <span class="lk-item-icon">🔄</span>
                        <div class="lk-item-texts">
                            <div class="lk-item-title">Restart Match</div>
                            <div class="lk-item-sub">Start fresh with new players</div>
                        </div>
                        <span style="color: #60a5fa; font-weight: 800;">❯</span>
                    </button>
                    <button class="lk-menu-item lk-danger-item" onclick="LudoKingMenu.exitToLobby()">
                        <span class="lk-item-icon">🚪</span>
                        <div class="lk-item-texts">
                            <div class="lk-item-title">Exit to Lobby</div>
                            <div class="lk-item-sub">Leave current match</div>
                        </div>
                        <span style="color: #f87171; font-weight: 800;">❯</span>
                    </button>
                </div>
                <button class="ultra-roll-btn" onclick="LudoKingMenu.closeMenu()" style="width: 100%; margin-top: 14px; min-height: 44px;">
                    RESUME GAME ▶️
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function injectChatModal() {
        if (document.getElementById('lk-chat-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'lk-chat-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content lk-chat-content">
                <div class="lk-menu-header" style="margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 22px;">💬</span>
                        <h3 style="margin: 0; color: #ffd700; font-size: 16px; font-weight: 900;">QUICK CHAT & EMOJIS</h3>
                    </div>
                    <button class="lk-close-circle" onclick="LudoKingMenu.closeChat()">✕</button>
                </div>

                <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 6px; text-align: left;">
                    POPULAR SHOUTS:
                </div>
                <div class="lk-chat-chips-grid">
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Hurry up! ⏰')">Hurry up! ⏰</button>
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Well played! 👏')">Well played! 👏</button>
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Awesome move! 🔥')">Awesome move! 🔥</button>
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Tough luck! 😅')">Tough luck! 😅</button>
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Thank you! 🙏')">Thank you! 🙏</button>
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Good luck! 🍀')">Good luck! 🍀</button>
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Need a six! 🎲')">Need a six! 🎲</button>
                    <button class="lk-chat-chip" onclick="LudoKingMenu.sendPhrase('Let\\'s go! 🎉')">Let's go! 🎉</button>
                </div>

                <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin: 10px 0 6px; text-align: left;">
                    THROW FUN EMOJI:
                </div>
                <div class="lk-emoji-reactions-row">
                    <span class="lk-emoji-btn" onclick="LudoKingMenu.sendEmoji('😂')">😂</span>
                    <span class="lk-emoji-btn" onclick="LudoKingMenu.sendEmoji('😎')">😎</span>
                    <span class="lk-emoji-btn" onclick="LudoKingMenu.sendEmoji('🔥')">🔥</span>
                    <span class="lk-emoji-btn" onclick="LudoKingMenu.sendEmoji('👏')">👏</span>
                    <span class="lk-emoji-btn" onclick="LudoKingMenu.sendEmoji('😭')">😭</span>
                    <span class="lk-emoji-btn" onclick="LudoKingMenu.sendEmoji('🥳')">🥳</span>
                    <span class="lk-emoji-btn" onclick="LudoKingMenu.sendEmoji('🍅')">🍅</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function openMenu() {
        const modal = document.getElementById('lk-in-game-menu-modal');
        if (modal) {
            updateAudioButtonStates();
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    function closeMenu() {
        const modal = document.getElementById('lk-in-game-menu-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function openChat() {
        const modal = document.getElementById('lk-chat-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    function closeChat() {
        const modal = document.getElementById('lk-chat-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function sendPhrase(phrase) {
        closeChat();
        displayLocalSpeechBubble('red', phrase);
        if (_mode === 'bot' && window.RealisticPersonas) {
            setTimeout(() => {
                const colors = ['green', 'yellow', 'blue'];
                const randomBot = colors[Math.floor(Math.random() * colors.length)];
                window.RealisticPersonas.triggerBotChatReaction(randomBot);
            }, 1200);
        }
    }

    function sendEmoji(emoji) {
        closeChat();
        displayLocalSpeechBubble('red', emoji);
    }

    function displayLocalSpeechBubble(color, text) {
        const profile = document.getElementById(`profile-${color}`) || document.getElementById(`corner-${color}`);
        if (!profile) return;

        let bubble = document.createElement('div');
        bubble.className = 'chat-speech-bubble';
        bubble.innerText = text;
        profile.style.position = 'relative';
        profile.appendChild(bubble);

        setTimeout(() => {
            if (bubble.parentElement) bubble.remove();
        }, 2800);
    }

    function toggleMusic() {
        if (window.LudoMusic) {
            window.LudoMusic.toggleMute();
            updateAudioButtonStates();
        }
    }

    function toggleSound() {
        _soundMuted = !_soundMuted;
        updateAudioButtonStates();
    }

    function updateAudioButtonStates() {
        const isMusicMuted = window.LudoMusic ? window.LudoMusic.isMuted() : false;
        
        const mBadge = document.getElementById('lk-music-badge');
        const mSub = document.getElementById('lk-music-status-text');
        if (mBadge) mBadge.innerText = isMusicMuted ? 'OFF' : 'ON';
        if (mBadge) mBadge.style.color = isMusicMuted ? '#ef4444' : '#10b981';
        if (mSub) mSub.innerText = isMusicMuted ? 'Music paused' : 'Playing soundtrack';

        const sBadge = document.getElementById('lk-sound-badge');
        const sSub = document.getElementById('lk-sound-status-text');
        if (sBadge) sBadge.innerText = _soundMuted ? 'OFF' : 'ON';
        if (sBadge) sBadge.style.color = _soundMuted ? '#ef4444' : '#10b981';
        if (sSub) sSub.innerText = _soundMuted ? 'Effects muted' : 'Dice & token audio active';
    }

    function showRules() {
        closeMenu();
        if (window.HowToPlayGuide && typeof window.HowToPlayGuide.openModal === 'function') {
            window.HowToPlayGuide.openModal();
        }
    }

    function restartGame() {
        closeMenu();
        if (confirm("Are you sure you want to restart the match?")) {
            window.location.reload();
        }
    }

    function exitToLobby() {
        closeMenu();
        if (window.LudoBackHandler && typeof window.LudoBackHandler.handleBackPress === 'function') {
            window.LudoBackHandler.handleBackPress();
        } else {
            window.location.href = 'index.html';
        }
    }

    function updateTurnPill(playerName, statusText, isMyTurn = false) {
        const titleEl = document.getElementById('lk-status-title');
        const subEl = document.getElementById('lk-status-sub');
        const pill = document.getElementById('lk-status-pill');

        if (titleEl) titleEl.innerText = playerName ? playerName.toUpperCase() : "YOUR TURN";
        if (subEl) subEl.innerText = statusText || "Roll the dice";

        if (pill) {
            if (isMyTurn) {
                pill.classList.add('lk-my-turn-pulse');
            } else {
                pill.classList.remove('lk-my-turn-pulse');
            }
        }
    }

    return {
        init,
        openMenu,
        closeMenu,
        openChat,
        closeChat,
        sendPhrase,
        sendEmoji,
        toggleMusic,
        toggleSound,
        showRules,
        restartGame,
        exitToLobby,
        updateTurnPill,
        displayLocalSpeechBubble
    };
})();
