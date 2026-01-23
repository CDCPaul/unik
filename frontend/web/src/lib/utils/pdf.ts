import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { pdf } from '@react-pdf/renderer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { ReactElement } from 'react';

/**
 * Generate PDF from @react-pdf/renderer Document component
 */
export async function generatePdfFromReactPDF(
  document: ReactElement,
  filename: string
): Promise<Blob> {
  try {
    console.log(`📄 Generating PDF with @react-pdf/renderer: ${filename}`);
    
    const blob = await pdf(document as any).toBlob();
    
    console.log(`✅ PDF generated successfully: ${filename}`);
    return blob;
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw new Error(`PDF 생성에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate PDF from HTML element with auto page splitting
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<Blob> {
  try {
    // Ensure element is visible and has dimensions
    if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
      throw new Error('Element is not visible or has no dimensions');
    }

    console.log(`📄 Generating PDF: ${filename}`);
    console.log(`📐 Element size: ${element.offsetWidth}x${element.offsetHeight}`);

    // html2canvas options with lab() color fix
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true, // Allow cross-origin images
      logging: false, // Disable console logs
      backgroundColor: '#ffffff',
      width: element.offsetWidth,
      height: element.offsetHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      // Fix modern CSS colors before rendering
      onclone: (clonedDoc) => {
        // Ensure all backgrounds are rendered
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const computedStyle = window.getComputedStyle(el);
          
          // Force print all backgrounds
          (htmlEl.style as any).webkitPrintColorAdjust = 'exact';
          htmlEl.style.printColorAdjust = 'exact';
          
          // Fix color property
          if (computedStyle.color && computedStyle.color.includes('lab')) {
            htmlEl.style.color = 'rgb(15, 23, 42)'; // slate-900
          }
          
          // Fix background-color
          if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('lab')) {
            htmlEl.style.backgroundColor = 'rgb(255, 255, 255)'; // white
          }
          
          // Fix border-color
          if (computedStyle.borderColor && computedStyle.borderColor.includes('lab')) {
            htmlEl.style.borderColor = 'rgb(226, 232, 240)'; // slate-200
          }
        });
      }
    });

    console.log(`🖼️ Canvas created: ${canvas.width}x${canvas.height}`);

    // Verify canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has no dimensions');
    }

    // A4 dimensions in mm
    const pageWidth = 210; // A4 width
    const pageHeight = 297; // A4 height
    
    // Calculate image dimensions to fit A4 width
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Verify image data
    if (!imgData || !imgData.startsWith('data:image/png')) {
      throw new Error('Invalid image data from canvas');
    }

    // Only add one page if content fits
    if (imgHeight <= pageHeight) {
      pdf.addImage(
        imgData, 
        'PNG', 
        0, 
        0, 
        imgWidth, 
        imgHeight,
        undefined,
        'FAST'
      );
      console.log(`✅ PDF generated successfully: ${filename} (1 page)`);
    } else {
      // Split into multiple pages if content is too tall
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 0;

      while (heightLeft > 0) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData, 
          'PNG', 
          0, 
          position, 
          imgWidth, 
          imgHeight,
          undefined,
          'FAST'
        );

        heightLeft -= pageHeight;
        position -= pageHeight;
        pageNumber++;
      }
      console.log(`✅ PDF generated successfully: ${filename} (${pageNumber} pages)`);
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw new Error(`PDF 생성에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Download PDF blob to user's device
 */
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Upload PDF blob to Firebase Storage
 */
export async function uploadPdfToStorage(
  blob: Blob,
  ticketId: string,
  passengerName: string
): Promise<string> {
  try {
    const storageRef = ref(storage, `tickets/pdf/${ticketId}/${passengerName}.pdf`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading PDF to storage:', error);
    throw error;
  }
}

