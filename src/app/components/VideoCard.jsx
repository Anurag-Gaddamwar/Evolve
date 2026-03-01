import React from 'react';

const VideoCard = ({ video, onCopy }) => {
  return (
    <article className="group rounded-xl bg-[#171717] transition-colors hover:bg-[#1a1a1a]">
      <div className="relative overflow-hidden rounded-lg aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-25 transition-opacity"></div>
      </div>
      <p className="mt-3 text-[#ececec] text-sm line-clamp-2 min-h-[40px]">{video.title}</p>
      <button
        onClick={() => onCopy(video.id)}
        className="mt-1 text-xs text-[#c7c7c7] hover:text-white underline-offset-2 hover:underline"
      >
        Copy link
      </button>
    </article>
  );
};

export default React.memo(VideoCard);
