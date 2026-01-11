import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Read the prompts file from the root prompts directory
    const filePath = join(process.cwd(), 'prompts', 'cursor-prompts.md')
    const fileContents = await readFile(filePath, 'utf-8')
    
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error reading prompts file:', error)
    return NextResponse.json(
      { error: 'Failed to load prompt log' },
      { status: 500 }
    )
  }
}
