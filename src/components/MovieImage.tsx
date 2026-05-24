import React, { useState } from "react";

interface MovieImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

const MovieImage: React.FC<MovieImageProps> = ({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  ...props
}) => {
  const [prevSrc, setPrevSrc] = useState(src);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    !src || src === "N/A" ? "error" : "loading"
  );

  // If the src prop changes, adjust state during render to avoid mount race conditions
  if (src !== prevSrc) {
    setPrevSrc(src);
    setStatus(!src || src === "N/A" ? "error" : "loading");
  }

  if (status === "error") {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-zinc-950 w-full h-full text-center p-4 border border-white/5 ${fallbackClassName}`}
      >
        <div className="loader scale-75 md:scale-100 mb-3"></div>
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">
          No Poster Available
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950">
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
          <div className="loader scale-75 md:scale-100"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${status === "loading" ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        {...props}
      />
    </div>
  );
};

export default MovieImage;
