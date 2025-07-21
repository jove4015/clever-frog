<script setup lang="ts">
import { ref, computed } from 'vue';
import { z } from 'zod';

const bookSchema = z.object({
  id: z.union([z.string(), z.number()]),
  imageUrl: z.string(),
  title: z.string(),
  author: z.string(),
  publicationYear: z.union([z.number(), z.string()]).optional(),
  averageRating: z.union([z.number(), z.string()]),
});

const paginationSchema = z.object({
  resultsEnd: z.number(),
  totalResults: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

const apiResponseSchema = z.object({
  books: z.array(bookSchema),
  pagination: paginationSchema.nullable(),
});

type Book = z.infer<typeof bookSchema>;
type Pagination = z.infer<typeof paginationSchema>;

const searchQuery = ref('');
const books = ref<Book[]>([]);
const error = ref('');
const hasResults = ref(false);
const currentPage = ref(1);
const pagination = ref<Pagination | null>(null);
const isLoading = ref(false);

const searchBooks = async (page = 1) => {
  error.value = '';
  currentPage.value = page;
  isLoading.value = true;

  if (!searchQuery.value) {
    hasResults.value = false;
    isLoading.value = false;
      books.value = [];
      pagination.value = null;
    return;
  }

  try {
    const response = await fetch(`/api/search?q=${searchQuery.value}&page=${page}`);
    if (!response.ok) {
      books.value = [];
      pagination.value = null;
      hasResults.value = false;
      throw new Error('Something went wrong');
    }
    const rawData = await response.json();
    const data = apiResponseSchema.parse(rawData);
    
    if (data.books && data.books.length > 0) {
      books.value = data.books;
      pagination.value = data.pagination;
      hasResults.value = true;
    } else {
      books.value = [];
      pagination.value = null;
      hasResults.value = false;
      error.value = "No books were found, please try a different search!";
    }
  } catch (err: any) {
    hasResults.value = false;
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const hasNextPage = computed(() => {
  if (!pagination.value) return false;
  return pagination.value.resultsEnd < pagination.value.totalResults;
});

const hasPreviousPage = computed(() => {
  if (!pagination.value) return false;
  return pagination.value.page > 1;
});

const onFirstSearch = () => {
  searchBooks(1);
}
</script>

<template>
  <div id="app" :class="{ 'initial-state': !hasResults, 'results-state': hasResults }">
    <div class="sticky-header">
      <div class="top-bar">
        <div class="search-container">
          <form @submit.prevent="onFirstSearch">
            <div class="input-wrapper">
              <input type="text" v-model="searchQuery" placeholder="What would you like to read today?" />
              <button type="submit" class="search-button" :disabled="isLoading">
                <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="112" cy="112" r="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="168.57" y1="168.57" x2="224" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                <svg v-else class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>
              </button>
            </div>
          </form>
        </div>

        <div v-if="hasResults && pagination" class="pagination">
          <button v-if="hasPreviousPage" @click="searchBooks(currentPage - 1)" class="pagination-button" :disabled="isLoading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="160 208 80 128 160 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
          </button>
          <span class="page-info">Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
          <button v-if="hasNextPage" @click="searchBooks(currentPage + 1)" class="pagination-button" :disabled="isLoading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="96 48 176 128 96 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-if="books.length" class="results">
      <div v-for="book in books" :key="book.id" class="book">
        <img :src="book.imageUrl" :alt="book.title" />
        <div class="book-info">
          <h2>{{ book.title }}</h2>
          <p>by {{ book.author }}</p>
          <p v-if="book.publicationYear">Published in {{ book.publicationYear }}</p>
          <p>Average rating: {{ book.averageRating }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  transition: all 0.5s ease;
}
#app.initial-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  flex-direction: column;
}
#app.initial-state .top-bar {
  width: 100%;
  display: flex;
  justify-content: center;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}
.sticky-header {
  position: sticky;
  top: 0;
  background: #efefef;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
#app.initial-state .sticky-header {
  background-color: #fff;
  box-shadow: none;
  position: static;
  margin-bottom: 0;
  top: auto;
}
.search-container {
  flex-grow: 1;
}
#app.initial-state .search-container {
  flex-grow: 0;
}
.input-wrapper {
  position: relative;
  max-width: 100%;
}
#app.initial-state .input-wrapper {
  margin: 0 auto;
  width: 400px;
  max-width: 80%;
}
input {
  padding: 10px 40px 10px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}
.search-button {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  background: none;
  border: none;
  padding: 0 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-button svg {
  width: 24px;
  height: 24px;
  color: #2c3e50;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 24px;
  height: 24px;
}

.spinner .path {
  stroke: #42b983;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.pagination {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.pagination-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button svg {
  width: 24px;
  height: 24px;
  color: #2c3e50;
}

.page-info {
  margin: 0 10px;
  font-size: 16px;
  white-space: nowrap;
}

.error {
  color: red;
  margin-bottom: 20px;
  text-align: center;
  width: 100%;
}

#app.results-state .error {
  position: static;
  text-align: left;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 20px;
}
.book {
  display: flex;
  align-items: flex-start;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
}
.book img {
  width: 100px;
  height: 150px;
  margin-right: 10px;
  object-fit: cover;
}
.book-info h2 {
  font-size: 1em;
  margin-bottom: 0.5em;
}
.book-info p {
  font-size: 0.8em;
  line-height: 1.2;
  margin: 0.25em 0;
}
.book-info {
  text-align: left;
}
</style>
