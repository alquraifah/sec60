import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export interface AnalyzePayload {
  city: string;
  facility_type: string;
  system_type?: string;
  monthly_bill_sar?: number;
  monthly_consumption_kwh?: number;
}

export async function analyzeProject(payload: AnalyzePayload) {
  const res = await api.post('/analyze', payload);
  return res.data;
}

export async function fetchCities() {
  const res = await api.get('/cities');
  return res.data.cities;
}

export async function uploadBillOCR(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/ocr-bill', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function generateReport(
  analysis: Record<string, unknown>,
  language: string = 'en'
) {
  const res = await api.post('/generate-report', { analysis, language });
  return res.data;
}

export function getReportDownloadUrl(filename: string): string {
  return `${API_BASE}/download-report/${filename}`;
}

export async function checkHealth() {
  const res = await api.get('/health');
  return res.data;
}
