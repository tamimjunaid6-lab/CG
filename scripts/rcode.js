// (function() {
(function() {
    // 🚨 YOUR IMAGE LINKS 🚨
    const LOGO_MAIN = "https://i.ibb.co/XZTdfw2x/logo.png"; 
    const LOGO_BUBBLE = "https://i.ibb.co/JWXLQgMF/logo2.jpg";

    console.log("⚙️ INJECT SCRIPT LOADED (Screen Reader Mode)");

    // ==========================================
    // PART 1: THE HACK ENGINE
    // ==========================================
    let hackSettings = {
        isRunning: false,
        price: null,
        intervalTime: 5,
        hackActive: false,
        intervalId: null,
        hasCountedThisPulse: false,
        currentSymbol: ""
    };

    // 🚨 NEW: Read the active market directly from the screen
    setInterval(() => {
        // Find the element in the top bar that displays the market name
        const elements = document.querySelectorAll('div, span');
        for (let el of elements) {
            if (el.innerText && el.innerText.includes('(OTC)') && el.innerText.length < 40) {
                // Extract the name (e.g., "Ethereum Classic")
                let sym = el.innerText.replace('(OTC)', '').replace('...', '').trim();
                
                if (sym !== hackSettings.currentSymbol) {
                    hackSettings.currentSymbol = sym;
                    window.postMessage({ type: "UPDATE_SYMBOL", symbol: sym }, "*");
                    console.log(`👀 Screen Reader updated to: ${sym}`);
                }
                break;
            }
        }
    }, 1000); // Check the screen every 1 second

    const originalDecode = TextDecoder.prototype.decode;

    TextDecoder.prototype.decode = function(...args) {
        let text = originalDecode.apply(this, args);

        if (typeof text === "string" && text.startsWith('[["') && text.split(",").length === 4) {
            
            if (!hackSettings.isRunning || !hackSettings.hackActive) {
                return text; 
            }

            const newPrice = parseFloat(hackSettings.price).toFixed(2);
            const regex = /(\[\s*"[^"]+"\s*,\s*[\d.]+\s*,\s*)[\d.]+/;
            const hackedText = text.replace(regex, `$1${newPrice}`);

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
            if (hackSettings.intervalId) clearInterval(hackSettings.intervalId);
        }
    });


    // ==========================================
    // PART 2: THE UI
    // ==========================================
    if (document.getElementById('glitch-host')) return;

    const host = document.createElement('div');
    host.id = 'glitch-host';
    host.style.cssText = 'position: fixed; top: 100px; right: 50px; width: 380px; font-family: monospace; z-index: 9999999; display: block;';
    
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes start-glow { 0% { box-shadow: 0 0 5px rgba(0, 240, 255, 0.4); } 50% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.8), inset 0 0 10px rgba(0, 240, 255, 0.3); } 100% { box-shadow: 0 0 5px rgba(0, 240, 255, 0.4); } }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        @keyframes pulse-dot { from { opacity: 1; transform: scale(1); } to { opacity: 0.5; transform: scale(1.2); } }

        .panel { background: rgba(13, 20, 34, 0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 16px; color: #fff; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6); position: relative; display: flex; flex-direction: column; width: 100%; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(0, 240, 255, 0.15); cursor: grab; background: rgba(0,0,0,0.2); }
        .header:active { cursor: grabbing; }
        .title-area { display: flex; align-items: center; gap: 10px; }
        .title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #00F0FF; letter-spacing: 1px; }
        .version { font-size: 9px; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); padding: 2px 6px; border-radius: 4px; color: #00F0FF; }
        .controls { display: flex; gap: 6px; }
        .btn-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #162035; border: 1px solid #334155; border-radius: 6px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
        .btn-icon:hover { color: #fff; border-color: #64748b; }
        .btn-icon.close:hover { color: #FF2A55; border-color: #FF2A55; }
        .body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

        .market-asset { background: rgba(11, 18, 30, 0.9); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
        .asset-label { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: bold; }
        .asset-icon { width: 14px; height: 14px; color: #00F0FF; }
        .asset-name { font-size: 16px; font-weight: 900; color: #67e8f9; letter-spacing: 0.5px; margin-top: 2px; text-shadow: 0 0 8px rgba(0,240,255,0.4); }
        .asset-type { font-size: 11px; color: #22d3ee; font-weight: 500; }
        .asset-live { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .live-badge { background: rgba(2, 44, 34, 0.7); border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 20px; display: flex; align-items: center; gap: 4px; font-size: 9px; color: #34d399; font-weight: bold; box-shadow: 0 0 8px rgba(0,255,133,0.2); }
        .live-dot { width: 6px; height: 6px; background: #34d399; border-radius: 50%; box-shadow: 0 0 6px #34d399; animation: pulse 2s infinite; }
        .sparkline { width: 60px; height: 16px; color: #22d3ee; overflow: visible; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px; }
        .input-wrapper { position: relative; }
        .input-wrapper input { width: 100%; background: #070b12; border: 1px solid rgba(0, 240, 255, 0.2); padding: 10px 12px; color: #fff; font-family: monospace; font-size: 16px; font-weight: bold; border-radius: 8px; outline: none; transition: border 0.2s; }
        .input-wrapper input:focus { border-color: #00F0FF; }
        .input-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 10px; color: #64748b; font-weight: bold; pointer-events: none; }
        .duration-pills { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 8px; }
        .pill { background: #0a101b; border: 1px solid #1e293b; color: #94a3b8; padding: 6px 0; text-align: center; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
        .pill.active { background: rgba(0, 240, 255, 0.1); border-color: #00F0FF; color: #00F0FF; box-shadow: 0 0 10px rgba(0,240,255,0.2); }
        .pill:hover:not(.active) { color: #fff; border-color: #64748b; }
        .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .btn { padding: 12px; border-radius: 8px; font-weight: bold; font-size: 13px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: 1px; }
        .btn:active { transform: scale(0.95); }
        .btn-start { background: linear-gradient(to right, #06b6d4, #2563eb); color: #fff; border: 1px solid rgba(0, 240, 255, 0.4); }
        .btn-start:hover { filter: brightness(1.2); }
        .btn-start.active { animation: start-glow 1.5s infinite; border-color: #00F0FF; }
        .btn-stop { background: rgba(22, 12, 20, 0.8); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.4); }
        .btn-stop:hover { border-color: #e11d48; color: #fff; }
        .btn-stop.shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .footer { padding-top: 12px; border-top: 1px solid rgba(0, 240, 255, 0.15); display: flex; flex-direction: column; gap: 10px; }
        .status-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
        .status-indicator { display: flex; align-items: center; gap: 6px; font-weight: bold; color: #94a3b8; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #64748b; transition: all 0.3s; }
        .dot.active { background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse-dot 1s infinite alternate; }
        .intercepts { display: flex; align-items: center; gap: 6px; }
        .intercepts span:first-child { color: #00F0FF; font-weight: bold; }
        .intercept-count { background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: bold; transition: all 0.2s; }
        .feedback { text-align: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(16, 185, 129, 0.2); padding: 6px; border-radius: 8px; font-size: 10px; color: #10b981; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; transition: all 0.3s; }
        .feedback.active-feedback { color: #00F0FF; border-color: rgba(0, 240, 255, 0.4); background: rgba(0, 240, 255, 0.1); }
        
        .minimized-bubble { display: none; width: 64px; height: 64px; background: rgba(13, 20, 34, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 50%; box-shadow: 0 0 20px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.1); align-items: center; justify-content: center; cursor: grab; transition: all 0.3s ease; user-select: none; }
        .minimized-bubble:active { cursor: grabbing; }
        .minimized-bubble:hover { transform: scale(1.1); border-color: #00F0FF; box-shadow: 0 0 30px rgba(0, 240, 255, 0.5); }
        .minimized-bubble img { width: 48px; height: 48px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.8)); }
    `;

    shadow.appendChild(style);
    document.body.appendChild(host);

    // ==========================================
    // SHOW MAIN PANEL DIRECTLY
    // ==========================================
    const container = document.createElement('div');
    container.className = 'panel';
    container.innerHTML = `
        <div class="header" id="drag-header">
            <div class="title-area">
                <div class="title">CANDLE GLITCH</div>
                <div class="version">v1.0</div>
            </div>
            <div class="controls">
                <div class="btn-icon" id="btn-minimize">—</div>
                <div class="btn-icon close" id="btn-close">✕</div>
            </div>
        </div>
        <div class="body" id="main-body">
            <div class="market-asset">
                <div>
                    <div class="asset-label">
                        <svg class="asset-icon" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 3v3m0 12v3M3 12h3m12 0h3"></path></svg>
                        <span>Market Asset</span>
                    </div>
                    <div class="asset-name" id="asset-symbol">WAITING... <span class="asset-type" id="asset-type">(LIVE)</span></div>
                </div>
                <div class="asset-live">
                    <div class="live-badge"><span class="live-dot"></span>LIVE</div>
                    <svg class="sparkline" fill="none" viewbox="0 0 64 16">
                        <path d="M1 11L12 13L24 7L36 10L48 3L63 8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>
                        <circle cx="63" cy="8" fill="#00F0FF" r="2"></circle>
                    </svg>
                </div>
            </div>
            <div class="input-group">
                <label>Target Price / Round Number</label>
                <div class="input-wrapper">
                    <input type="text" id="target-price" value="8260.00" />
                    <span class="input-suffix">OTC</span>
                </div>
            </div>
            <div class="input-group">
                <label>Delay Time (Seconds)</label>
                <div class="input-wrapper">
                    <input type="number" id="delay-time" value="5" />
                    <span class="input-suffix">SEC</span>
                </div>
                <div class="duration-pills" id="pills">
                    <div class="pill active" data-time="5">5s</div>
                    <div class="pill" data-time="6">6s</div>
                    <div class="pill" data-time="10">10s</div>
                    <div class="pill" data-time="15">15s</div>
                    <div class="pill" data-time="30">30s</div>
                </div>
            </div>
            <div class="actions">
                <button class="btn btn-start" id="btn-start">▶ START</button>
                <button class="btn btn-stop" id="btn-stop">■ STOP</button>
            </div>
            <div class="footer">
                <div class="status-row">
                    <div class="status-indicator">
                        <div class="dot" id="status-dot"></div>
                        <span id="status-text">STANDBY</span>
                    </div>
                    <div class="intercepts">
                        <span>INTERCEPTS:</span>
                        <span class="intercept-count" id="intercept-count">0</span>
                    </div>
                </div>
                <div class="feedback" id="feedback-text">💀 Glitch Bot Ready • Waiting for Signal</div>
            </div>
        </div>
    `;

    const bubble = document.createElement('div');
    bubble.className = 'minimized-bubble';
    bubble.id = 'minimized-bubble';
    bubble.innerHTML = `<img src="${LOGO_BUBBLE}" alt="Logo" />`;

    shadow.appendChild(container);
    shadow.appendChild(bubble);

    const header = container.querySelector('#drag-header');
    const btnStart = container.querySelector('#btn-start');
    const btnStop = container.querySelector('#btn-stop');
    const btnClose = container.querySelector('#btn-close');
    const btnMinimize = container.querySelector('#btn-minimize');
    const statusText = container.querySelector('#status-text');
    const statusDot = container.querySelector('#status-dot');
    const interceptCount = container.querySelector('#intercept-count');
    const delayInput = container.querySelector('#delay-time');
    const pills = container.querySelectorAll('.pill');
    const feedbackText = container.querySelector('#feedback-text');
    const assetSymbol = container.querySelector('#asset-symbol');
    const assetType = container.querySelector('#asset-type');

    let totalIntercepts = 0;
    let isDragging = false, draggingBubble = false, offsetX, offsetY, bubbleWasDragged = false;

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.btn-icon')) return;
        isDragging = true;
        draggingBubble = false;
        offsetX = e.clientX - host.getBoundingClientRect().left;
        offsetY = e.clientY - host.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        if (draggingBubble) bubbleWasDragged = true;
        host.style.left = (e.clientX - offsetX) + 'px';
        host.style.top = (e.clientY - offsetY) + 'px';
        host.style.right = 'auto'; 
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        draggingBubble = false;
    });

    btnMinimize.addEventListener('click', () => {
        container.style.display = 'none';
        bubble.style.display = 'flex';
        host.style.width = '64px';
    });

    bubble.addEventListener('mousedown', (e) => {
        isDragging = true;
        draggingBubble = true;
        bubbleWasDragged = false;
        offsetX = e.clientX - host.getBoundingClientRect().left;
        offsetY = e.clientY - host.getBoundingClientRect().top;
        e.preventDefault();
    });

    bubble.addEventListener('click', () => {
        if (bubbleWasDragged) {
            bubbleWasDragged = false;
            return;
        }
        bubble.style.display = 'none';
        container.style.display = 'flex';
        host.style.width = '380px';
    });

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            delayInput.value = pill.getAttribute('data-time');
        });
    });

    btnStart.addEventListener('click', () => {
        const price = container.querySelector('#target-price').value;
        const time = delayInput.value;

        window.postMessage({ type: "START_HACK", price: price, time: time }, "*");
        
        statusText.innerText = "ACTIVE";
        statusText.style.color = "#00F0FF";
        statusDot.classList.add('active');
        btnStart.classList.add('active');
        feedbackText.innerHTML = "⚡ HACKING ENGINE ARMED • SCANNING...";
        feedbackText.classList.add('active-feedback');

        totalIntercepts = 0;
        interceptCount.innerText = totalIntercepts;
    });

    btnStop.addEventListener('click', () => {
        window.postMessage({ type: "STOP_HACK" }, "*");
        
        statusText.innerText = "STANDBY";
        statusText.style.color = "#94a3b8";
        statusDot.classList.remove('active');
        btnStart.classList.remove('active');

        btnStop.classList.add('shake');
        setTimeout(() => btnStop.classList.remove('shake'), 400);

        feedbackText.innerHTML = "🛑 SYSTEM HALTED • STANDBY MODE";
        feedbackText.classList.remove('active-feedback');
    });

    btnClose.addEventListener('click', () => host.style.display = 'none');

    window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        
        if (event.data && event.data.type === "INCREMENT_INTERCEPT") {
            totalIntercepts++;
            interceptCount.innerText = totalIntercepts;
            interceptCount.style.transform = "scale(1.2)";
            setTimeout(() => interceptCount.style.transform = "scale(1)", 150);
        }
        
        if (event.data && event.data.type === "UPDATE_SYMBOL") {
            const sym = event.data.symbol;
            // The DOM gives us the name without _otc, so we format it nicely
            assetSymbol.childNodes[0].nodeValue = sym + " ";
            assetType.innerText = "(OTC)";
        }
    });
    
    console.log("🎨 UI Panel Rendered Successfully!");
})();

//     // 🚨 YOUR IMAGE LINKS 🚨
//     const LOGO_MAIN = "https://i.ibb.co/XZTdfw2x/logo.png"; 
//     const LOGO_BUBBLE = "https://i.ibb.co/JWXLQgMF/logo2.jpg";

//     console.log("⚙️ INJECT SCRIPT LOADED (Server Payload)");

//     // ==========================================
//     // PART 1: THE HACK ENGINE
//     // ==========================================
//     let hackSettings = {
//         isRunning: false,
//         price: null,
//         intervalTime: 5,
//         hackActive: false,
//         intervalId: null,
//         hasCountedThisPulse: false,
//         currentSymbol: ""
//     };

//     const originalDecode = TextDecoder.prototype.decode;

//     TextDecoder.prototype.decode = function(...args) {
//         let text = originalDecode.apply(this, args);

//         if (typeof text === "string" && text.startsWith('[["') && text.split(",").length === 4) {
//             const match = text.match(/\[\s*"([^"]+)"/);
//             if (match && match[1] && match[1] !== hackSettings.currentSymbol) {
//                 hackSettings.currentSymbol = match[1];
//                 window.postMessage({ type: "UPDATE_SYMBOL", symbol: match[1] }, "*");
//             }

//             if (!hackSettings.isRunning || !hackSettings.hackActive) {
//                 return text; 
//             }

//             const newPrice = parseFloat(hackSettings.price).toFixed(2);
//             const regex = /(\[\s*"[^"]+"\s*,\s*[\d.]+\s*,\s*)[\d.]+/;
//             const hackedText = text.replace(regex, `$1${newPrice}`);

//             if (!hackSettings.hasCountedThisPulse) {
//                 window.postMessage({ type: "INCREMENT_INTERCEPT" }, "*");
//                 hackSettings.hasCountedThisPulse = true;
//             }

//             return hackedText;
//         }
//         return text;
//     };

//     window.addEventListener("message", (event) => {
//         if (event.source !== window) return;
        
//         if (event.data && event.data.type === "START_HACK") {
//             hackSettings.price = parseFloat(event.data.price).toFixed(2);
//             hackSettings.intervalTime = parseInt(event.data.time);
//             hackSettings.isRunning = true;

//             if (hackSettings.intervalId) clearInterval(hackSettings.intervalId);

//             hackSettings.intervalId = setInterval(() => {
//                 hackSettings.hackActive = true;
//                 hackSettings.hasCountedThisPulse = false;
//                 setTimeout(() => {
//                     hackSettings.hackActive = false;
//                 }, 1000); 
//             }, hackSettings.intervalTime * 1000);
//         }

//         if (event.data && event.data.type === "STOP_HACK") {
//             hackSettings.isRunning = false;
//             hackSettings.hackActive = false;
//             hackSettings.hasCountedThisPulse = false;
//             if (hackSettings.intervalId) clearInterval(hackSettings.intervalId);
//         }
//     });


//     // ==========================================
//     // PART 2: THE UI
//     // ==========================================
//     if (document.getElementById('glitch-host')) return;

//     const host = document.createElement('div');
//     host.id = 'glitch-host';
//     host.style.cssText = 'position: fixed; top: 100px; right: 50px; width: 380px; font-family: monospace; z-index: 9999999; display: block;';
    
//     const shadow = host.attachShadow({ mode: 'open' });

//     const style = document.createElement('style');
//     style.textContent = `
//         * { box-sizing: border-box; margin: 0; padding: 0; }
        
//         @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
//         @keyframes start-glow { 0% { box-shadow: 0 0 5px rgba(0, 240, 255, 0.4); } 50% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.8), inset 0 0 10px rgba(0, 240, 255, 0.3); } 100% { box-shadow: 0 0 5px rgba(0, 240, 255, 0.4); } }
//         @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
//         @keyframes pulse-dot { from { opacity: 1; transform: scale(1); } to { opacity: 0.5; transform: scale(1.2); } }

//         .panel { background: rgba(13, 20, 34, 0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 16px; color: #fff; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6); position: relative; display: flex; flex-direction: column; width: 100%; }
//         .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(0, 240, 255, 0.15); cursor: grab; background: rgba(0,0,0,0.2); }
//         .header:active { cursor: grabbing; }
//         .title-area { display: flex; align-items: center; gap: 10px; }
//         .title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #00F0FF; letter-spacing: 1px; }
//         .version { font-size: 9px; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); padding: 2px 6px; border-radius: 4px; color: #00F0FF; }
//         .controls { display: flex; gap: 6px; }
//         .btn-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #162035; border: 1px solid #334155; border-radius: 6px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
//         .btn-icon:hover { color: #fff; border-color: #64748b; }
//         .btn-icon.close:hover { color: #FF2A55; border-color: #FF2A55; }
//         .body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

//         .market-asset { background: rgba(11, 18, 30, 0.9); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
//         .asset-label { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: bold; }
//         .asset-icon { width: 14px; height: 14px; color: #00F0FF; }
//         .asset-name { font-size: 16px; font-weight: 900; color: #67e8f9; letter-spacing: 0.5px; margin-top: 2px; text-shadow: 0 0 8px rgba(0,240,255,0.4); }
//         .asset-type { font-size: 11px; color: #22d3ee; font-weight: 500; }
//         .asset-live { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
//         .live-badge { background: rgba(2, 44, 34, 0.7); border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 20px; display: flex; align-items: center; gap: 4px; font-size: 9px; color: #34d399; font-weight: bold; box-shadow: 0 0 8px rgba(0,255,133,0.2); }
//         .live-dot { width: 6px; height: 6px; background: #34d399; border-radius: 50%; box-shadow: 0 0 6px #34d399; animation: pulse 2s infinite; }
//         .sparkline { width: 60px; height: 16px; color: #22d3ee; overflow: visible; }
//         .input-group { display: flex; flex-direction: column; gap: 6px; }
//         .input-group label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px; }
//         .input-wrapper { position: relative; }
//         .input-wrapper input { width: 100%; background: #070b12; border: 1px solid rgba(0, 240, 255, 0.2); padding: 10px 12px; color: #fff; font-family: monospace; font-size: 16px; font-weight: bold; border-radius: 8px; outline: none; transition: border 0.2s; }
//         .input-wrapper input:focus { border-color: #00F0FF; }
//         .input-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 10px; color: #64748b; font-weight: bold; pointer-events: none; }
//         .duration-pills { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 8px; }
//         .pill { background: #0a101b; border: 1px solid #1e293b; color: #94a3b8; padding: 6px 0; text-align: center; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
//         .pill.active { background: rgba(0, 240, 255, 0.1); border-color: #00F0FF; color: #00F0FF; box-shadow: 0 0 10px rgba(0,240,255,0.2); }
//         .pill:hover:not(.active) { color: #fff; border-color: #64748b; }
//         .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
//         .btn { padding: 12px; border-radius: 8px; font-weight: bold; font-size: 13px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: 1px; }
//         .btn:active { transform: scale(0.95); }
//         .btn-start { background: linear-gradient(to right, #06b6d4, #2563eb); color: #fff; border: 1px solid rgba(0, 240, 255, 0.4); }
//         .btn-start:hover { filter: brightness(1.2); }
//         .btn-start.active { animation: start-glow 1.5s infinite; border-color: #00F0FF; }
//         .btn-stop { background: rgba(22, 12, 20, 0.8); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.4); }
//         .btn-stop:hover { border-color: #e11d48; color: #fff; }
//         .btn-stop.shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
//         .footer { padding-top: 12px; border-top: 1px solid rgba(0, 240, 255, 0.15); display: flex; flex-direction: column; gap: 10px; }
//         .status-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
//         .status-indicator { display: flex; align-items: center; gap: 6px; font-weight: bold; color: #94a3b8; }
//         .dot { width: 8px; height: 8px; border-radius: 50%; background: #64748b; transition: all 0.3s; }
//         .dot.active { background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse-dot 1s infinite alternate; }
//         .intercepts { display: flex; align-items: center; gap: 6px; }
//         .intercepts span:first-child { color: #00F0FF; font-weight: bold; }
//         .intercept-count { background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: bold; transition: all 0.2s; }
//         .feedback { text-align: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(16, 185, 129, 0.2); padding: 6px; border-radius: 8px; font-size: 10px; color: #10b981; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; transition: all 0.3s; }
//         .feedback.active-feedback { color: #00F0FF; border-color: rgba(0, 240, 255, 0.4); background: rgba(0, 240, 255, 0.1); }
        
//         .minimized-bubble { display: none; width: 64px; height: 64px; background: rgba(13, 20, 34, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 50%; box-shadow: 0 0 20px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.1); align-items: center; justify-content: center; cursor: grab; transition: all 0.3s ease; user-select: none; }
//         .minimized-bubble:active { cursor: grabbing; }
//         .minimized-bubble:hover { transform: scale(1.1); border-color: #00F0FF; box-shadow: 0 0 30px rgba(0, 240, 255, 0.5); }
//         .minimized-bubble img { width: 48px; height: 48px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.8)); }
//     `;

//     shadow.appendChild(style);
//     document.body.appendChild(host);

//     // ==========================================
//     // SHOW MAIN PANEL DIRECTLY
//     // ==========================================
//     const container = document.createElement('div');
//     container.className = 'panel';
//     container.innerHTML = `
//         <div class="header" id="drag-header">
//             <div class="title-area">
//                 <div class="title">CANDLE GLITCH</div>
//                 <div class="version">v1.0</div>
//             </div>
//             <div class="controls">
//                 <div class="btn-icon" id="btn-minimize">—</div>
//                 <div class="btn-icon close" id="btn-close">✕</div>
//             </div>
//         </div>
//         <div class="body" id="main-body">
//             <div class="market-asset">
//                 <div>
//                     <div class="asset-label">
//                         <svg class="asset-icon" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 3v3m0 12v3M3 12h3m12 0h3"></path></svg>
//                         <span>Market Asset</span>
//                     </div>
//                     <div class="asset-name" id="asset-symbol">WAITING... <span class="asset-type" id="asset-type">(LIVE)</span></div>
//                 </div>
//                 <div class="asset-live">
//                     <div class="live-badge"><span class="live-dot"></span>LIVE</div>
//                     <svg class="sparkline" fill="none" viewbox="0 0 64 16">
//                         <path d="M1 11L12 13L24 7L36 10L48 3L63 8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>
//                         <circle cx="63" cy="8" fill="#00F0FF" r="2"></circle>
//                     </svg>
//                 </div>
//             </div>
//             <div class="input-group">
//                 <label>Target Price / Round Number</label>
//                 <div class="input-wrapper">
//                     <input type="text" id="target-price" value="8260.00" />
//                     <span class="input-suffix">OTC</span>
//                 </div>
//             </div>
//             <div class="input-group">
//                 <label>Delay Time (Seconds)</label>
//                 <div class="input-wrapper">
//                     <input type="number" id="delay-time" value="5" />
//                     <span class="input-suffix">SEC</span>
//                 </div>
//                 <div class="duration-pills" id="pills">
//                     <div class="pill active" data-time="5">5s</div>
//                     <div class="pill" data-time="6">6s</div>
//                     <div class="pill" data-time="10">10s</div>
//                     <div class="pill" data-time="15">15s</div>
//                     <div class="pill" data-time="30">30s</div>
//                 </div>
//             </div>
//             <div class="actions">
//                 <button class="btn btn-start" id="btn-start">▶ START</button>
//                 <button class="btn btn-stop" id="btn-stop">■ STOP</button>
//             </div>
//             <div class="footer">
//                 <div class="status-row">
//                     <div class="status-indicator">
//                         <div class="dot" id="status-dot"></div>
//                         <span id="status-text">STANDBY</span>
//                     </div>
//                     <div class="intercepts">
//                         <span>INTERCEPTS:</span>
//                         <span class="intercept-count" id="intercept-count">0</span>
//                     </div>
//                 </div>
//                 <div class="feedback" id="feedback-text">💀 Glitch Bot Ready • Waiting for Signal</div>
//             </div>
//         </div>
//     `;

//     const bubble = document.createElement('div');
//     bubble.className = 'minimized-bubble';
//     bubble.id = 'minimized-bubble';
//     bubble.innerHTML = `<img src="${LOGO_BUBBLE}" alt="Logo" />`;

//     shadow.appendChild(container);
//     shadow.appendChild(bubble);

//     const header = container.querySelector('#drag-header');
//     const btnStart = container.querySelector('#btn-start');
//     const btnStop = container.querySelector('#btn-stop');
//     const btnClose = container.querySelector('#btn-close');
//     const btnMinimize = container.querySelector('#btn-minimize');
//     const statusText = container.querySelector('#status-text');
//     const statusDot = container.querySelector('#status-dot');
//     const interceptCount = container.querySelector('#intercept-count');
//     const delayInput = container.querySelector('#delay-time');
//     const pills = container.querySelectorAll('.pill');
//     const feedbackText = container.querySelector('#feedback-text');
//     const assetSymbol = container.querySelector('#asset-symbol');
//     const assetType = container.querySelector('#asset-type');

//     let totalIntercepts = 0;
//     let isDragging = false, draggingBubble = false, offsetX, offsetY, bubbleWasDragged = false;

//     header.addEventListener('mousedown', (e) => {
//         if (e.target.closest('.btn-icon')) return;
//         isDragging = true;
//         draggingBubble = false;
//         offsetX = e.clientX - host.getBoundingClientRect().left;
//         offsetY = e.clientY - host.getBoundingClientRect().top;
//     });
//     document.addEventListener('mousemove', (e) => {
//         if (!isDragging) return;
//         if (draggingBubble) bubbleWasDragged = true;
//         host.style.left = (e.clientX - offsetX) + 'px';
//         host.style.top = (e.clientY - offsetY) + 'px';
//         host.style.right = 'auto'; 
//     });
//     document.addEventListener('mouseup', () => {
//         isDragging = false;
//         draggingBubble = false;
//     });

//     btnMinimize.addEventListener('click', () => {
//         container.style.display = 'none';
//         bubble.style.display = 'flex';
//         host.style.width = '64px';
//     });

//     bubble.addEventListener('mousedown', (e) => {
//         isDragging = true;
//         draggingBubble = true;
//         bubbleWasDragged = false;
//         offsetX = e.clientX - host.getBoundingClientRect().left;
//         offsetY = e.clientY - host.getBoundingClientRect().top;
//         e.preventDefault();
//     });

//     bubble.addEventListener('click', () => {
//         if (bubbleWasDragged) {
//             bubbleWasDragged = false;
//             return;
//         }
//         bubble.style.display = 'none';
//         container.style.display = 'flex';
//         host.style.width = '380px';
//     });

//     pills.forEach(pill => {
//         pill.addEventListener('click', () => {
//             pills.forEach(p => p.classList.remove('active'));
//             pill.classList.add('active');
//             delayInput.value = pill.getAttribute('data-time');
//         });
//     });

//     btnStart.addEventListener('click', () => {
//         const price = container.querySelector('#target-price').value;
//         const time = delayInput.value;

//         window.postMessage({ type: "START_HACK", price: price, time: time }, "*");
        
//         statusText.innerText = "ACTIVE";
//         statusText.style.color = "#00F0FF";
//         statusDot.classList.add('active');
//         btnStart.classList.add('active');
//         feedbackText.innerHTML = "⚡ HACKING ENGINE ARMED • SCANNING...";
//         feedbackText.classList.add('active-feedback');

//         totalIntercepts = 0;
//         interceptCount.innerText = totalIntercepts;
//     });

//     btnStop.addEventListener('click', () => {
//         window.postMessage({ type: "STOP_HACK" }, "*");
        
//         statusText.innerText = "STANDBY";
//         statusText.style.color = "#94a3b8";
//         statusDot.classList.remove('active');
//         btnStart.classList.remove('active');

//         btnStop.classList.add('shake');
//         setTimeout(() => btnStop.classList.remove('shake'), 400);

//         feedbackText.innerHTML = "🛑 SYSTEM HALTED • STANDBY MODE";
//         feedbackText.classList.remove('active-feedback');
//     });

//     btnClose.addEventListener('click', () => host.style.display = 'none');

//     window.addEventListener("message", (event) => {
//         if (event.source !== window) return;
        
//         if (event.data && event.data.type === "INCREMENT_INTERCEPT") {
//             totalIntercepts++;
//             interceptCount.innerText = totalIntercepts;
//             interceptCount.style.transform = "scale(1.2)";
//             setTimeout(() => interceptCount.style.transform = "scale(1)", 150);
//         }
        
//         if (event.data && event.data.type === "UPDATE_SYMBOL") {
//             const sym = event.data.symbol;
//             const isOtc = sym.toLowerCase().includes("_otc");
//             const cleanSym = sym.replace("_otc", "").replace("_", "/");
            
//             assetSymbol.childNodes[0].nodeValue = cleanSym + " ";
//             assetType.innerText = isOtc ? "(OTC)" : "(LIVE)";
//         }
//     });
    
//     console.log("🎨 UI Panel Rendered Successfully!");
// })();