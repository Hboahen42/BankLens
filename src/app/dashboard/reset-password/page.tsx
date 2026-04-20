import React from 'react'
import {FormMessage, Message} from "@/components/form-message";
import BackgroundImage from "@/components/landing/BackgroundImage";
import Link from "next/link";
import {UrlProvider} from "@/components/url-provider";
import {PasswordInput} from "@/components/password-input";
import {SubmitButton} from "@/components/submit-button";
import {resetPasswordAction} from "@/app/actions";

export default async function RestPassword(props: {
    searchParams: Promise<Message>;
}) {
    const searchParams = await props.searchParams;

    return (
        <div className="relative overflow-hidden flex min-h-screen w-full items-center justify-center">
            <BackgroundImage />

            <div className="relative z-10 flex w-full items-center justify-center px-4">
                <div className="w-full max-w-md flex flex-col items-center gap-6">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-0 w-full">
                        {/* Logo wordmark */}
                        <div className="flex flex-col items-center pb-6 w-full animate-fade-up anim-delay-1">
                            <Link className="font-inter font-bold text-white text-2xl leading-8"
                                  href="/"
                            >
                                BankLens
                            </Link>
                        </div>
                        {/* Heading */}
                        <div className="flex flex-col items-center pb-2 w-full animate-fade-up anim-delay-2">
                            <h1 className="text-white text-center text-[40px] leading-9 font-normal" style={{ fontFamily: "Georgia, serif" }}>
                                Reset Your Password
                            </h1>
                        </div>
                        {/* Subtitle */}
                        <p className="font-inter font-normal text-center pt-2 text-white/60 text-sm leading-5 animate-fade-up anim-delay-3">
                            Enter your new password below to reset your account password.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="w-full rounded-2xl px-8.75 py-8.5 flex flex-col gap-2.5 animate-fade-up anim-delay-4"
                         style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                        <UrlProvider>
                            <form className="flex flex-col gap-2.5">
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    label="New password"
                                    placeholder="Enter your new password"
                                    required
                                    className="font-inter font-normal text-white/50 text-sm leading-5 rounded-md bg-transparent border border-white/15 px-4 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                                <PasswordInput
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    label="Confirm password"
                                    placeholder="Confirm your password"
                                    required
                                    className="font-inter font-normal text-white/50 text-sm leading-5 rounded-md bg-transparent border border-white/15 px-4 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />

                                <div className="flex flex-col p-1 pt-2 gap-2.5">
                                    <SubmitButton
                                        formAction={resetPasswordAction}
                                        pendingText="Resetting password..."
                                        className="w-full bg-white text-black font-inter font-normal text-sm leading-5 py-2 rounded-md hover:bg-white/90 transition-colors"
                                    >
                                        Reset Password
                                    </SubmitButton>
                                </div>

                                <FormMessage message={searchParams} />
                            </form>
                        </UrlProvider>
                    </div>
                </div>
            </div>
        </div>
    )

}
