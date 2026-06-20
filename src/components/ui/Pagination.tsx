interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm">Page {currentPage} of {totalPages}</span>
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
