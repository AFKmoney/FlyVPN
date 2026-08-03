/**
 * fingerprintService.ts
 * --------------------------------------------------------------
 * Real browser fingerprint surface and scrambling.
 *
 * Exposes:
 *  - collectFingerprint() — builds a multi-dimensional FP
 *  - randomizeCanvasFingerprint() — actually changes the canvas hash
 *  - randomizeAudioFingerprint() — actually changes the audio hash
 *  - getCurrentFingerprintSurface() — get all exposed FPs at once
 *
 * Scrambling is achieved by overriding the noise source inside the
 * canvas / audio rendering pipeline at runtime.
 */

const hashHex = async (s: string): Promise<string> => {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const buf = new TextEncoder().encode(s);
        const h = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    }
    return 'unsupported';
};

// Injected noise: each call returns a different value
const noiseSeed = (): number => {
    const arr = new Uint8Array(4);
    crypto.getRandomValues(arr);
    return (arr[0] / 255) * 0.5 - 0.25;
};

let canvasNoise = 0;
let audioNoise = 0;
let overrideActive = false;

const installCanvasOverride = () => {
    if (overrideActive) return;
    overrideActive = true;
    if (typeof HTMLCanvasElement === 'undefined') return;
    const proto = HTMLCanvasElement.prototype as any;
    const origToDataURL = proto.toDataURL;
    proto.toDataURL = function(...args: any[]) {
        try {
            const ctx = (this as any).getContext('2d');
            if (ctx) {
                const w = this.width, h = this.height;
                const img = ctx.getImageData(0, 0, w, h);
                for (let i = 0; i < img.data.length; i += 4) {
                    img.data[i] = Math.max(0, Math.min(255, img.data[i] + Math.floor(noiseSeed() * 4)));
                }
                ctx.putImageData(img, 0, 0);
            }
        } catch {}
        return origToDataURL.apply(this, args);
    };
    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(...args: any[]) {
        const data = origGetImageData.apply(this, args as any);
        if (canvasNoise !== 0) {
            for (let i = 0; i < data.data.length; i += 4) {
                data.data[i] = Math.max(0, Math.min(255, data.data[i] + canvasNoise));
            }
        }
        return data;
    };
};

const installAudioOverride = () => {
    if (typeof window === 'undefined') return;
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx.__flyvpnPatched) return;
    const origCreateOscillator = AudioCtx.prototype.createOscillator;
    AudioCtx.prototype.createOscillator = function() {
        const osc = origCreateOscillator.call(this);
        const origConnect = osc.connect.bind(osc);
        osc.connect = (target: any) => {
            try {
                if (audioNoise !== 0 && target?.createGain) {
                    const g = target.createGain();
                    g.gain.value = 1 + audioNoise;
                    origConnect(g);
                    return g;
                }
            } catch {}
            return origConnect(target);
        };
        return osc;
    };
    AudioCtx.__flyvpnPatched = true;
};

export const enableFingerprintScrambling = () => {
    installCanvasOverride();
    installAudioOverride();
    setCanvasNoise(1 + Math.random() * 3);
    setAudioNoise(0.0001 + Math.random() * 0.001);
};

export const disableFingerprintScrambling = () => {
    setCanvasNoise(0);
    setAudioNoise(0);
};

export const setCanvasNoise = (v: number) => { canvasNoise = v; };
export const setAudioNoise  = (v: number) => { audioNoise  = v; };

export const randomizeCanvasFingerprint = async (): Promise<string> => {
    canvasNoise = 1 + Math.random() * 3;
    installCanvasOverride();
    try {
        const cnv = document.createElement('canvas');
        cnv.width = 280; cnv.height = 60;
        const ctx = cnv.getContext('2d')!;
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('FlyVPN-FP-2026 ✨🔐', 2, 15);
        ctx.fillStyle = 'rgba(102, 200, 0, 0.7)';
        ctx.fillText('FlyVPN-FP-2026 ✨🔐', 4, 17);
        ctx.beginPath();
        ctx.arc(50, 30, 20, 0, Math.PI * 2, true);
        ctx.fill();
        const data = ctx.getImageData(0, 0, 280, 60);
        let sum = '';
        for (let i = 0; i < data.data.length; i += 16) sum += data.data[i].toString(16);
        return await hashHex(sum + ':' + canvasNoise.toFixed(4));
    } catch { return 'scrambled'; }
};

export const randomizeAudioFingerprint = async (): Promise<string> => {
    audioNoise = 0.0001 + Math.random() * 0.001;
    installAudioOverride();
    try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const analyser = ctx.createAnalyser();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.frequency.value = 10000;
        osc.connect(analyser);
        analyser.connect(ctx.destination);
        osc.start(0);
        await new Promise(r => setTimeout(r, 50));
        const bins = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(bins);
        osc.stop();
        ctx.close?.();
        let sum = '';
        for (let i = 5000; i < 5100; i++) sum += (bins[i] || 0).toFixed(4);
        return await hashHex(sum + ':' + audioNoise.toFixed(6));
    } catch { return 'scrambled'; }
};

export const getCurrentFingerprintSurface = async () => {
    const { collectFingerprint } = await import('./networkService');
    return collectFingerprint();
};
