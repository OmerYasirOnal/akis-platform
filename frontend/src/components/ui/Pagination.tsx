interface PaginationProps {
  nextCursor: string | null;
  onNext: () => void;
  isLoading?: boolean;
}

export function Pagination({ nextCursor, onNext, isLoading }: PaginationProps) {
  if (!nextCursor) {
    return null;
  }

  return (
    <div className="flex justify-center mt-6">
      <button
        onClick={onNext}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}

