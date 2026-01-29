import { ModeToggle } from '@/components/v2/ui/molecules/mode-toggle/ModeToggle';
import DocIcon from '@/assets/logo.svg';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@/components/v2/ui/atoms/Icons/Icons';

const Navbar = () => {
    return (
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

                <Link to="/help" className="dark:hover:text-white   hover:text-black transition-colors group flex items-center gap-x-1">Help<span className="relative overflow-hidden h-fit w-fit">
                    <ArrowUpRight className="group-hover:-translate-y-5 group-hover:translate-x-5 duration-500 transition-transform " />
                    <ArrowUpRight className="absolute top-0 group-hover:translate-x-0 duration-500 group-hover:translate-y-0 transition-all translate-y-5 -translate-x-5 " />
                </span>

                </Link>
                <ModeToggle />
            </div>

        </nav>

    )
}

export default Navbar