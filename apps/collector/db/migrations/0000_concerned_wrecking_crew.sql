CREATE TABLE "app_usage_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_name" text NOT NULL,
	"app_url" text NOT NULL,
	"model_display_name" text NOT NULL,
	"model_name" text NOT NULL,
	"collect_batch_id" integer NOT NULL,
	"tokens_used" text NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"category" text,
	"tokens_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "apps_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "collect_batch" (
	"id" serial PRIMARY KEY NOT NULL,
	"collected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"model_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "models_model_name_unique" UNIQUE("model_name")
);
