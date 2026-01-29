import React from "react";
import { User, Mail, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/auth/use-auth-hook";
import AvatarWrapper from "@/components/ui/custom-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UserProfile: React.FC = () => {
	const { t } = useTranslation();
	const { currentUser, isAuthenticated } = useAuth();

	if (!isAuthenticated || !currentUser) {
		return (
			<div className=" border rounded-md bg-gray-50 text-center">
				<p className="">
					{t("profile.notAuthenticated", "Please log in to view your profile.")}
				</p>
			</div>
		);
	}

	const { name, email, picture } = currentUser;

	return (
		<div className="space-y-2">
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User size={20} />
						{t("profile.title", "User Profile")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-start gap-2">
						<div className="flex-shrink-0">
							<AvatarWrapper
								imageUrl={picture}
								name={name}
								size={80}
							/>
						</div>

						<div className="flex-1 space-y-2">
							<div>
								<p className="text-lg font-semibold">
									{name || t("profile.nameUnavailable", "Name not available")}
								</p>
								<p className="text-sm">
									{t("profile.member", "Pecha Tool Member")}
								</p>
								<div className="flex items-center">
									<Badge variant="secondary" className="flex items-center">
										<Shield size={12} />
										{t("profile.verified", "Verified Account")}
									</Badge>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="text-lg">
						{t("profile.accountDetails", "Account Details")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{/* Email */}
						<div className="flex items-center gap-3 p-2 rounded-lg">
							<Mail size={16} />
							<div className="flex-1">
								<p className="text-sm font-medium">
									{t("profile.email", "Email Address")}
								</p>
								<p className="text-sm">{email}</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default UserProfile;
