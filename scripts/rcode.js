(function() {
    console.log("⚙️ HACK ENGINE LOADED (Smooth Glide Mode)");

    let hackSettings = {
        isRunning: false,
        price: null,
        intervalTime: 5,
        hackActive: false,
        intervalId: null,
        hasCountedThisPulse: false
    };

    let currentVirtualPrice = null; // Tracks the price as it glides

    const originalDecode = TextDecoder.prototype.decode;

    TextDecoder.prototype.decode = function(...args) {
        let text = originalDecode.apply(this, args);

        // Check if it's a tick: [["BTCUSD", 12345, 678.90, 1]]
        if (typeof text === "string" && text.startsWith('[["') && text.split(",").length === 4) {
            
            if (!hackSettings.isRunning || !hackSettings.hackActive) {
                // If the hack is off, reset the virtual price so it re-calculates next time
                currentVirtualPrice = null; 
                return text; 
            }

            // Extract the real price from the text to use as a starting point
            const match = text.match(/(\[\s*"[^"]+"\s*,\s*[\d.]+\s*,\s*)([\d.]+)/);
            if (!match) return text;

            const realPrice = parseFloat(match[2]);
            const targetPrice = parseFloat(hackSettings.price);
            
            // Figure out how many decimal places to use based on the target
            const decimalPlaces = (hackSettings.price.toString().split('.')[1] || '').length || 2;

            // Initialize the virtual price if it's null (first tick after starting)
            if (currentVirtualPrice === null) {
                currentVirtualPrice = realPrice;
            }

            let finalPrice;
            const gap = targetPrice - currentVirtualPrice;

            // 🚨 THE LOGIC: Glide vs Fluctuate
            // If the gap is larger than 0.1% of the target, we are still gliding
            if (Math.abs(gap) > (targetPrice * 0.001)) {
                // Move 5% closer to the target on every tick
                currentVirtualPrice += gap * 0.05; 
                finalPrice = currentVirtualPrice;
            } else {
                // We are close enough! Now apply the natural fluctuation around the target
                const volatility = 0.0005; // 0.05% fluctuation
                const randomOffset = (Math.random() - 0.5) * (targetPrice * volatility);
                finalPrice = targetPrice + randomOffset;
                
                // Keep currentVirtualPrice anchored to the target to prevent drift
                currentVirtualPrice = targetPrice; 
            }

            const newPriceStr = finalPrice.toFixed(decimalPlaces);
            
            // Replace the real price with our smoothed/fluctuated price
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
            hackSettings.price = parseFloat(event.data.price).toFixed(2);
            hackSettings.intervalTime = parseInt(event.data.time);
            hackSettings.isRunning = true;
            
            // 🚨 Reset the virtual price so it starts gliding from the REAL price again
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
            hackSettings.isRunning = false;
            hackSettings.hackActive = false;
            hackSettings.hasCountedThisPulse = false;
            currentVirtualPrice = null; // Reset
            if (hackSettings.intervalId) clearInterval(hackSettings.intervalId);
        }
    });
})();