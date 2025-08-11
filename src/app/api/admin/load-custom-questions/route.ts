import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Your COMPLETE custom questions from CSV with ALL the hilarious full text
const customQuestions = [
  {
    id: 'Q1',
    text: "I asked my bachelor friends, what's the most awkward thing you have walked in on?",
    answerCount: 10,
    answers: [
      { index: 1, text: 'Dancing / Singing Alone: Twerking on pinky hai paise walo ki', value: 1000 },
      { index: 2, text: 'Self talk / Self motivate: Sheeshe main khud ko \'Tu sher puttar hai yaara\' bolna', value: 1000 },
      { index: 3, text: 'Self Pleasure / Naked: Jhaant ke baal gin-na', value: 1000 },
      { index: 4, text: 'Intercourse / Outercourse: Walking in on getting pegged', value: 1000 },
      { index: 5, text: 'Crying / Sad: Siskiyan lete pakde jaana', value: 1000 },
      { index: 6, text: 'Washroom: Potty Dhotte pakde jaana', value: 1000 },
      { index: 7, text: 'Make Up / Skin: Getting caught with cucumber on eyes', value: 1000 },
      { index: 8, text: 'Giving up on life: Using the rope as a necklope', value: 1000 },
      { index: 9, text: 'Gross Activity: Naak bed pe chipkate hue padke jaana', value: 1000 },
      { index: 10, text: 'Random absurd weird unexplainable shit: Masturbating your dog for medical reasons', value: 1000 },
    ]
  },
  {
    id: 'Q2',
    text: "I asked my bachelor friends, what's something that they tried to get their partner in the mood but failed?",
    answerCount: 10,
    answers: [
      { index: 1, text: 'Aromatic Senses: Trying to pleasure their nose with lavender candles.', value: 2000 },
      { index: 2, text: 'Cooking: Claimed to have coocked the food myself but forgot to remove Zomato tape', value: 2000 },
      { index: 3, text: 'Massage: Used Sarso ke tel instead of massage oil', value: 2000 },
      { index: 4, text: 'Music / Poetry: Searched "Panty dropping music" in front of partner', value: 2000 },
      { index: 5, text: 'Showering Together: Cleaning nipples with shampoo', value: 2000 },
      { index: 6, text: 'Surprise: Adding her / him in the surprise plan group', value: 2000 },
      { index: 7, text: 'Sexy Clothes: Phaatte khache se peaky-a-boo khelna', value: 2000 },
      { index: 8, text: 'Dance: Mashing up Govinda and Sunny Deol cheoreography', value: 2000 },
      { index: 9, text: 'Food on Body: Chocolate lagake sirf chocolate khane pe dhyaan dena', value: 2000 },
      { index: 10, text: 'Asking for it: But like a creep', value: 2000 },
    ]
  },
  {
    id: 'Q4',
    text: "I asked my bachelor friends, what's something they stole from their friend and never told them about?",
    answerCount: 6,
    answers: [
      { index: 1, text: 'Sexual Product: Vibrator with flavoured condom', value: 1500 },
      { index: 2, text: 'Electronics / Gadgets: Jhaant wala Trimmer', value: 1500 },
      { index: 3, text: 'Money: Challan ke paise', value: 1500 },
      { index: 4, text: 'Clothes: Banyan / Bra', value: 1500 },
      { index: 5, text: 'Peace of Mind: Chain Churaya mera', value: 1500 },
      { index: 6, text: 'Girlfriend / Boyfriend: Maaf karde kachi mitti thi', value: 1500 },
    ]
  },
  {
    id: 'Q5',
    text: "I asked my bachelor friends, what's a fake excuse they might use to get out of a bad date?",
    answerCount: 6,
    answers: [
      { index: 1, text: 'Emergency: Daadi phirse mar gayi', value: 3000 },
      { index: 2, text: 'Real life ghosting: Washroom ki khidki se kood jana', value: 3000 },
      { index: 3, text: 'Borrowed time up: Dost ko pata chal gaya main uski gaadi le ke bhaga hu', value: 3000 },
      { index: 4, text: 'Health issue: Bhayankar diarrhea hogaya hai', value: 3000 },
      { index: 5, text: 'Deadline: Biwi/PG ki taraf se curfew', value: 3000 },
      { index: 6, text: 'Ex related: Meri ex ko hosh aagaya hai', value: 3000 },
    ]
  },
  {
    id: 'Q6',
    text: "I asked my bachelor friends, the last advice they took from ChatGPT?",
    answerCount: 6,
    answers: [
      { index: 1, text: 'Daily Life Advice: 5 minute mein kachcha kaise sukhaye', value: 2500 },
      { index: 2, text: 'Money problems: Landlord se rent kaise maaf karaye', value: 2500 },
      { index: 3, text: 'Fix and Repair: Bedsheet se cigarette burns kaise gayab kare', value: 2500 },
      { index: 4, text: 'Communation Advice: Bandi ko kaise samjhau ki woh sirf tera sapna tha', value: 2500 },
      { index: 5, text: 'Medical/Health advice: Is it okay to have uneven testicals / boobs', value: 2500 },
      { index: 6, text: 'DIY: DIY bong at home using bisleri bottle', value: 2500 },
    ]
  },
  {
    id: 'Q7',
    text: "I asked my bachelor friends, If your boss says \"you are fired\", what will you do?",
    answerCount: 13,
    answers: [
      { index: 1, text: 'Gross comeback: Uske cabin pe mutrvisarjan / hugg dunga', value: 4000 },
      { index: 2, text: 'Physical violence: Thar waale bhaion se Uski fielding set karunga', value: 4000 },
      { index: 3, text: 'Blackmail: Main ldki ki fake profile banake blackmail karunga', value: 4000 },
      { index: 4, text: 'Rumours: Will mail all clients that boss licks their dog with an AI photo', value: 4000 },
      { index: 5, text: 'Cry baby: Mummy se baat kara dunga', value: 4000 },
      { index: 6, text: 'Destruction to office property: Office se samaan chura ke jaunga', value: 4000 },
      { index: 7, text: 'Bribery: Boss ko bolunga Kuch le deke settle krlete hai/bribe/will get on my knees', value: 4000 },
      { index: 8, text: 'Acceptance: Theek hai mera farewell gift/Tum kya resign karoge main chodd ke jaa rhaa hu', value: 4000 },
      { index: 9, text: 'Denial: Manuga he nahi, will show up again tomorrow', value: 4000 },
      { index: 10, text: 'Make boss my relative: Will start dating boss\'s younger sibling', value: 4000 },
      { index: 11, text: 'Argue: Kyu-will reason and try to prove my worth', value: 4000 },
      { index: 12, text: 'Revenge: Client chura lunga', value: 4000 },
      { index: 13, text: 'Start a movement: Poach employs to join my "to be startup"', value: 4000 },
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
