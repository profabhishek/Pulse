import { useEffect, useState } from "react";
import ProfileModal from "./components/ProfileModal";
import MainLayout from "./MainLayout";

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadProfile = async () => {
    const p = await window.pulse.getProfile();
    setProfile(p);
    setLoading(false);

    if (!p) {
      setShowProfileModal(true);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) return null;

  return (
    <>
      {showProfileModal && (
        <ProfileModal
          existingProfile={profile}
          onComplete={() => {
            setShowProfileModal(false);
            loadProfile(); // 🔥 refresh profile without reload
          }}
        />
      )}

      {profile && (
        <MainLayout
          profile={profile}
          onEditProfile={() => setShowProfileModal(true)}
        />
      )}
    </>
  );
}
