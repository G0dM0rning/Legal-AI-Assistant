// src/utils/exportUtils.js
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

/**
 * Strips markdown symbols but keeps the core text structure
 */
export const stripMarkdown = (text) => {
    if (!text) return '';
    return text
        .replace(/[#*`_~]/g, '') // Remove most markdown symbols
        .replace(/\[Ref \d+:[^\]]+\]/g, '$&') // Keep references but maybe clean them?
        .trim();
};

/**
 * Generates a professionally formatted DOCX file
 */
export const generateDocx = async (messages, username = 'User') => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "LegalAI Consultation Transcript",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: `Date: ${new Date().toLocaleString()}`,
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 400 },
                }),
                ...messages.flatMap(msg => [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${msg.sender === 'user' ? username : 'LegalAI'}:`,
                                bold: true,
                                color: msg.sender === 'user' ? "2563eb" : "1e293b",
                                size: 24,
                            }),
                        ],
                        spacing: { before: 200 },
                    }),
                    ...formatMarkdownForDocx(msg.text)
                ])
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `LegalAI_Export_${new Date().toISOString().split('T')[0]}.docx`);
};

/**
 * Helper to turn markdown-like strings into docx Paragraphs
 */
const formatMarkdownForDocx = (text) => {
    const lines = text.split('\n');
    return lines.map(line => {
        let cleanLine = line.trim();
        let isHeading = false;
        let headingLevel = HeadingLevel.HEADING_3;
        let isBullet = false;

        if (cleanLine.startsWith('###')) {
            cleanLine = cleanLine.replace(/^###\s*/, '');
            isHeading = true;
        } else if (cleanLine.startsWith('##')) {
            cleanLine = cleanLine.replace(/^##\s*/, '');
            isHeading = true;
            headingLevel = HeadingLevel.HEADING_2;
        } else if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
            cleanLine = cleanLine.replace(/^[*|-]\s*/, '');
            isBullet = true;
        }

        return new Paragraph({
            text: cleanLine.replace(/\*\*/g, ''), // Strip bold markers for simplicity in this helper
            heading: isHeading ? headingLevel : undefined,
            bullet: isBullet ? { level: 0 } : undefined,
            spacing: { after: 120 },
        });
    });
};

/**
 * Generates a professionally formatted PDF file
 */
export const generatePdf = async (messages, username = 'User') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text("LegalAI Consultation Transcript", pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth - 20, y, { align: 'right' });
    y += 20;

    messages.forEach(msg => {
        // Sender Label
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        if (msg.sender === 'user') {
            doc.setTextColor(37, 99, 235);
            doc.text(`${username}:`, 20, y);
        } else {
            doc.setTextColor(30, 41, 59);
            doc.text("LegalAI Consultant:", 20, y);
        }
        y += 8;

        // Message Body
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        const cleanText = msg.text
            .replace(/###\s*(.*)/g, '$1')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/[*|-]\s*/g, '• ');

        const splitText = doc.splitTextToSize(cleanText, pageWidth - 40);

        // Check for page break
        if (y + (splitText.length * 6) > 280) {
            doc.addPage();
            y = 20;
        }

        doc.text(splitText, 20, y);
        y += (splitText.length * 6) + 10;
    });

    doc.save(`LegalAI_Export_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateTxt = (messages, username = 'User') => {
    const content = messages.map(msg => {
        const sender = msg.sender === 'user' ? username : 'LEGALAI';
        const cleanBody = stripMarkdown(msg.text);
        return `${sender}:\n${cleanBody}\nTimestamp: ${msg.timestamp.toLocaleString()}\n`;
    }).join('\n' + '-'.repeat(40) + '\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    saveAs(blob, `LegalAI_Export_${new Date().toISOString().split('T')[0]}.txt`);
};
