(function() {
    console.log("⚙️ HACK ENGINE LOADED (Debug Mode)");

    let hackSettings = {
        isRunning: false,
        price: null,
        intervalTime: 5,
        hackActive: false,
        intervalId: null,
        hasCountedThisPulse: false
    };

    let currentVirtualPrice = null;

    const originalDecode = TextDecoder.prototype.decode;

    TextDecoder.prototype.decode = function(...args) {
        let text = originalDecode.apply(this, args);

        if (typeof text === "string" && text.startsWith('[["')) {
            
            if (!hackSettings.isRunning || !hackSettings.hackActive) {
                currentVirtualPrice = null;
                return text; 
            }

            const match = text.match(/(\[\s*"[^"]+"\s*,\s*[\d.]+\s*,\s*)([\d.]+)/);
            
            if (!match) {
                console.log("❌ REGEX FAILED TO MATCH:", text);
                return text;
            }

            const realPrice = parseFloat(match[2]);
            const targetPrice = parseFloat(hackSettings.price);
            const decimalPlaces = (hackSettings.price.toString().split('.')[1] || '').length || 2;

            if (currentVirtualPrice === null) {
                currentVirtualPrice = realPrice;
                console.log("🚀 STARTING GLIDE FROM REAL PRICE:", realPrice);
            }

            let finalPrice;
            const gap = targetPrice - currentVirtualPrice;

            if (Math.abs(gap) > (targetPrice * 0.001)) {
                currentVirtualPrice += gap * 0.05; 
                finalPrice = currentVirtualPrice;
                console.log("🛬 GLIDING TO:", finalPrice.toFixed(decimalPlaces));
            } else {
                const volatility = 0.0005;
                const randomOffset = (Math.random() - 0.5) * (targetPrice * volatility);
                finalPrice = targetPrice + randomOffset;
                currentVirtualPrice = targetPrice; 
                console.log("🌊 FLUCTUATING AT:", finalPrice.toFixed(decimalPlaces));
            }

            const newPriceStr = finalPrice.toFixed(decimalPlaces);
            const hackedText = text.replace(match[1] + match[2], `${match[1]}${newPriceStr}`);

            if (!hackSettings.hasCountedThisPulse) {
                window.postMessage({ type: "INCREMENT_INTERCEPT" }, "*");
                hackSettings.hasCountedThisPulse = true;
            }

            return hackedText;
        }
        return text;
    };

    window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        
        if (event.data && event.data.type === "START_HACK") {
            console.log("✅ START_HACK RECEIVED! Target:", event.data.price);
            hackSettings.price = parseFloat(event.data.price).toFixed(2);
            hackSettings.intervalTime = parseInt(event.data.time);
            hackSettings.isRunning = true;
            currentVirtualPrice = null; 

            if (hackSettings.intervalId) clearInterval(hackSettings.intervalId);

            hackSettings.intervalId = setInterval(() => {
                hackSettings.hackActive = true;
                hackSettings.hasCountedThisPulse = false;
                setTimeout(() => {
                    hackSettings.hackActive = false;
                }, 1000); 
            }, hackSettings.intervalTime * 1000);
        }

        if (event.data && event.data.type === "STOP_HACK") {
            console.log("🛑 STOP_HACK RECEIVED!");
            hackSettings.isRunning = false;
            hackSettings.hackActive = false;
            hackSettings.hasCountedThisPulse = false;
            currentVirtualPrice = null;
            if (hackSettings.intervalId) clearInterval(hackSettings.intervalId);
        }
    });
})();