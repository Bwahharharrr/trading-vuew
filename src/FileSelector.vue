<template>
    <div class="file-selector">
        <label>Data File:</label>
        <select v-model="selectedFile" @change="onFileChange">
            <option v-for="file in files" :key="file" :value="file">
                {{ file }}
            </option>
        </select>
    </div>
</template>

<script>
export default {
    name: 'FileSelector',
    props: {
        files: {
            type: Array,
            required: true
        },
        currentFile: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            selectedFile: this.currentFile || (this.files.length ? this.files[0] : '')
        }
    },
    watch: {
        currentFile(newVal) {
            this.selectedFile = newVal
        }
    },
    methods: {
        onFileChange() {
            this.$emit('file-selected', this.selectedFile)
        }
    }
}
</script>

<style scoped>
.file-selector {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: rgba(18, 24, 39, 0.9);
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #3e3e3e;
}

.file-selector label {
    color: #888;
    font: 11px -apple-system, BlinkMacSystemFont,
        Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell,
        Fira Sans, Droid Sans, Helvetica Neue,
        sans-serif;
    margin-right: 8px;
}

.file-selector select {
    background: #1e2433;
    color: #35a776;
    border: 1px solid #3e3e3e;
    border-radius: 3px;
    padding: 4px 8px;
    font: 11px -apple-system, BlinkMacSystemFont,
        Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell,
        Fira Sans, Droid Sans, Helvetica Neue,
        sans-serif;
    cursor: pointer;
    outline: none;
}

.file-selector select:hover {
    border-color: #35a776;
}

.file-selector select option {
    background: #1e2433;
    color: #35a776;
}
</style>
