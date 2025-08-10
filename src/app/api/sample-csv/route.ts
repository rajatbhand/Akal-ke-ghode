import { NextResponse } from "next/server";

const sample = [
  [
    "QuestionID",
    "QuestionText",
    ...Array.from({ length: 15 }, (_, i) => `Answer${i + 1}`),
    ...Array.from({ length: 15 }, (_, i) => `Value${i + 1}`),
    "AnswerCount",
  ].join(","),
  [
    "Q1",
    "Name something people forget at home",
    "Wallet","Keys","Phone","Charger","Umbrella","Mask","Glasses","Lunch","ID Card","Water Bottle","","","","","",
    1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,"","","","","",
    10,
  ]
    .map(String)
    .join(","),
  [
    "Q2",
    "Name a place where you need to keep quiet",
    "Library","Temple","Hospital","Cinema","Classroom","Court","","","","","","","","","",
    2000,2000,2000,2000,2000,2000,"","","","","","","","","",
    6,
  ]
    .map(String)
    .join(","),
].join("\n");

export async function GET() {
  return new NextResponse(sample, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=sample-question-bank.csv",
    },
  });
}


