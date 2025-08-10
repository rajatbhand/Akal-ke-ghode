-- CreateSchema (postgres)
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."TeamId" AS ENUM ('R', 'G', 'B');

-- CreateEnum
CREATE TYPE "public"."Attribution" AS ENUM ('R', 'G', 'B', 'Host', 'Neutral');

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" "public"."TeamId" NOT NULL,
    "name" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "answerCount" INTEGER NOT NULL,
    "isFinalRound" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Answer" (
    "questionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("questionId","index")
);

-- CreateTable
CREATE TABLE "public"."Reveal" (
    "id" SERIAL NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    "attribution" "public"."Attribution" NOT NULL,
    "roundNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reveal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "currentQuestionId" TEXT,
    "r3AnswerCount" INTEGER NOT NULL DEFAULT 4,
    "timerSetting" INTEGER,
    "finalBonus" INTEGER NOT NULL DEFAULT 0,
    "activeTeam" "public"."TeamId",
    "logoOnly" BOOLEAN NOT NULL DEFAULT false,
    "bigX" BOOLEAN NOT NULL DEFAULT false,
    "scorecardOverlay" BOOLEAN NOT NULL DEFAULT false,
    "round2BonusApplied" BOOLEAN NOT NULL DEFAULT false,
    "audienceWindow" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoreAdjustment" (
    "id" SERIAL NOT NULL,
    "team" "public"."TeamId" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AudienceMember" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "team" "public"."TeamId" NOT NULL,
    "windowNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudienceMember_phone_key" ON "public"."AudienceMember"("phone");

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reveal" ADD CONSTRAINT "Reveal_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoreAdjustment" ADD CONSTRAINT "ScoreAdjustment_team_fkey" FOREIGN KEY ("team") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AudienceMember" ADD CONSTRAINT "AudienceMember_team_fkey" FOREIGN KEY ("team") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

