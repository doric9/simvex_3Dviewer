import { jsPDF } from 'jspdf';
import { Note, AIMessage } from '../types';
import { MachineryProgress } from './aiService';
import { KOREAN_FONT_BASE64 } from './koreanFont';

/**
 * Generates a PDF with the 3D viewer screenshot, notes, and AI conversation.
 * Uses direct canvas capture for WebGL content instead of html2canvas.
 */
export async function generatePDF(
  machineryName: string,
  viewerElement: HTMLElement,
  notes: string,
  aiConversation: { role: string; content: string }[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true
  });

  try {
    pdf.addFileToVFS('NanumGothic-Regular.ttf', KOREAN_FONT_BASE64);
    pdf.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
    pdf.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'bold');
    pdf.setFont('NanumGothic');
  } catch (error) {
    console.error('[PDF] Font registration failed:', error);
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Title
  pdf.setFontSize(20);
  pdf.text(`SIMVEX - ${machineryName}`, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.text(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, margin, yPosition);
  yPosition += 15;

  // Capture 3D Viewer - use WebGL canvas directly
  try {
    // Find the WebGL canvas inside the viewer element
    const canvas = viewerElement.querySelector('canvas') as HTMLCanvasElement;

    if (canvas) {
      const imgData = canvas.toDataURL('image/png');

      // Detect blank canvas: render to a tiny offscreen canvas and check if all pixels are empty
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const testCtx = testCanvas.getContext('2d');
      let isBlank = true;
      if (testCtx) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            testCtx.drawImage(img, 0, 0, 1, 1);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = imgData;
        });
        const pixel = testCtx.getImageData(0, 0, 1, 1).data;
        isBlank = pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] === 0;
      }

      if (!isBlank) {
        const imgWidth = pageWidth - margin * 2;
        const aspectRatio = canvas.height / canvas.width;
        const imgHeight = imgWidth * aspectRatio;

        if (yPosition + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, 100));
        yPosition += Math.min(imgHeight, 100) + 10;
      }
    }
  } catch (error) {
    console.error('3D 캡처 실패:', error);
  }

  // Notes Section
  if (notes && notes.trim()) {
    if (yPosition + 20 > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text('학습 노트', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    // Handle Korean text by keeping lines shorter
    const noteLines = pdf.splitTextToSize(notes, pageWidth - margin * 2);
    noteLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      // Use try-catch for each line in case of encoding issues
      try {
        pdf.text(line, margin, yPosition);
      } catch {
        pdf.text('[텍스트 인코딩 오류]', margin, yPosition);
      }
      yPosition += 5;
    });
    yPosition += 10;
  }

  // AI Conversation Section
  if (aiConversation.length > 0) {
    if (yPosition + 20 > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text('AI 어시스턴트 대화', margin, yPosition);
    yPosition += 7;

    aiConversation.forEach((msg) => {
      if (yPosition > pageHeight - margin - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(10);
      pdf.setFont('NanumGothic', 'bold');
      const roleLabel = msg.role === 'user' ? '질문:' : 'AI:';
      pdf.text(roleLabel, margin, yPosition);
      yPosition += 5;

      pdf.setFont('NanumGothic', 'normal');
      try {
        const msgLines = pdf.splitTextToSize(msg.content, pageWidth - margin * 2);
        msgLines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        });
      } catch {
        pdf.text('[메시지 인코딩 오류]', margin, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
    });
  }

  // Download PDF
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`SIMVEX_${machineryName}_${timestamp}.pdf`);
  } catch (saveError) {
    console.error('[PDF] Save failed:', saveError);
  }
}

/**
 * Generates an enhanced Study Summary PDF with notes grouped by part,
 * quiz results with corrections, and AI conversation highlights.
 */
