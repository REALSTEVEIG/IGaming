/*
  Warnings:

  - A unique constraint covering the columns `[sessionNumber]` on the table `game_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN     "sessionNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_sessionNumber_key" ON "game_sessions"("sessionNumber");
