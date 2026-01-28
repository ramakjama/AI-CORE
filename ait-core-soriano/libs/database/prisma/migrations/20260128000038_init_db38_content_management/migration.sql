-- CreateTable
CREATE TABLE "content_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_translations" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "translatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");

-- CreateIndex
CREATE INDEX "content_pages_status_idx" ON "content_pages"("status");

-- CreateIndex
CREATE INDEX "content_pages_type_idx" ON "content_pages"("type");

-- CreateIndex
CREATE INDEX "content_pages_language_idx" ON "content_pages"("language");

-- CreateIndex
CREATE INDEX "content_pages_publishedAt_idx" ON "content_pages"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_categories_slug_key" ON "content_categories"("slug");

-- CreateIndex
CREATE INDEX "content_categories_parentId_idx" ON "content_categories"("parentId");

-- CreateIndex
CREATE INDEX "content_categories_isActive_idx" ON "content_categories"("isActive");

-- CreateIndex
CREATE INDEX "content_media_fileType_idx" ON "content_media"("fileType");

-- CreateIndex
CREATE INDEX "content_media_uploadedBy_idx" ON "content_media"("uploadedBy");

-- CreateIndex
CREATE INDEX "content_translations_pageId_idx" ON "content_translations"("pageId");

-- CreateIndex
CREATE INDEX "content_translations_language_idx" ON "content_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "content_translations_pageId_language_key" ON "content_translations"("pageId", "language");

-- AddForeignKey
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "content_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "content_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
