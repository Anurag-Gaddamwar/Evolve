"use client";

import React from "react";
import EditAccountModal from "../../components/EditAccountModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAccountModalWrapper({ isOpen, onClose }: Props) {
  const refreshProfile = () => {
    window.location.reload();
  };

  // Hardcoded for now - replace with real user state when available
  const userChannelId = "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // Your actual channel ID

  return (
    <EditAccountModal
      isOpen={isOpen}
      onClose={onClose}
      userChannelId={userChannelId}
      onSuccess={refreshProfile}
    />
  );
}

