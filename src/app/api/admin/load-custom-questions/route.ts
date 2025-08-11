import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Your custom questions from CSV (cleaned and formatted)
const customQuestions = [
  {
    id: 'Q1',
    text: "I asked my bachelor friends, what's the most awkward thing you have walked in on?",
    answerCount: 10,
    answers: [
      { index: 1, text: 'Dancing / Singing Alone', value: 1000 },
      { index: 2, text: 'Self talk / Self motivate', value: 1000 },
      { index: 3, text: 'Self Pleasure / Naked', value: 1000 },
      { index: 4, text: 'Intercourse / Outercourse', value: 1000 },
      { index: 5, text: 'Crying / Sad', value: 1000 },
      { index: 6, text: 'Washroom activities', value: 1000 },
      { index: 7, text: 'Make Up / Skin care', value: 1000 },
      { index: 8, text: 'Giving up on life', value: 1000 },
      { index: 9, text: 'Gross Activity', value: 1000 },
      { index: 10, text: 'Random weird stuff', value: 1000 },
    ]
  },
  {
    id: 'Q2',
    text: "I asked my bachelor friends, what's something that they tried to get their partner in the mood but failed?",
    answerCount: 6,
    answers: [
      { index: 1, text: 'Aromatic Senses', value: 2000 },
      { index: 2, text: 'Cooking', value: 2000 },
      { index: 3, text: 'Massage', value: 2000 },
      { index: 4, text: 'Music / Poetry', value: 2000 },
      { index: 5, text: 'Showering Together', value: 2000 },
      { index: 6, text: 'Surprise', value: 2000 },
    ]
  },
  {
    id: 'Q4',
    text: "I asked my bachelor friends, what's something they stole from their friend and never told them about?",
    answerCount: 6,
    answers: [
      { index: 1, text: 'Sexual Product', value: 1500 },
      { index: 2, text: 'Electronics / Gadgets', value: 1500 },
      { index: 3, text: 'Money', value: 1500 },
      { index: 4, text: 'Clothes', value: 1500 },
      { index: 5, text: 'Peace of Mind', value: 1500 },
      { index: 6, text: 'Girlfriend / Boyfriend', value: 1500 },
    ]
  },
  {
    id: 'Q5',
    text: "I asked my bachelor friends, what's a fake excuse they might use to get out of a bad date?",
    answerCount: 6,
    answers: [
      { index: 1, text: 'Emergency', value: 3000 },
      { index: 2, text: 'Real life ghosting', value: 3000 },
      { index: 3, text: 'Borrowed time up', value: 3000 },
      { index: 4, text: 'Health issue', value: 3000 },
      { index: 5, text: 'Deadline / Curfew', value: 3000 },
      { index: 6, text: 'Ex related', value: 3000 },
    ]
  },
  {
    id: 'Q6',
    text: "I asked my bachelor friends, the last advice they took from ChatGPT?",
    answerCount: 6,
    answers: [
      { index: 1, text: 'Daily Life Advice', value: 2500 },
      { index: 2, text: 'Money problems', value: 2500 },
      { index: 3, text: 'Fix and Repair', value: 2500 },
      { index: 4, text: 'Communication Advice', value: 2500 },
      { index: 5, text: 'Medical/Health advice', value: 2500 },
      { index: 6, text: 'DIY projects', value: 2500 },
    ]
  },
  {
    id: 'Q7',
    text: "I asked my bachelor friends, If your boss says \"you are fired\", what will you do?",
    answerCount: 13,
    answers: [
      { index: 1, text: 'Gross comeback', value: 4000 },
      { index: 2, text: 'Physical violence', value: 4000 },
      { index: 3, text: 'Blackmail', value: 4000 },
      { index: 4, text: 'Spread Rumours', value: 4000 },
      { index: 5, text: 'Cry baby', value: 4000 },
      { index: 6, text: 'Destroy office property', value: 4000 },
      { index: 7, text: 'Bribery', value: 4000 },
      { index: 8, text: 'Acceptance', value: 4000 },
      { index: 9, text: 'Denial', value: 4000 },
      { index: 10, text: 'Make boss relative', value: 4000 },
      { index: 11, text: 'Argue', value: 4000 },
      { index: 12, text: 'Revenge', value: 4000 },
      { index: 13, text: 'Start a movement', value: 4000 },
    ]
  }
];

export async function POST() {
  try {
    let imported = 0;
    
    // Clear existing questions first
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    
    // Insert each question with its answers
    for (const q of customQuestions) {
      await prisma.question.create({
        data: {
          id: q.id,
          text: q.text,
          answerCount: q.answerCount,
          isFinalRound: false
        }
      });
      
      await prisma.answer.createMany({
        data: q.answers.map(a => ({
          questionId: q.id,
          index: a.index,
          text: a.text,
          value: a.value
        }))
      });
      
      imported++;
    }
    
    return NextResponse.json({ 
      success: true,
      imported,
      message: `✅ Successfully loaded ${imported} custom questions from your CSV!`,
      questions: customQuestions.map(q => ({ id: q.id, text: q.text, answers: q.answerCount }))
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: String(error?.message || error),
      success: false 
    }, { status: 500 });
  }
}
