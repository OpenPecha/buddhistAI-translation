import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationData {
    currentPage: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number;
    nextPage?: number;
}

interface PaginationControlsProps {
    pagination: PaginationData;
    onPageChange: (page: number) => void;
}

export const PaginationControls = ({ pagination, onPageChange }: PaginationControlsProps) => {
    const renderPaginationItems = () => {
        const items = [];
        const { totalPages, currentPage } = pagination;

        // Always show first page if we're far from it
        if (totalPages > 5 && currentPage > 3) {
            items.push(
                <PaginationItem key="page-1">
                    <PaginationLink
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(1);
                        }}
                        isActive={currentPage === 1}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            if (currentPage > 4) {
                items.push(
                    <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
        }

        // Show current page range
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={`page-${i}`}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(i);
                        }}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        // Show last page if we're far from it
        if (totalPages > 5 && currentPage < totalPages - 2) {
            if (currentPage < totalPages - 3) {
                items.push(
                    <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }

            items.push(
                <PaginationItem key={`page-${totalPages}`}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(totalPages);
                        }}
                        isActive={currentPage === totalPages}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    if (pagination.totalPages <= 1) return null;

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasPrevPage && pagination.prevPage) {
                                onPageChange(pagination.prevPage);
                            }
                        }}
                        className={
                            pagination.hasPrevPage ? "" : "pointer-events-none opacity-50"
                        }
                    />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasNextPage && pagination.nextPage) {
                                onPageChange(pagination.nextPage);
                            }
                        }}
                        className={
                            pagination.hasNextPage ? "" : "pointer-events-none opacity-50"
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};