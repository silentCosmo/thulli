export default class EmotionEngine {
constructor({ base = 'neutral', intensity = 0.1, decay = 0.01 } = {}) {
this.base = base;
this.intensity = intensity;
this.decay = decay;
this.recentTriggers = [];
}


nudge(emotion, weight = 0.2) {
this.recentTriggers.push({ emotion, weight, time: Date.now() });
if (this.base === emotion) {
this.intensity = Math.min(1, this.intensity + weight);
} else {
// simple blend: if intensity low, switch base; otherwise slightly move toward new
if (this.intensity < 0.25) this.base = emotion;
this.intensity = Math.max(0, Math.min(1, this.intensity * 0.6 + weight * 0.4));
}
this._cleanup();
}


tick() {
this.intensity = Math.max(0, this.intensity - this.decay);
if (this.intensity < 0.1) this.base = 'neutral';
}


getState() {
return { base: this.base, intensity: Number(this.intensity.toFixed(2)) };
}


_cleanup() {
if (this.recentTriggers.length > 100) this.recentTriggers.shift();
}
}