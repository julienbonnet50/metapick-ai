interface StatsComponentProps {
    statsData: any[];
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    handleSort: (key: string) => void;
    brawlers: any[];
}