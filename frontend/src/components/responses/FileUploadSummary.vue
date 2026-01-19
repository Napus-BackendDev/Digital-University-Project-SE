<template>
  <div class="file-upload-summary">
    <!-- Summary Count -->
    <p class="file-count">{{ files.length }} file(s) uploaded</p>
    
    <!-- File List -->
    <div v-if="files.length > 0" class="file-list">
      <div 
        v-for="(file, index) in files" 
        :key="index" 
        class="file-item"
      >
        <!-- File Icon -->
        <div class="file-icon" :class="getFileIconClass(file)">
          <component :is="getFileIcon(file)" />
        </div>
        
        <!-- File Info -->
        <div class="file-info">
          <span class="file-name">{{ getFileName(file) }}</span>
          <span v-if="file.uploaderName" class="uploader-name"> - {{ file.uploaderName }}</span>
        </div>
      </div>
    </div>
    
    <!-- View Folder Link (if folderUrl provided) -->
    <a 
      v-if="folderUrl" 
      :href="folderUrl" 
      target="_blank" 
      class="view-folder-link"
    >
      <svg class="folder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V9C20 7.89543 19.1046 7 18 7H12L10 5H6C4.89543 5 4 5.89543 4 7Z" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>View folder</span>
    </a>
  </div>
</template>

<script>
import { h } from 'vue';

/**
 * FileUploadSummary - สรุปไฟล์ที่อัพโหลดแบบ Google Forms style
 * แสดงรายการไฟล์พร้อมไอคอนและลิงก์ไปยัง folder
 */
export default {
  name: 'FileUploadSummary',
  props: {
    files: { 
      type: Array, 
      default: () => [] 
      // Each file: { name, type, url, uploaderName }
    },
    folderUrl: { 
      type: String, 
      default: '' 
    },
    // Legacy props for backward compatibility
    count: { type: Number, default: 0 },
    fileType: { type: String, default: 'file' }
  },
  methods: {
    // Get file name from file object or string
    getFileName(file) {
      if (typeof file === 'string') return file;
      return file.name || file.filename || 'Unknown file';
    },
    // Get file extension
    getFileExtension(file) {
      const name = this.getFileName(file);
      const ext = name.split('.').pop()?.toLowerCase();
      return ext || '';
    },
    // Determine file icon class based on file type
    getFileIconClass(file) {
      const ext = this.getFileExtension(file);
      const mimeType = file.type || file.mimeType || '';
      
      if (['pdf'].includes(ext) || mimeType.includes('pdf')) {
        return 'icon-pdf';
      }
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) || mimeType.includes('image')) {
        return 'icon-image';
      }
      if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) {
        return 'icon-doc';
      }
      if (['xls', 'xlsx'].includes(ext) || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        return 'icon-excel';
      }
      if (['ppt', 'pptx'].includes(ext) || mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return 'icon-ppt';
      }
      if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext) || mimeType.includes('video')) {
        return 'icon-video';
      }
      if (['mp3', 'wav', 'ogg', 'flac'].includes(ext) || mimeType.includes('audio')) {
        return 'icon-audio';
      }
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes('zip') || mimeType.includes('archive')) {
        return 'icon-archive';
      }
      return 'icon-file';
    },
    // Get SVG icon component based on file type
    getFileIcon(file) {
      const iconClass = this.getFileIconClass(file);
      
      // PDF Icon (Red)
      if (iconClass === 'icon-pdf') {
        return {
          render() {
            return h('svg', { viewBox: '0 0 24 24', fill: 'none', class: 'file-type-icon' }, [
              h('rect', { x: '4', y: '2', width: '16', height: '20', rx: '2', fill: '#EA4335' }),
              h('text', { x: '12', y: '15', fill: 'white', 'font-size': '6', 'text-anchor': 'middle', 'font-weight': 'bold' }, 'PDF')
            ]);
          }
        };
      }
      
      // Image Icon (Red/Orange)
      if (iconClass === 'icon-image') {
        return {
          render() {
            return h('svg', { viewBox: '0 0 24 24', fill: 'none', class: 'file-type-icon' }, [
              h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', fill: '#EA4335' }),
              h('circle', { cx: '8', cy: '8', r: '2', fill: 'white' }),
              h('path', { d: 'M21 15L16 10L11 15L8 12L3 17V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V15Z', fill: 'white' })
            ]);
          }
        };
      }
      
      // Default file icon (Gray)
      return {
        render() {
          return h('svg', { viewBox: '0 0 24 24', fill: 'none', class: 'file-type-icon' }, [
            h('path', { 
              d: 'M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z', 
              fill: '#9E9E9E' 
            }),
            h('path', { d: 'M14 2V8H20', fill: '#BDBDBD' }),
            h('path', { d: 'M14 2L20 8H14V2Z', fill: '#E0E0E0' })
          ]);
        }
      };
    }
  }
}
</script>

<style scoped>
.file-upload-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-count {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #525252;
  margin: 0;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #F8F9FA;
  border-radius: 12px;
  padding: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: background 0.2s;
}

.file-item:hover {
  background: var(--bg-gray);
}

.file-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-type-icon {
  width: 24px;
  height: 24px;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.file-name {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uploader-name {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #737373;
}

.view-folder-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4285F4;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  transition: color 0.2s;
  align-self: flex-end;
}

.view-folder-link:hover {
  color: #1A73E8;
  text-decoration: underline;
}

.folder-icon {
  width: 20px;
  height: 20px;
}
</style>
