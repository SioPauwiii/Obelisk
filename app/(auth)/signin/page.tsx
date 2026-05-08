"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setIsLoading(true);

        // Simulate authentication delay
        setTimeout(() => {
            setIsLoading(false);
        }, 2000);
    }

    return (
        // bg-slate-50 gives a very soft, professional light gray background
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            {/* The main login card - white background, subtle shadow, light border */}
            <Card className="w-full max-w-md shadow-sm border-slate-200 bg-white">
                <CardHeader className="space-y-3 items-center text-center pb-6">
                    {/* Clean logo placement */}
                    <div className="h-24 w-24 relative mb-2">
                        {/* Make sure obelisk_logo.png is in your /public folder */}
                        <Image
                            src="/obelisk_logo.png"
                            alt="Company Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-base">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-slate-700 font-medium"
                            >
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                required
                                className="border-slate-200 bg-white text-slate-900 focus-visible:ring-slate-400 h-11"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-slate-700 font-medium"
                                >
                                    Password
                                </Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                className="border-slate-200 bg-white text-slate-900 focus-visible:ring-slate-400 h-11"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Primary Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-base font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500 tracking-wider">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    {/* Secondary Action Button */}
                    <Button
                        variant="outline"
                        type="button"
                        className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 h-11 font-medium"
                        disabled={isLoading}
                    >
                        Single Sign-On (SSO)
                    </Button>
                </CardContent>

                {/* Footer */}
                <CardFooter className="flex justify-center border-t border-slate-100 p-6 bg-slate-50/50 rounded-b-xl">
                    <p className="text-sm text-slate-600">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-slate-900 hover:underline underline-offset-4"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
