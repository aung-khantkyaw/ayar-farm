-- DropForeignKey
ALTER TABLE "public"."AIChatMessage" DROP CONSTRAINT "AIChatMessage_roomId_fkey";

-- AddForeignKey
ALTER TABLE "AIChatMessage" ADD CONSTRAINT "AIChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
