/**
 * WebCodecs API - Hardware-accelerated video decoding
 * Supports H.264, H.265/HEVC, VP9, AV1
 */

class VideoDecoderService {
  constructor() {
    this.decoder = null;
    this.isInitialized = false;
    this.frameQueue = [];
    this.currentFrame = null;
    this.isPlaying = false;
    this.frameRate = 24;
    this.onFrameCallback = null;
  }

  /**
   * Initialize decoder with video config
   */
  async initialize(config) {
    try {
      // Check WebCodecs support
      if (!('VideoDecoder' in window)) {
        throw new Error('WebCodecs not supported in this browser');
      }

      // Create decoder
      this.decoder = new VideoDecoder({
        output: (frame) => {
          this.frameQueue.push(frame);
          if (this.onFrameCallback) {
            this.onFrameCallback(frame);
          }
        },
        error: (e) => {
          console.error('Decoder error:', e);
        }
      });

      // Configure decoder
      const decoderConfig = {
        codec: config.codec || 'avc1.64001f', // H.264 High Profile
        codedWidth: config.width || 1920,
        codedHeight: config.height || 1080,
        hardwareAcceleration: 'prefer-hardware',
        optimizeForLatency: true
      };

      // Check if config is supported
      const support = await VideoDecoder.isConfigSupported(decoderConfig);
      if (!support.supported) {
        throw new Error(`Codec ${config.codec} not supported`);
      }

      this.decoder.configure(decoderConfig);
      this.isInitialized = true;
      
      console.log('✅ VideoDecoder initialized:', decoderConfig);
      return true;
    } catch (error) {
      console.error('Failed to initialize VideoDecoder:', error);
      return false;
    }
  }

  /**
   * Decode video chunk
   */
  decode(chunk, timestamp) {
    if (!this.isInitialized || !this.decoder) {
      console.warn('Decoder not initialized');
      return;
    }

    try {
      const encodedChunk = new EncodedVideoChunk({
        type: chunk.type || 'key',
        timestamp: timestamp * 1000000, // Convert to microseconds
        duration: (1 / this.frameRate) * 1000000,
        data: chunk.data
      });

      this.decoder.decode(encodedChunk);
    } catch (error) {
      console.error('Decode error:', error);
    }
  }

  /**
   * Get next frame from queue
   */
  getNextFrame() {
    if (this.frameQueue.length > 0) {
      // Close previous frame
      if (this.currentFrame) {
        this.currentFrame.close();
      }
      this.currentFrame = this.frameQueue.shift();
      return this.currentFrame;
    }
    return null;
  }

  /**
   * Render frame to canvas
   */
  renderFrame(canvas, frame) {
    if (!frame) return;

    const ctx = canvas.getContext('2d');
    canvas.width = frame.displayWidth;
    canvas.height = frame.displayHeight;
    
    ctx.drawImage(frame, 0, 0);
  }

  /**
   * Start playback
   */
  play(onFrame) {
    this.isPlaying = true;
    this.onFrameCallback = onFrame;
    this.playbackLoop();
  }

  /**
   * Playback loop at specified frame rate
   */
  playbackLoop() {
    if (!this.isPlaying) return;

    const frame = this.getNextFrame();
    if (frame && this.onFrameCallback) {
      this.onFrameCallback(frame);
    }

    // Schedule next frame
    setTimeout(() => {
      this.playbackLoop();
    }, 1000 / this.frameRate);
  }

  /**
   * Pause playback
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Seek to specific time
   */
  async seek(time) {
    // Flush decoder
    await this.decoder.flush();
    this.frameQueue = [];
    
    // TODO: Implement seeking logic
    console.log('Seek to:', time);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.decoder) {
      this.decoder.close();
      this.decoder = null;
    }
    
    // Close all frames
    this.frameQueue.forEach(frame => frame.close());
    if (this.currentFrame) {
      this.currentFrame.close();
    }
    
    this.frameQueue = [];
    this.currentFrame = null;
    this.isInitialized = false;
  }
}

/**
 * Detect codec from file
 */
export const detectCodec = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  
  const codecMap = {
    'mp4': 'avc1.64001f',  // H.264
    'mov': 'avc1.64001f',  // H.264
    'm4v': 'avc1.64001f',  // H.264
    'hevc': 'hev1.1.6.L120.B0', // H.265
    'h265': 'hev1.1.6.L120.B0', // H.265
    'webm': 'vp09.00.10.08', // VP9
    'av1': 'av01.0.04M.08'  // AV1
  };

  return codecMap[extension] || 'avc1.64001f';
};

/**
 * Parse MP4 file and extract metadata
 */
export const parseMP4Metadata = async (file) => {
  const arrayBuffer = await file.slice(0, 10000).arrayBuffer();
  const view = new DataView(arrayBuffer);
  
  // Simple MP4 parser (ftyp, moov boxes)
  let offset = 0;
  const metadata = {
    width: 1920,
    height: 1080,
    frameRate: 24,
    duration: 0,
    codec: 'avc1.64001f'
  };

  // TODO: Implement full MP4 parser
  // For now, return defaults
  
  return metadata;
};

export default VideoDecoderService;
