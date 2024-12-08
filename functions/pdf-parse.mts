import type { Context } from '@netlify/functions'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
} 

export default async (req: Request, context: Context) => {
  if (!req.body) {
    return Response.json({
      code: 400,
      message: 'No file provided',
      error: true
    });
  }

  try {
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const text = await parsePDF(buffer);
    return Response.json({
      code: 200,
      message: 'PDF parsed successfully',
      text: text
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return Response.json({
      code: 500,
      message: 'Failed to parse PDF',
      error: true
    });
  }
}