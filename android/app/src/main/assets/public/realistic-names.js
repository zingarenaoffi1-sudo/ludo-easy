const REALISTIC_NAMES_LIST = [
    "Alex_Pro99", "David_King", "Sophie_Star", "Lucas_Viper", "Emma_Ace",
    "Oliver_Champion", "Liam_Thunder", "Noah_Vortex", "Ethan_Knight", "Maya_Blaze",
    "Ryan_Striker", "Chloe_Flash", "Daniel_Legend", "Sam_Phantom", "Mia_Shadow",
    "Nathan_Titan", "Zoe_Specter", "Jack_Ranger", "Grace_Comet", "Leo_Sniper",
    "Aarav_Ace", "Rahul_Pro", "Priya_Star", "Kabir_King", "Rohan_Warrior",
    "Vikram_Titan", "Ananya_Spark", "Aditya_Falcon", "Arjun_Apex", "Riya_Glow"
];

const REALISTIC_AVATAR_EMOJIS = [
    "👦", "👨", "👩", "👧", "🧔", "🧑‍𦱰", "👱‍♂️", "👱‍♀️", "🥷", "🤠", "👑", "🦁", "⚡", "🔥", "🎯", "🏆"
];

const REALISTIC_RANK_TAGS = [
    "Lv 24 • Pro", "Lv 38 • Master", "Lv 19 • Ace", "Lv 42 • Legend", "Lv 31 • Champion",
    "Lv 27 • Veteran", "Lv 35 • Elite", "Lv 22 • Star", "Lv 45 • Grandmaster", "Lv 29 • Expert"
];

const REALISTIC_CHAT_PHRASES = [
    "Well played! 👏",
    "Nice move! 🔥",
    "Oops! 😅",
    "Good luck! 🍀",
    "Hurry up! ⏰",
    "Thanks! 🙏",
    "Great shot! 🎯",
    "Tough luck! 😂",
    "Roll fast! 🎲"
];

window.RealisticPersonas = (function() {
    let usedNames = new Set();

    function getRandomPlayer(excludeNames = []) {
        let pool = REALISTIC_NAMES_LIST.filter(n => !usedNames.has(n) && !excludeNames.includes(n));
        if (pool.length === 0) {
            usedNames.clear();
            pool = REALISTIC_NAMES_LIST;
        }
        const name = pool[Math.floor(Math.random() * pool.length)];
        usedNames.add(name);

        const avatar = REALISTIC_AVATAR_EMOJIS[Math.floor(Math.random() * REALISTIC_AVATAR_EMOJIS.length)];
        const tag = REALISTIC_RANK_TAGS[Math.floor(Math.random() * REALISTIC_RANK_TAGS.length)];
        const level = Math.floor(Math.random() * 35) + 12;

        return {
            name: name,
            avatar: avatar,
            tag: tag,
            level: level,
            initials: name.substring(0, 2).toUpperCase()
        };
    }

    function resetPool() {
        usedNames.clear();
    }

    function triggerBotChatReaction(senderColor, triggerType = 'normal') {
        const profile = document.getElementById(`profile-${senderColor}`) || document.getElementById(`corner-${senderColor}`);
        if (!profile) return;

        let phrase = REALISTIC_CHAT_PHRASES[Math.floor(Math.random() * REALISTIC_CHAT_PHRASES.length)];
        if (triggerType === 'capture') {
            phrase = Math.random() > 0.5 ? "Got you! 🎯" : "Oops! 😅";
        } else if (triggerType === 'six') {
            phrase = Math.random() > 0.5 ? "Sixer! 🔥" : "Boom! 🎲";
        }

        let bubble = document.createElement('div');
        bubble.className = 'chat-speech-bubble';
        bubble.innerText = phrase;
        profile.style.position = 'relative';
        profile.appendChild(bubble);

        setTimeout(() => {
            if (bubble.parentElement) bubble.remove();
        }, 2800);
    }

    return {
        getRandomPlayer,
        resetPool,
        triggerBotChatReaction,
        chatPhrases: REALISTIC_CHAT_PHRASES
    };
})();
