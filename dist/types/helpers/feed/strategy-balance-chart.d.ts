export function balanceChartPoints(history: any): any;
export function splitBalanceSegments(points: any, valueKey: any, baseline: any): {
    tone: string;
    points: {
        timestamp: any;
        value: any;
    }[];
}[];
export function balanceChartDomain(points: any, baseline: any, logScale?: boolean): {
    minimum: number;
    maximum: number;
    useLog: boolean;
    project: (value: any) => any;
};
