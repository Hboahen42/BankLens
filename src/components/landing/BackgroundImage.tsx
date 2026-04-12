const BackgroundImage = () => {
    return (
        <div className="absolute inset-0 z-0">
            <img
                src={process.env.NEXT_PUBLIC_HERO_BG_MOBILE_URL!}
                alt="Hero background"
                className="w-full h-full object-cover lg:hidden"
            />
            <img
                src={process.env.NEXT_PUBLIC_HERO_BG_DESKTOP_URL!}
                alt="Hero background"
                className="w-full h-full object-cover hidden lg:block"
            />
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-[#0a0a0d]/60"/>
            {/* Bottom fade effect */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#0a0a0d] to-transparent z-10 pointer-events-none"/>
        </div>

    )
}
export default BackgroundImage
