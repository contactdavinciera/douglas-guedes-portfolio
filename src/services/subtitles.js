/**
 * Auto Subtitling Service
 * Uses Web Speech API + Whisper.cpp (WASM) for transcription
 */

class SubtitleService {
  constructor() {
    this.recognition = null;
    this.isRecognizing = false;
    this.segments = [];
    this.onTranscriptCallback = null;
  }

  /**
   * Initialize Speech Recognition
   */
  initialize() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('Speech Recognition not supported, will use Whisper API');
        return false;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-BR'; // Default Portuguese

      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const confidence = event.results[last][0].confidence;
        const isFinal = event.results[last].isFinal;

        if (this.onTranscriptCallback) {
          this.onTranscriptCallback({
            text: transcript,
            confidence,
            isFinal,
            timestamp: Date.now()
          });
        }

        if (isFinal) {
          this.segments.push({
            text: transcript,
            confidence,
            timestamp: Date.now()
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      console.log('✅ Speech Recognition initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Speech Recognition:', error);
      return false;
    }
  }

  /**
   * Start transcription from audio
   */
  async transcribeAudio(audioFile, options = {}) {
    const {
      language = 'pt-BR',
      onProgress,
      onSegment
    } = options;

    try {
      // Use Whisper API for better accuracy
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('language', language);
      formData.append('model', 'base'); // tiny, base, small, medium, large

      const response = await fetch('/api/subtitles/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      
      // Format segments
      const segments = result.segments.map(seg => ({
        id: seg.id,
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        confidence: seg.confidence || 0.95
      }));

      this.segments = segments;
      
      console.log(`✅ Transcription complete: ${segments.length} segments`);
      return segments;

    } catch (error) {
      console.error('Transcription error:', error);
      
      // Fallback to browser Speech Recognition
      return this.transcribeWithBrowserAPI(audioFile, options);
    }
  }

  /**
   * Fallback: Browser Speech Recognition
   */
  async transcribeWithBrowserAPI(audioFile, options) {
    const { onProgress, onSegment } = options;

    // Play audio and record speech
    const audio = new Audio(URL.createObjectURL(audioFile));
    
    this.segments = [];
    this.onTranscriptCallback = (result) => {
      if (result.isFinal && onSegment) {
        onSegment({
          text: result.text,
          start: audio.currentTime - 5, // Approximate
          end: audio.currentTime,
          confidence: result.confidence
        });
      }
    };

    if (this.recognition) {
      this.recognition.start();
      audio.play();

      await new Promise((resolve) => {
        audio.onended = () => {
          this.recognition.stop();
          resolve();
        };
      });
    }

    return this.segments;
  }

  /**
   * Export to SRT format
   */
  exportSRT(segments = this.segments) {
    let srt = '';
    
    segments.forEach((seg, index) => {
      const startTime = this.formatSRTTime(seg.start);
      const endTime = this.formatSRTTime(seg.end);
      
      srt += `${index + 1}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${seg.text}\n\n`;
    });

    return srt;
  }

  /**
   * Export to VTT format
   */
  exportVTT(segments = this.segments) {
    let vtt = 'WEBVTT\n\n';
    
    segments.forEach((seg, index) => {
      const startTime = this.formatVTTTime(seg.start);
      const endTime = this.formatVTTTime(seg.end);
      
      vtt += `${index + 1}\n`;
      vtt += `${startTime} --> ${endTime}\n`;
      vtt += `${seg.text}\n\n`;
    });

    return vtt;
  }

  /**
   * Export to JSON
   */
  exportJSON(segments = this.segments) {
    return JSON.stringify({
      language: 'pt-BR',
      segments: segments
    }, null, 2);
  }

  /**
   * Format time for SRT (00:00:00,000)
   */
  formatSRTTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * Format time for VTT (00:00:00.000)
   */
  formatVTTTime(seconds) {
    return this.formatSRTTime(seconds).replace(',', '.');
  }

  /**
   * Auto-translate subtitles
   */
  async translateSubtitles(segments, targetLanguage) {
    try {
      const response = await fetch('/api/subtitles/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments,
          targetLanguage
        })
      });

      const result = await response.json();
      return result.translatedSegments;
      
    } catch (error) {
      console.error('Translation error:', error);
      return segments;
    }
  }

  /**
   * Apply subtitle styling
   */
  applyStyle(segments, style) {
    return segments.map(seg => ({
      ...seg,
      style: {
        fontFamily: style.fontFamily || 'Arial',
        fontSize: style.fontSize || 48,
        color: style.color || '#FFFFFF',
        backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.8)',
        outlineColor: style.outlineColor || '#000000',
        outlineWidth: style.outlineWidth || 2,
        position: style.position || 'bottom',
        alignment: style.alignment || 'center'
      }
    }));
  }

  /**
   * Generate burnt-in subtitles (hardcoded)
   */
  async burnSubtitles(videoFile, segments, style) {
    // This would use FFmpeg in the backend
    const response = await fetch('/api/subtitles/burn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: videoFile.id,
        segments,
        style
      })
    });

    return await response.json();
  }
}

/**
 * Subtitle presets for popular platforms
 */
export const subtitlePresets = {
  'tiktok': {
    fontFamily: 'Montserrat Bold',
    fontSize: 64,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0)',
    outlineColor: '#000000',
    outlineWidth: 6,
    position: 'center',
    alignment: 'center',
    animation: 'word-by-word'
  },
  'instagram': {
    fontFamily: 'Helvetica Neue',
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.7)',
    outlineColor: 'transparent',
    outlineWidth: 0,
    position: 'bottom',
    alignment: 'center',
    padding: 20
  },
  'youtube': {
    fontFamily: 'Roboto',
    fontSize: 48,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.8)',
    outlineColor: 'transparent',
    outlineWidth: 0,
    position: 'bottom',
    alignment: 'center'
  },
  'netflix': {
    fontFamily: 'Netflix Sans',
    fontSize: 52,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.9)',
    outlineColor: 'transparent',
    outlineWidth: 0,
    position: 'bottom',
    alignment: 'center'
  }
};

export default SubtitleService;
