import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const battery = { id: v.string(), name: v.string(), kind: v.union(v.literal("Demo"), v.literal("Competition")), status: v.union(v.literal("Active"), v.literal("Retired")), createdAt: v.string() };
const event = { id: v.string(), name: v.string(), startDate: v.string(), endDate: v.string(), type: v.union(v.literal("Competition"), v.literal("Demo"), v.literal("Practice")), status: v.union(v.literal("Active"), v.literal("Closed")) };
const member = { id: v.string(), name: v.string(), role: v.union(v.literal("Mentor"), v.literal("Subsystem Leader"), v.literal("Member")), joinedAt: v.string() };
const reading = { id: v.string(), batteryId: v.string(), batteryName: v.string(), when: v.union(v.literal("off"), v.literal("on")), status: v.union(v.literal("Good"), v.literal("Fair"), v.literal("Bad"), v.literal("Charge Battery")), charge: v.union(v.number(), v.null()), v0: v.union(v.number(), v.null()), v1: v.union(v.number(), v.null()), v2: v.union(v.number(), v.null()), ir: v.union(v.number(), v.null()), notes: v.string(), recordedAt: v.string(), eventId: v.optional(v.string()), eventName: v.optional(v.string()), matchNumber: v.optional(v.number()) };

export default defineSchema({
  ...authTables,
  batteries: defineTable({ teamId: v.string(), ...battery }).index("by_team", ["teamId"]),
  events: defineTable({ teamId: v.string(), ...event }).index("by_team", ["teamId"]),
  members: defineTable({ teamId: v.string(), tokenIdentifier: v.optional(v.string()), ...member }).index("by_team", ["teamId"]).index("by_token", ["tokenIdentifier"]),
  readings: defineTable({ teamId: v.string(), ...reading }).index("by_team", ["teamId"]),
});
