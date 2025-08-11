import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 6 Simple Questions for Game Show
const sampleQuestions = [
  {
    id: 'Q1',
    text: 'Name something people forget at home when going out',
    answerCount: 8,
    answers: [
      { index: 1, text: 'Keys', value: 1000 },
      { index: 2, text: 'Wallet', value: 1000 },
      { index: 3, text: 'Phone', value: 1000 },
      { index: 4, text: 'Umbrella', value: 1000 },
      { index: 5, text: 'Mask', value: 1000 },
      { index: 6, text: 'Glasses', value: 1000 },
      { index: 7, text: 'ID Card', value: 1000 },
      { index: 8, text: 'Charger', value: 1000 },
    ]
  },
  {
    id: 'Q2',
    text: 'Name a place where you need to keep quiet',
    answerCount: 6,
    answers: [
      { index: 1, text: 'Library', value: 2000 },
      { index: 2, text: 'Temple', value: 2000 },
      { index: 3, text: 'Hospital', value: 2000 },
      { index: 4, text: 'Cinema', value: 2000 },
      { index: 5, text: 'Classroom', value: 2000 },
      { index: 6, text: 'Court', value: 2000 },
    ]
  },
  {
    id: 'Q3',
    text: 'Name something you find in a kitchen',
    answerCount: 10,
    answers: [
      { index: 1, text: 'Refrigerator', value: 1500 },
      { index: 2, text: 'Stove', value: 1500 },
      { index: 3, text: 'Microwave', value: 1500 },
      { index: 4, text: 'Dishes', value: 1500 },
      { index: 5, text: 'Knife', value: 1500 },
      { index: 6, text: 'Spoons', value: 1500 },
      { index: 7, text: 'Plates', value: 1500 },
      { index: 8, text: 'Toaster', value: 1500 },
      { index: 9, text: 'Blender', value: 1500 },
      { index: 10, text: 'Sink', value: 1500 },
    ]
  },
  {
    id: 'Q4',
    text: 'Name a reason why someone might be late to work',
    answerCount: 7,
    answers: [
      { index: 1, text: 'Traffic Jam', value: 3000 },
      { index: 2, text: 'Overslept', value: 3000 },
      { index: 3, text: 'Car Trouble', value: 3000 },
      { index: 4, text: 'Bad Weather', value: 3000 },
      { index: 5, text: 'Sick Child', value: 3000 },
      { index: 6, text: 'Train Delay', value: 3000 },
      { index: 7, text: 'Forgot Keys', value: 3000 },
    ]
  },
  {
    id: 'Q5',
    text: 'Name something people do when they are bored',
    answerCount: 9,
    answers: [
      { index: 1, text: 'Watch TV', value: 500 },
      { index: 2, text: 'Read Book', value: 500 },
      { index: 3, text: 'Play Games', value: 500 },
      { index: 4, text: 'Listen Music', value: 500 },
      { index: 5, text: 'Social Media', value: 500 },
      { index: 6, text: 'Call Friends', value: 500 },
      { index: 7, text: 'Exercise', value: 500 },
      { index: 8, text: 'Cook', value: 500 },
      { index: 9, text: 'Sleep', value: 500 },
    ]
  },
  {
    id: 'Q6',
    text: 'Name a popular social media platform',
    answerCount: 5,
    answers: [
      { index: 1, text: 'Facebook', value: 4000 },
      { index: 2, text: 'Instagram', value: 4000 },
      { index: 3, text: 'Twitter', value: 4000 },
      { index: 4, text: 'WhatsApp', value: 4000 },
      { index: 5, text: 'YouTube', value: 4000 },
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
    for (const q of sampleQuestions) {
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
      message: `✅ Successfully loaded ${imported} sample questions ready for your game show!`,
      questions: sampleQuestions.map(q => ({ id: q.id, text: q.text, answers: q.answerCount }))
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: String(error?.message || error),
      success: false 
    }, { status: 500 });
  }
}