export async function generateStudySummaryPDF(
  machineryName: string,
  viewerElement: HTMLElement | null,
  notes: Note[],
  aiMessages: AIMessage[],
  progress: MachineryProgress | null
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true
  });

  try {
    pdf.addFileToVFS('NanumGothic-Regular.ttf', KOREAN_FONT_BASE64);
    pdf.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
    pdf.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'bold');
    pdf.setFont('NanumGothic');
  } catch (error) {
    console.error('[PDF] Font registration failed:', error);
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Helper function to check and add new page
  const checkNewPage = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to draw section header
  const drawSectionHeader = (title: string) => {
    checkNewPage(25);
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, margin + 3, yPosition + 5.5);
    pdf.setTextColor(0, 0, 0);
    yPosition += 12;
  };

  // ===== TITLE SECTION =====
  pdf.setFontSize(22);
  pdf.setFont('NanumGothic', 'bold');
  pdf.text('SIMVEX 학습 요약', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(14);
  pdf.setFont('NanumGothic', 'normal');
  pdf.text(machineryName, margin, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`생성일: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}`, margin, yPosition);
  pdf.setTextColor(0, 0, 0);
  yPosition += 15;

  // ===== STATS OVERVIEW =====
  checkNewPage(30);
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, pageWidth - margin * 2, 20, 'F');

  const statsY = yPosition + 8;
  const colWidth = (pageWidth - margin * 2) / 3;

  pdf.setFontSize(16);
  pdf.setFont('NanumGothic', 'bold');
  pdf.text(String(notes.length), margin + colWidth * 0.5, statsY, { align: 'center' });
  pdf.text(`${progress ? Math.round(progress.quiz_accuracy * 100) : 0}%`, margin + colWidth * 1.5, statsY, { align: 'center' });
  pdf.text(String(aiMessages.length), margin + colWidth * 2.5, statsY, { align: 'center' });

  pdf.setFontSize(8);
  pdf.setFont('NanumGothic', 'normal');
  pdf.text('노트', margin + colWidth * 0.5, statsY + 7, { align: 'center' });
  pdf.text('퀴즈 정확도', margin + colWidth * 1.5, statsY + 7, { align: 'center' });
  pdf.text('AI 대화', margin + colWidth * 2.5, statsY + 7, { align: 'center' });

  yPosition += 28;

  // ===== 3D VIEWER CAPTURE =====
  if (viewerElement) {
    try {
      const canvas = viewerElement.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');

        // Detect blank canvas: render to a tiny offscreen canvas and check if all pixels are empty
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1;
        testCanvas.height = 1;
        const testCtx = testCanvas.getContext('2d');
        if (testCtx) {
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              testCtx.drawImage(img, 0, 0, 1, 1);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = imgData;
          });
          const pixel = testCtx.getImageData(0, 0, 1, 1).data;
          const isBlank = pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] === 0;

          if (!isBlank) {
            checkNewPage(80);
            const imgWidth = pageWidth - margin * 2;
            const aspectRatio = canvas.height / canvas.width;
            const imgHeight = Math.min(imgWidth * aspectRatio, 70);
            pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
          }
        }
      }
    } catch (error) {
      console.error('3D capture failed:', error);
    }
  }

  // ===== NOTES SECTION =====
  drawSectionHeader(`학습 노트 (${notes.length}개)`);

  if (notes.length === 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('작성된 노트가 없습니다.', margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;
  } else {
    // Group notes by part
    const notesByPart: Record<string, Note[]> = {};
    const untaggedNotes: Note[] = [];

    notes.forEach(note => {
      if (note.partName) {
        if (!notesByPart[note.partName]) notesByPart[note.partName] = [];
        notesByPart[note.partName].push(note);
      } else {
        untaggedNotes.push(note);
      }
    });

    // Print notes grouped by part
    Object.entries(notesByPart).forEach(([partName, partNotes]) => {
      checkNewPage(15);
      pdf.setFontSize(10);
      pdf.setFont('NanumGothic', 'bold');
      pdf.text(`[${partName}]`, margin, yPosition);
      yPosition += 5;

      pdf.setFont('NanumGothic', 'normal');
      partNotes.forEach(note => {
        checkNewPage(10);
        const lines = pdf.splitTextToSize(note.content, pageWidth - margin * 2 - 5);
        lines.forEach((line: string) => {
          checkNewPage(5);
          pdf.text(`  ${line}`, margin, yPosition);
          yPosition += 5;
        });
      });
      yPosition += 3;
    });

    // Print untagged notes
    if (untaggedNotes.length > 0) {
      checkNewPage(15);
      pdf.setFontSize(10);
      pdf.setFont('NanumGothic', 'bold');
      pdf.text('[일반 노트]', margin, yPosition);
      yPosition += 5;

      pdf.setFont('NanumGothic', 'normal');
      untaggedNotes.forEach(note => {
        checkNewPage(10);
        const lines = pdf.splitTextToSize(note.content, pageWidth - margin * 2 - 5);
        lines.forEach((line: string) => {
          checkNewPage(5);
          pdf.text(`  ${line}`, margin, yPosition);
          yPosition += 5;
        });
      });
    }
    yPosition += 5;
  }

  // ===== QUIZ RESULTS SECTION =====
  drawSectionHeader(`퀴즈 결과`);

  if (!progress || progress.quiz_attempts === 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('아직 퀴즈를 풀지 않았습니다.', margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;
  } else {
    pdf.setFontSize(10);
    pdf.text(`총 ${progress.quiz_attempts}문제 중 ${progress.quiz_correct}문제 정답 (${Math.round(progress.quiz_accuracy * 100)}%)`, margin, yPosition);
    yPosition += 7;

    // Topics learned
    if (progress.topics_learned && progress.topics_learned.length > 0) {
      pdf.setFontSize(9);
      pdf.text('학습한 주제: ' + progress.topics_learned.join(', '), margin, yPosition);
      yPosition += 7;
    }
  }
  yPosition += 5;

  // ===== AI CONVERSATION HIGHLIGHTS =====
  drawSectionHeader(`AI 대화 하이라이트`);

  const aiHighlights = aiMessages.filter(m => m.role === 'assistant').slice(-3);

  if (aiHighlights.length === 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('AI 대화 기록이 없습니다.', margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;
  } else {
    aiHighlights.forEach((msg, idx) => {
      checkNewPage(20);
      pdf.setFontSize(9);
      pdf.setFont('NanumGothic', 'bold');
      pdf.text(`AI 응답 ${idx + 1}:`, margin, yPosition);
      yPosition += 5;

      pdf.setFont('NanumGothic', 'normal');
      // Truncate long messages
      const truncatedContent = msg.content.length > 300
        ? msg.content.substring(0, 300) + '...'
        : msg.content;
      const lines = pdf.splitTextToSize(truncatedContent, pageWidth - margin * 2);
      lines.slice(0, 6).forEach((line: string) => {
        checkNewPage(5);
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    });
  }

  // ===== FOOTER =====
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`SIMVEX 학습 요약 - ${i}/${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Download PDF
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`SIMVEX_학습요약_${machineryName}_${timestamp}.pdf`);
  } catch (saveError) {
    console.error('[PDF] Save failed:', saveError);
  }
}
