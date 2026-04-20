"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
    label: string;
}

export function PasswordInput({ label, id, className, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setShowPassword(true);
    };

    const handleMouseUp = () => {
        setShowPassword(false);
    };

    return (
        <div className="flex flex-col gap-1.25 p-1">
            <label htmlFor={id} className="text-sm text-white font-medium">
                {label}
            </label>
            <div className="relative">
                <Input
                    {...props}
                    id={id}
                    type={showPassword ? "text" : "password"}
                    className={cn(
                        "pr-10", // Add padding to the right for the icon
                        className
                    )}
                />
                <button
                    type="button"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseUp}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
    );
}
