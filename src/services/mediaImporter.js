/**
 * MAESTRO MEDIA IMPORTER
 * Intelligent media upload with codec detection and routing
 * 
 * Flow:
 * 1. Analyze file (codec, colorspace, resolution)
 * 2. Route to Stream (proxy-ready) or R2+Transcode (RAW)
 * 3. Return media metadata for timeline
 */

import { API_BASE_URL } from '@/config/api';

// Supported formats
const PROXY_READY_CODECS = ['h264', 'avc1', 'avc'];
const RAW_FORMATS = ['braw', 'r3d', 'ari', 'dng', 'raw'];
const PROXY_COLORSPACES = ['rec709', 'srgb', 'bt709'];

/**
 * Main import function
 */
export async function importMedia(file) {
  console.log('🎬 Maestro: Starting media import...', file.name);
  
  // 1. Analyze file
  const metadata = await analyzeFile(file);
  console.log('📊 Media analysis:', metadata);
  
  // 2. Route based on codec
  if (isProxyReady(metadata)) {
    console.log('✅ Proxy-ready detected → Direct to Stream');
    return await uploadToStream(file, metadata);
  } else {
    console.log('⚙️ RAW format detected → R2 + Transcode');
    return await uploadToR2AndTranscode(file, metadata);
  }
}

/**
 * Analyze video file to extract codec, colorspace, resolution
 */
async function analyzeFile(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const metadata = {
        filename: file.name,
        filesize: file.size,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2),
        codec: detectCodec(file),
        colorSpace: 'rec709', // Default (would need more analysis)
        isRaw: isRawFile(file),
        mimetype: file.type
      };
      
      URL.revokeObjectURL(video.src);
      resolve(metadata);
    };
    
    video.onerror = () => {
      // For RAW files that can't be played in browser
      const metadata = {
        filename: file.name,
        filesize: file.size,
        duration: 0,
        width: 0,
        height: 0,
        codec: detectCodec(file),
        colorSpace: 'unknown',
        isRaw: isRawFile(file),
        mimetype: file.type
      };
      resolve(metadata);
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Detect codec from filename and mimetype
 */
function detectCodec(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const mime = file.type.toLowerCase();
  
  // RAW formats
  if (['braw', 'r3d', 'ari', 'arri', 'dng'].includes(ext)) {
    return ext.toUpperCase();
  }
  
  // Common codecs
  if (mime.includes('mp4') || ext === 'mp4') {
    return 'h264'; // Most MP4s are H.264
  }
  
  if (mime.includes('webm')) {
    return 'vp9';
  }
  
  if (ext === 'mov') {
    return 'prores'; // Assume ProRes for MOV
  }
  
  return 'unknown';
}

/**
 * Check if file is RAW format
 */
function isRawFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  return RAW_FORMATS.includes(ext);
}

/**
 * Check if media is proxy-ready (can go direct to Stream)
 */
function isProxyReady(metadata) {
  const isCodecOk = PROXY_READY_CODECS.some(c => 
    metadata.codec.toLowerCase().includes(c)
  );
  
  const isColorSpaceOk = PROXY_COLORSPACES.includes(
    metadata.colorSpace.toLowerCase()
  );
  
  const isResolutionOk = metadata.width <= 1920 && metadata.height <= 1080;
  
  return isCodecOk && isColorSpaceOk && isResolutionOk && !metadata.isRaw;
}

/**
 * Upload directly to Cloudflare Stream
 * For proxy-ready files (REC709 H.264)
 */
async function uploadToStream(file, metadata) {
  try {
    // 1. Get upload URL from backend
    const response = await fetch(`${API_BASE_URL}/api/stream/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        filesize: file.size,
        metadata: metadata
      })
    });
    
    if (!response.ok) throw new Error('Failed to get upload URL');
    
    const { uploadURL, uid } = await response.json();
    console.log('📤 Stream upload URL obtained:', uid);
    
    // 2. Upload file to Stream with progress
    const uploadResponse = await uploadWithProgress(uploadURL, file, (progress) => {
      console.log(`Upload progress: ${progress}%`);
    });
    
    console.log('✅ Upload complete!');
    
    // 3. Return media object
    return {
      id: uid,
      type: 'proxy-ready',
      status: 'ready',
      name: file.name,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      codec: metadata.codec,
      colorSpace: metadata.colorSpace,
      streamUID: uid,
      playbackURL: `https://customer-${uid}.cloudflarestream.com/${uid}/manifest/video.m3u8`,
      thumbnailURL: `https://customer-${uid}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`,
      source: 'stream'
    };
  } catch (error) {
    console.error('❌ Stream upload failed:', error);
    throw error;
  }
}

/**
 * Upload to R2 and trigger transcode
 * For RAW files that need processing
 */
async function uploadToR2AndTranscode(file, metadata) {
  try {
    // 1. Upload to R2
    console.log('📤 Uploading to R2...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/r2`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) throw new Error('R2 upload failed');
    
    const { fileKey, fileUrl } = await uploadResponse.json();
    console.log('✅ R2 upload complete:', fileKey);
    
    // 2. Trigger transcode job
    console.log('⚙️ Starting transcode job...');
    const transcodeResponse = await fetch(`${API_BASE_URL}/api/transcode/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceKey: fileKey,
        sourceUrl: fileUrl,
        metadata: metadata,
        outputs: [
          {
            name: 'proxy',
            resolution: '1920x1080',
            codec: 'h264',
            bitrate: '5M',
            profile: 'high',
            colorSpace: 'rec709'
          },
          {
            name: 'master',
            resolution: metadata.width && metadata.height 
              ? `${metadata.width}x${metadata.height}` 
              : '3840x2160',
            codec: 'h265',
            bitrate: '50M',
            profile: 'main10',
            colorSpace: 'rec2020'
          }
        ]
      })
    });
    
    if (!transcodeResponse.ok) throw new Error('Transcode job failed');
    
    const job = await transcodeResponse.json();
    console.log('✅ Transcode job started:', job.jobId);
    
    // 3. Return media object (processing status)
    return {
      id: job.jobId,
      type: 'transcoding',
      status: 'processing',
      name: file.name,
      duration: metadata.duration || 0,
      width: metadata.width || 0,
      height: metadata.height || 0,
      codec: metadata.codec,
      colorSpace: metadata.colorSpace,
      jobId: job.jobId,
      r2Key: fileKey,
      r2Url: fileUrl,
      progress: 0,
      source: 'r2',
      estimatedTime: job.estimatedTime || 300 // 5 min estimate
    };
  } catch (error) {
    console.error('❌ R2 upload/transcode failed:', error);
    throw error;
  }
}

/**
 * Upload with progress tracking
 */
function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Upload error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    
    xhr.open('POST', url);
    xhr.send(file);
  });
}

/**
 * Poll transcode job status
 */
export async function pollTranscodeStatus(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transcode/status/${jobId}`);
    
    if (!response.ok) throw new Error('Failed to get status');
    
    const status = await response.json();
    return status;
  } catch (error) {
    console.error('❌ Status check failed:', error);
    throw error;
  }
}

/**
 * Cancel transcode job
 */
export async function cancelTranscode(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transcode/cancel/${jobId}`, {
      method: 'POST'
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ Cancel failed:', error);
    return false;
  }
}

export default {
  importMedia,
  pollTranscodeStatus,
  cancelTranscode
};
