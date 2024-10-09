import { HttpResponse } from '@angular/common/http';

export function downloadReport(event: HttpResponse<Blob>, fileName: string) {
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(event.body as Blob);
  link.href = objectUrl;
  link.download = `${fileName}.xlsx`;
  link.click();
  URL.revokeObjectURL(objectUrl); // Clean up the URL object
}

export function generateFileName(
  corporateAccount?: string,
  currentDay?: string,
) {
  const today = currentDay ?? new Date().toLocaleDateString(); // Use current date if currentDay is null or undefined
  return `${today} - ${corporateAccount ?? 'Unknown Account'}`; // Fallback for corporateAccount if needed
}

