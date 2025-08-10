-- CreateTable
CREATE TABLE "ScoreAdjustment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreAdjustment_team_fkey" FOREIGN KEY ("team") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "currentQuestionId" TEXT,
    "r3AnswerCount" INTEGER NOT NULL DEFAULT 4,
    "timerSetting" INTEGER,
    "finalBonus" INTEGER NOT NULL DEFAULT 0,
    "activeTeam" TEXT,
    "logoOnly" BOOLEAN NOT NULL DEFAULT false,
    "bigX" BOOLEAN NOT NULL DEFAULT false,
    "scorecardOverlay" BOOLEAN NOT NULL DEFAULT false,
    "round2BonusApplied" BOOLEAN NOT NULL DEFAULT false,
    "audienceWindow" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_GameState" ("activeTeam", "audienceWindow", "currentQuestionId", "currentRound", "finalBonus", "id", "r3AnswerCount", "timerSetting") SELECT "activeTeam", "audienceWindow", "currentQuestionId", "currentRound", "finalBonus", "id", "r3AnswerCount", "timerSetting" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
CREATE TABLE "new_Reveal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    "attribution" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reveal_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reveal" ("answerIndex", "attribution", "createdAt", "id", "questionId") SELECT "answerIndex", "attribution", "createdAt", "id", "questionId" FROM "Reveal";
DROP TABLE "Reveal";
ALTER TABLE "new_Reveal" RENAME TO "Reveal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
