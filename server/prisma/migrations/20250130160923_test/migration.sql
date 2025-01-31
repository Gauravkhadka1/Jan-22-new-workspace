-- CreateTable
CREATE TABLE "newUser" (
    "userId" SERIAL NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "profilePictureUrl" TEXT,
    "password" TEXT,

    CONSTRAINT "newUser_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "newUser_email_key" ON "newUser"("email");
