/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TEAM_ID = "team-341";
const batteryFields = { id: v.string(), name: v.string(), kind: v.union(v.literal("Demo"), v.literal("Competition")), status: v.union(v.literal("Active"), v.literal("Retired")), createdAt: v.string() };
const eventFields = { id: v.string(), name: v.string(), startDate: v.string(), endDate: v.string(), type: v.union(v.literal("Competition"), v.literal("Demo"), v.literal("Practice")), status: v.union(v.literal("Active"), v.literal("Closed")) };
const memberFields = { id: v.string(), name: v.string(), role: v.union(v.literal("Mentor"), v.literal("Subsystem Leader"), v.literal("Member")), joinedAt: v.string() };
const readingFields = { id: v.string(), batteryId: v.string(), batteryName: v.string(), when: v.union(v.literal("off"), v.literal("on")), status: v.union(v.literal("Good"), v.literal("Fair"), v.literal("Bad"), v.literal("Charge Battery")), charge: v.union(v.number(), v.null()), v0: v.union(v.number(), v.null()), v1: v.union(v.number(), v.null()), v2: v.union(v.number(), v.null()), ir: v.union(v.number(), v.null()), notes: v.string(), recordedAt: v.string(), eventId: v.optional(v.string()), eventName: v.optional(v.string()), matchNumber: v.optional(v.number()) };
const battery = v.object(batteryFields); const event = v.object(eventFields); const member = v.object(memberFields); const reading = v.object(readingFields);

async function requireIdentity(ctx: any) { const current = await ctx.auth.getUserIdentity(); if (!current) throw new Error("You must be signed in."); return current; }
async function findMember(ctx: any, tokenIdentifier: string) { return await ctx.db.query("members").withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier)).unique(); }
function clean(value: any) { const item = { ...value }; delete item.teamId; delete item.tokenIdentifier; delete item._id; delete item._creationTime; return item; }
function sameRecords(existing: any[], incoming: any[]) { return JSON.stringify(existing.map(clean).sort((a, b) => a.id.localeCompare(b.id))) === JSON.stringify([...incoming].sort((a, b) => a.id.localeCompare(b.id))); }

export const get = query({ args: {}, handler: async (ctx) => {
  const current = await ctx.auth.getUserIdentity(); if (!current) return null;
  const [batteries, events, readings, members] = await Promise.all([
    ctx.db.query("batteries").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(5000),
    ctx.db.query("events").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(5000),
    ctx.db.query("readings").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(10000),
    ctx.db.query("members").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(5000),
  ]);
  return { batteries: batteries.map(clean), events: events.map(clean), readings: readings.map(clean), members: members.map(clean), currentMember: clean(await findMember(ctx, current.tokenIdentifier)) || null };
} });

export const ensureMember = mutation({ args: { name: v.string() }, handler: async (ctx, args) => {
  const current = await requireIdentity(ctx); const existing = await findMember(ctx, current.tokenIdentifier); if (existing) return clean(existing);
  const members = await ctx.db.query("members").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(5000);
  const created = { id: `member-${Date.now()}-${Math.random().toString(36).slice(2)}`, teamId: TEAM_ID, tokenIdentifier: current.tokenIdentifier, name: args.name.trim() || current.name || "Team member", role: members.length === 0 ? "Mentor" as const : "Member" as const, joinedAt: new Date().toISOString() };
  await ctx.db.insert("members", created); return clean(created);
} });

export const replaceData = mutation({ args: { batteries: v.array(battery), events: v.array(event), members: v.array(member), readings: v.array(reading) }, handler: async (ctx, args) => {
  const current = await requireIdentity(ctx); const me = await findMember(ctx, current.tokenIdentifier); if (!me) throw new Error("Complete sign in before saving data.");
  const [oldBatteries, oldEvents, oldReadings, oldMembers] = await Promise.all([
    ctx.db.query("batteries").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(5000), ctx.db.query("events").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(5000), ctx.db.query("readings").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(10000), ctx.db.query("members").withIndex("by_team", (q) => q.eq("teamId", TEAM_ID)).take(5000),
  ]);
  const adminChange = !sameRecords(oldBatteries, args.batteries) || !sameRecords(oldEvents, args.events) || !sameRecords(oldMembers, args.members);
  if (adminChange && me.role === "Member") throw new Error("Only mentors and subsystem leaders can manage team setup.");
  async function sync(table: "batteries" | "events" | "readings", existing: any[], incoming: any[]) { const byId = new Map(existing.map((item) => [item.id, item])); for (const item of incoming) { const old = byId.get(item.id); if (old) await ctx.db.patch(old._id, { ...item, teamId: TEAM_ID }); else await ctx.db.insert(table, { ...item, teamId: TEAM_ID }); byId.delete(item.id); } for (const old of byId.values()) await ctx.db.delete(old._id); }
  await sync("batteries", oldBatteries, args.batteries); await sync("events", oldEvents, args.events); await sync("readings", oldReadings, args.readings);
  const byId = new Map(oldMembers.map((item) => [item.id, item])); for (const item of args.members) { const old = byId.get(item.id); if (old) await ctx.db.patch(old._id, { ...item, teamId: TEAM_ID }); else await ctx.db.insert("members", { ...item, teamId: TEAM_ID, tokenIdentifier: `legacy:${item.id}` }); byId.delete(item.id); } for (const old of byId.values()) { if (old.tokenIdentifier !== current.tokenIdentifier) await ctx.db.delete(old._id); }
} });
