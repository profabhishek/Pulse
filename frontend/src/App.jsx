import { useEffect, useState } from "react";
import ProfileModal from "./components/ProfileModal";
import MainLayout from "./MainLayout";
import { subscribeToAllTextChannels } from "./services/mqttService";

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
    } else {
      // SUBSCRIBE TO ALL TEXT CHANNELS ON APP START
      subscribeToAllTextChannels();
    }
  };

  useEffect(() => {
    document.title = "Pulse";
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
            loadProfile(); // refresh profile + subscribe
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
