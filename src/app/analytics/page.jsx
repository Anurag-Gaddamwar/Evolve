'use client';

import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AppSidebarShell from '../components/AppSidebarShell';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faThumbsUp,
  faThumbsDown,
  faComments,
  faEye,
  faCalendar,
  faChartLine,
  faSmile,
  faLightbulb,
  faQuestion,
  faStar,
  faTasks,
  faBullseye,
  faList,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

const extractSection = (text, startLabel, endLabel) => {
  if (!text || !startLabel) return '';
  const start = text.indexOf(startLabel);
  if (start === -1) return '';

  const contentStart = start + startLabel.length;
  const contentEnd = endLabel ? text.indexOf(endLabel, contentStart) : -1;
  return text
    .slice(contentStart, contentEnd === -1 ? undefined : contentEnd)
    .replace(/\*/g, '')
    .trim();
};

const formatNumber = (value) => {
  if (value == null) return '--';
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '--';

  // always use a fixed locale to prevent hydration mismatches between
  // server and client (e.g. en-US vs en-IN) when calling toLocaleString()
  // Next.js renders on the server using the system locale while the
  // browser may use the user's locale. A consistent locale keeps the
  // output stable.
  return num.toLocaleString('en-US');
};

const toPercent = (value, total) => {
  // a null value indicates the metric is unknown/hidden rather than zero.
  if (value == null) return null;
  const num = Number(value || 0);
  const den = Number(total || 0);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return Number(((num / den) * 100).toFixed(2));
};

