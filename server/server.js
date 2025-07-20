require('dotenv').config();
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
const { z } = require('zod');

const app = express();
const port = 3000;

const GOODREADS_API_KEY = process.env.GOODREADS_API_KEY;

if (!GOODREADS_API_KEY) {
  throw new Error('GOODREADS_API_KEY is not defined in your .env file');
}

const goodreadsIdSchema = z.object({
  _: z.string(),
  '$': z.object({ type: z.literal('integer') }),
});

const goodreadsAuthorSchema = z.object({
  id: goodreadsIdSchema,
  name: z.string(),
});

const goodreadsBestBookSchema = z.object({
  '$': z.object({ type: z.literal('Book') }),
  id: goodreadsIdSchema,
  title: z.string(),
  author: goodreadsAuthorSchema,
  image_url: z.string().url(),
  small_image_url: z.string().url(),
});

const publicationDatePartSchema = z.object({
  _: z.string().optional(),
  '$': z.object({
    type: z.literal('integer'),
    nil: z.literal('true').optional(),
  }),
});

const goodreadsWorkSchema = z.object({
  id: goodreadsIdSchema,
  books_count: z.any(),
  ratings_count: z.any(),
  text_reviews_count: z.any(),
  original_publication_year: publicationDatePartSchema,
  original_publication_month: publicationDatePartSchema,
  original_publication_day: publicationDatePartSchema,
  average_rating: z.union([
    z.string(),
    z.object({
      _: z.string(),
      '$': z.object({ type: z.literal('float') }),
    }),
  ]),
  best_book: goodreadsBestBookSchema,
});

const goodreadsResponseSchema = z.object({
  GoodreadsResponse: z.object({
    search: z.object({
      results: z.object({
        work: z.array(goodreadsWorkSchema).optional(),
      }),
    }),
  }),
});


app.use(cors());

app.get('/api/search', async (req, res) => {
  const { q, page = 1 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const goodreadsUrl = `https://www.goodreads.com/search/index.xml?key=${GOODREADS_API_KEY}&q=${q}&page=${page}`;
    const response = await axios.get(goodreadsUrl);
    const xml = response.data;

    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);

    const validatedResponse = goodreadsResponseSchema.parse(result);
    const searchResults = validatedResponse.GoodreadsResponse.search.results.work || [];

    const books = searchResults.map(work => ({
      id: work.best_book.id._,
      title: work.best_book.title,
      author: work.best_book.author.name,
      imageUrl: work.best_book.image_url,
      smallImageUrl: work.best_book.small_image_url,
      publicationYear: work.original_publication_year._,
      averageRating: typeof work.average_rating === 'string'
        ? work.average_rating
        : work.average_rating._,
    }));

    res.json({ books });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data from Goodreads API', details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
