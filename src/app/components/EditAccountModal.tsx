"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userChannelId: string;
  onSuccess: () => void; // refetch profile after update
};

export default function EditAccountModal({
  isOpen,
  onClose,
  userChannelId,
  onSuccess,
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
    if (!channelId || channelId === userChannelId) {
      setErrorMsg("No change to channel");
      toast.error("No change to channel");
      return;
    }
    try {
      setLoading(true);
      await axios.put("/api/users/me", { channelId });
      toast.success("Channel updated");
      onSuccess();
      close();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
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
                className="flex items-center gap-2 px-4 py-2 bg-[#232323] flex-1"
                onClick={() => setShowChannelEdit((p) => !p)}
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
                  className="px-3 py-1 bg-accent text-xs rounded"
                  onClick={updateChannel}
                  disabled={loading}
                >Save</button>
              )}
            </div>
            {showChannelEdit && (
              <div className="p-4 space-y-2">
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#222] border border-[#333] focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                />
              </div>
            )}
          </div>

          <hr className="border-[#2a2a2a]" />

          {/* Password Section */}

          <div className="border border-[#333] rounded mt-3">
            <div className="flex items-center justify-between w-full">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#232323] flex-1"
                onClick={() => setShowPwdEdit((p) => !p)}
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
                  className="px-3 py-1 bg-accent text-xs rounded"
                  onClick={updatePassword}
                  disabled={loading}
                >Save</button>
              )}
            </div>
            {showPwdEdit && (
              <div className="p-4 space-y-2">
                <div className="relative">
                  <input
                    type={showCurrentPwd ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#222] border border-[#333] focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(p => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showCurrentPwd ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.968 9.968 0 012.223-3.502M9.879 9.879A3 3 0 0114.121 14.12" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.225 6.225l11.55 11.55" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#222] border border-[#333] focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(p => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showNewPwd ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.968 9.968 0 012.223-3.502M9.879 9.879A3 3 0 0114.121 14.12" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.225 6.225l11.55 11.55" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#222] border border-[#333] focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(p => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showConfirmPwd ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.968 9.968 0 012.223-3.502M9.879 9.879A3 3 0 0114.121 14.12" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.225 6.225l11.55 11.55" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
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
              >Delete Account</button>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showDeletePwd ? "text" : "password"}
                    placeholder="Confirm with current password"
                    value={currentPasswordDelete}
                    onChange={(e) => setCurrentPasswordDelete(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#222] border border-[#333] focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePwd(p => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showDeletePwd ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.968 9.968 0 012.223-3.502M9.879 9.879A3 3 0 0114.121 14.12" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.225 6.225l11.55 11.55" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={deleteAccount}
                    disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60"
                  >Confirm Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}