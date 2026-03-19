import { AnalysisReport } from "@/types";

// This is the interface that will be replaced by real API calls later
export async function fetchAnalysis(appUrl: string): Promise<AnalysisReport> {
  // TODO: Replace with real API call
  // return await apiClient.post('/api/analyze', { url: appUrl })

  // Suppress unused variable warning for now
  void appUrl;

  // For now, use mock data
  const { getMockAnalysis } = await import("@/data/mock-data");
  return getMockAnalysis();
}
