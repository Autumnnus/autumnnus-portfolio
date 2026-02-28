CREATE TABLE "Category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BlogPost" ADD COLUMN "categoryId" uuid;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "categoryId" uuid;--> statement-breakpoint
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BlogPost" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "Project" DROP COLUMN "category";