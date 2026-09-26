import { apiRequest } from './client';

export async function exportGedcom(treeId: string): Promise<string> {
  const res = await fetch(`/api/trees/${treeId}/gedcom`);
  return res.text();
}

export async function importGedcom(treeId: string, gedcomText: string): Promise<any> {
  return apiRequest(`/trees/${treeId}/gedcom`, {
    method: 'POST',
    body: gedcomText,
    headers: { 'Content-Type': 'text/plain' },
  });
}
