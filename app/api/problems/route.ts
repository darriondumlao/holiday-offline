import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'Offline Answers PT 2 - answers.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    // Parse CSV - no header row in this file
    const lines = csvContent.split('\n')
    const answers: string[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      // CSV format: Timestamp,Answer
      // Find the first comma to split timestamp from answer
      const firstComma = line.indexOf(',')
      if (firstComma !== -1) {
        const answer = line.slice(firstComma + 1).trim()
        // Skip empty answers, links, very short answers, and placeholder text
        if (answer &&
            answer.length > 2 &&
            !answer.includes('http') &&
            !answer.includes('www.') &&
            !answer.includes('.com') &&
            !answer.includes('.org') &&
            !answer.includes('.net') &&
            answer.toLowerCase() !== 'type your answer here') {
          answers.push(answer)
        }
      }
    }

    return NextResponse.json({ answers, total: answers.length })
  } catch (error) {
    console.error('Error reading problems CSV:', error)
    return NextResponse.json({ answers: [], total: 0, error: 'Failed to load answers' })
  }
}
