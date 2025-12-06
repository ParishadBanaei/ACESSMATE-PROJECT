const SVG_TO_METER = 0.5;
const WALK_SPEED = 1.2; // m/s

const steps = [
    { el: document.getElementById('S1'), text: "Exit the elevator and move slightly up the corridor.", zoom: {w:350,h:245} },
    { el: document.getElementById('S2'), text: "Turn right and continue along the corridor.", zoom: {w:380,h:265} },
    { el: document.getElementById('S3'), text: "Turn left to reach the accessible restroom.", zoom: {w:360,h:250} }
];

let totalDistance = 0;
steps.forEach(step => {
    step.length = step.el.getTotalLength();
    step.distance = step.length * SVG_TO_METER;
    step.el.style.strokeDasharray = step.length;
    step.el.style.strokeDashoffset = step.length;
    totalDistance += step.distance;
});

const totalTime = Math.max(1, Math.round(totalDistance / WALK_SPEED / 60));

let running = false, paused = false;
let cumulativeDistance = 0;

const marker = document.getElementById('markerGroup');
const distanceLabel = document.getElementById('distance');
const timeLabel = document.getElementById('time');
const svg = document.getElementById('svgMap');
const instructionEl = document.getElementById('instruction');

const firstPos = steps[0].el.getPointAtLength(0);
marker.setAttribute('transform', `translate(${firstPos.x},${firstPos.y})`);

function speakText(text) {
    return new Promise(resolve => {
        if (!('speechSynthesis' in window)) { resolve(); return; }
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.0;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        speechSynthesis.speak(u);
    });
}

function smoothZoomIn(targetZoom, duration = 1200) {
    return new Promise(resolve => {
        const [sx, sy, sw, sh] = svg.getAttribute('viewBox').split(' ').map(Number);
        let start = null;
        function frame(ts) {
            if (!start) start = ts;
            const t = Math.min(1, (ts - start) / duration);
            const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const x = sx + (targetZoom.x - sx) * e;
            const y = sy + (targetZoom.y - sy) * e;
            const w = sw + (targetZoom.w - sw) * e;
            const h = sh + (targetZoom.h - sh) * e;
            svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
            if (t < 1) requestAnimationFrame(frame);
            else resolve();
        }
        requestAnimationFrame(frame);
    });
}

function animateAlong(path, step, duration = 2000) {
    return new Promise(resolve => {
        const total = step.length;
        path.classList.add('active');
        let start = null;
        function frame(ts) {
            if (!start) start = ts;
            const t = Math.min(1, (ts - start) / duration);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const pt = path.getPointAtLength(eased * total);
            marker.setAttribute('transform', `translate(${pt.x},${pt.y})`);
            path.style.strokeDashoffset = total * (1 - eased);

            const zoomWidth = step.zoom.w;
            const zoomHeight = step.zoom.h;
            const x = pt.x - zoomWidth / 2;
            const y = pt.y - zoomHeight / 2;
            svg.setAttribute('viewBox', `${x} ${y} ${zoomWidth} ${zoomHeight}`);

            const traveled = cumulativeDistance + (step.distance * eased);
            const remaining = Math.max(0, Math.round(totalDistance - traveled));
            const remainingTime = Math.max(0, Math.round((totalDistance - traveled) / WALK_SPEED / 60));
            distanceLabel.innerText = `Distance: ${remaining} m`;
            timeLabel.innerText = `Est. Time: ${remainingTime} min`;

            if (t < 1) requestAnimationFrame(frame);
            else {
                path.classList.remove('active');
                cumulativeDistance += step.distance;
                resolve();
            }
        }
        requestAnimationFrame(frame);
    });
}

function smoothZoomOut(duration = 1000) {
    return new Promise(resolve => {
        const [sx, sy, sw, sh] = svg.getAttribute('viewBox').split(' ').map(Number);
        let start = null;
        function frame(ts) {
            if (!start) start = ts;
            const t = Math.min(1, (ts - start) / duration);
            for (let e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t, x = sx + (0 - sx) * e, y = sy + (0 - sy) * e, w = sw + (1000 - sw) * e, h = sh + (700 - sh) * e; t < 1;) {
                svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
                if (t < 1) requestAnimationFrame(frame);
                else resolve();
                return;
            }
            resolve();
        }
        requestAnimationFrame(frame);
    });
}

async function runGuidance() {
    if (running) return;
    running = true; paused = false;
    cumulativeDistance = 0;
    distanceLabel.innerText = `Distance: ${Math.round(totalDistance)} m`;
    timeLabel.innerText = `Est. Time: ${totalTime} min`;

    const firstZoom = steps[0].zoom;
    await smoothZoomIn({x: firstPos.x - firstZoom.w/2, y: firstPos.y - firstZoom.h/2, w: firstZoom.w, h: firstZoom.h}, 1200);

    for (let i = 0; i < steps.length; i++) {
        instructionEl.innerText = steps[i].text;
        await speakText(steps[i].text);
        await animateAlong(steps[i].el, steps[i]);
        while (paused) await new Promise(r => setTimeout(r, 200));
    }

    instructionEl.innerText = "You have arrived at the accessible restroom.";
    distanceLabel.innerText = "Distance: 0 m";
    timeLabel.innerText = "Est. Time: 0 min";
    await speakText("You have arrived at the accessible restroom.");
    await smoothZoomOut(1000);
    running = false;
}

// Button events
document.getElementById('startBtn').addEventListener('click', () => runGuidance());
document.getElementById('pauseBtn').addEventListener('click', () => {
    paused = true;
    speechSynthesis.pause();
    instructionEl.innerText = 'Paused';
});
document.getElementById('resumeBtn').addEventListener('click', () => {
    paused = false;
    speechSynthesis.resume();
    instructionEl.innerText = 'Resuming...';
});
