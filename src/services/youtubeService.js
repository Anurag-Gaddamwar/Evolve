const axios = require('axios');
const NodeCache = require('node-cache');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CACHE_TTL = parseInt(process.env.YOUTUBE_CACHE_TTL || '300', 10); // seconds

if (!YOUTUBE_API_KEY) {
  console.warn('WARNING: missing YOUTUBE_API_KEY in env');
}

// simple in-memory cache for youtube responses
const ytCache = new NodeCache({ stdTTL: YOUTUBE_CACHE_TTL, checkperiod: 60 });

async function fetchUploadsPlaylistId(channelId) {
  const cacheKey = `uploadsId:${channelId}`;
  const cached = ytCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });
    const uploadsId = response.data.items[0].contentDetails.relatedPlaylists.uploads;
    ytCache.set(cacheKey, uploadsId);
    return uploadsId;
  } catch (error) {
    console.error('Error fetching uploads playlist ID:', error);
    throw new Error('Error fetching uploads playlist ID');
  }
}

async function fetchChannelDetails(channelId) {
  const cacheKey = `channelDetails:${channelId}`;
  const cached = ytCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'brandingSettings,snippet,statistics',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });
    const item = response.data.items[0];
    // console.log('Channel brandingSettings:', item.brandingSettings);
    const details = {
      banner: item.brandingSettings?.image?.bannerImageUrl || item.brandingSettings?.image?.bannerTabletImageUrl || item.brandingSettings?.image?.bannerMobileImageUrl || null,
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || '',
      title: item.snippet?.title || '',
      profileImage: item.snippet?.thumbnails?.default?.url || '',
      subscriberCount: item.statistics?.subscriberCount || '0',
      videoCount: item.statistics?.videoCount || '0',
    };
    ytCache.set(cacheKey, details);
    return details;
  } catch (error) {
    console.error('Error fetching channel details:', error);
    throw new Error('Error fetching channel details');
  }
}

async function fetchVideoIdsByPlaylistId(playlistId) {
  const cacheKey = `videoIds:${playlistId}`;
  const cached = ytCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'contentDetails,snippet',
        playlistId,
        maxResults: 20,
        key: YOUTUBE_API_KEY,
      },
    });
    const videoIds = response.data.items.map(item => ({
      id: item.contentDetails.videoId,
      title: item.snippet?.title || '',
      thumbnail: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
    }));
    ytCache.set(cacheKey, videoIds);
    return videoIds;
  } catch (error) {
    console.error('Error fetching video IDs by playlist ID:', error);
    throw new Error('Error fetching video IDs by playlist ID');
  }
}

module.exports = {
  fetchUploadsPlaylistId,
  fetchVideoIdsByPlaylistId,
  fetchChannelDetails,
};
