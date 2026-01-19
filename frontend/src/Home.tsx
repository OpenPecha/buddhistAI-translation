import { ArrowRight, Globe } from 'lucide-react';
import DocIcon from '@/assets/logo.svg';
import Window from './components/v2/window/Window';
import { Button } from './components/ui/button';
import { ModeToggle } from './components/v2/ui/molecules/mode-toggle/ModeToggle';
import FeatureCard from './components/v2/ui/molecules/cards/feature-card/FeatureCard';
import Footer from './pages/layout/Footbar';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/use-auth-hook';

const Home = () => {
    const { isAuthenticated, login } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen dark:bg-[#191919] dark:text-white dark:selection:bg-white/20 overflow-x-hidden font-sans">
            <nav className="flex items-center justify-between px-6 py-6 ">
                <div className="flex items-center gap-2">
                    <div className='flex items-center gap-2'>
                        <img src={DocIcon} alt="logo" className='w-8 h-8' />
                    </div>
                    <div className='flex flex-col'>
                        <span className="font-semibold text-lg tracking-tight leading-none">Buddhist AI Studio</span>
                        <span className='text-xs text-zinc-400 leading-none'>Translation Editor</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
                    <a href="#features" className="dark:hover:text-white  hover:text-black transition-colors">Features</a>

                    <Link to="/help" className="dark:hover:text-white  hover:text-black transition-colors">Help</Link>
                    <ModeToggle />
                </div>

            </nav>

            <main className="flex flex-col p-10 items-left space-y-10 justify-center text-left">
                <div>
                    <p className="text-2xl font-semibold tracking-tight">
                        Buddhistai Translation Tool
                    </p>

                    <p className="text-medium text-zinc-400 max-w-2xl leading-tight">
                        An advanced platform for translating and editing Tibetan texts with real-time collaboration, parallel text editing, and comprehensive annotation tools.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-x-4">
                    <Button variant="secondary" onClick={() => login()}>
                        Start Translating <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline">
                        <Link to="/help" className='text-neutral-400 hover:text-neutral-600 flex items-center gap-2'>
                            <Globe className="w-4 h-4" /> View Walkthrough
                        </Link>
                    </Button>
                </div>
                <Window />
                <div id="features">
                    <FeatureCard />
                </div>
            </main>

            <Footer />

        </div>
    );
}

export default Home;