const extractVideoId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v)\/*))([^?&"'>]+)/);
  return match ? match[1] : null;
};

const calculateEngagementRate = (likeCount, commentCount, viewCount) => {
  const likes = Number(likeCount || 0);
  const comments = Number(commentCount || 0);
  const views = Number(viewCount || 0);
  if (!views) return '0.00%';
  return `${(((likes + comments) / views) * 100).toFixed(2)}%`;
};

const splitActionItems = (text = '') =>
  text
    .split(/\n|\.|•|-/)
    .map((line) => line.trim())
    .filter((line) => line.length > 8)
    .slice(0, 6);

const deriveSentiment = (report) => {
  const text = [report.suggestions, report.conclusion]
    .join(' ')
    .toLowerCase();

  const positive = ['great', 'good', 'love', 'helpful', 'clear', 'valuable', 'improve', 'strong', 'best'];
  const negative = ['bad', 'confusing', 'hate', 'weak', 'poor', 'issue', 'problem', 'spam', 'abusive'];

  let pos = 1;
  let neg = 1;
  positive.forEach((word) => {
    if (text.includes(word)) pos += 1;
  });
  negative.forEach((word) => {
    if (text.includes(word)) neg += 1;
  });

  const neutral = Math.max(1, Math.round((pos + neg) * 0.8));
  const total = pos + neg + neutral;

  return {
    positive: Math.round((pos / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.max(0, 100 - Math.round((pos / total) * 100) - Math.round((neutral / total) * 100)),
  };
};

// sampleReport removed – we no longer surface hardcoded values.  
// When the UI needs to render a placeholder it uses skeleton markup via the
// `isSample` prop instead of relying on dummy data.
// small reusable card used inside the report grid
const MetricCard = ({ title, value, icon, subtitle, compact = false }) => {
  const containerClasses = `rounded-xl border border-[#2f2f2f] bg-[#1f1f1f] ${
    compact ? 'p-1 sm:p-2' : 'p-4'
  }`;
  const titleClasses = `uppercase tracking-wide text-[#9f9f9f] mb-1 ${
    compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'
  }`;
  const valueClasses = compact ? 'text-sm sm:text-base md:text-lg font-semibold' : 'text-lg sm:text-xl font-semibold';
  const subtitleClasses = `${compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'} text-[#9f9f9f] mt-1`;

  return (
    <div className={containerClasses}>
      <p className={titleClasses}>{title}</p>
      <div className={`flex items-center gap-2 text-[#ececec]`}> 
        {icon ? <FontAwesomeIcon icon={icon} className="text-[#cfcfcf]" /> : null}
        <span className={valueClasses}>{value}</span>
      </div>
      {subtitle ? <p className={subtitleClasses}>{subtitle}</p> : null}
    </div>
  );
};

// simple ring chart showing percentage value
const RingChart = ({ pct, size = 60, stroke = 6, color = '#4a4a4a' }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="#2f2f2f"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

const HorizontalBar = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-sm text-[#cfcfcf] mb-2">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-4 rounded-full bg-[#121212] border border-[#2f2f2f] overflow-hidden">
      <div className="h-full bg-[#4a4a4a]" style={{ width: `${Math.max(2, value)}%` }} />
    </div>
  </div>
);

// simple markdown-to-HTML helper (bold **, italic *)
const mdToHtml = (str) => {
  if (!str) return '';
  let html = str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  return html;
};

// helper to render multi‑sentence text as list
const renderTextList = (input) => {
  if (!input) return null;
  if (Array.isArray(input)) {
    if (input.length === 0) return null;
    return (
      <ul className="list-disc list-outside text-xs sm:text-sm text-[#d7d7d7] space-y-2 pl-5">
        {input.map((p, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: mdToHtml(p) }} />
        ))}
      </ul>
    );
  }
  // fallback for single string
  const parts = input
    .split(/\.|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1)
    return (
      <p
        className="text-xs sm:text-sm text-[#d7d7d7] leading-6"
        dangerouslySetInnerHTML={{ __html: mdToHtml(input) }}
      />
    );
  return (
    <ul className="list-disc list-outside text-xs sm:text-sm text-[#d7d7d7] space-y-2 pl-5">
      {parts.map((p, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: mdToHtml(p) }} />
      ))}
    </ul>
  );
};

const WireframeReport = ({ report, isSample = false }) => {
  // helper for skeleton headers and blocks
  const headerBar = (label, width = 'w-24') => (
    <div className={`h-3 ${width} bg-[#2a2a2a] rounded mb-2 flex items-center justify-center text-[10px] text-[#7a7a7a]`}>{label}</div>
  );
  const sectionBar = (height) => (
    <div className={`${height} bg-[#1a1a1a] rounded border border-dashed border-[#3a3a3a]`} />
  );

  // explicit skeleton when sample requested
  if (isSample) {
    return (
      <div className="space-y-6">
        {/* channel header */}
        {headerBar('Channel')}
        {sectionBar('h-20')}

        {/* metric headers + boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {['Views','Likes','Comments','Dislikes','Published','Engagement'].map((label,i) => (
            <div key={i} className="space-y-1">
              {headerBar(label, 'w-16')}
              <div className="h-12 rounded-xl border border-dashed border-[#2f2f2f] bg-[#1f1f1f]" />
            </div>
          ))}
        </div>

        {/* engagement and sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            {headerBar('Engagement Funnel', 'w-32')}
            {sectionBar('h-24')}
          </div>
          <div className="space-y-2">
            {headerBar('Sentiment', 'w-24')}
            {sectionBar('h-24')}
          </div>
        </div>

        {/* viewer questions + top comments placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            {headerBar('Viewer Questions', 'w-28')}
            {sectionBar('h-20')}
          </div>
          <div className="space-y-2">
            {headerBar('Top Comments', 'w-24')}
            {sectionBar('h-20')}
          </div>
        </div>

        {/* action / opportunity placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {headerBar('Highlights', 'w-28')}
            {sectionBar('h-20')}
          </div>
          <div className="space-y-2">
            {headerBar('Actionable', 'w-24')}
            {sectionBar('h-20')}
          </div>
          <div className="space-y-2">
            {headerBar('Opportunities', 'w-28')}
            {sectionBar('h-20')}
          </div>
        </div>

        {/* content recommendations */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            {headerBar('Content Rec.', 'w-28')}
            {sectionBar('h-32')}
          </div>
        </div>

        {/* conclusion */}
        <div className="space-y-2">
          {headerBar('Conclusion', 'w-24')}
          {sectionBar('h-24')}
        </div>

        {/* end of skeleton */}
      </div>
    );
  }

  // stats and derived values used throughout the non-sample report
  const stats = report.videoStatistics || {};
  const viewCount = Number(stats.viewCount || 0);
  const likeRate = toPercent(stats.likeCount, viewCount);
  const commentRate = toPercent(stats.commentCount, viewCount);
  // dislike rate should be null when the count is hidden
  const dislikeRate = stats.dislikeCount == null ? null : toPercent(stats.dislikeCount, viewCount);

  // extra ratios useful for creators
  const likeDislikeRatio = stats.dislikeCount == null
    ? '--'
    : stats.dislikeCount === 0
    ? '∞'
    : (Number(stats.likeCount || 0) / Number(stats.dislikeCount)).toFixed(1);
  const subsPerViewRate = viewCount
    ? `${((Number(report.subscriberCount || 0) / viewCount) * 100).toFixed(2)}%`
    : '--';

  // prefer the structured sentiment from the AI response if present;
  // fall back to crude text‑based derivation otherwise.
  const sentiment = report.sentiment && typeof report.sentiment === 'object'
    ? report.sentiment
    : deriveSentiment(report);

  // convert to 0‑100 range; some backends return decimals (e.g. 0.35)
  const sanitize = (n) => {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return 0;
    return num <= 1 ? num * 100 : num;
  };

  const sentimentData = {
    positive: sanitize(sentiment.positive),
    neutral: sanitize(sentiment.neutral),
    negative: sanitize(sentiment.negative),
  };

  // numeric values for rings
  const ringEngagement = parseFloat(report.engagementRate?.toString().replace('%','')||'0');
  const ringSentiment = sentimentData.positive;
  const ringSubsView = viewCount ? ((Number(report.subscriberCount||0)/viewCount)*100) : 0;

  const hasSentiment = typeof sentiment.positive === 'number' && sentiment.positive > 0;
  const hasSubsView = viewCount > 0 && Number(report.subscriberCount || 0) > 0;

  // questions provided on the report object
  const questions = Array.isArray(report.questions) ? report.questions : [];

  // top comments: prefer AI output
  const topComments = Array.isArray(report.topComments) && report.topComments.length
    ? report.topComments
    : [];


  // highlights list from AI
  const highlightsSection = report.highlights && report.highlights.length ? (
    <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-4">
      <h4 className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] mb-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faLightbulb} className="text-[#cfcfcf]" />
        Key Highlights
      </h4>
      <ul className="list-disc list-outside text-sm text-[#d7d7d7] space-y-1 pl-5">
        {report.highlights.map((h, idx) => (
          <li key={idx}>{h}</li>
        ))}
      </ul>
    </div>
  ) : null;

  const questionsSection = questions.length ? (
    <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-4">
      <h4 className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] mb-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faQuestion} className="text-[#cfcfcf]" />
        Viewer Questions
      </h4>
      <ul className="list-disc list-outside text-sm text-[#d7d7d7] space-y-1 pl-5">
        {questions.map((q, idx) => (
          <li key={idx}>{q}</li>
        ))}
      </ul>
    </div>
  ) : null;

  const topCommentsSection = topComments.length ? (
    <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-4">
      <h4 className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] mb-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faStar} className="text-[#cfcfcf]" />
        Top Comments
      </h4>
      <ul className="list-disc list-outside text-sm text-[#d7d7d7] space-y-1 pl-5 max-h-32 overflow-y-auto">
        {topComments.map((c, idx) => (
          <li key={idx} className="break-words">{c}</li>
        ))}
      </ul>
    </div>
  ) : null;

  const [openOps, setOpenOps] = useState(true);
  const [openRec, setOpenRec] = useState(true);
  const [openConcl, setOpenConcl] = useState(true);

  return (
    <div className={`space-y-6 ${isSample ? 'border border-dashed border-[#3a3a3a] p-4' : 'bg-[#1a1a1a] p-4 md:p-6 rounded-xl'}`}>
    {/* Channel Header + quick stats rings */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-row items-center gap-4 flex-wrap">
      <img
        src={report.channelProfile || '/logo.png'}
        alt="Channel"
        className="w-14 h-14 rounded-full border border-[#3a3a3a] object-cover"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-[#ececec] truncate">
          {report.channelName || 'Unknown Channel'}
        </h3>
        <p className="text-xs sm:text-sm text-[#a8a8a8]">
          {formatNumber(report.subscriberCount)} subscribers
        </p>
        <p className="text-xs sm:text-sm text-[#c8c8c8] mt-1 w-full whitespace-normal break-words">
          {report.videoTitle || 'Video title unavailable'}
        </p>
      </div>
    </div>

    {/* quick rings */}
    <div className="flex gap-6 mt-4">
      <div className="flex flex-col items-center text-xs text-[#cfcfcf]">
        <RingChart pct={ringEngagement} color="#4a90e2" />
        <span className="mt-1">Engagement</span>
      </div>
      {hasSentiment ? (
        <div className="flex flex-col items-center text-xs text-[#cfcfcf]">
          <RingChart pct={ringSentiment} color="#24a587" />
          <span className="mt-1">Sentiment</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-xs text-[#cfcfcf]">
          <span className="mt-1">No sentiment data</span>
        </div>
      )}
      {hasSubsView ? (
        <div className="flex flex-col items-center text-xs text-[#cfcfcf]">
          <RingChart pct={ringSubsView} color="#f5a623" />
          <span className="mt-1">Subs/View</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-xs text-[#cfcfcf]">
          <span className="mt-1">No subscribers or views</span>
        </div>
      )}
    </div>
  </div>  {/* end flex-col wrapper */}

    {/* Metrics */}
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <MetricCard compact title="Views" value={formatNumber(stats.viewCount)} icon={faEye} />
      <MetricCard compact title="Likes" value={formatNumber(stats.likeCount)} icon={faThumbsUp} />
      <MetricCard compact title="Comments" value={formatNumber(stats.commentCount)} icon={faComments} />
      {stats.dislikeCount == null ? (
        <MetricCard compact title="Dislikes" value="Hidden" icon={faThumbsDown} />
      ) : (
        <MetricCard compact title="Dislikes" value={formatNumber(stats.dislikeCount)} icon={faThumbsDown} />
      )}
      <MetricCard
        compact
        title="Published"
        value={
          report.videoPostedDate
            ? new Date(report.videoPostedDate).toLocaleDateString()
            : '--'
        }
        icon={faCalendar}
      />
      <MetricCard compact title="Engagement" value={report.engagementRate || '0.00%'} icon={faChartLine} />
    </div>

    {/* Engagement + Sentiment */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-4">
        <h4 className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="text-[#cfcfcf]" />
          Engagement Funnel
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs sm:text-sm text-[#cfcfcf] mb-1">
              <span>Like Rate</span>
              <span>{likeRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#121212] border border-[#2f2f2f] overflow-hidden">
              <div className="h-full bg-[#6a6a6a]" style={{ width: `${likeRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs sm:text-sm text-[#cfcfcf] mb-1">
              <span>Comment Rate</span>
              <span>{commentRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#121212] border border-[#2f2f2f] overflow-hidden">
              <div className="h-full bg-[#6a6a6a]" style={{ width: `${commentRate}%` }} />
            </div>
          </div>
          {dislikeRate != null && (
            <div>
              <div className="flex justify-between text-xs sm:text-sm text-[#cfcfcf] mb-1">
                <span>Dislike Rate</span>
                <span>{dislikeRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#121212] border border-[#2f2f2f] overflow-hidden">
                <div className="h-full bg-[#6a6a6a]" style={{ width: `${dislikeRate}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>


      <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-4">
        <h4 className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faSmile} className="text-[#cfcfcf]" />
          Sentiment Distribution
        </h4>
        {/* show bars for clarity alongside the existing line chart */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs sm:text-sm text-[#cfcfcf] mb-1">
              <span>Positive</span>
              <span>{sentimentData.positive}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#121212] border border-[#2f2f2f] overflow-hidden">
              <div className="h-full bg-[#10b981]" style={{ width: `${sentimentData.positive}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs sm:text-sm text-[#cfcfcf] mb-1">
              <span>Neutral</span>
              <span>{sentimentData.neutral}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#121212] border border-[#2f2f2f] overflow-hidden">
              <div className="h-full bg-[#6a6a6a]" style={{ width: `${sentimentData.neutral}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs sm:text-sm text-[#cfcfcf] mb-1">
              <span>Negative</span>
              <span>{sentimentData.negative}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#121212] border border-[#2f2f2f] overflow-hidden">
              <div className="h-full bg-[#ef4444]" style={{ width: `${sentimentData.negative}%` }} />
            </div>
          </div>
        </div>

      </div>
    </div>

    <hr className="border-[#2f2f2f] my-6" />

    <hr className="border-[#2f2f2f] my-6" />

    {/* viewer questions + top comments placeholders */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {questionsSection}
      {topCommentsSection}
    </div>

    <hr className="border-[#2f2f2f] my-6" />

    {/* action / opportunity placeholders */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {highlightsSection}
      {report.actionableSteps && report.actionableSteps.length > 0 && (
        <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-4">
          <h4 className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faTasks} className="text-[#cfcfcf]" />
            Actionable
          </h4>
          {renderTextList(report.actionableSteps)}
        </div>
      )}
      {report.opportunities && report.opportunities.length > 0 && (
        <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a]">
          <button
            className="w-full text-left px-4 py-2 flex items-center justify-between"
            onClick={() => setOpenOps(o => !o)}
          >
            <span className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] flex items-center gap-2">
              <FontAwesomeIcon icon={faBullseye} className="text-[#cfcfcf]" />
              Opportunities
            </span>
            <svg
              className={`w-4 h-4 transform transition-transform ${openOps ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openOps && <div className="pt-2 pb-4 px-4">{renderTextList(report.opportunities)}</div>}
        </div>
      )}
    </div>

    <hr className="border-[#2f2f2f] my-6" />

    {/* content recommendations */}
    <div className="grid grid-cols-1 gap-4">
      {report.suggestions && report.suggestions.length > 0 && (
        <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a]">
          <button
            className="w-full text-left px-4 py-2 flex items-center justify-between"
            onClick={() => setOpenRec(r => !r)}
          >
            <span className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] flex items-center gap-2">
              <FontAwesomeIcon icon={faList} className="text-[#cfcfcf]" />
              Content Recommendations
            </span>
            <svg
              className={`w-4 h-4 transform transition-transform ${openRec ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openRec && (
            <div className="pt-2 pb-4 px-4 space-y-2">
              {report.suggestions.map((s, i) => (
                <div key={i} className="">
                  <div className="flex items-center gap-2">
                    <span className="text-[#d7d7d7]">•</span>
                    <div className="flex-1">
                      <p
                        className="font-medium text-xs sm:text-sm text-[#d7d7d7] leading-tight"
                        dangerouslySetInnerHTML={{
                          __html: mdToHtml(s.recommendation || s),
                        }}
                      />
                      {s.reason && <p className="text-xs sm:text-sm text-[#a0a0a0] italic mt-1 leading-5">Why: {s.reason}</p>}
                      {s.implementation && <p className="text-xs sm:text-sm text-[#b0b0b0] mt-1 leading-5">How: {s.implementation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    <hr className="border-[#2f2f2f] my-6" />
    {/* conclusion */}
    <div className="rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a]">
      <button
        className="w-full text-left px-4 py-2 flex items-center justify-between"
        onClick={() => setOpenConcl(c => !c)}
      >
        <span className="text-xs sm:text-sm uppercase tracking-wide text-[#9f9f9f] flex items-center gap-2">
          <FontAwesomeIcon icon={faCheck} className="text-[#cfcfcf]" />
          Conclusion
        </span>
        <svg
          className={`w-4 h-4 transform transition-transform ${openConcl ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openConcl && <div className="pt-2 pb-4 px-4">{renderTextList(report.conclusion)}</div>}
    </div>


  </div>
);
};

// cache previous reports by videoId+stats so we can skip backend analysis when nothing changed
const analyticsCache = new Map();

const makeCacheKey = (videoId, stats) => {
  // only need counts
  const { viewCount, likeCount, commentCount, dislikeCount } = stats || {};
  return `${videoId}:${viewCount}:${likeCount}:${commentCount}:${dislikeCount}`;
};

const CommentSummarizer = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // treat any fetched report object (even with empty fields) as "live" so we
  // render the real structure; sample skeleton only shows before first fetch.
  const hasLiveReport = report !== null;
  const showSample = report === null && !isLoading;

  // if there's no live report yet we don't need any data for the wireframe
  // since `isSample` will cause skeleton elements to render. an empty object
  // avoids option chaining elsewhere.
  const reportToDisplay = report || {};

  const handleInputChange = (e) => {
    setVideoUrl(e.target.value);
    setError('');
    if (report) setReport(null);
  };

  const fetchComments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        setError('Invalid YouTube URL'); toast.error('Invalid YouTube URL');
        toast.error('Invalid YouTube URL');
        return;
      }

      const videoDetailsResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,statistics`
      );

      if (!videoDetailsResponse.data?.items?.length) {
        setError('Could not fetch video details from YouTube.'); toast.error('Could not fetch video details from YouTube.');
        toast.error('Could not fetch video details');
        return;
      }

      const videoSnippet = videoDetailsResponse.data.items[0].snippet;
      let videoStatistics = videoDetailsResponse.data.items[0].statistics || {};
      const videoTitle = videoSnippet.title;
      const channelId = videoSnippet.channelId;
      const videoPostedDate = videoSnippet.publishedAt;
      const videoThumbnail = videoSnippet.thumbnails?.high?.url || '';
      // check cache key before doing backend analysis
      const cacheKey = makeCacheKey(videoId, videoStatistics);
      if (analyticsCache.has(cacheKey)) {
        const cached = analyticsCache.get(cacheKey);
        setReport(cached);
        setIsLoading(false);
        toast.success('Report loaded from cache');
        return;
      }
      // YouTube sometimes hides the dislike count; the API then omits the field completely.
      // We want to treat that case as "unknown" rather than zero so the analytics
      // calculations and UI don't make misleading assumptions.
      if (!('dislikeCount' in videoStatistics)) {
        videoStatistics = { ...videoStatistics, dislikeCount: null };
      } else {
        // make sure it's a number when present
        videoStatistics.dislikeCount = Number(videoStatistics.dislikeCount);
      }

      const channelDetailsResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${YOUTUBE_API_KEY}&part=snippet,statistics`
      );

      const channelData = channelDetailsResponse.data?.items?.[0] || {};
      const channelName = channelData?.snippet?.title || 'Unknown Channel';
      const channelProfile = channelData?.snippet?.thumbnails?.default?.url || '/logo.png';
      const subscriberCount = channelData?.statistics?.subscriberCount || 0;

      const commentResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/commentThreads?key=${YOUTUBE_API_KEY}&part=snippet&videoId=${videoId}`
      );
      const commentsData = (commentResponse.data?.items || []).map((item) => item.snippet.topLevelComment.snippet.textDisplay);

      const engagementRate = calculateEngagementRate(
        videoStatistics.likeCount || 0,
        videoStatistics.commentCount || 0,
        videoStatistics.viewCount || 0
      );

      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const backendResponse = await axios.post(`${apiUrl}/api/generate-content`, {
        comments: commentsData.join('\n'),
        videoTitle,
        channelName,
        videoStatistics,
        videoPostedDate,
        engagementRate,
        subscriberCount,
        likes: videoStatistics.likeCount,
        dislikes: videoStatistics.dislikeCount,
        views: videoStatistics.viewCount,
      });

      // backend now returns a parsed object under `parsed` (and raw string if needed)
      const backendData = backendResponse.data || {};
      // console.log('AI backend response object:', backendData);
      
      // after we derive final report object below we will cache it

      if (!backendData || typeof backendData !== 'object') {
        setError('Error fetching or processing comments. Please try again later.'); toast.error('Error fetching or processing comments. Please try again later.');
        toast.error('Error processing data');
        return;
      }

      // prefer structured result if available
      let aiData = backendData.parsed || backendData.aiData || null;
      const rawText = backendData.raw || backendData.text || backendData.geminiResponse || '';
      if (!aiData || typeof aiData !== 'object') {
        console.error('Expected parsed AI data object but got', aiData, 'raw:', rawText);
        setError('AI returned invalid data.'); toast.error('AI returned invalid data.');
        toast.error('AI returned invalid data');
        return;
      }

      let parsedSuggestions = [];
      let parsedConclusion = [];
      let sentimentObj = null;
      let questionsList = [];
      let highlightsList = [];
      let statsComparison = null;
      let actionableList = [];
      let opportunityList = [];
      // other structured fields
      let radarMetrics = null;
      let funnelData = null;
      let emotionSpectrum = null;
      let commentIntentData = null;

      // once we build report object we will store cache before setReport

      if (aiData) {
        // helper that normalizes a field into an array of strings
        const asArray = (v) => {
          if (typeof v === 'string' && v.trim()) return [v];
          if (Array.isArray(v)) return v.filter((x) => !!x);
          if (typeof v === 'object' && v !== null) return [JSON.stringify(v)];
          return [];
        };

        // support the new name used by some backends
      parsedSuggestions = asArray(aiData.suggestions || aiData.contentRecommendations);
        parsedConclusion = asArray(aiData.conclusion);
        sentimentObj = aiData.sentiment || null;
        questionsList = Array.isArray(aiData.questions) ? aiData.questions : [];
        highlightsList = Array.isArray(aiData.highlights) ? aiData.highlights : [];
        statsComparison = aiData.statsComparison || null;
        actionableList = Array.isArray(aiData.actionableSteps) ? aiData.actionableSteps : [];
        opportunityList = Array.isArray(aiData.opportunities) ? aiData.opportunities : [];
        radarMetrics = aiData.radarMetrics || null;
        funnelData = aiData.funnel || null;
        emotionSpectrum = aiData.emotionSpectrum || null;
        commentIntentData = aiData.commentIntent || null;
      }
      // provide helpful placeholders when the AI output is empty
      if (parsedSuggestions.length === 0) {
        parsedSuggestions = ['(no suggestions generated)'];
      }
      if (parsedConclusion.length === 0) {
        parsedConclusion = ['(no conclusion generated)'];
      }
      if (highlightsList.length === 0) {
        highlightsList = ['(no highlights)'];
      }

      const finalReport = {
        suggestions: parsedSuggestions,
        conclusion: parsedConclusion,
        videoStatistics,
        videoPostedDate,
        channelName,
        channelProfile,
        videoTitle,
        videoThumbnail,
        subscriberCount,
        engagementRate,
        // additional structured info
        sentiment: sentimentObj,
        questions: questionsList,
        highlights: highlightsList,
        statsComparison,
        actionableSteps: actionableList,
        // metrics directly from AI response (may be null/undefined)
        radarMetrics: aiData?.radarMetrics || null,
        funnel: aiData?.funnel || null,
        emotionSpectrum: aiData?.emotionSpectrum || null,
        commentIntent: aiData?.commentIntent || null,
        // normalize opportunity matrix name (backend may return either key)
        opportunityMatrix: aiData && Array.isArray(aiData.opportunityMatrix)
          ? aiData.opportunityMatrix
          : aiData && Array.isArray(aiData.opportunities)
          ? aiData.opportunities
          : [],
        // top comments from AI override raw scraped comments
        topComments: aiData && Array.isArray(aiData.topComments) && aiData.topComments.length
          ? aiData.topComments.slice(0, 5)
          : commentsData.slice(0, 5),
      };
      // cache result for this stats key
      analyticsCache.set(cacheKey, finalReport);
      setReport(finalReport);
      toast.success('Report generated');
    } catch (requestError) {
      setError('Error fetching comments or generating report. Please try again later.'); toast.error('Error fetching comments or generating report. Please try again later.');
      toast.error('Failed to fetch/generate report');
      console.error('Error:', requestError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchComments = async (e) => {
    if (e) e.preventDefault();
    fetchComments();
  };

  return (
    <AppSidebarShell title="Analysis">
      <div className="max-w-full sm:max-w-6xl w-full mx-auto px-4 sm:px-6 text-[#ececec]">
        {/* header + form shown only before report generated */}
        {!hasLiveReport ? (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#171717] p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-semibold text-center mb-3">YouTube Video Analyzer</h1>
            <p className="text-[#a8a8a8] text-center mb-8 max-w-3xl mx-auto">
              Paste a YouTube URL to generate a structured creator report with metrics, sentiment overview, and actionable next steps.
            </p>

            <form onSubmit={handleFetchComments} className="space-y-3">
              <div className="flex flex-col md:flex-row items-stretch gap-3">
                <input
                  type="text"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={handleInputChange}
                  placeholder="Paste YouTube URL here"
                  className="w-full rounded-lg bg-[#111] border border-[#2f2f2f] px-4 py-3 text-sm text-[#d6d6d6] placeholder:text-[#8f8f8f] outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-[#3b3b3b] bg-[#2a2a2a] px-5 py-3 text-sm font-semibold hover:bg-[#323232] disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              <p className="text-xs text-[#8f8f8f]">Example: https://youtube.com/watch?v=dQw4w9WgXcQ</p>
            </form>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Analysis Report:</h2>
            <button
              onClick={() => window.location.href = '/'}
              className="text-sm text-[#a8a8a8] hover:text-[#ececec] flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
        )}

        <div className="mt-8">
          {isLoading ? (
            <div className="rounded-xl border border-[#2f2f2f] bg-[#171717] p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-5 w-44 bg-[#2b2b2b] rounded" />
                <div className="h-4 w-full bg-[#242424] rounded" />
                <div className="h-4 w-5/6 bg-[#242424] rounded" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="h-24 bg-[#1f1f1f] rounded-lg border border-[#2f2f2f]" />
                  <div className="h-24 bg-[#1f1f1f] rounded-lg border border-[#2f2f2f]" />
                  <div className="h-24 bg-[#1f1f1f] rounded-lg border border-[#2f2f2f]" />
                </div>
              </div>
            </div>
          ) : showSample ? (
            <div className="rounded-xl border border-dashed border-[#3a3a3a] p-4">
              <h3 className="text-lg font-semibold mb-2">Sample Analysis Report</h3>
              <WireframeReport report={reportToDisplay} isSample />
            </div>
          ) : hasLiveReport ? (
            <WireframeReport report={reportToDisplay} isSample={false} />
          ) : null}
        </div>
      </div>
    </AppSidebarShell>
  );
};

export default CommentSummarizer;
