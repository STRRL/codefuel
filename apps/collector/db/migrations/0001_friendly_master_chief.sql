CREATE INDEX "app_usage_history_collect_batch_id_idx" ON "app_usage_history" USING btree ("collect_batch_id");--> statement-breakpoint
CREATE INDEX "app_usage_history_model_name_idx" ON "app_usage_history" USING btree ("model_name");--> statement-breakpoint
CREATE INDEX "app_usage_history_app_name_idx" ON "app_usage_history" USING btree ("app_name");