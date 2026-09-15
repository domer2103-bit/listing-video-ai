// One-off setup: creates the Starter/Pro/Agency recurring Products+Prices
// in Stripe (whatever mode STRIPE_SECRET_KEY is in — test or live) and
// prints the Price IDs to paste into .env.local as STRIPE_PRICE_*.
// Safe to re-run: skips any plan whose product already exists (matched by
// product name).
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const envPath = path.join(projectRoot, ".env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const Stripe = (await import("stripe")).default;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = [
  { key: "STARTER", name: "Starter", priceGBP: 19, description: "5 videos/month, Remotion motion, full voice library" },
  { key: "PRO", name: "Pro", priceGBP: 49, description: "15 videos/month, AI satellite establishing shot, priority rendering" },
  { key: "AGENCY", name: "Agency", priceGBP: 149, description: "50 videos/month, AI establishing shot, batch generation" },
];

const existingProducts = await stripe.products.list({ limit: 100 });

for (const plan of PLANS) {
  let product = existingProducts.data.find((p) => p.name === `Listing Video AI — ${plan.name}`);
  if (!product) {
    product = await stripe.products.create({
      name: `Listing Video AI — ${plan.name}`,
      description: plan.description,
    });
    console.log(`Created product: ${product.name} (${product.id})`);
  } else {
    console.log(`Product already exists: ${product.name} (${product.id})`);
  }

  const existingPrices = await stripe.prices.list({ product: product.id, limit: 10 });
  let price = existingPrices.data.find(
    (p) => p.unit_amount === plan.priceGBP * 100 && p.recurring?.interval === "month" && p.currency === "gbp"
  );
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceGBP * 100,
      currency: "gbp",
      recurring: { interval: "month" },
    });
    console.log(`Created price: £${plan.priceGBP}/mo (${price.id})`);
  } else {
    console.log(`Price already exists: £${plan.priceGBP}/mo (${price.id})`);
  }

  console.log(`STRIPE_PRICE_${plan.key}=${price.id}\n`);
}
