"use client";

import React, { useEffect, useState } from "react";
import EditAccountModal from "../../components/EditAccountModal";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isGuest?: boolean;
}

export default function EditAccountModalWrapper({ isOpen, onClose, isGuest }: Props) {
  const [userChannelId, setUserChannelId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const refreshProfile = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (!isOpen) return; // fetch only when modal opens

    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/users/me");
        const channelId = res.data?.data?.channelId || "";
        setUserChannelId(channelId);
      } catch (err) {
        console.error("Failed to fetch user data", err);
        toast.error("Unable to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isOpen]);

  if (loading) return null; // or loader

  return (
    <EditAccountModal
      isOpen={isOpen}
      onClose={onClose}
      userChannelId={userChannelId}
      onSuccess={refreshProfile}
      isGuest={isGuest}
    />
  );
}