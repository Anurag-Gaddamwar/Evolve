"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import VideoCard from "../../components/VideoCard";
import EditAccountModalWrapper from "./EditAccountModalWrapper";

const PAGE_CHUNK_SIZE = 24;

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
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [videoIds, setVideoIds] = useState<VideoItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const hasProfileToast = useRef(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchVideos = useCallback(async (channelId: string, offset = 0, limit = PAGE_CHUNK_SIZE) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/get-videos?channelId=${channelId}&offset=${offset}&limit=${limit}`
      );
      return {
        videos: response.data?.videoIds || [],
        total: response.data?.total || 0,
        hasMore: response.data?.hasMore || false
      };
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Unable to load channel videos");
      return { videos: [], total: 0, hasMore: false };
    }
  }, [API_URL]);

  const fetchChannelDetails = useCallback(async (channelId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/get-channel-details?channelId=${channelId}`
      );
      return response.data?.details || null;
    } catch (error) {
      console.error("Error fetching channel details:", error);
      return null;
    }
  }, [API_URL]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userRes = await axios.get("/api/users/me");
        const { username, email, profileImage, channelId } = userRes.data?.data || {};

        if (!channelId) {
          setUserData({
            username: username || "",
            email: email || "",
            profileImage: profileImage || "",
            channelId: "",
            channelName: "You don't have a YouTube channel",
            channelProfileImage: "",
            subscriberCount: "0",
            videoCount: "0",
          });
          setVideoIds([]);
          setTotalVideos(0);
          setHasMore(false);
          setLoading(false);
          return;
        }

        const [videosData, channelDetails] = await Promise.all([
          fetchVideos(channelId, 0, PAGE_CHUNK_SIZE),
          fetchChannelDetails(channelId)
        ]);

        setVideoIds(normalizeVideos(videosData.videos));
        setTotalVideos(videosData.total);
        setHasMore(videosData.hasMore);

        const channel = channelDetails || {};

        setUserData({
          username: username || "",
          email: email || "",
          profileImage: profileImage || "",
          channelId: channelId || "",
          channelName: channel.title || "",
          channelProfileImage: channel.profileImage || "",
          subscriberCount: channel.subscriberCount || "0",
          videoCount: channel.videoCount || "0",
        });

        if (!hasProfileToast.current) {
          toast.success("Profile loaded");
          hasProfileToast.current = true;
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast.error("Unable to load profile");

        if (error.response?.status === 401) {
          router.push("/login");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [fetchVideos, fetchChannelDetails, router]);

  const loadMoreVideos = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const newOffset = videoIds.length;
      const { videos, hasMore: moreAvailable } = await fetchVideos(
        userData.channelId,
        newOffset,
        PAGE_CHUNK_SIZE
      );

      if (videos.length > 0) {
        setVideoIds(prev => [...prev, ...normalizeVideos(videos)]);
        setHasMore(moreAvailable);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, videoIds.length, userData.channelId, fetchVideos]);

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
  }, [loadMoreVideos]);

  const channelHandle = useMemo(() => {
    const source = userData.channelName || userData.username || "creator";
    return `@${source.replace(/\s+/g, "")}`;
  }, [userData.channelName, userData.username]);

  const handleCopyLink = (videoId: string) => {
    const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(videoLink).then(() => {
      setCopiedVideoId(videoId);
      toast.success("Link copied");
      setTimeout(() => setCopiedVideoId(null), 1400);
    });
  };

  const refreshProfile = async () => {
    try {
      const userRes = await axios.get("/api/users/me");
      const { username, email, profileImage, channelId } = userRes.data?.data || {};

      if (!channelId) {
        setUserData({
          username: username || "",
          email: email || "",
          profileImage: profileImage || "",
          channelId: "",
          channelName: "",
          channelProfileImage: "",
          subscriberCount: "0",
          videoCount: "0",
        });
        setVideoIds([]);
        setTotalVideos(0);
        setHasMore(false);
        return;
      }

      const [videosData, channelDetails] = await Promise.all([
        fetchVideos(channelId, 0, PAGE_CHUNK_SIZE),
        fetchChannelDetails(channelId)
      ]);

      setVideoIds(normalizeVideos(videosData.videos));
      setTotalVideos(videosData.total);
      setHasMore(videosData.hasMore);

      const channel = channelDetails || {};

      setUserData({
        username: username || "",
        email: email || "",
        profileImage: profileImage || "",
        channelId: channelId || "",
        channelName: channel.title || "",
        channelProfileImage: channel.profileImage || "",
        subscriberCount: channel.subscriberCount || "0",
        videoCount: channel.videoCount || "0",
      });

      toast.success("Profile refreshed with new channel data");
    } catch (error: any) {
      console.error("Refresh error:", error);
      toast.error("Failed to refresh profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-2">
        <div className="w-3 h-3 bg-[#a8a8a8] rounded-full animate-bounce [animation-delay:0ms]"></div>
        <div className="w-3 h-3 bg-[#a8a8a8] rounded-full animate-bounce [animation-delay:150ms]"></div>
        <div className="w-3 h-3 bg-[#a8a8a8] rounded-full animate-bounce [animation-delay:300ms]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1320px] mx-auto w-full text-[#ececec] space-y-6 pb-8">
        <section className="relative rounded-2xl border border-[#2a2a2a] bg-[#171717] p-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowModal(true)}
              className={`px-3 py-1 rounded text-sm ${userData.email === 'guestuser@gmail.com' ? 'bg-gray-600 cursor-default text-gray-400 hover:bg-gray-600' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'}`}
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-[#222]">
              {userData.channelProfileImage ? (
                <img
                  src={userData.channelProfileImage}
                  className="w-full h-full object-cover"
                  alt="Channel avatar"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-gray-600 to-gray-700">
                  {(userData.channelName || userData.username || "U")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {userData.channelName || userData.username || "Creator"}
              </h1>
              <p className="text-sm text-[#a8a8a8] mt-1">
                {channelHandle} • {parseInt(userData.subscriberCount).toLocaleString()} subscribers
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {videoIds.length > 0 ? (
            <>
              <h2 className="font-semibold mb-2">Latest Uploads ({totalVideos.toLocaleString()})</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videoIds.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onCopy={handleCopyLink}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-[#a8a8a8] bg-[#1a1a1a]/50 rounded-xl p-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-[#4a5568] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.665z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-semibold mb-2">No videos yet</h2>
              <p className="text-sm">Connect your YouTube channel to see your latest uploads and analytics.</p>
              <button
                onClick={refreshProfile}
                className="mt-4 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm transition-colors"
              >
                Refresh Profile
              </button>
            </div>
          )}
          {hasMore && (
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-sm text-[#a8a8a8]">
                <div className="w-4 h-4 border-2 border-[#4a5568] border-t-transparent rounded-full animate-spin"></div>
                Loading more...
              </div>
            </div>
          )}
        </section>
      </div>

      <EditAccountModalWrapper
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

