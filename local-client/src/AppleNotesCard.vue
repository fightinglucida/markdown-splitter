<template>
  <div class="notes-page">
    <NotesToolbar />
    <time class="notes-time">{{ timestamp }}</time>
    <h1 class="notes-title">{{ title }}</h1>
    <main class="notes-body markdown-body card-content" v-html="html"></main>
    <footer class="notes-footer">
      <span>{{ author }}</span><span>字数:{{ wordCount }}</span>
    </footer>
  </div>
</template>

<script setup>
import NotesToolbar from './NotesToolbar.vue'

defineProps({
  timestamp: String,
  title: String,
  html: String,
  author: String,
  wordCount: Number
})
</script>
