import { Skeleton } from "@/components/ui/skeleton"

export function ProjectLoader() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:w-fit">
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-sm border bg-background p-4 md:w-[180px] w-full"
                >
                    <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                        <Skeleton className="h-8 w-8 shrink-0 rounded sm:h-10 sm:w-10" />

                        <div className="flex-1 w-full min-w-0 flex flex-col h-full">
                            <div className="flex items-center justify-between gap-2">

                                <div className="flex items-center gap-2 shrink-0">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>

                            <div className="hidden sm:block mt-3 space-y-2">
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-5/6" />
                                <Skeleton className="h-3 w-4/6" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
