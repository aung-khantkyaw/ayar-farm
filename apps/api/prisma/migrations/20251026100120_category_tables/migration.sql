-- CreateTable
CREATE TABLE "CropTypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "category" "Category" NOT NULL DEFAULT 'CROPS_AND_PULSES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivestockTypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "category" "Category" NOT NULL DEFAULT 'LIVESTOCK_INDUSTRY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivestockTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineTypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "category" "Category" NOT NULL DEFAULT 'AGRI_INDUSTRY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crops" (
    "id" TEXT NOT NULL,
    "crop_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livestocks" (
    "id" TEXT NOT NULL,
    "livestock_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livestocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machines" (
    "id" TEXT NOT NULL,
    "machine_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fishs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fishs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "file_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "crop_type_id" TEXT,
    "livestock_type_id" TEXT,
    "machine_type_id" TEXT,
    "crop_id" TEXT,
    "livestock_id" TEXT,
    "machine_id" TEXT,
    "fish_id" TEXT,

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CropTypes_id_key" ON "CropTypes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "LivestockTypes_id_key" ON "LivestockTypes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MachineTypes_id_key" ON "MachineTypes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Crops_id_key" ON "Crops"("id");

-- CreateIndex
CREATE INDEX "Crops_crop_type_id_idx" ON "Crops"("crop_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "Livestocks_id_key" ON "Livestocks"("id");

-- CreateIndex
CREATE INDEX "Livestocks_livestock_type_id_idx" ON "Livestocks"("livestock_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "Machines_id_key" ON "Machines"("id");

-- CreateIndex
CREATE INDEX "Machines_machine_type_id_idx" ON "Machines"("machine_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "Fishs_id_key" ON "Fishs"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Documents_id_key" ON "Documents"("id");

-- CreateIndex
CREATE INDEX "Documents_crop_type_id_idx" ON "Documents"("crop_type_id");

-- CreateIndex
CREATE INDEX "Documents_livestock_type_id_idx" ON "Documents"("livestock_type_id");

-- CreateIndex
CREATE INDEX "Documents_machine_type_id_idx" ON "Documents"("machine_type_id");

-- CreateIndex
CREATE INDEX "Documents_crop_id_idx" ON "Documents"("crop_id");

-- CreateIndex
CREATE INDEX "Documents_livestock_id_idx" ON "Documents"("livestock_id");

-- CreateIndex
CREATE INDEX "Documents_machine_id_idx" ON "Documents"("machine_id");

-- CreateIndex
CREATE INDEX "Documents_fish_id_idx" ON "Documents"("fish_id");

-- AddForeignKey
ALTER TABLE "Crops" ADD CONSTRAINT "Crops_crop_type_id_fkey" FOREIGN KEY ("crop_type_id") REFERENCES "CropTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livestocks" ADD CONSTRAINT "Livestocks_livestock_type_id_fkey" FOREIGN KEY ("livestock_type_id") REFERENCES "LivestockTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machines" ADD CONSTRAINT "Machines_machine_type_id_fkey" FOREIGN KEY ("machine_type_id") REFERENCES "MachineTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_crop_type_id_fkey" FOREIGN KEY ("crop_type_id") REFERENCES "CropTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_livestock_type_id_fkey" FOREIGN KEY ("livestock_type_id") REFERENCES "LivestockTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_machine_type_id_fkey" FOREIGN KEY ("machine_type_id") REFERENCES "MachineTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_livestock_id_fkey" FOREIGN KEY ("livestock_id") REFERENCES "Livestocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "Machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_fish_id_fkey" FOREIGN KEY ("fish_id") REFERENCES "Fishs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
