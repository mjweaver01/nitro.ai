<template>
  <div class="file-upload">
    <div class="upload-trigger" @click="triggerFileInput">
      <i class="pi pi-paperclip"></i>
    </div>
    <input
      type="file"
      ref="fileInput"
      accept=".txt,.md,.json,.csv,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
      @change="handleFileSelect"
      style="display: none"
    />
    <div v-if="selectedFile" class="file-preview">
      <template v-if="isImage">
        <img :src="filePreview" alt="Selected file" />
      </template>
      <template v-else>
        <div class="file-info">
          <i class="pi pi-file"></i>
          <span>{{ selectedFile.name }}</span>
        </div>
      </template>
      <button @click="clearFile" class="clear-button">
        <i class="pi pi-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useMessagesStore } from '../stores/messages'

export default {
  name: 'FileUpload',
  computed: {
    ...mapStores(useMessagesStore),
    selectedFile() {
      return this.messagesStore?.fileCache.selectedFile
    },
    filePreview() {
      return this.messagesStore?.fileCache.filePreview
    },
    isImage() {
      return this.selectedFile?.type.startsWith('image/')
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      if (file.size > 500 * 1024) {
        alert('File size exceeds 500KB limit')
        this.$refs.fileInput.value = ''
        return
      }

      if (file.type.startsWith('image/')) {
        this.handleImageFile(file)
      } else {
        await this.handleDocumentFile(file)
      }
    },
    handleImageFile(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.messagesStore.setFileCache({
          selectedFile: file,
          filePreview: e.target.result,
          fileContent: e.target.result,
          fileType: 'image_url'
        })
      }
      reader.readAsDataURL(file)
    },
    async handleDocumentFile(file) {
      try {
        // Create a new Blob from the file
        const blob = new Blob([file], { type: file.type })
        
        // Read the blob as an ArrayBuffer first
        const arrayBuffer = await blob.arrayBuffer()
        
        // Convert ArrayBuffer to string
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(arrayBuffer)
        
        this.messagesStore.setFileCache({
          selectedFile: file,
          filePreview: file.name,
          fileContent: text,
          fileType: file.type.match(/(text|json|csv|md)/i) ? 'text' : 'file',
          fileName: file.name
        })
      } catch (error) {
        console.error('Error reading file:', error)
      }
    },
    getFileType(file) {
      const extension = file.name.split('.').pop().toLowerCase()
      
      if (file.type.startsWith('text/') || ['txt', 'md', 'json', 'csv'].includes(extension)) {
        return 'text'
      }
      
      return 'binary'
    },
    getMimeType(filename) {
      const extension = filename.split('.').pop().toLowerCase()
      const mimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'json': 'application/json',
        'csv': 'text/csv'
      }
      return mimeTypes[extension] || 'application/octet-stream'
    },
    clearFile() {
      this.messagesStore.clearFileCache()
      this.$refs.fileInput.value = ''
    }
  }
}
</script>

<style scoped>
.file-upload {
  position: absolute;
  right: 0;
  top: 0;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5em;
  width: 100%;
  pointer-events: none;
}

.upload-trigger,
.clear-button {
  pointer-events: auto;
}

.upload-trigger {
  cursor: pointer;
  padding: 0.5em;
  border-radius: 5px;
}

.upload-trigger:hover {
  background-color: var(--light-blue);
}

.file-preview {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  padding: 0.5em;
  margin-bottom: 0.5em;
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

.file-preview img {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 3px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.5em;
  background: var(--light-blue);
  border-radius: 3px;
}

.file-info i {
  font-size: 1.2em;
  color: var(--blue);
}

.file-info span {
  font-size: 0.9em;
  color: var(--text-color);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--red);
  border-color: var(--red);
  color: var(--white);
  padding: 0.25rem;
  font-size: 0.5rem;
  width: auto;
}
</style>