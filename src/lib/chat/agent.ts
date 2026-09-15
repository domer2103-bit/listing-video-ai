import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "../clients/anthropic";
import { scrapeListing } from "../scrapers";
import { Audience, ChatSession } from "../types";
import { CURATED_VOICES } from "../voices";

function buildSystemPrompt(audience: Audience): string {
  if (audience === "airbnb") {
    return `You are a friendly, efficient assistant guiding an Airbnb / short-term
rental host through creating a short AI-narrated promo video for their
listing. This is a guided intake conversation, not a form — be warm and
conversational, ask one thing at a time, and keep replies brief.

Airbnb listings can't be scraped automatically, so this is always a
photo-upload flow — don't ask about a listing URL.

Your job, in order:
1. Ask for the listing details you need — location (just the area/city is
   fine, no need for a full street address), nightly rate, bedrooms,
   bathrooms, and a short description of what makes the place stand out
   (view, amenities, style, location perks) — naturally, not as a rigid
   checklist. Call set_property_details as details come in (partial calls
   are fine, fields merge with what's already recorded).
2. Tell them to use the upload button to add photos of the place. Once
   photos are uploaded (you'll see a system note listing the new photo
   URLs), ask what room or area each one shows — a few at a time is fine —
   and call tag_photo for each answer.
3. Once the core details are in, offer a narration voice choice — mention
   it's optional. Offer this shortlist: ${CURATED_VOICES.map((v) => v.label).join("; ")}.
   If they pick one, call set_voice. If they don't care, don't push — just
   proceed with the default and move on, don't make this feel mandatory.
4. Once you have enough — location, nightly rate, and at least 3 tagged
   photos — summarize what you have (including the chosen voice if one was
   picked) and ask for final confirmation before generating. When they
   confirm, call ready_to_generate.

Only ask for what's actually needed for the video. No email, no login, no
payment details. If ready_to_generate reports something is still missing,
ask for exactly that and try again once you have it.`;
  }

  return `You are a friendly, efficient assistant guiding someone through
creating a short AI-narrated promo video for a property listing. This is a
guided intake conversation, not a form — be warm and conversational, ask one
thing at a time, and keep replies brief.

Your job, in order:
1. Ask whether they have a property listing URL (e.g. Rightmove) or would
   rather upload photos directly. Call set_flow as soon as they answer.
2. If they have a URL: ask for it, then call set_listing_url — this scrapes
   the listing automatically (address, price, photos, floorplan). Relay a
   short summary of what was found back to them and ask them to confirm or
   correct anything that looks wrong. The tool result tells you which
   fields came back missing or empty (scrapers vary in what they can pull
   from a given site) — ask the user for those specifically before moving
   on, using set_property_details to fill them in (it patches the scraped
   listing directly). Don't just silently proceed with gaps.
3. If they'd rather upload photos: ask for the property details you need —
   address, price, bedrooms, bathrooms, size, and a short description of
   standout features — naturally, not as a rigid checklist. Call
   set_property_details as details come in (partial calls are fine, fields
   merge with what's already recorded). Then tell them to use the upload
   button to add photos. Once photos are uploaded (you'll see a system note
   listing the new photo URLs), ask what room or area each one shows — a
   few at a time is fine — and call tag_photo for each answer.
4. Once the core details are in, offer a narration voice choice — mention
   it's optional. Offer this shortlist: ${CURATED_VOICES.map((v) => v.label).join("; ")}.
   If they pick one, call set_voice. If they don't care, don't push — just
   proceed with the default and move on, don't make this feel mandatory.
5. Once you have enough — a successfully scraped listing, OR address, price,
   and at least 3 tagged photos — summarize what you have (including the
   chosen voice if one was picked) and ask for final confirmation before
   generating. When they confirm, call ready_to_generate.

Only ask for what's actually needed for the video. No email, no login, no
payment details. If ready_to_generate reports something is still missing,
ask for exactly that and try again once you have it.`;
}

