/**
 * Extract text content from PDF file
 * Using dynamic import to avoid SSR issues
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues in Next.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker path for Next.js (must be done after import)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with spaces
      const pageText = textContent.items
        .map((item: any) => {
          // Handle items with str property
          if (typeof item === 'object' && 'str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    throw new Error(`PDF 텍스트 추출에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if file is PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

