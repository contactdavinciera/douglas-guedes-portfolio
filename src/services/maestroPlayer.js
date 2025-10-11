/**
 * MAESTRO PLAYER
 * Professional playback engine with hybrid mode
 * 
 * Modes:
 * - Stream: Fast preview using Cloudflare Stream
 * - Local: Frame-accurate using WebCodecs + IndexedDB cache
 * - Hybrid: Start with stream, download in background
 */

class MaestroPlayer {
  constructor() {
    this.mode = 'hybrid'; // 'stream' | 'local' | 'hybrid'
    this.currentPlayer = null;
    this.cache = null; // IndexedDB instance
    this.decoder = null; // WebCodecs decoder
    this.fps = 24; // Default FPS
    this.isPlaying = false;
    this.currentTime = 0;
    
    this.initCache();
  }

  /**
   * Initialize IndexedDB cache
   */
  async initCache() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MaestroMediaCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.cache = request.result;
        console.log('✅ Maestro cache initialized');
        resolve(this.cache);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Load clip for playback
   */
  async loadClip(clipId, mediaFile) {
    console.log(`🎬 Loading clip ${clipId} in ${this.mode} mode`);
    
    switch (this.mode) {
      case 'stream':
        return await this.loadFromStream(mediaFile);
      case 'local':
        return await this.loadFromCache(clipId, mediaFile);
      case 'hybrid':
        return await this.loadHybrid(clipId, mediaFile);
      default:
        throw new Error(`Unknown mode: ${this.mode}`);
    }
  }

