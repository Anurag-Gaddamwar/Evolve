"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import AppSidebarShell from "../components/AppSidebarShell";
import VideoCard from "../components/VideoCard";
import EditAccountModal from "../components/EditAccountModal";

const PAGE_CHUNK_SIZE = 12;
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

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

const channelCache = new Map<
  string,
  {
    channelName: string;
    channelProfileImage: string;
    subscriberCount: string;
    videoCount: string;
  }
>();

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
  const [showModal, setShowModal] = useState(false);
  const hasProfileToast = useRef(false);

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
      const { username, email, profileImage, channelId } =
        res.data?.data || {};

      let fetched: VideoItem[];

      if (videoFetchCache.has(channelId)) {
        fetched = videoFetchCache.get(channelId)!;
      } else {
        fetched = await fetchVideos(channelId);
        videoFetchCache.set(channelId, fetched);
      }

      setVideoIds(normalizeVideos(fetched));

      let channelName = "";
      let channelProfileImage = "";
      let subscriberCount = "0";
      let videoCount = "0";

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

        const channelData =
          channelDetailsResponse.data?.items?.[0] || {};

        channelName = channelData?.snippet?.title || "";
        channelProfileImage =
          channelData?.snippet?.thumbnails?.default?.url || "";
        subscriberCount =
          channelData?.statistics?.subscriberCount || "0";
        videoCount =
          channelData?.statistics?.videoCount || "0";

        channelCache.set(channelId, {
          channelName,
          channelProfileImage,
          subscriberCount,
          videoCount,
        });
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

      setUserData({
        username: "",
        email: "",
        profileImage: "",
        channelId: "",
        channelName: "",
        channelProfileImage: "",
        subscriberCount: "0",
        videoCount: "0",
      });
      setVideoIds([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (channelId: string) => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:3001";
      const response = await axios.get(
        `${apiUrl}/api/get-videos?channelId=${channelId}`
      );
      return response.data?.videoIds || [];
    } catch (error) {
      toast.error("Unable to load channel videos");
      return [];
    }
  };

  const handleCopyLink = (videoId: string) => {
    const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(videoLink).then(() => {
      setCopiedVideoId(videoId);
      toast.success("Link copied");
      setTimeout(() => setCopiedVideoId(null), 1400);
    });
  };

  const loadMoreVideos = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(prev + PAGE_CHUNK_SIZE, videoIds.length)
    );
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
  }, [loadMoreVideos]);

  const displayedVideos = useMemo(
    () => videoIds.slice(0, visibleCount),
    [videoIds, visibleCount]
  );

  const latestVideo = displayedVideos[0];
  const hasMoreVideos = displayedVideos.length < videoIds.length;

  const channelHandle = useMemo(() => {
    const source =
      userData.channelName || userData.username || "creator";
    return `@${source.replace(/\s+/g, "")}`;
  }, [userData.channelName, userData.username]);

  if (loading) {
    return (
      <AppSidebarShell title="Profile">
        <div className="p-6 text-white">Loading...</div>
      </AppSidebarShell>
    );
  }

  return (
    <AppSidebarShell title="Profile">
      <div className="max-w-[1320px] mx-auto w-full text-[#ececec] space-y-6 pb-8">

        {/* Profile Header */}
        <section className="relative rounded-2xl border border-[#2a2a2a] bg-[#171717] p-6">

          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1 bg-[#2a2a2a] rounded text-sm hover:bg-[#3a3a3a]"
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
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">
                  {(userData.channelName ||
                    userData.username ||
                    "U")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold">
                {userData.channelName ||
                  userData.username ||
                  "Creator"}
              </h1>
              <p className="text-sm text-[#a8a8a8] mt-1">
                {channelHandle} •{" "}
                {parseInt(userData.subscriberCount).toLocaleString()} subscribers
              </p>
            </div>
          </div>
        </section>

        {/* Videos Section */}
        <section className="space-y-5">
          {latestVideo && (
            <h2 className="font-semibold mb-2">Latest Uploads</h2>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onCopy={handleCopyLink}
              />
            ))}
          </div>

          <div ref={loadMoreRef} className="h-10" />

          
        </section>
      </div>

      {/* Modal */}
      <EditAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userChannelId={userData.channelId}
        onSuccess={getUserDetails}
      />
    </AppSidebarShell>
  );
}