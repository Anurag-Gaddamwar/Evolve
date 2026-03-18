"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userChannelId: string;
  onSuccess: () => void; 
  isGuest?: boolean;
};

export default function EditAccountModal({
  isOpen,
  onClose,
  userChannelId,
  onSuccess,
  isGuest,
}: Props) {
  const [channelId, setChannelId] = useState(userChannelId);
  const [currentPassword, setCurrentPassword] = useState(""); // for change-password
  const [currentPasswordDelete, setCurrentPasswordDelete] = useState(""); // for delete-account
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showChannelEdit, setShowChannelEdit] = useState(false);
  const [showPwdEdit, setShowPwdEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPwdFields, setShowPwdFields] = useState(false); // legacy, will remove
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showDeletePwd, setShowDeletePwd] = useState(false); // toggle for delete confirmation

  const hasUpdates = (
    (showChannelEdit && channelId !== userChannelId) ||
    (showPwdEdit && newPassword.length > 0)
  );

  useEffect(() => {
    if (isOpen) {
      setChannelId(userChannelId);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, userChannelId]);

  const resetAll = () => {
    setChannelId(userChannelId);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChannelEdit(false);
    setShowPwdEdit(false);
    setShowDeleteConfirm(false);
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
    setShowDeletePwd(false);
    setErrorMsg("");
  };

  const close = () => {
    if (!loading) {
      resetAll();
      onClose();
    }
  };

  // collapse listeners: reset section values when user collapses them
  useEffect(() => {
    if (!showChannelEdit) {
      setChannelId(userChannelId);
      setErrorMsg("");
    }
  }, [showChannelEdit, userChannelId]);

  useEffect(() => {
    if (!showPwdEdit) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg("");
      setShowCurrentPwd(false);
      setShowNewPwd(false);
      setShowConfirmPwd(false);
    }
  }, [showPwdEdit]);

  useEffect(() => {
    if (!showDeleteConfirm) {
      setCurrentPasswordDelete("");
      setErrorMsg("");
      setShowDeletePwd(false);
    }
  }, [showDeleteConfirm]);

  // update individual sections
  const updateChannel = async () => {
    setErrorMsg("");
    if (isGuest) {
      toast.error("Guest users cannot change channel ID");
      return;
    }

    if (!channelId || channelId === userChannelId) {
      setErrorMsg("No change to channel");
      toast.error("No change to channel");
      return;
    }
    // Optional: client-side check for empty/whitespace
    if (!channelId.trim()) {
      toast.error("Channel ID cannot be empty");
      return;
    }
    try {
      setLoading(true);
      await axios.put("/api/users/me", { channelId });
      toast.success("Channel updated successfully!");
      onSuccess();
      close();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (isGuest) {
      toast.error("Guest users cannot change password");
      return;
    }

    setErrorMsg("");
    if (!newPassword) {
      setErrorMsg("No new password entered");
      toast.error("No new password entered");
      return;
    }
    if (!currentPassword) {
      setErrorMsg("Current password required to change password");
      toast.error("Current password required to change password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      toast.error("New passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await axios.put("/api/users/me", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated");
      close();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };


  const deleteAccount = async () => {
    if (!currentPasswordDelete) {
      setErrorMsg("Enter password to confirm deletion");
      toast.error("Enter password to confirm deletion");
      return;
    }
    try {
      setLoading(true);
      await axios.delete("/api/users/me", { data: { currentPassword: currentPasswordDelete } });
      toast.success("Account deleted");
      window.location.href = "/signup";
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Deletion failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm text-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="w-full max-w-md bg-[#181818] rounded-2xl shadow-2xl border border-[#2a2a2a] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.3.787-.3 1.087 0l8 8c.3.3.3.787 0 1.087l-7.586 7.586a1 1 0 01-.438.26l-4.57 1.37a1 1 0 01-1.213-1.213l1.37-4.57a1 1 0 01.26-.438l7.586-7.586z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3l5 5" />
            </svg>
            <h2 className="text-base font-semibold">Account Settings</h2>
          </div>
          <button onClick={close} className="text-[#aaa] hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Channel Section */}
          <div className="border border-[#333] rounded">
            <div className="flex items-center justify-between w-full">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#232323] hover:bg-[#2a2a2a] flex-1 transition-colors"
                onClick={() => setShowChannelEdit(prev => !prev)}
              >
                <span className="text-xs font-semibold text-[#ccc]">Edit Channel ID</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 transform transition-transform ${showChannelEdit ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {showChannelEdit && channelId !== userChannelId && (
  <button
    className="px-3 py-1 bg-accent text-xs rounded disabled:opacity-50"
    onClick={updateChannel}
    disabled={loading || isGuest}
  >
    Save
  </button>
)}
            </div>
            {showChannelEdit && (
              <div className="p-4 space-y-2">
                <input
  type="text"
  value={channelId}
  onChange={(e) => {
    if (isGuest) return; // ❌ block typing
    setChannelId(e.target.value);
  }}
  disabled={isGuest}
  className={`w-full p-2 rounded-lg border outline-none ${
    isGuest
      ? 'bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed'
      : 'bg-[#222] border-[#333] focus:border-accent focus:ring-1 focus:ring-accent'
  }`}
/>
              </div>
            )}
          </div>

          <hr className="border-[#2a2a2a]" />

          {/* Password Section */}

<div className="border border-[#333] rounded mt-3">
  <div className="flex items-center justify-between w-full">
    <button
      className="flex items-center gap-2 px-4 py-2 bg-[#232323] hover:bg-[#2a2a2a] flex-1 transition-colors"
      onClick={() => setShowPwdEdit(prev => !prev)}
    >
      <span className="text-xs font-semibold text-[#ccc]">Change Password</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-4 h-4 transform transition-transform ${showPwdEdit ? 'rotate-90' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>

    {showPwdEdit && newPassword && (
      <button
        className="px-3 py-1 bg-accent text-xs rounded disabled:opacity-50"
        onClick={updatePassword}
        disabled={loading || isGuest}
      >
        Save
      </button>
    )}
  </div>

  {showPwdEdit && (
    <div className="p-4 space-y-2">

      {/* Current Password */}
      <div className="relative">
        <input
          type={showCurrentPwd ? "text" : "password"}
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => {
            if (isGuest) return;
            setCurrentPassword(e.target.value);
          }}
          className={`w-full p-2 rounded-lg border outline-none ${
            isGuest
              ? 'bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed'
              : 'bg-[#222] border-[#333] focus:border-accent focus:ring-1 focus:ring-accent'
          }`}
        />
      </div>

      {/* New Password */}
      <div className="relative">
        <input
          type={showNewPwd ? "text" : "password"}
          placeholder="New password"
          value={newPassword}
          onChange={(e) => {
            if (isGuest) return;
            setNewPassword(e.target.value);
          }}
          className={`w-full p-2 rounded-lg border outline-none ${
            isGuest
              ? 'bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed'
              : 'bg-[#222] border-[#333] focus:border-accent focus:ring-1 focus:ring-accent'
          }`}
        />
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <input
          type={showConfirmPwd ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => {
            if (isGuest) return;
            setConfirmPassword(e.target.value);
          }}
          className={`w-full p-2 rounded-lg border outline-none ${
            isGuest
              ? 'bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed'
              : 'bg-[#222] border-[#333] focus:border-accent focus:ring-1 focus:ring-accent'
          }`}
        />
      </div>

    </div>
  )}
</div> 

          <hr className="border-[#2a2a2a]" />

          {/* Danger Zone */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-red-400">Danger Zone</h3>
            <p className="text-xs text-[#aaa]">
              This action is permanent and cannot be undone.
            </p>
            {!showDeleteConfirm ? (
  <button
    className="px-2 py-1 bg-red-600 rounded text-xs text-white hover:bg-red-700"
    onClick={() => setShowDeleteConfirm(true)}
  >
    Delete Account
  </button>
) : (
<div className="space-y-2">
  <div className="relative">
    <input
      type={showDeletePwd ? "text" : "password"}
      placeholder="Confirm with current password"
      value={currentPasswordDelete}
      onChange={(e) => {
        if (isGuest) return;
        setCurrentPasswordDelete(e.target.value);
      }}
      className={`w-full p-2 rounded-lg border outline-none ${
        isGuest
          ? 'bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed'
          : 'bg-[#222] border-[#333] focus:border-accent focus:ring-1 focus:ring-accent'
      }`}
    />
  </div>

  <div className="flex gap-2">
    <button
      onClick={deleteAccount}
      disabled={loading || isGuest}
      className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
    >
      Confirm Delete
    </button>
  </div>
</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}