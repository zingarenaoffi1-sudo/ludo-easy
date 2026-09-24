const LudoBackHandler = (function () {
    let currentMode = 'dashboard';

    function init(options) {
        currentMode = (options && options.mode) || 'dashboard';

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            try {
                window.Capacitor.Plugins.App.addListener('backButton', function () {
                    handleBackPress();
                });
            } catch (e) {}
        }

        try {
            history.pushState({ ludoNav: true }, '', window.location.href);
            window.addEventListener('popstate', function () {
                history.pushState({ ludoNav: true }, '', window.location.href);
                handleBackPress();
            });
        } catch (e) {}

        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                handleBackPress();
            }
        });
    }

    function handleBackPress() {
        const auxiliaryModalIds = [
            'how-to-play-modal',
            'dev-feature-modal',
            'lk-in-game-menu-modal',
            'lk-chat-modal'
        ];

        for (let id of auxiliaryModalIds) {
            const el = document.getElementById(id);
            if (el && !el.classList.contains('hidden') && el.style.display !== 'none') {
                el.classList.add('hidden');
                el.style.display = 'none';
                return;
            }
        }

        const confirmModal = document.getElementById('ludo-back-confirm-modal');
        if (confirmModal && !confirmModal.classList.contains('hidden') && confirmModal.style.display !== 'none') {
            closeModal();
            return;
        }

        const victoryModal = document.getElementById('victory-modal');
        if (victoryModal && !victoryModal.classList.contains('hidden') && victoryModal.style.display !== 'none') {
            window.location.href = 'index.html';
            return;
        }

        const startupModal = document.getElementById('startup-modal');
        if (startupModal && !startupModal.classList.contains('hidden') && startupModal.style.display !== 'none') {
            window.location.href = 'index.html';
            return;
        }

        if (currentMode === 'dashboard') {
            showExitAppModal();
        } else {
            showMatchLeaveModal();
        }
    }

    function showExitAppModal() {
        showModal({
            icon: '🚪',
            title: 'Exit Ludo?',
            message: 'Are you sure you want to close the game?',
            confirmText: 'Yes, Exit',
            confirmAction: function () {
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                    try {
                        window.Capacitor.Plugins.App.exitApp();
                        return;
                    } catch (e) {}
                }
                closeModal();
            }
        });
    }

    function showMatchLeaveModal() {
        showModal({
            icon: '⚠️',
            title: 'Leave Current Match?',
            message: 'Your current match progress will be lost. Return to the main menu?',
            confirmText: 'Leave Match',
            confirmAction: function () {
                window.location.href = 'index.html';
            }
        });
    }

    function showModal(config) {
        let modal = document.getElementById('ludo-back-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ludo-back-confirm-modal';
            modal.className = 'modal hidden';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 340px; padding: 22px 18px; border-radius: 16px; border: 2px solid #ffd700; background: linear-gradient(180deg, #1e293b, #0f172a); text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                <div style="font-size: 38px; margin-bottom: 8px;">${config.icon}</div>
                <h3 style="color: #ffd700; font-size: 18px; font-weight: 900; margin: 0 0 8px 0;">${config.title}</h3>
                <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin: 0 0 18px 0;">${config.message}</p>
                <div style="display: flex; gap: 10px; width: 100%;">
                    <button id="ludo-back-cancel-btn" class="menu-btn" style="flex: 1; padding: 10px 6px; font-size: 13px; font-weight: 700; border-radius: 10px; background: rgba(255,255,255,0.1); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.2); cursor: pointer;">
                        Cancel
                    </button>
                    <button id="ludo-back-confirm-btn" class="ultra-roll-btn" style="flex: 1; padding: 10px 6px; font-size: 13px; font-weight: 900; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(220,38,38,0.4);">
                        ${config.confirmText}
                    </button>
                </div>
            </div>
        `;

        document.getElementById('ludo-back-cancel-btn').onclick = closeModal;
        document.getElementById('ludo-back-confirm-btn').onclick = function () {
            closeModal();
            config.confirmAction();
        };

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function closeModal() {
        const modal = document.getElementById('ludo-back-confirm-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    return {
        init: init,
        handleBackPress: handleBackPress,
        closeModal: closeModal
    };
})();

window.LudoBackHandler = LudoBackHandler;
