"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import AppSidebarShell from "../components/AppSidebarShell";
import VideoCard from "../components/VideoCard";

const PAGE_CHUNK_SIZE = 12;
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

type VideoItem = {
  id: string;
  title: string;
  thumbnail: string;
};

type UserData = {
  username: string;
  email: string;
  profileImage: string;
  channelId: string;
  channelName: string;
  channelProfileImage: string;
  subscriberCount: string;
  videoCount: string;
};

// simple in-memory caches to avoid repeat requests during session
const channelCache = new Map<string, {
  channelName: string;
  channelProfileImage: string;
  subscriberCount: string;
  videoCount: string;
}>();

const videoFetchCache = new Map<string, VideoItem[]>();

const normalizeVideos = (items: any[]): VideoItem[] => {
  const unique: VideoItem[] = [];
  const seen = new Set<string>();

  for (const item of items || []) {
    const id = (item?.id || "").toString();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push({
      id,
      title: (item?.title || "Untitled video").toString(),
      thumbnail: (item?.thumbnail || "").toString(),
    });
  }

  return unique;
};

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    username: "",
    email: "",
    profileImage: "",
    channelId: "",
    channelName: "",
    channelProfileImage: "",
    subscriberCount: "0",
    videoCount: "0",
  });
  const [loading, setLoading] = useState(true);
  const [videoIds, setVideoIds] = useState<VideoItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_CHUNK_SIZE);
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getUserDetails();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_CHUNK_SIZE);
  }, [videoIds.length]);

  const getUserDetails = async () => {
    try {
      const res = await axios.get("/api/users/me");
      const { username, email, profileImage, channelId } = res.data?.data || {};

      let fetched: VideoItem[];
      if (videoFetchCache.has(channelId)) {
        fetched = videoFetchCache.get(channelId)!;
      } else {
        fetched = await fetchVideos(channelId);
        videoFetchCache.set(channelId, fetched);
      }
      setVideoIds(normalizeVideos(fetched));

      // fetch channel details with caching
      let channelName = '';
      let channelProfileImage = '';
      let subscriberCount = '0';
      let videoCount = '0';
      if (channelCache.has(channelId)) {
        const c = channelCache.get(channelId)!;
        channelName = c.channelName;
        channelProfileImage = c.channelProfileImage;
        subscriberCount = c.subscriberCount;
        videoCount = c.videoCount;
      } else {
        const channelDetailsResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${YOUTUBE_API_KEY}&part=snippet,statistics`
        );

        const channelData = channelDetailsResponse.data?.items?.[0] || {};
        channelName = channelData?.snippet?.title || '';
        channelProfileImage = channelData?.snippet?.thumbnails?.default?.url || '';
        subscriberCount = channelData?.statistics?.subscriberCount || '0';
        videoCount = channelData?.statistics?.videoCount || '0';
        channelCache.set(channelId, { channelName, channelProfileImage, subscriberCount, videoCount });
      }

      setUserData({
        username: username || "",
        email: email || "",
        profileImage: profileImage || "",
        channelId: channelId || "",
        channelName,
        channelProfileImage,
        subscriberCount,
        videoCount,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      // on failure just leave everything blank/empty
      setUserData({username: "", email: "", profileImage: "", channelId: "", channelName: "", channelProfileImage: "", subscriberCount: "0", videoCount: "0"});
      setVideoIds([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (channelId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await axios.get(`${apiUrl}/api/get-videos?channelId=${channelId}`);
      return response.data?.videoIds || [];
    } catch (error) {
      console.error("Error fetching videos:", error);
      return [];
    }
  };

  const handleCopyLink = (videoId: string) => {
    const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(videoLink).then(() => {
      setCopiedVideoId(videoId);
      setTimeout(() => setCopiedVideoId(null), 1400);
    });
  };

  const loadMoreVideos = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_CHUNK_SIZE, videoIds.length));
  }, [videoIds.length]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreVideos();
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMoreVideos, visibleCount]);

  const displayedVideos = useMemo(() => videoIds.slice(0, visibleCount), [videoIds, visibleCount]);
  const hasMoreVideos = displayedVideos.length < videoIds.length;
  const latestVideo = displayedVideos[0];
  const featureStrip = displayedVideos.slice(1, 7);

  const channelHandle = useMemo(() => {
    const source = userData.channelName || userData.username || "creator";
    return `@${source.replace(/\s+/g, "")}`;
  }, [userData.channelName, userData.username]);

  if (loading) {
    return (
      <AppSidebarShell title="Profile">
        <div className="max-w-full sm:max-w-[1320px] mx-auto w-full text-[#ececec] space-y-4">
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-[clamp(74px,9vw,128px)] h-[clamp(74px,9vw,128px)] rounded-full bg-[#2f2f2f]" />
              <div className="space-y-3 w-full">
                <div className="h-6 w-44 bg-[#2d2d2d] rounded" />
                <div className="h-4 w-72 bg-[#262626] rounded" />
                <div className="h-4 w-56 bg-[#262626] rounded" />
              </div>
            </div>
          </div>
        </div>
      </AppSidebarShell>
    );
  }

  return (
    <AppSidebarShell title="Profile">
      <div className="max-w-full sm:max-w-[1320px] mx-auto w-full text-[#ececec] space-y-4 md:space-y-6 pb-8">

        <section className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4 sm:p-6 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              <div className="w-[clamp(74px,9vw,132px)] h-[clamp(74px,9vw,132px)] rounded-full overflow-hidden border-[3px] border-[#7a7f8d] bg-[#202020] shrink-0">
                {userData.channelProfileImage ? (
                  <img
                    src={userData.channelProfileImage}
                    alt="Channel Profile"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : userData.profileImage ? (
                  <img
                    src={userData.profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[clamp(1.35rem,3.5vw,2.3rem)] font-semibold text-[#f0f0f0]">
                    {(userData.channelName || userData.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-[clamp(1.4rem,3.5vw,2.5rem)] leading-tight font-semibold truncate">
                  {userData.channelName || userData.username || "Creator Channel"}
                </h1>
                <p className="text-[clamp(0.82rem,1.8vw,1rem)] text-[#a8a8a8] mt-1 truncate">
                  {channelHandle} • {parseInt(userData.subscriberCount).toLocaleString()} subscribers • {parseInt(userData.videoCount).toLocaleString()} videos
                </p>
                <p className="text-[clamp(0.75rem,1.55vw,0.92rem)] text-[#8f8f8f] mt-2 truncate">
                  Channel ID: {userData.channelId || "-"}
                </p>
              </div>
            </div>

          </div>

        </section>

        <section className="space-y-5">
            {latestVideo ? (
              <article className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4 md:p-5">
                <h2 className="text-[clamp(1rem,2.2vw,1.45rem)] font-semibold mb-4">Latest Upload</h2>
                <div className="flex flex-col xl:flex-row gap-4">
                  <div className="w-full xl:w-[420px] shrink-0 overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#111]">
                    <img
                      src={latestVideo.thumbnail}
                      alt={latestVideo.title}
                      className="h-[clamp(190px,30vw,236px)] w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[clamp(1rem,2vw,1.65rem)] leading-snug font-medium line-clamp-2">
                      {latestVideo.title}
                    </h3>
                    <p className="text-[clamp(0.8rem,1.6vw,0.95rem)] text-[#9f9f9f] mt-2">
                      {channelHandle} • {videoIds.length.toLocaleString()} total uploads
                    </p>
                    <p className="text-[clamp(0.82rem,1.65vw,1rem)] text-[#c8c8c8] mt-4 leading-7">
                      This section highlights your latest video in a high-visibility layout for fast performance review and optimization.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => handleCopyLink(latestVideo.id)}
                        className="rounded-full border border-[#3a3a3a] bg-[#242424] px-4 py-2 text-[clamp(0.78rem,1.5vw,0.9rem)] hover:bg-[#2f2f2f]"
                      >
                        Copy Video Link
                      </button>
                      {copiedVideoId === latestVideo.id ? (
                        <span className="text-[clamp(0.72rem,1.4vw,0.85rem)] text-[#a8a8a8]">Link copied</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            <article className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-[clamp(1rem,2.2vw,1.45rem)] font-semibold">
                  All Videos
                </h2>

              </div>

              {displayedVideos.length === 0 ? (
                <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-6 text-[clamp(0.8rem,1.6vw,1rem)] text-[#a8a8a8]">
                  No videos available.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayedVideos.map((video) => (
                      <div key={video.id}>
                        <VideoCard video={video} onCopy={handleCopyLink} />
                        {copiedVideoId === video.id ? (
                          <p className="text-[clamp(0.7rem,1.35vw,0.82rem)] text-[#9f9f9f] mt-1">Link copied</p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div ref={loadMoreRef} className="h-10" />
                  {hasMoreVideos ? (
                    <div className="rounded-lg border border-dashed border-[#3a3a3a] bg-[#1a1a1a] px-4 py-2 text-[clamp(0.72rem,1.45vw,0.86rem)] text-[#9f9f9f] text-center">
                      Loading more videos as you scroll...
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-2 text-[clamp(0.72rem,1.45vw,0.86rem)] text-[#9f9f9f] text-center">
                      All channel videos loaded
                    </div>
                  )}
                </>
              )}
            </article>
          </section>
      </div>
    </AppSidebarShell>
  );
}
