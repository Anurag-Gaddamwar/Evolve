declare module '../../../services/youtubeService' {
  export function validateChannelId(channelId: string): Promise<boolean>;
}
