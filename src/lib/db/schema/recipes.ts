import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const recipesTable = pgTable("recipes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  companyFilters: jsonb("company_filters").notNull(),
  peopleFilters: jsonb("people_filters").notNull(),
  exportColumns: jsonb("export_columns").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
