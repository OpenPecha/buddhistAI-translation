import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/use-auth-hook";

const Callback: React.FC = () => {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/");
		}
	}, [isAuthenticated]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h2 className="mb-4">
					Processing your login...
				</h2>
			</div>
		</div>
	);
};

export default Callback;
