<script setup lang="ts">
import { ref } from 'vue';

const searchQuery = ref('');
const books = ref([]);
const error = ref('');
const searchPerformed = ref(false);

const searchBooks = async () => {
  error.value = '';
  books.value = [];
  searchPerformed.value = true;

  if (!searchQuery.value) {
    return;
  }

  try {
    const response = await fetch(`/api/search?q=${searchQuery.value}`);
    if (!response.ok) {
      throw new Error('Something went wrong');
    }
    const data = await response.json();
    books.value = data.books;
  } catch (err) {
    error.value = err.message;
  }
};
</script>

<template>
  <div id="app" :class="{ 'initial-state': !searchPerformed, 'results-state': searchPerformed }">
    <div class="search-container">
      <form @submit.prevent="searchBooks">
        <div class="input-wrapper">
          <input type="text" v-model="searchQuery" placeholder="What would you like to read today?" />
          <button type="submit" class="search-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="112" cy="112" r="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="168.57" y1="168.57" x2="224" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
          </button>
        </div>
      </form>
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
}

#app.results-state {
  margin-top: 20px;
}

.search-container {
  width: 100%;
}

form {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

#app.results-state form {
  justify-content: flex-start;
}

.input-wrapper {
  position: relative;
  width: 400px;
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

.error {
  color: red;
  margin-bottom: 20px;
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