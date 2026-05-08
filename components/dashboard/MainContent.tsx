"use client";

interface MainContentProps {
    children?: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
    return (
        <main className="flex-1 overflow-y-auto pb-20 pt-16">
            <div className="p-4 md:p-6">
                {children ? (
                    children
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-96 text-center">
                        <div className="space-y-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Main content area
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
