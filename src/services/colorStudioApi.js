// API service for Color Studio Pro
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/color-studio' 
  : 'http://localhost:5001/api/color-studio';

class ColorStudioAPI {
  async uploadFile(file, projectName, clientEmail) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_name', projectName);
    formData.append('client_email', clientEmail);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async getLUTs() {
    try {
      const response = await fetch(`${API_BASE_URL}/luts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching LUTs:', error);
      throw error;
    }
  }

  async getProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  async applyLUT(projectId, lutId, processingMode = 'auto', outputFormat = 'rec709') {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/apply-lut`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lut_id: lutId,
          processing_mode: processingMode,
          output_format: outputFormat,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error applying LUT:', error);
      throw error;
    }
  }

  async requestQuote(projectId, notes = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting quote:', error);
      throw error;
    }
  }

  // Utility method to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility method to format duration
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Utility method to get format color
  getFormatColor(format) {
    const colors = {
      'BRAW': '#ff6b35',
      'RED R3D': '#dc2626',
      'ALEXA': '#059669',
      'Sony MXF': '#3b82f6',
      'Cinema DNG': '#8b5cf6',
      'QuickTime': '#6b7280',
      'MP4': '#6b7280',
    };
    
    return colors[format] || '#6b7280';
  }
}

export default new ColorStudioAPI();
