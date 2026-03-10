const express = require('express');
const {
  fetchUploadsPlaylistId,
  fetchVideoIdsByPlaylistId,
  fetchChannelDetails,
} = require('../services/youtubeService');

const router = express.Router();

router.get('/get-videos', async (req, res) => {
  try {
    const { channelId, limit = 24, offset = 0 } = req.query;
    if (!channelId) {
      return res.status(400).json({ error: 'channelId query parameter is required' });
    }

    const uploadsPlaylistId = await fetchUploadsPlaylistId(channelId);
    const allVideoIds = await fetchVideoIdsByPlaylistId(uploadsPlaylistId, 500);
    
    // Apply pagination
    const paginatedVideos = allVideoIds.slice(Number(offset), Number(offset) + Number(limit));
    const totalVideos = allVideoIds.length;
    
    res.json({ 
      videoIds: paginatedVideos,
      total: totalVideos,
      hasMore: Number(offset) + Number(limit) < totalVideos
    });
  } catch (error) {
    console.error('Videos route error', error);
    res.status(500).json({ error: 'Error fetching video IDs' });
  }
});

router.get('/get-channel-details', async (req, res) => {
  try {
    const { channelId } = req.query;
    if (!channelId) {
      return res.status(400).json({ error: 'channelId query parameter is required' });
    }

    const details = await fetchChannelDetails(channelId);
    res.json({ details });
  } catch (error) {
    console.error('Channel details route error', error);
    res.status(500).json({ error: 'Error fetching channel details' });
  }
});

module.exports = router;
