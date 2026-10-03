import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <EmptyState
        icon={Compass}
        title="This page wandered off"
        message="The page you're looking for doesn't exist."
        action={
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        }
      />
    </div>
  );
}
