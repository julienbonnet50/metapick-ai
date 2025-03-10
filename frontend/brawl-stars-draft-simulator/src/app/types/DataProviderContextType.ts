interface DataProviderContextType {
  brawlers: Brawler[];
  maps: MapBs[];
  baseUrl: string;
  isLoading: boolean;
  latestVersion: GameVersion | null;
  storageKey: string;
}