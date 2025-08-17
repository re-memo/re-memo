import { cn } from "@/lib/utils";

const Spinner = ({ className, size = "default", ...props }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-foreground",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

export { Spinner };
