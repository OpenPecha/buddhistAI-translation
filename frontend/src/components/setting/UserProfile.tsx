import React from "react";
import { User, Shield, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/auth/use-auth-hook";
import AvatarWrapper from "@/components/ui/custom-avatar";
import { Badge } from "@/components/ui/badge";

const UserProfile: React.FC = () => {
	const { t } = useTranslation();
	const { currentUser, isAuthenticated } = useAuth();

	// Enhanced unauthenticated state with padding, an icon, and better visual hierarchy
	if (!isAuthenticated || !currentUser) {
		return (
			<div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/30 text-center space-y-3">
				<div className="p-3 bg-muted rounded-full text-muted-foreground">
					<LockKeyhole size={24} />
				</div>
				<p className="text-sm font-medium text-muted-foreground">
					{t("profile.notAuthenticated", "Please log in to view your profile.")}
				</p>
			</div>
		);
	}

	const { name, email, picture } = currentUser;

	return (
		<div className="w-full max-w-2xl border rounded-xl bg-card text-card-foreground shadow-sm">
			<div className="flex items-center gap-2 p-2 border-b">
				<User size={20} className="text-primary" />
				<h2 className="text-lg font-semibold tracking-tight">
					{t("profile.title", "User Profile")}
				</h2>
			</div>

			<div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4">
				<div className="flex-shrink-0 ring-4 ring-muted/50 rounded-full">
					<AvatarWrapper
						imageUrl={picture}
						name={name}
						size={88}
					/>
				</div>
				<div className="flex-1 flex flex-col items-center sm:items-start space-y-4">
					<div className="text-center sm:text-left space-y-1">
						<h3 className="text-2xl font-semibold tracking-tight">
							{name || t("profile.nameUnavailable", "Name not available")}
						</h3>
						<p className="text-sm text-muted-foreground">
							{email}
						</p>
					</div>

					<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
						<Badge variant="secondary" className="px-3 py-1 font-medium">
							{t("profile.member", "Pecha Tool Member")}
						</Badge>
						<Badge
							variant="outline"
							className="px-3 py-1 flex items-center gap-1.5 bg-green-50/50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900"
						>
							<Shield size={14} className="text-green-600 dark:text-green-500" />
							{t("profile.verified", "Verified Account")}
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UserProfile;