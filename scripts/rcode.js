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

    let currentVirtualPrice = null; 

    const originalDecode = TextDecoder.prototype.decode;

    TextDecoder.prototype.decode = function(...args) {
        let text = originalDecode.apply(this, args);

        // Check if it's a tick: [["BTCUSD_otc", 1792344807.672, 83949.13, 1]]
        if (typeof text === "string" && text.startsWith('[["') && text.split(",").length === 4) {
            
            if (!hackSettings.isRunning || !hackSettings.hackActive) {
                currentVirtualPrice = null; 
                return text; 
            }

            // 🚨 THE FOOLPROOF SPLIT METHOD 🚨
            let parts = text.split(",");
            
            // parts[0] = '[["BTCUSD_otc"'
            // parts[1] = ' 1792344807.672'
            // parts[2] = ' 83949.13'  <-- THIS IS THE PRICE
            // parts[3] = ' 1]]'
            
            const realPrice = parseFloat(parts[2]);
            const targetPrice = parseFloat(hackSettings.price);
            
            // Get how many decimals the user wants (e.g. 8260.00 = 2, 1.3050 = 4)
            const decimalPlaces = (hackSettings.price.toString().split('.')[1] || '').length || 2;

            // Initialize the virtual price on the first tick
            if (currentVirtualPrice === null) {
                currentVirtualPrice = realPrice;
            }

            let finalPrice;
            const gap = targetPrice - currentVirtualPrice;

            // 🚨 THE MATH 🚨
            // If we are far from the target, GLIDE 5% of the distance per tick
            if (Math.abs(gap) > (targetPrice * 0.001)) {
                currentVirtualPrice += gap * 0.05; 
                finalPrice = currentVirtualPrice;
            } else {
                // If we are close, FLUCTUATE naturally around the target (0.05% variance)
                const volatility = 0.0005; 
                const randomOffset = (Math.random() - 0.5) * (targetPrice * volatility);
                finalPrice = targetPrice + randomOffset;
                
                // Keep the anchor at target so it doesn't drift away over time
                currentVirtualPrice = targetPrice; 
            }

            const newPriceStr = finalPrice.toFixed(decimalPlaces);
            
            // Put the hacked price back into the array
            parts[2] = " " + newPriceStr; 
            const hackedText = parts.join(",");

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
            currentVirtualPrice = null; 
            if (hackSettings.intervalId) clearInterval(hackSettings.intervalId);
        }
    });
})();