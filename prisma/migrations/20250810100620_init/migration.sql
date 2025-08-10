-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "answerCount" INTEGER NOT NULL,
    "isFinalRound" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Answer" (
    "questionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    PRIMARY KEY ("questionId", "index"),
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reveal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    "attribution" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reveal_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "currentQuestionId" TEXT,
    "r3AnswerCount" INTEGER NOT NULL DEFAULT 4,
    "timerSetting" INTEGER,
    "finalBonus" INTEGER NOT NULL DEFAULT 0,
    "audienceWindow" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "AudienceMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "windowNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AudienceMember_team_fkey" FOREIGN KEY ("team") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AudienceMember_phone_key" ON "AudienceMember"("phone");
