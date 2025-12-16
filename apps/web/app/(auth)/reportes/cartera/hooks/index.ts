export {
  usePortfolioReport,
  useActiveClientsWithCVStatus,
  usePeriodNavigation,
  useLocalityReport,
  useLocalityClients,
  useAnnualPortfolioData,
} from './usePortfolioReport'

export type {
  PeriodType,
  Trend,
  CVStatus,
  WeekRange,
  ClientBalanceData,
  PeriodComparison,
  PortfolioSummary,
  WeeklyPortfolioData,
  LocationBreakdown,
  RenovationKPIs,
  PortfolioReport,
  ActiveClientStatus,
  PortfolioFilters,
  PDFGenerationResult,
  // Locality types
  ClientCategory,
  LocalityWeekData,
  LocalitySummary,
  LocalityBreakdownDetail,
  LocalityReport,
  LocalityClientDetail,
  // Annual data types
  AnnualPortfolioDataPoint,
} from './usePortfolioReport'
