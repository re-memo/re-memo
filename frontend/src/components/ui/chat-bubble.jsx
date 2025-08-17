import * as React from "react";

import { cn } from "@/lib/utils";

const ChatBubble = React.forwardRef(({ className, role, ...props }, ref) => {
  return (
    <p
      className={cn(
        "text-md text-foreground rounded-lg px-4 py-2",
        role === "user"
          ? "rounded-br-none bg-accent"
          : "rounded-bl-none bg-muted",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
ChatBubble.displayName = "ChatBubble";

export { ChatBubble };
