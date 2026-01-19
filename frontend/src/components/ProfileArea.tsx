import AvatarWrapper from "./ui/custom-avatar";
import { useAuth } from "@/auth/use-auth-hook";

function ProfileArea() {
  const { currentUser } = useAuth();
  return (
    <div className="flex items-center gap-2 font-sans p-2">
      <AvatarWrapper
        imageUrl={currentUser?.picture}
        name={currentUser?.name}
        size={36}
      />
      <div className="hidden sm:flex flex-col items-start">
        <span className="text-sm font-medium text-neutral-900 dark:text-zinc-100">
          {currentUser?.name}
        </span>
        <span className="text-xs text-neutral-500 dark:text-zinc-400">
          {currentUser?.email}
        </span>
      </div>
    </div>

  );
}

export default ProfileArea;
