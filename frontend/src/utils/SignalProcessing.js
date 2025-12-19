export class PPGSignalProcessor {
  constructor() {
    this.buffer = [];
    this.windowSize = 300; // Keep last 300 samples (at 30fps = 10s)
    this.samplingRate = 30; // Hz
  }

  // Add a brightness value (average red channel intensity)
  addSample(value) {
    this.buffer.push(value);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
  }

  // Calculate heart rate using simple peak detection
  calculateHeartRate() {
    if (this.buffer.length < this.samplingRate * 3) {
      return 0; // Need at least 3 seconds of data
    }

    const data = this.smooth(this.buffer);
    const peaks = this.findPeaks(data);
    
    if (peaks.length < 2) return 0;

    // Calculate intervals between peaks (in samples)
    let totalInterval = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalInterval += (peaks[i] - peaks[i-1]);
    }
    const avgInterval = totalInterval / (peaks.length - 1);
    
    // Convert to BPM: (SamplingRate / SamplesPerBeat) * 60
    const bpm = (this.samplingRate / avgInterval) * 60;
    
    // Sanity check
    if (bpm < 40 || bpm > 200) return 0;
    
    return Math.round(bpm);
  }

  // Simple moving average smoothing
  smooth(data) {
    const smoothed = [];
    const window = 5;
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - window); j <= Math.min(data.length - 1, i + window); j++) {
        sum += data[j];
        count++;
      }
      smoothed.push(sum / count);
    }
    return smoothed;
  }

  // Find local maxima
  findPeaks(data) {
    const peaks = [];
    // Need a dynamic threshold based on recent signal amplitude
    // For simplicity, we check if a point is higher than neighbors
    for (let i = 2; i < data.length - 2; i++) {
      if (data[i] > data[i-1] && 
          data[i] > data[i-2] && 
          data[i] > data[i+1] && 
          data[i] > data[i+2]) {
        peaks.push(i);
      }
    }
    return peaks;
  }
  
  reset() {
    this.buffer = [];
  }
}
