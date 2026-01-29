import Window from '../../components/v2/window/Window';
import { Button } from '../../components/ui/button';
import FeatureCard from '../../components/v2/ui/molecules/cards/feature-card/FeatureCard';
import Footer from '../layout/Footbar';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/use-auth-hook';
import Navbar from '../../components/v2/ui/molecules/navbar/Navbar';
import { ArrowUpRight } from '../../components/v2/ui/atoms/Icons/Icons';

const Home = () => {
    const { isAuthenticated, login } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen dark:text-white dark:selection:bg-cyan-500/40 overflow-x-hidden font-sans">
            <Navbar />
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
                    <Button variant="secondary" className='cursor-pointer' onClick={() => login()}>
                        Start Translating
                    </Button>
                    <Button variant="outline" className='group'>
                        <Link to="/help" className="text-neutral-400 hover:text-neutral-600 flex items-center gap-2">
                            View Walkthrough <span className="relative overflow-hidden h-fit w-fit">
                                <ArrowUpRight className="group-hover:-translate-y-5 group-hover:translate-x-5 duration-500 transition-transform " />
                                <ArrowUpRight className="absolute top-0 group-hover:translate-x-0 duration-500 group-hover:translate-y-0 transition-all translate-y-5 -translate-x-5 " />
                            </span>
                        </Link>
                    </Button>
                </div>
                <Window />
                <div id="features">
                    <FeatureCard />
                </div>
            </main >

            <Footer />

        </div >
    );
}

export default Home;