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
  return `${currentDay} - ${corporateAccount}`;
}
