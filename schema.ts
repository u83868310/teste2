import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Basic user account information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Content types enum for categorization
export const ContentTypeEnum = z.enum(['movie', 'series', 'channel']);
export type ContentType = z.infer<typeof ContentTypeEnum>;

// Media content schema
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  streamUrl: text("stream_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: text("type").notNull(), // 'movie', 'series', 'channel'
  category: text("category"),
  rating: text("rating"),
  year: text("year"),
  description: text("description"),
  isFeatured: boolean("is_featured").default(false),
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;

// Categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"),
  colorFrom: text("color_from"),
  colorTo: text("color_to"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Episodes schema for series
export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull(),
  title: text("title").notNull(),
  seasonNumber: integer("season_number").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  streamUrl: text("stream_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
});

export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;

// Schema for favorites
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mediaId: integer("media_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
