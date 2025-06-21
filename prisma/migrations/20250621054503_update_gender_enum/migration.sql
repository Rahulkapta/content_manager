/*
  Warnings:

  - The values [PREFER_NOT_TO_SAY] on the enum `UserDetails_gender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `userdetails` MODIFY `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED') NULL;