const URL_FLOW_TOOLS: Anthropic.Tool[] = [
  {
    name: "set_flow",
    description: "Record whether the user has a listing URL or wants to upload photos directly. Call as soon as they tell you.",
    input_schema: {
      type: "object",
      properties: { flow: { type: "string", enum: ["url", "upload"] } },
      required: ["flow"],
    },
  },
  {
    name: "set_listing_url",
    description:
      "Record the property listing URL and scrape it automatically (address, price, photos, floorplan, location). Returns a summary to relay to the user.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
  },
];

const SHARED_TOOLS: Anthropic.Tool[] = [
  {
    name: "set_property_details",
    description:
      "Record property details — either building up the listing from scratch (photo-upload flow) or filling in gaps left by a scrape (URL flow, patches the scraped listing directly). Call incrementally as details come in — partial calls are fine, fields merge with what's already recorded.",
    input_schema: {
      type: "object",
      properties: {
        address: { type: "string" },
        price: { type: "string" },
        bedrooms: { type: "number" },
        bathrooms: { type: "number" },
        sqft: { type: "number" },
        description: { type: "string", description: "Short description of standout features, style, condition." },
      },
    },
  },
  {
    name: "tag_photo",
    description: "Record which room/area a specific uploaded photo shows, once the user tells you.",
    input_schema: {
      type: "object",
      properties: {
        photoUrl: { type: "string" },
        roomType: { type: "string", description: "e.g. kitchen, living room, primary bedroom, garden, exterior front" },
      },
      required: ["photoUrl", "roomType"],
    },
  },
  {
    name: "set_voice",
    description: "Record the user's narration voice choice from the offered shortlist. Optional — only call if they actually pick one.",
    input_schema: {
      type: "object",
      properties: { voiceId: { type: "string", enum: CURATED_VOICES.map((v) => v.id) } },
      required: ["voiceId"],
    },
  },
  {
    name: "ready_to_generate",
    description:
      "Call once the user has confirmed everything is correct and wants the video generated. Requires a scraped listing (URL flow) or address + price + at least 3 tagged photos (upload flow).",
    input_schema: { type: "object", properties: {} },
  },
];

function buildTools(audience: Audience): Anthropic.Tool[] {
  // Airbnb listings can't be scraped, so that audience never gets the
  // URL-flow tools — set_flow defaults to "upload" implicitly instead,
  // see executeTool's ready_to_generate case.
  return audience === "airbnb" ? SHARED_TOOLS : [...URL_FLOW_TOOLS, ...SHARED_TOOLS];
}

export interface ChatTurnResult {
  reply: string;
  readyToGenerate: boolean;
}

export async function runChatTurn(session: ChatSession, userMessage: string): Promise<ChatTurnResult> {
  const client = getAnthropicClient();
  const audience: Audience = session.audience ?? "sale";
  session.messages.push({ role: "user", content: userMessage });

  const anthropicMessages: Anthropic.MessageParam[] = session.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let readyToGenerate = false;
  let finalText = "";

  for (let turn = 0; turn < 6; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: buildSystemPrompt(audience),
      tools: buildTools(audience),
      messages: anthropicMessages,
    });

    anthropicMessages.push({ role: "assistant", content: response.content });

    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const text = textBlocks.map((b) => b.text).join("\n").trim();
    if (text) finalText = text;

    if (response.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const result = await executeTool(session, block.name, block.input as Record<string, unknown>);
      if (block.name === "ready_to_generate" && result.ok) readyToGenerate = true;
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result.message,
        is_error: !result.ok,
      });
    }
    anthropicMessages.push({ role: "user", content: toolResults });
  }

  session.messages.push({ role: "assistant", content: finalText });
  return { reply: finalText, readyToGenerate };
}

