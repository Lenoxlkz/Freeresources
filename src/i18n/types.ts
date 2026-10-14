export type LanguageCode = 
  | 'es' 
  | 'en';

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸', region: 'Internacional' },
  { code: 'en', name: 'Inglés', nativeName: 'English', flag: '🇺🇸', region: 'Global' },
];

export interface TranslationDictionary {
  topBar: {
    directory: string;
    compareMatrix: string;
    installGuide: string;
    language: string;
    apiQuota: string;
    syncGitHub: string;
    syncing: string;
    syncedJustNow: string;
    syncedAt: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    searchPlaceholder: string;
    statApps: string;
    statStars: string;
    statPlatforms: string;
    clearSearch: string;
    liveApiActive: string;
  };
  categories: {
    all: string;
    youtubeMusic: string;
    spotify: string;
    offline: string;
    selfHosted: string;
    tools: string;
  };
  filterControls: {
    title: string;
    filterByOS: string;
    filterByFeatures: string;
    sortBy: string;
    sortStars: string;
    sortName: string;
    sortUpdated: string;
    clearOS: string;
    resetAll: string;
    activeFilters: string;
    features: {
      backgroundPlayback: string;
      offlineDownloads: string;
      syncedLyrics: string;
      androidAuto: string;
      losslessAudio: string;
      sponsorBlock: string;
      equalizer: string;
      noAccountNeeded: string;
    };
  };
  catalog: {
    showing: string;
    appsFound: string;
    emptyTitle: string;
    emptySubtitle: string;
    emptyReset: string;
    viewLabel: string;
    viewGrid: string;
    viewList: string;
  };
  appCard: {
    live: string;
    inList: string;
    compare: string;
    maxCompare: string;
    compatibleOS: string;
    latestReleaseTitle: string;
    interactiveHint: string;
    changeVersionDownload: string;
    audioSources: string;
    stack: string;
    detailsAndSources: string;
    downloadTitle: string;
    viewRepo: string;
    visitWebsite: string;
  };
  releaseModal: {
    titlePrefix: string;
    subtitle: string;
    step1Title: string;
    interactiveBanner: string;
    selectVersionLabel: string;
    latestBadge: string;
    preReleaseBadge: string;
    recommendedBadge: string;
    installersAvailable: string;
    showChangelog: string;
    hideChangelog: string;
    step2Title: string;
    filterAll: string;
    filterAndroid: string;
    filterWindows: string;
    filterMac: string;
    filterLinux: string;
    downloadButton: string;
    downloadingButton: string;
    downloadSuccess: string;
    notStartingHelp: string;
    officialServerNotice: string;
    close: string;
    noReleasesTitle: string;
    noReleasesSubtitle: string;
    downloadSourceZip: string;
    registeredVersionsSuffix: string;
    tapToSwitch: string;
    tapToSelectVersion: string;
    activeBadge: string;
    tapHint: string;
    installerBinary: string;
    zipArchive: string;
    linuxPackage: string;
    downloadsCountSingular: string;
    downloadsCountPlural: string;
    noFilteredAssets: string;
  };
  quotaModal: {
    title: string;
    subtitle: string;
    currentStatus: string;
    defaultApiBadge: string;
    customApiBadge: string;
    availableRequests: string;
    consumedRequests: string;
    syncNow: string;
    syncing: string;
    quotaExhaustedTitle: string;
    countdownMessage: string;
    defaultApiOptionTitle: string;
    defaultApiOptionDesc: string;
    defaultApiProtected: string;
    customApiOptionTitle: string;
    customApiOptionDesc: string;
    tokenInputLabel: string;
    tokenPlaceholder: string;
    useDefaultButton: string;
    saveVerifyButton: string;
    verifying: string;
    tokenNotice: string;
    generateTokenLink: string;
    close: string;
  };
  languageModal: {
    title: string;
    subtitle: string;
    autoDetectBadge: string;
    detectedMessage: string;
    selectLanguagePrompt: string;
    currentActive: string;
    autoInUse: string;
    savedPreference: string;
    close: string;
  };
  appDetailModal: {
    syncedViaGitHub: string;
    featured: string;
    license: string;
    version: string;
    stars: string;
    forks: string;
    inCompare: string;
    compare: string;
    close: string;
    latestReleaseTitle: string;
    latestReleaseDesc: string;
    selectVersionAndDownload: string;
    installationFilesTitle: string;
    published: string;
    exploreAllReleases: string;
    osCompatibilityTitle: string;
    officialChannelsTitle: string;
    audioAndStackTitle: string;
    audioOriginLabel: string;
    techStackLabel: string;
    featuresTitle: string;
    viewOnGitHub: string;
    done: string;
    sourceTypes: {
      store: string;
      packageManager: string;
      direct: string;
      repo: string;
    };
    features: {
      backgroundPlayback: string;
      offlineDownloads: string;
      syncedLyrics: string;
      androidAuto: string;
      losslessAudio: string;
      sponsorBlock: string;
      equalizer: string;
      noAccountNeeded: string;
    };
  };
  compareDrawer: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDesc: string;
    exploreButton: string;
    attributeCol: string;
    viewDetails: string;
    downloadLatest: string;
    clearAll: string;
    close: string;
    pressEsc: string;
  };
  installGuide: {
    title: string;
    subtitle: string;
    close: string;
  };
  footer: {
    description: string;
    openSourceCatalog: string;
    builtWith: string;
    communityNotice: string;
  };
}
