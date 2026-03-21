-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'USER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'PLAYING', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "name" TEXT,
    "phoneNumber" TEXT,
    "establishmentId" TEXT,
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "phoneNumber" TEXT,
    "additionalInfo" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "youtubeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongRequest" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "youtubeId" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "selfieUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistItem" (
    "id" TEXT NOT NULL,
    "songRequestId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "establishmentId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRequest" ADD CONSTRAINT "SongRequest_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistItem" ADD CONSTRAINT "PlaylistItem_songRequestId_fkey" FOREIGN KEY ("songRequestId") REFERENCES "SongRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
