import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/edit")({
  component: RedirectHome,
});

function RedirectHome() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);

  return null;
}
