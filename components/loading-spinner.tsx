export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-t-2 border-l-2 border-black dark:border-white animate-spin"></div>
      </div>
    </div>
  )
}
