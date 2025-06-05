-- CreateTable
CREATE TABLE "ComputerEvent" (
    "id" TEXT NOT NULL,
    "computer_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ComputerEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ComputerEvent" ADD CONSTRAINT "ComputerEvent_computer_id_fkey" FOREIGN KEY ("computer_id") REFERENCES "Computer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
