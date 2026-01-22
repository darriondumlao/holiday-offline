import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'Holiday Landing Responses - Sheet1.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    // Parse CSV - skip header row
    const lines = csvContent.split('\n').slice(1)
    const answers: string[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      // CSV format: Timestamp,Answer
      // Find the first comma to split timestamp from answer
      const firstComma = line.indexOf(',')
      if (firstComma !== -1) {
        const answer = line.slice(firstComma + 1).trim()
        // Skip empty answers, links, and very short answers
        if (answer &&
            answer.length > 1 &&
            !answer.includes('http') &&
            !answer.includes('www.') &&
            !answer.includes('.com') &&
            !answer.includes('.org') &&
            !answer.includes('.net')) {
          answers.push(answer)
        }
      }
    }

    return NextResponse.json({ answers, total: answers.length })
  } catch (error) {
    console.error('Error reading answers CSV:', error)
    return NextResponse.json({ answers: [], total: 0, error: 'Failed to load answers' })
  }
}
