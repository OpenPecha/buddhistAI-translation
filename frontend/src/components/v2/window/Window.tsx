import windowImage from '@/assets/screenshots/window.png';

const Window = () => {
    return (
        <div className="w-full max-w-7xl mx-auto group">
            <div className="rounded-xl border shadow dark:border-zinc-800 dark:bg-[#1E1E1E] bg-white border-zinc-100 overflow-hidden">
                <div className="h-10 border-b dark:border-zinc-800 border-zinc-100 dark:bg-zinc-900/50 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    <div className="ml-4 px-3 py-1 dark:bg-zinc-800 bg-zinc-100 rounded text-[10px] text-zinc-500 font-mono">
                        Chojuk.docx
                    </div>
                </div>

                <div className="aspect-video w-full  flex items-center justify-center">
                    <img
                        src={windowImage}
                        alt="App Dashboard Placeholder"
                        className="w-full h-full object-cover opacity-80"
                    />
                </div>
            </div>
        </div>
    )
}

export default Window