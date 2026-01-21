import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Validate input - reject links, scripts, and suspicious content
function validateAnswer(input: string): { valid: boolean; error?: string } {
  const trimmed = input.trim();

  // Check length
  if (trimmed.length > 500) {
    return { valid: false, error: 'Answer is too long' };
  }

  // Block URLs and links
  const urlPatterns = [
    /https?:\/\//i,
    /www\./i,
    /\.com|\.net|\.org|\.io|\.co|\.edu|\.gov|\.me|\.info|\.biz|\.xyz/i,
    /ftp:\/\//i,
    /file:\/\//i,
  ];

  for (const pattern of urlPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Links are not allowed' };
    }
  }

  // Block script tags, event handlers, and code injection attempts
  const dangerousPatterns = [
    /<script/i,
    /<\/script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input/i,
    /eval\s*\(/i,
    /function\s*\(/i,
    /=>\s*{/,  // arrow functions
    /document\./i,
    /window\./i,
    /localStorage/i,
    /sessionStorage/i,
    /cookie/i,
    /<img.*onerror/i,
    /data:/i,
    /base64/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Invalid characters detected' };
    }
  }

  return { valid: true };
}

// Sanitize the answer - strip any HTML and trim
function sanitizeAnswer(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '')    // Remove any remaining angle brackets
    .trim()
    .substring(0, 500);      // Limit length
}

export async function POST(request: Request) {
  try {
    const { answer } = await request.json();

    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    // Validate the input
    const validation = validateAnswer(answer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Sanitize the answer
    const sanitizedAnswer = sanitizeAnswer(answer);

    // Check for required environment variables
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.error('Missing Google Sheets environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Google Sheets setup
    // Handle the private key - replace literal \n with actual newlines
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '';

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ANSWERS;

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'answers!A:B',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[new Date().toISOString(), sanitizedAnswer]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting answer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
