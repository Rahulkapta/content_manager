/*
  Warnings:

  - You are about to drop the column `username` on the `userdetails` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `UserDetails_username_key` ON `userdetails`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `username` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `userdetails` DROP COLUMN `username`;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
