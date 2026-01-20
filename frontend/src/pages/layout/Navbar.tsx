import { Link } from "react-router-dom";
import SearchInput from "@/components/Dashboard/SearchInput";
import AppLauncher from "@/components/Applauncher";
import DocIcon from "@/assets/logo.svg";
import ProfileArea from "@/components/ProfileArea";
import { ModeToggle } from "@/components/v2/ui/molecules/mode-toggle/ModeToggle";
import { LanguageToggle } from "@/components/v2/ui/molecules/language-toggle/LanguageToggle";
import AuthLogout from "@/components/v2/ui/molecules/auth-logout/Logout";

const Navbar = () => {
	return (
		<nav className="px-4 py-2 flex justify-between items-center">
			<div className="flex gap-2">
				<Link
					to="/dashboard"
				>
					<div className="flex items-center gap-2">
						<div className='flex items-center gap-2'>
							<img src={DocIcon} alt="logo" className='w-8 h-8' />
						</div>
						<div className='flex flex-col font-sans'>
							<span className="hidden md:block font-semibold text-lg tracking-tight leading-none">Buddhist AI Studio</span>
							<span className='hidden md:block text-xs text-zinc-400 leading-none'>Translation Editor</span>
						</div>
					</div>
				</Link>
			</div>
			<SearchInput />
			<div className="flex items-center gap-2">
				<AppLauncher />
				<ProfileArea />
				<LanguageToggle />
				<ModeToggle />
				<AuthLogout />
			</div>
		</nav>
	);
};

export default Navbar;
