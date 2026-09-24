// Capacitor Web Safe Polyfill & Stub
(function() {
    if (typeof window !== 'undefined') {
        window.Capacitor = window.Capacitor || {
            isNativePlatform: function() { return false; },
            getPlatform: function() { return 'web'; },
            isPluginAvailable: function() { return false; },
            registerPlugin: function() { return null; },
            Plugins: {}
        };
    }
})();
