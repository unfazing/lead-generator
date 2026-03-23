import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const companySnapshotsTable = pgTable("company_snapshots", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull(),
  signature: text("signature").notNull(),
  requestPayload: jsonb("request_payload").notNull(),
  resultPayload: jsonb("result_payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
