"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getMyProfileAction } from "@/modules/users/actions/user.actions";
import {
  UserProfileDialog,
  type ProfileData,
} from "@/modules/users/components/user-profile-form";

type ProfileDialogContextValue = {
  openProfile: () => void;
};

const ProfileDialogContext = createContext<ProfileDialogContextValue>({
  openProfile: () => {},
});

export function useProfileDialog() {
  return useContext(ProfileDialogContext);
}

export function ProfileDialogProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const openProfile = useCallback(async () => {
    if (!session?.user?.tenantId) return;

    const result = await getMyProfileAction();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setProfile(result.data);
    setOpen(true);
  }, [session?.user?.tenantId]);

  return (
    <ProfileDialogContext.Provider value={{ openProfile }}>
      {children}
      {profile && (
        <UserProfileDialog
          open={open}
          onOpenChange={setOpen}
          profile={profile}
          onProfileChange={setProfile}
        />
      )}
    </ProfileDialogContext.Provider>
  );
}
