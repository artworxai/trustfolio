import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { category, keywords } = await request.json();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are an achievement description writer. Write a professional, concise achievement description for a student portfolio.

Category: ${category}
Keywords: ${keywords}

Write 2-3 sentences describing this achievement. Focus on:
- What was accomplished
- Technologies/skills used
- Impact or results

Be specific and impressive, but honest. Write in past tense. Don't use "I" - write as if describing someone else's work.

Example good output: "Built AI-powered claims extraction system using Python, LangChain, and Claude API. Implemented prompt engineering with few-shot learning to filter non-verifiable claims and improve data quality by 50%."

Your output (just the description, no extra text):`,
        },
      ],
    });

    const description = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}