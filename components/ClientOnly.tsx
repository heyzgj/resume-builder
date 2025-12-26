"use client";

import { useEffect, useState, ReactNode } from "react";

/**
 * Prevents hydration mismatch errors for client-side only state (like Zustand persist).
 * Renders children only after the component has mounted on the client.
 */
export const ClientOnly = ({ children }: { children: ReactNode }) => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return null; // Or a loading skeleton
    }

    return <>{children}</>;
};
