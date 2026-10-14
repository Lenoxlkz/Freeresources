export type Platform = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'web';

export type AppCategory = 'youtube-music' | 'spotify' | 'offline' | 'self-hosted' | 'tools';

export type LicenseType = 
  | 'GPL-3.0' 
  | 'GPL-2.0' 
  | 'AGPL-3.0' 
  | 'MIT' 
  | 'Apache-2.0' 
  | 'MPL-2.0' 
  | 'BSD-3-Clause'
  | 'Open-Source';

export type AppStatus = 'active' | 'mature' | 'discontinued';

export interface InstallSource {
  name: string;
  url: string;
  label?: string;
  type: 'store' | 'package-manager' | 'direct' | 'repo';
}

export interface AppFeatures {
  backgroundPlayback: boolean;
  offlineDownloads: boolean;
  syncedLyrics: boolean;
  androidAuto: boolean;
  losslessAudio: boolean;
  sponsorBlock: boolean;
  equalizer: boolean;
  noAccountNeeded: boolean;
  spotifySync?: boolean;
  scrobbling?: boolean;
}

export interface AppItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: AppCategory;
  platforms: Platform[];
  githubRepo?: string; // owner/repo format for GitHub API calls
  githubUrl: string;
  websiteUrl?: string;
  license: LicenseType;
  status: AppStatus;
  stars: number;
  forks: number;
  latestVersion: string;
  lastUpdated: string;
  features: AppFeatures;
  audioSources: string[];
  installSources: InstallSource[];
  techStack: string[];
  featured?: boolean;
  accentColor?: string;
}

export interface DirectoryFilters {
  searchQuery: string;
  selectedCategory: AppCategory | 'all';
  selectedPlatforms: Platform[];
  selectedStatus: AppStatus | 'all';
  featureFilters: Partial<Record<keyof AppFeatures, boolean>>;
  sortBy: 'stars' | 'name' | 'recently-updated';
}

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  size: number;
  downloadCount?: number;
}

export interface GitHubRelease {
  id: number;
  tagName: string;
  name: string;
  htmlUrl: string;
  publishedAt: string;
  prerelease: boolean;
  body?: string;
  assets: ReleaseAsset[];
}

export interface GitHubRepoStats {
  stars: number;
  forks: number;
  latestReleaseTag?: string;
  latestReleaseUrl?: string;
  latestReleaseDate?: string;
  releaseAssets?: ReleaseAsset[];
  pushedAt?: string;
  openIssues?: number;
  verifiedHtmlUrl?: string;
  licenseSpdx?: string;
  isLoading?: boolean;
  fetchedAt?: string;
}

export const PLATFORM_METADATA: Record<Platform, { label: string; short: string; badge: string }> = {
  android: { label: 'Android', short: 'AND', badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' },
  ios: { label: 'iOS', short: 'iOS', badge: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60' },
  windows: { label: 'Windows', short: 'WIN', badge: 'bg-sky-950/60 text-sky-400 border-sky-800/60' },
  macos: { label: 'macOS', short: 'MAC', badge: 'bg-purple-950/60 text-purple-400 border-purple-800/60' },
  linux: { label: 'Linux', short: 'LIN', badge: 'bg-amber-950/60 text-amber-400 border-amber-800/60' },
  web: { label: 'Web', short: 'WEB', badge: 'bg-teal-950/60 text-teal-400 border-teal-800/60' },
};