async function executeTool(
  session: ChatSession,
  name: string,
  input: Record<string, unknown>
): Promise<{ ok: boolean; message: string }> {
  switch (name) {
    case "set_flow": {
      const flow = input.flow as "url" | "upload";
      session.draft.flow = flow;
      return { ok: true, message: `Flow set to ${flow}.` };
    }

    case "set_listing_url": {
      const url = input.url as string;
      session.draft.sourceUrl = url;
      try {
        const listing = await scrapeListing(url);
        session.draft.scrapedListing = listing;

        const missing: string[] = [];
        if (!listing.address) missing.push("address");
        if (!listing.price) missing.push("price");
        if (!listing.bedrooms) missing.push("bedrooms");
        if (!listing.bathrooms) missing.push("bathrooms");
        if (!listing.sqft) missing.push("size (sqft)");
        if (listing.photos.length === 0) missing.push("photos (none found at all — may need the upload flow instead)");

        return {
          ok: true,
          message: `Scraped successfully: "${listing.address}", ${listing.price}, ${listing.bedrooms ?? "?"} bed / ${listing.bathrooms ?? "?"} bath, ${listing.photos.length} photos${listing.floorplanUrl ? ", floorplan found" : ""}.${
            missing.length > 0
              ? ` Missing from the scrape: ${missing.join(", ")}. Ask the user for these before offering to generate.`
              : ""
          }`,
        };
      } catch (err) {
        return {
          ok: false,
          message: `Scraping failed: ${err instanceof Error ? err.message : "unknown error"}. Relay the actual reason to the user (don't default to "check the URL" if the error says otherwise, e.g. a site blocking automated access), and offer the upload flow as a fallback.`,
        };
      }
    }

    case "set_property_details": {
      // If a listing was already scraped, patch it directly — that's what
      // actually feeds the pipeline (buildListingFromDraft prefers
      // scrapedListing unconditionally), otherwise these fill-ins would be
      // silently discarded.
      if (session.draft.scrapedListing) {
        Object.assign(session.draft.scrapedListing, input);
      } else {
        Object.assign(session.draft, input);
      }
      return { ok: true, message: "Details recorded." };
    }

    case "set_voice": {
      const voiceId = input.voiceId as string;
      session.draft.voiceId = voiceId;
      return { ok: true, message: `Voice set to ${voiceId}.` };
    }

    case "tag_photo": {
      const photoUrl = input.photoUrl as string;
      const roomType = input.roomType as string;
      const photo = session.draft.photos.find((p) => p.url === photoUrl);
      if (!photo) {
        return { ok: false, message: `No uploaded photo found matching that URL — ask the user to re-upload it.` };
      }
      photo.roomType = roomType;
      return { ok: true, message: `Tagged as ${roomType}.` };
    }

    case "ready_to_generate": {
      const { draft } = session;
      // Airbnb sessions never get the set_flow tool (no URL flow exists
      // for them) — treat as upload flow implicitly.
      const flow = session.audience === "airbnb" ? "upload" : draft.flow;
      if (flow === "url") {
        if (!draft.scrapedListing) {
          return { ok: false, message: "No listing has been successfully scraped yet." };
        }
        if (draft.scrapedListing.photos.length === 0) {
          return { ok: false, message: "The scraped listing has no photos — can't generate a video without any. Switch to the upload flow instead." };
        }
        return { ok: true, message: "Ready." };
      }
      if (flow === "upload") {
        const taggedCount = draft.photos.filter((p) => p.roomType).length;
        const missing: string[] = [];
        if (!draft.address) missing.push("address");
        if (!draft.price) missing.push("price");
        if (taggedCount < 3) missing.push(`at least 3 tagged photos (currently ${taggedCount})`);
        if (missing.length > 0) {
          return { ok: false, message: `Still missing: ${missing.join(", ")}.` };
        }
        return { ok: true, message: "Ready." };
      }
      return { ok: false, message: "No flow selected yet." };
    }

    default:
      return { ok: false, message: `Unknown tool: ${name}` };
  }
}
