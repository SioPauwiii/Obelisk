// --- SHARED PHYSICS SCRIPT (Embedded in templates below) ---
// This ensures the effect is identical across all pages.

export const generateLiveHealthPage = (data: any) => {
    const isHealthy = data.isHealthy;
    const statusColor = isHealthy ? '#15803d' : '#b45309';
    const statusBg = isHealthy ? '#dcfce7' : '#fef3c7';
    const statusBorder = isHealthy ? '#86efac' : '#fcd34d';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>System Diagnostics | SayHere</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
            
            :root {
                --dti-blue: #003366;
                --bg-surface: #f8fafc;
                --card-bg: #ffffff;
                --text-main: #1e293b;
                --text-muted: #64748b;
                --border: #e2e8f0;
            }

            body {
                font-family: 'Inter', sans-serif;
                background-color: var(--bg-surface);
                color: var(--text-main);
                margin: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                overflow-x: hidden; /* Prevent scrollbars from dots */
            }

            /* PHYSICS CANVAS */
            #bgCanvas {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
            }

            .container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 1;
                pointer-events: none; /* Let mouse pass through to canvas */
            }

            .dashboard-card {
                /* Glassmorphism Update */
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(8px);
                width: 100%;
                max-width: 600px;
                border-radius: 12px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                border: 1px solid rgba(226, 232, 240, 0.8);
                overflow: hidden;
                pointer-events: auto; /* Re-enable clicks */
            }

            .card-header {
                padding: 24px;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255, 255, 255, 0.5); /* Semi-transparent header */
            }

            .header-left { display: flex; align-items: center; gap: 16px; }
            .header-logo { height: 42px; width: auto; }
            
            .header-titles h1 { margin: 0; font-size: 1.1rem; color: var(--dti-blue); font-weight: 700; }
            .header-titles span { font-size: 0.8rem; color: var(--text-muted); display: block; }

            .status-badge {
                background: ${statusBg};
                color: ${statusColor};
                border: 1px solid ${statusBorder};
                padding: 6px 12px;
                border-radius: 99px;
                font-size: 0.75rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }

            .pulse-dot {
                width: 8px; height: 8px; background: currentColor; border-radius: 50%;
                animation: pulse 2s infinite;
            }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                background: transparent;
                gap: 1px;
                border-bottom: 1px solid var(--border);
            }

            .metric-box {
                background: rgba(255, 255, 255, 0.6);
                padding: 20px;
                text-align: center;
            }

            .metric-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px; }
            .metric-value { 
                font-family: 'JetBrains Mono', monospace; 
                font-size: 1.1rem; 
                font-weight: 600; 
                color: var(--text-main);
            }

            .services-section { padding: 24px; }
            .section-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }

            .service-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border: 1px solid var(--border);
                margin-bottom: 8px;
                border-radius: 6px;
                background: rgba(248, 250, 252, 0.5);
                transition: transform 0.2s;
            }
            .service-row:hover { background: rgba(255, 255, 255, 0.8); border-color: #cbd5e1; }

            .service-info { display: flex; align-items: center; gap: 12px; }
            .service-icon { color: var(--text-muted); font-size: 1.1rem; }
            .service-name { font-weight: 500; font-size: 0.9rem; color: var(--text-main); }
            
            .service-status { 
                font-size: 0.8rem; 
                font-weight: 600; 
                color: ${statusColor};
                background: ${statusBg};
                padding: 2px 8px;
                border-radius: 4px;
            }

            .card-footer {
                padding: 12px 24px;
                background: rgba(248, 250, 252, 0.5);
                border-top: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                font-size: 0.75rem;
                color: var(--text-muted);
            }
            .footer-id { font-family: 'JetBrains Mono', monospace; }

        </style>
    </head>
    <body>
        <canvas id="bgCanvas"></canvas>

        <div class="container">
            <div class="dashboard-card">
                
                <div class="card-header">
                    <div class="header-left">
                        <div class="header-titles">
                            <h1>System Diagnostics</h1>
                            <span>SayHere</span>
                        </div>
                    </div>
                    <div class="status-badge">
                        <div class="pulse-dot"></div>
                        ${data.status}
                    </div>
                </div>

                <div class="metrics-grid">
                    <div class="metric-box">
                        <div class="metric-label">Environment</div>
                        <div class="metric-value" style="color: var(--dti-blue)">${data.environment}</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">System Uptime</div>
                        <div class="metric-value" id="uptime-display">${data.process.uptimeFormatted}</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Memory Used</div>
                        <div class="metric-value">${data.system.memory.usedPercentage}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Server Time</div>
                        <div class="metric-value" id="clock-display">--:--</div>
                    </div>
                </div>

                <div class="services-section">
                    <div class="section-label">Database Connectivity & Latency</div>
                    
                    <div class="service-row">
                        <div class="service-info">
                            <span class="service-icon">&#9670;</span> <span class="service-name">MongoDB Atlas</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${data.databases.MongoDB.latencyMs}ms</span>
                            <span class="service-status">${data.databases.MongoDB.status}</span>
                        </div>
                    </div>

                    <div class="service-row">
                        <div class="service-info">
                            <span class="service-icon">&#9670;</span> <span class="service-name">Supabase (Postgres)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${data.databases.Supabase.latencyMs}ms</span>
                            <span class="service-status">${data.databases.Supabase.status}</span>
                        </div>
                    </div>

                    <div class="service-row">
                        <div class="service-info">
                            <span class="service-icon">&#9670;</span> <span class="service-name">Redis</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${data.databases.Redis.latencyMs}ms</span>
                            <span class="service-status">${data.databases.Redis.status}</span>
                        </div>
                    </div>
                </div>
                
                <div class="services-section" style="border-top: 1px solid var(--border); padding-top: 16px; margin-top: -8px;">
                    <div class="section-label">System Specs</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.6;">
                        <div><strong>OS:</strong> ${data.system.osPlatform} ${data.system.osRelease}</div>
                        <div><strong>CPU:</strong> ${data.system.cpuCores}x ${data.system.cpuModel} (Load: ${data.system.loadAverage.join(', ')})</div>
                        <div><strong>Memory:</strong> ${data.system.memory.freeMB}MB free / ${data.system.memory.totalMB}MB total</div>
                        <div><strong>Node Memory:</strong> ${data.process.memoryUsage.rssMB}MB RSS / ${data.process.memoryUsage.heapUsedMB}MB Heap</div>
                    </div>
                </div>

                <div class="card-footer">
                    <span>Generated by SayHere API</span>
                    <span class="footer-id">Ref: ${data.prepared_by}</span>
                </div>

            </div>
        </div>

        <script>
            // --- 1. Dashboard Logic ---
            let totalSeconds = ${Math.floor(data.process.uptimeSeconds)};
            
            function formatTime(totalSeconds) {
                const d = Math.floor(totalSeconds / 86400);
                const h = Math.floor((totalSeconds % 86400) / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = Math.floor(totalSeconds % 60);
                return \`\${d}d \${h}h \${m}m \${s}s\`;
            }

            function updateDashboard() {
                totalSeconds++;
                document.getElementById('uptime-display').innerText = formatTime(totalSeconds);
                const now = new Date();
                const options = { timeZone: 'Asia/Manila', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
                document.getElementById('clock-display').innerText = now.toLocaleTimeString('en-US', options);
            }
            
            updateDashboard();
            setInterval(updateDashboard, 1000);


            // --- 2. Antigravity Physics Logic ---
            const canvas = document.getElementById('bgCanvas');
            const ctx = canvas.getContext('2d');
            let width, height, dots = [];
            const mouse = { x: -1000, y: -1000 };

            // Parameters (Wider & Bigger)
            const GAP = 50;
            const RADIUS = 2.5;
            const MOUSE_RADIUS = 300;
            const MASS = 1;
            const STIFFNESS = 0.02;
            const DAMPING = 0.90;
            const MOUSE_FORCE = 0.05;

            const colorBase = {r: 203, g: 213, b: 225};
            const colorActive = {r: 0, g: 51, b: 102};

            class Dot {
                constructor(x, y) {
                    this.baseX = x; this.baseY = y;
                    this.x = x; this.y = y;
                    this.vx = 0; this.vy = 0;
                }
                update() {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < MOUSE_RADIUS) {
                        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                        const repulsionX = -(dx / distance) * force * MOUSE_FORCE;
                        const repulsionY = -(dy / distance) * force * MOUSE_FORCE;
                        this.vx += repulsionX; this.vy += repulsionY;
                    }
                    this.vx += (this.baseX - this.x) * STIFFNESS;
                    this.vy += (this.baseY - this.y) * STIFFNESS;
                    this.vx *= DAMPING; this.vy *= DAMPING;
                    this.x += this.vx; this.y += this.vy;
                }
                draw() {
                    const distFromHome = Math.sqrt(Math.pow(this.x - this.baseX, 2) + Math.pow(this.y - this.baseY, 2));
                    let t = Math.min(distFromHome / 40, 1); 
                    const r = Math.round(colorBase.r + (colorActive.r - colorBase.r) * t);
                    const g = Math.round(colorBase.g + (colorActive.g - colorBase.g) * t);
                    const b = Math.round(colorBase.b + (colorActive.b - colorBase.b) * t);
                    ctx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            function init() {
                dots = [];
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
                for (let x = 0; x < width; x += GAP) {
                    for (let y = 0; y < height; y += GAP) {
                        dots.push(new Dot(x, y));
                    }
                }
            }
            function animate() {
                ctx.clearRect(0, 0, width, height);
                dots.forEach(dot => { dot.update(); dot.draw(); });
                requestAnimationFrame(animate);
            }
            window.addEventListener('resize', init);
            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });
            window.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });
            init(); animate();
        </script>
    </body>
    </html>
    `;
};

export const notFoundTemplate = (originalUrl: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 Not Found</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            
            :root {
                --dti-blue: #003366;
                --bg: #f8fafc;
                --text-main: #334155;
                --text-muted: #64748b;
                --border: #e2e8f0;
            }

            body { 
                font-family: 'Inter', sans-serif; 
                background-color: var(--bg);
                color: var(--text-main); 
                display: flex; 
                height: 100vh; 
                align-items: center; 
                justify-content: center; 
                margin: 0;
                overflow: hidden; 
            }

            #bgCanvas {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            }

            .container { 
                text-align: center; 
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(8px);
                padding: 40px;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.5);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 90%;
                z-index: 1;
            }

            h1 { 
                font-size: 6rem; 
                margin: 0; 
                color: rgba(226, 232, 240, 0.8); /* See-through text */
                font-weight: 800; 
                letter-spacing: -4px; 
                user-select: none;
            }

            h2 { 
                margin: -20px 0 15px 0; 
                font-size: 1.5rem; 
                font-weight: 700; 
                color: var(--dti-blue); 
                position: relative;
            }

            p { 
                color: var(--text-muted); 
                line-height: 1.6;
                margin: 0 auto 30px; 
                font-size: 0.95rem;
            }

            .path { 
                font-family: 'Courier New', monospace; 
                color: #dc2626; 
                background: #fee2e2; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 0.85rem;
                word-break: break-all;
            }

            .btn { 
                text-decoration: none; 
                background: var(--dti-blue);
                color: #fff; 
                padding: 12px 24px; 
                border-radius: 6px; 
                font-size: 0.9rem; 
                font-weight: 600;
                transition: all 0.2s; 
                display: inline-block;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }

            .btn:hover { 
                background: #002244; 
                transform: translateY(-1px);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
        </style>
    </head>
    <body>
    <canvas id="bgCanvas"></canvas>
    <div class="container">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The requested route <br><span class="path">${originalUrl}</span><br> does not exist on this server.</p>
            <a href="/" class="btn">Return to Dashboard</a>
        </div>
        
        <script>
            // Antigravity Script
            const canvas = document.getElementById('bgCanvas');
            const ctx = canvas.getContext('2d');
            let width, height, dots = [];
            const mouse = { x: -1000, y: -1000 };

            const GAP = 50; const RADIUS = 2.5; const MOUSE_RADIUS = 300;
            const STIFFNESS = 0.02; const DAMPING = 0.90; const MOUSE_FORCE = 0.05;
            const colorBase = {r: 203, g: 213, b: 225};
            const colorActive = {r: 0, g: 51, b: 102};

            class Dot {
                constructor(x, y) {
                    this.baseX = x; this.baseY = y;
                    this.x = x; this.y = y;
                    this.vx = 0; this.vy = 0;
                }
                update() {
                    let dx = mouse.x - this.x; let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < MOUSE_RADIUS) {
                        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                        this.vx += -(dx / distance) * force * MOUSE_FORCE;
                        this.vy += -(dy / distance) * force * MOUSE_FORCE;
                    }
                    this.vx += (this.baseX - this.x) * STIFFNESS;
                    this.vy += (this.baseY - this.y) * STIFFNESS;
                    this.vx *= DAMPING; this.vy *= DAMPING;
                    this.x += this.vx; this.y += this.vy;
                }
                draw() {
                    const dist = Math.sqrt(Math.pow(this.x-this.baseX,2)+Math.pow(this.y-this.baseY,2));
                    let t = Math.min(dist/40, 1);
                    const r=Math.round(colorBase.r+(colorActive.r-colorBase.r)*t);
                    const g=Math.round(colorBase.g+(colorActive.g-colorBase.g)*t);
                    const b=Math.round(colorBase.b+(colorActive.b-colorBase.b)*t);
                    ctx.fillStyle = \`rgb(\${r},\${g},\${b})\`;
                    ctx.beginPath(); ctx.arc(this.x,this.y,RADIUS,0,Math.PI*2); ctx.fill();
                }
            }
            function init() {
                dots = []; width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight;
                for(let x=0;x<width;x+=GAP) for(let y=0;y<height;y+=GAP) dots.push(new Dot(x,y));
            }
            function animate() { ctx.clearRect(0,0,width,height); dots.forEach(d=> {d.update();d.draw();}); requestAnimationFrame(animate); }
            window.addEventListener('resize', init);
            window.addEventListener('mousemove', e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
            window.addEventListener('mouseleave', ()=>{mouse.x=-1000;mouse.y=-1000;});
            init(); animate();
        </script>
    </body>
    </html>
    `;
};

export const AccessDeniedTemplate = (originalUrl: string) => {
    return `
     <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Access Denied - SayHere</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

                            body { 
                                font-family: 'Inter', sans-serif;
                                display: flex; 
                                justify-content: center; 
                                align-items: center; 
                                height: 100vh; 
                                background-color: #f4f6f8; 
                                margin: 0; 
                                overflow: hidden;
                            }
                            
                            #bgCanvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; }

                            .card { 
                                background: rgba(255, 255, 255, 0.85); /* Glass effect */
                                backdrop-filter: blur(8px);
                                padding: 40px; 
                                border-radius: 12px; 
                                border: 1px solid rgba(255,255,255,0.6);
                                box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
                                text-align: center; 
                                max-width: 420px; 
                                width: 90%; 
                                z-index: 1;
                            }
                            h1 { color: #d32f2f; margin-top: 0; font-size: 24px; font-weight: 700; }
                            p { color: #555; line-height: 1.6; margin-bottom: 20px; }
                            .tag { background: #eee; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #333; }
                            .footer { margin-top: 30px; font-size: 12px; color: #999; }
                        </style>
                    </head>
                    <body>
                        <canvas id="bgCanvas"></canvas>
                        <div class="card">
                            <h1>🚫 Access Denied</h1>
                            <p>You are trying to access a protected API endpoint directly.</p>
                            <p>Route: <span class="tag">${originalUrl}</span></p>
                            <p>This resource requires a valid <strong>Bearer Token</strong>. Please access this via the Mobile App.</p>
                            <div class="footer">SayHere API Gateway</div>
                        </div>

                        <script>
                            // Antigravity Script
                            const canvas = document.getElementById('bgCanvas');
                            const ctx = canvas.getContext('2d');
                            let width, height, dots = [];
                            const mouse = { x: -1000, y: -1000 };

                            const GAP = 50; const RADIUS = 2.5; const MOUSE_RADIUS = 300;
                            const STIFFNESS = 0.02; const DAMPING = 0.90; const MOUSE_FORCE = 0.05;
                            const colorBase = {r: 203, g: 213, b: 225}; // Slate
                            const colorActive = {r: 204, g: 0, b: 0};   // Red for Access Denied

                            class Dot {
                                constructor(x, y) {
                                    this.baseX = x; this.baseY = y;
                                    this.x = x; this.y = y;
                                    this.vx = 0; this.vy = 0;
                                }
                                update() {
                                    let dx = mouse.x - this.x; let dy = mouse.y - this.y;
                                    let distance = Math.sqrt(dx * dx + dy * dy);
                                    if (distance < MOUSE_RADIUS) {
                                        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                                        this.vx += -(dx / distance) * force * MOUSE_FORCE;
                                        this.vy += -(dy / distance) * force * MOUSE_FORCE;
                                    }
                                    this.vx += (this.baseX - this.x) * STIFFNESS;
                                    this.vy += (this.baseY - this.y) * STIFFNESS;
                                    this.vx *= DAMPING; this.vy *= DAMPING;
                                    this.x += this.vx; this.y += this.vy;
                                }
                                draw() {
                                    const dist = Math.sqrt(Math.pow(this.x-this.baseX,2)+Math.pow(this.y-this.baseY,2));
                                    let t = Math.min(dist/40, 1);
                                    const r=Math.round(colorBase.r+(colorActive.r-colorBase.r)*t);
                                    const g=Math.round(colorBase.g+(colorActive.g-colorBase.g)*t);
                                    const b=Math.round(colorBase.b+(colorActive.b-colorBase.b)*t);
                                    ctx.fillStyle = \`rgb(\${r},\${g},\${b})\`;
                                    ctx.beginPath(); ctx.arc(this.x,this.y,RADIUS,0,Math.PI*2); ctx.fill();
                                }
                            }
                            function init() {
                                dots = []; width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight;
                                for(let x=0;x<width;x+=GAP) for(let y=0;y<height;y+=GAP) dots.push(new Dot(x,y));
                            }
                            function animate() { ctx.clearRect(0,0,width,height); dots.forEach(d=> {d.update();d.draw();}); requestAnimationFrame(animate); }
                            window.addEventListener('resize', init);
                            window.addEventListener('mousemove', e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
                            window.addEventListener('mouseleave', ()=>{mouse.x=-1000;mouse.y=-1000;});
                            init(); animate();
                        </script>
                    </body>
                    </html>
                    `;
};

export const welcomeTemplate = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DTI Zambales | SayHere API</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            :root {
                --dti-blue: #003366;
                --dti-red: #cc0000;
                --bg-surface: #f8fafc;
                --card-bg: #ffffff;
                --text-main: #1e293b;
                --text-muted: #64748b;
                --border: #e2e8f0;
            }

            body {
                font-family: 'Inter', sans-serif;
                background-color: var(--bg-surface);
                color: var(--text-main);
                margin: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                overflow-x: hidden;
            }

            /* Physics Canvas */
            #bgCanvas {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
            }

            .container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 1;
                pointer-events: none; /* Let mouse pass through to canvas */
            }

            .card {
                background: rgba(255, 255, 255, 0.9);
                padding: 48px;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 480px;
                width: 100%;
                position: relative;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(226, 232, 240, 0.8);
                pointer-events: auto; /* Re-enable clicks on card */
            }

            .logo-area { margin-bottom: 24px; }
            .logo-img { height: 80px; width: auto; }

            h1 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--dti-blue);
                letter-spacing: -0.025em;
            }

            h2 {
                margin: 5px 0 0 0;
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-muted);
                font-weight: 600;
            }

            .divider {
                height: 1px;
                background: var(--border);
                margin: 24px 0;
                width: 100%;
            }

            .content p {
                color: var(--text-main);
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 30px;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: var(--dti-blue);
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                text-decoration: none;
                transition: all 0.2s;
                width: 100%;
                box-sizing: border-box;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }

            .btn:hover {
                background: #002244;
                transform: translateY(-1px);
            }

            .footer-links {
                margin-top: 24px;
                font-size: 0.8rem;
                color: var(--text-muted);
            }

            .footer-links a {
                color: var(--text-muted);
                text-decoration: none;
                margin: 0 8px;
            }
            .footer-links a:hover {
                color: var(--dti-blue);
                text-decoration: underline;
            }

            .tech-mono {
                font-family: 'Courier New', monospace;
                font-size: 0.8rem;
                background: #f1f5f9;
                padding: 2px 6px;
                border-radius: 4px;
                color: var(--text-muted);
            }
        </style>
    </head>
    <body>
        <canvas id="bgCanvas"></canvas>

        <div class="container">
            <div class="card">
                <div class="logo-area">
                </div>
                
                <h1>DTI ZAMBALES</h1>
                <h2>SayHere API Gateway</h2>
                
                <div class="divider"></div>

                <div class="content">
                    <p>Welcome to the <strong>SayHere</strong> backend services. This API provides the digital infrastructure for DTI Zambales enterprise monitoring and data integration.</p>
                </div>

                <a href="/v1/api/health" class="btn">Run System Diagnostics &rarr;</a>

                <div class="footer-links">
                    <span class="tech-mono">v1.0.0</span> &bull; 
                    <a href="#">API Docs</a> &bull; 
                    <a href="#">Support</a>
                </div>
            </div>
        </div>

        <script>
            const canvas = document.getElementById('bgCanvas');
            const ctx = canvas.getContext('2d');

            let width, height;
            let dots = [];

            // --- PHYSICS PARAMETERS ---
            const GAP = 50;           // Grid spacing
            const RADIUS = 1.5;       // Dot size
            const MOUSE_RADIUS = 500; // Influence area
            const MASS = 1;           // Heavy dots move slower
            const STIFFNESS = 0.03;   // Spring strength (Hooke's law)
            const DAMPING = 0.6;     // Friction (0.90 = slippery, 0.6 = mud)
            const MOUSE_FORCE = 1;  // Repulsion strength
            
            // Brand Colors
            const colorBase = {r: 203, g: 213, b: 225}; // Slate-300 (#cbd5e1)
            const colorActive = {r: 0, g: 51, b: 102};  // DTI Blue (#003366)
            
            const mouse = { x: -1000, y: -1000 };

            class Dot {
                constructor(x, y) {
                    this.baseX = x; // Anchor position (Resting point)
                    this.baseY = y;
                    this.x = x;     // Current position
                    this.y = y;
                    this.vx = 0;    // Velocity X
                    this.vy = 0;    // Velocity Y
                }

                update() {
                    // 1. Calculate distance to mouse
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    // 2. Repulsion Force (Inverse Square Law roughly)
                    // If mouse is close, push dot away
                    if (distance < MOUSE_RADIUS) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                        
                        // F = ma -> a = F/m (Push away negative)
                        const repulsionX = -forceDirectionX * force * MOUSE_FORCE;
                        const repulsionY = -forceDirectionY * force * MOUSE_FORCE;

                        this.vx += repulsionX;
                        this.vy += repulsionY;
                    }

                    // 3. Spring Force (Hooke's Law: F = -kx)
                    // Pulls dot back to base position
                    const springX = (this.baseX - this.x) * STIFFNESS;
                    const springY = (this.baseY - this.y) * STIFFNESS;

                    this.vx += springX;
                    this.vy += springY;

                    // 4. Damping (Friction)
                    this.vx *= DAMPING;
                    this.vy *= DAMPING;

                    // 5. Update Position
                    this.x += this.vx;
                    this.y += this.vy;
                }

                draw() {
                    // Color interpolation based on displacement
                    // Calculate how far dot is from home
                    const distFromHome = Math.sqrt(
                        Math.pow(this.x - this.baseX, 2) + 
                        Math.pow(this.y - this.baseY, 2)
                    );
                    
                    // Normalize displacement (0 to 1) for color blending
                    let t = Math.min(distFromHome / 40, 1); 

                    // Linear Interpolation (Lerp) for RGB
                    const r = Math.round(colorBase.r + (colorActive.r - colorBase.r) * t);
                    const g = Math.round(colorBase.g + (colorActive.g - colorBase.g) * t);
                    const b = Math.round(colorBase.b + (colorActive.b - colorBase.b) * t);

                    ctx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
                    
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            function init() {
                dots = [];
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;

                // Create grid
                for (let x = 0; x < width; x += GAP) {
                    for (let y = 0; y < height; y += GAP) {
                        dots.push(new Dot(x, y));
                    }
                }
            }

            function animate() {
                ctx.clearRect(0, 0, width, height);
                
                dots.forEach(dot => {
                    dot.update();
                    dot.draw();
                });

                requestAnimationFrame(animate);
            }

            window.addEventListener('resize', init);
            
            window.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            });

            // If mouse leaves, hide influence
            window.addEventListener('mouseleave', () => {
                mouse.x = -1000;
                mouse.y = -1000;
            });

            init();
            animate();
        </script>
    </body>
    </html>
    `;
};
