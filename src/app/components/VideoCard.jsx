import React from 'react';

const VideoCard = ({ video, onCopy, copied = false }) => {
  return (
    <article className="group rounded-xl bg-[#171717] hover:bg-[#1a1a1a] shadow hover:shadow-lg transition transform hover:scale-[1.02] duration-200 overflow-hidden">
      <div className="relative overflow-hidden aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-white p-2 line-clamp-2">
          {video.title}
        </div>
      </div>
      <div className="p-2 flex justify-end">
        <button
          onClick={() => onCopy(video.id)}
          className="text-xs text-[#c7c7c7] hover:text-white underline-offset-2 hover:underline"
        >
          Copy link
        </button>
      </div>
    </article>
  );
};

export default React.memo(VideoCard);
