const BackgroundImage = () => {
    return (
        <div className="absolute inset-0 z-0">
            <img
                src="https://gvfxdigzxbvkvkjnmddy.supabase.co/storage/v1/object/sign/s3/rotated-hero-bg.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTEwZWNiOC1jMjEwLTRmODItYTYzMy01NmY4NmE4ZDIwMjgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzMy9yb3RhdGVkLWhlcm8tYmcuanBnIiwiaWF0IjoxNzc1ODk5MzUzLCJleHAiOjE4MDc0MzUzNTN9.-wr6sezFAmdptRxLdElT9prX1JJU9nV-z-jHUvvN1Eo"
                alt="Hero background"
                className="w-full h-full object-cover lg:hidden"
            />
            <img
                src="https://gvfxdigzxbvkvkjnmddy.supabase.co/storage/v1/object/sign/s3/hero-bg.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTEwZWNiOC1jMjEwLTRmODItYTYzMy01NmY4NmE4ZDIwMjgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzMy9oZXJvLWJnLmpwZyIsImlhdCI6MTc3NTg5OTE3OSwiZXhwIjoxODA3NDM1MTc5fQ.hvvE2uRKj6jsZAl62Br4V-NcKx5_mxFX4PnfFKHyQIM"
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
