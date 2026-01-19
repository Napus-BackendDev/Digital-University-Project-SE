<template>
  <div class="question-field media-field">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="video/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- Preview วิดีโอที่อัพโหลด -->
    <div v-if="previewUrl || (videoUrl && !videoUrl.includes('youtube'))" class="media-preview">
      <video :src="previewUrl || videoUrl" controls class="preview-video"></video>
      <button class="remove-preview" @click="previewUrl = ''; emit('update:videoUrl', '')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
    </div>

    <div class="media-url-row">
      <input 
        :value="videoUrl"
        @input="emit('update:videoUrl', $event.target.value)"
        type="text" 
        placeholder="Video URL (YouTube, direct link) หรือคลิกอัพโหลด" 
        class="media-url-input" 
      />
      <button class="btn btn-secondary" @click="triggerFileUpload">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Upload
      </button>
    </div>
    <input 
      :value="caption"
      @input="emit('update:caption', $event.target.value)"
      type="text" 
      placeholder="Caption (optional)" 
      class="caption-input" 
    />
  </div>
</template>

<script>
/**
 * VideoQuestion - เพิ่มวิดีโอในคำถาม
 * รองรับ YouTube URL, direct link หรืออัพโหลดจากเครื่อง พร้อม caption
 */
export default {
  name: 'VideoQuestion',
  props: {
    videoUrl: { type: String, default: '' },
    caption: { type: String, default: '' }
  },
  emits: ['update:videoUrl', 'update:caption', 'error'],
  data() {
    return {
      previewUrl: '',
      errorMessage: ''
    }
  },
  methods: {
    triggerFileUpload() {
      this.$refs.fileInput?.click()
    },
    handleFileSelect(event) {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('video/')) {
        this.errorMessage = 'Please select a video file only'
        this.$emit('error', 'Please select a video file only')
        return
      }
      this.errorMessage = ''

      const reader = new FileReader()
      reader.onload = (e) => {
        this.previewUrl = e.target.result
        this.$emit('update:videoUrl', e.target.result)
      }
      reader.readAsDataURL(file)
    },
    emit(event, payload) {
      this.$emit(event, payload)
    }
  }
}
</script>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-field {
  gap: 16px;
}

.media-url-row {
  display: flex;
  gap: 8px;
}

.media-url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
}

.media-url-input:focus {
  outline: none;
  border-color: var(--primary);
}

.caption-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
}

.caption-input:focus {
  outline: none;
  border-color: var(--primary);
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: var(--bg-gray-light);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: #eee;
}

/* Preview styles */
.media-preview {
  position: relative;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.preview-video {
  width: 100%;
  max-height: 300px;
  display: block;
}

.remove-preview {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-preview:hover {
  background: rgba(0, 0, 0, 0.8);
}

.remove-preview svg {
  width: 14px;
  height: 14px;
  color: white;
}
</style>
