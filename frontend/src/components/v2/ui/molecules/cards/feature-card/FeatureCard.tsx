import ParallelTextIcon from '@/assets/icon0.svg';
import CollaborationIcon from '@/assets/card1.svg';
import RichTextIcon from '@/assets/ai.svg';
import ChangeTrackingIcon from '@/assets/time.svg';

const IconParallelText = () => (
    <img src={ParallelTextIcon} alt="Parallel Text" />
);

const IconCollaboration = () => (
    <img src={CollaborationIcon} alt="Collaboration" />
);

const IconRichText = () => (
    <img src={RichTextIcon} alt="Rich Text" />);

const IconChangeTracking = () => (
    <img src={ChangeTrackingIcon} alt="Change Tracking" />
);


const FeatureCard = () => {
    const featuresData = [
        {
            CustomIcon: IconParallelText,
            title: "Parallel Text Editing",
            description: "Two-panel sync for source and translation side-by-side.",
        },
        {
            CustomIcon: IconCollaboration,
            title: "Real-time Collaboration",
            description: "Multiple users editing and reviewing simultaneously.",
        },
        {
            CustomIcon: IconRichText,
            title: "Rich Text Editing",
            description: "Powered by Quill editor with Tibetan text support.",
        },
        {
            CustomIcon: IconChangeTracking,
            title: "Change Tracking",
            description: "Track versions and sync annotations seamlessly.",
        },
    ];

    return (
        <section>
            <div className="space-y-6">
                <h2 className="text-2xl ont-normal dark:text-white/90 tracking-tight">
                    Explore our features
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuresData.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative dark:bg-[#1c1c1c] border dark:border-zinc-800 rounded-sm p-6 h-[320px]  flex flex-col overflow-hidden transition-colors duration-200 hover:border-zinc-300 dark:hover:border-zinc-700"
                        >

                            <div>
                                <h3 className="text-2xl font-medium dark:text-zinc-100 ">
                                    {feature.title}
                                </h3>
                                <p className="text-zinc-400 group-hover:text-zinc-500 dark:group-hover:text-zinc-200 transition-colors duration-500 max-w-[90%] leading-tight">
                                    {feature.description}
                                </p>
                            </div>

                            <div className="absolute bottom-[-10px] left-[-10px] text-zinc-400/20 group-hover:text-zinc-500/30 transition-colors duration-500 pointer-events-none">
                                <feature.CustomIcon />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section >
    );
};

export default FeatureCard;