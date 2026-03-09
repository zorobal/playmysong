import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const YT_KEY = process.env.YOUTUBE_API_KEY;

router.get('/search', async (req, res) => {
  const q = req.query.q;
  const limit = req.query.limit || 10;
  if (!q) return res.status(400).json({ error: 'Missing query q' });

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${limit}&q=${encodeURIComponent(q)}&key=${YT_KEY}`;
    const searchResp = await fetch(searchUrl);
    const searchJson = await searchResp.json();

    const items = searchJson.items || [];
    const results = items.map((it) => ({
      youtubeId: it.id.videoId,
      title: it.snippet.title,
      channelTitle: it.snippet.channelTitle,
      thumbnail: it.snippet.thumbnails?.default?.url || null
    }));

    res.json(results);
  } catch (err) {
    console.error('YouTube proxy error', err);
    res.status(500).json({ error: 'YouTube proxy error' });
  }
});

export default router;