  /**
   * STREAM MODE
   * Fast preview using HLS from Cloudflare Stream
   */
  async loadFromStream(mediaFile) {
    console.log('📺 Loading from Stream:', mediaFile.streamUID);
    
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    
    // Use HLS manifest
    const manifestURL = mediaFile.playbackURL || 
      `https://customer-${mediaFile.streamUID}.cloudflarestream.com/${mediaFile.streamUID}/manifest/video.m3u8`;
    
    // Load HLS (browser native or hls.js fallback)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifestURL;
    } else if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(manifestURL);
      hls.attachMedia(video);
    } else {
      throw new Error('HLS not supported');
    }
    
    return {
      type: 'stream',
      element: video,
      seek: (time) => { video.currentTime = time; },
      play: () => video.play(),
      pause: () => video.pause(),
      getCurrentTime: () => video.currentTime,
      getDuration: () => video.duration,
      destroy: () => {
        video.pause();
        video.src = '';
      }
    };
  }

  /**
   * LOCAL MODE
   * Frame-accurate playback using WebCodecs
   */
  async loadFromCache(clipId, mediaFile) {
    console.log('💾 Loading from cache:', clipId);
    
    // Check if cached
    let cachedData = await this.getCachedMedia(clipId);
    
    if (!cachedData) {
      console.log('📥 Not cached, downloading...');
      // Download proxy from R2 or Stream
      const proxyURL = mediaFile.proxyURL || mediaFile.playbackURL;
      cachedData = await this.downloadAndCache(clipId, proxyURL);
    }
    
    // Initialize WebCodecs decoder
    const decoder = await this.initDecoder(cachedData, mediaFile);
    
    return {
      type: 'local',
      decoder,
      seek: (time) => this.seekToFrame(decoder, time),
      play: () => this.playDecoded(decoder),
      pause: () => this.pauseDecoded(),
      getFrame: (time) => this.decodeFrameAt(decoder, time),
      getCurrentTime: () => this.currentTime,
      getDuration: () => mediaFile.duration,
      destroy: () => {
        if (decoder) decoder.close();
      }
    };
  }

  /**
   * HYBRID MODE
   * Start with stream, download in background
   */
  async loadHybrid(clipId, mediaFile) {
    console.log('🔀 Hybrid mode: Stream + Background download');
    
    // Start with stream for instant playback
    const streamPlayer = await this.loadFromStream(mediaFile);
    
    // Download in background
    this.downloadInBackground(clipId, mediaFile).then(() => {
      console.log('✅ Background download complete, can switch to local mode');
    });
    
    return streamPlayer;
  }

  /**
   * Download and cache media
   */
  async downloadAndCache(clipId, url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Store in IndexedDB
    await this.cacheMedia(clipId, arrayBuffer);
    
    return arrayBuffer;
  }

  /**
   * Download in background (no await)
   */
  downloadInBackground(clipId, mediaFile) {
    const proxyURL = mediaFile.proxyURL || mediaFile.playbackURL;
    return this.downloadAndCache(clipId, proxyURL);
  }

  /**
   * Cache media in IndexedDB
   */
  async cacheMedia(clipId, arrayBuffer) {
    if (!this.cache) await this.initCache();
    
    return new Promise((resolve, reject) => {
      const transaction = this.cache.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      
      const request = store.put({
        id: clipId,
        data: arrayBuffer,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => {
        console.log('✅ Cached:', clipId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached media from IndexedDB
   */
  async getCachedMedia(clipId) {
    if (!this.cache) await this.initCache();
    
    return new Promise((resolve, reject) => {
      const transaction = this.cache.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const request = store.get(clipId);
      
      request.onsuccess = () => {
        if (request.result) {
          console.log('✅ Found in cache:', clipId);
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Initialize WebCodecs decoder
   */
  async initDecoder(arrayBuffer, mediaFile) {
    // This is a simplified version
    // Real implementation would parse MP4/container format
    
    const decoder = new VideoDecoder({
      output: (frame) => {
        // Frame decoded, can be rendered to canvas
        this.currentFrame = frame;
      },
      error: (e) => {
        console.error('Decoder error:', e);
      }
    });
    
    // Configure decoder (would need actual codec config from file)
    decoder.configure({
      codec: 'avc1.64001f', // H.264 High Profile
      codedWidth: mediaFile.width || 1920,
      codedHeight: mediaFile.height || 1080,
      hardwareAcceleration: 'prefer-hardware'
    });
    
    return decoder;
  }

  /**
   * Seek to specific frame
   */
  async seekToFrame(decoder, timeInSeconds) {
    const frameNumber = Math.floor(timeInSeconds * this.fps);
    console.log(`🎯 Seeking to frame ${frameNumber} (${timeInSeconds}s)`);
    
    // Would decode from keyframe to target frame
    // Simplified for now
    this.currentTime = timeInSeconds;
    
    return frameNumber;
  }

  /**
   * Decode frame at specific time
   */
  async decodeFrameAt(decoder, timeInSeconds) {
    await this.seekToFrame(decoder, timeInSeconds);
    return this.currentFrame;
  }

  /**
   * Play with decoded frames
   */
  playDecoded(decoder) {
    this.isPlaying = true;
    this.playbackLoop();
  }

  /**
   * Pause decoded playback
   */
  pauseDecoded() {
    this.isPlaying = false;
  }

  /**
   * Playback loop for decoded frames
   */
  playbackLoop() {
    if (!this.isPlaying) return;
    
    const frameTime = 1000 / this.fps;
    
    setTimeout(() => {
      this.currentTime += 1 / this.fps;
      // Decode and render next frame
      this.playbackLoop();
    }, frameTime);
  }

  /**
   * Switch playback mode
   */
  setMode(mode) {
    if (['stream', 'local', 'hybrid'].includes(mode)) {
      this.mode = mode;
      console.log(`🔄 Switched to ${mode} mode`);
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    if (!this.cache) return;
    
    const transaction = this.cache.transaction(['media'], 'readwrite');
    const store = transaction.objectStore('media');
    await store.clear();
    
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache size
   */
  async getCacheSize() {
    if (!this.cache) return 0;
    
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage;
    }
    return 0;
  }
}

export default MaestroPlayer;
