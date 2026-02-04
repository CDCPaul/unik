import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({
  region: "asia-northeast3", // 서울 리전
  maxInstances: 10,
});

const getResendApiKey = () => process.env.RESEND_API_KEY || "";

const allowedOrigins = [
  "https://unik.ph",
  "https://www.unik.ph",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const applyCors = (req: any, res: any) => {
  const origin = req.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  } else {
    res.set("Access-Control-Allow-Origin", "*");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
};

const buildDefaultRouletteSlots = () =>
  Array.from({ length: 50 }).map((_, idx) => ({
    id: `slot-${idx + 1}`,
    label: `Gift ${idx + 1}`,
    grade: idx % 10 === 0 ? "high" : idx % 3 === 0 ? "mid" : "low",
    probability: idx % 10 === 0 ? 1 : idx % 3 === 0 ? 2 : 3,
    total_stock: idx % 10 === 0 ? 10 : idx % 3 === 0 ? 30 : 60,
    current_stock: idx % 10 === 0 ? 10 : idx % 3 === 0 ? 30 : 60,
  }));

const buildVisualSlots = (
  tiers: Array<{ id: string; name: string; probability: number }>,
  slotCount: number,
  visualCounts?: Partial<Record<string, number>>,
  visualPattern?: string[]
) => {
  const counts: Record<string, number> = tiers.reduce((acc, tier) => {
    acc[tier.id] = Math.max(0, Number(visualCounts?.[tier.id] ?? 0));
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(counts).reduce((acc, value) => acc + value, 0);
  if (total !== slotCount) {
    const fallbackId = tiers[tiers.length - 1]?.id || 'low';
    counts[fallbackId] = Math.max(0, (counts[fallbackId] || 0) + (slotCount - total));
  }

  const tierMap = tiers.reduce((acc, tier) => {
    acc[tier.id] = tier;
    return acc;
  }, {} as Record<string, { id: string; name: string }>);

  const pattern = (visualPattern && visualPattern.length ? visualPattern : ['low', 'low', 'low', 'mid', 'high', 'mid', 'low', 'low', 'low'])
    .map((id) => String(id));

  const slots: Array<{ id: string; label: string; grade: string }> = [];
  const remaining = { ...counts };
  let guard = 0;

  while (slots.length < slotCount && guard < slotCount * 5) {
    for (const id of pattern) {
      if (slots.length >= slotCount) break;
      if (remaining[id] > 0) {
        const name = tierMap[id]?.name || id;
        const nextIndex = (counts[id] - remaining[id]) + 1;
        slots.push({ id: `${id}-${nextIndex}`, label: name, grade: id });
        remaining[id] -= 1;
      }
    }
    guard += 1;
  }

  for (const id of Object.keys(remaining)) {
    while (slots.length < slotCount && remaining[id] > 0) {
      const name = tierMap[id]?.name || id;
      const nextIndex = (counts[id] - remaining[id]) + 1;
      slots.push({ id: `${id}-${nextIndex}`, label: name, grade: id });
      remaining[id] -= 1;
    }
  }

  return slots;
};

/**
 * Get staff email from settings
 */
async function getStaffEmail(): Promise<string> {
  try {
    const settingsDoc = await admin.firestore()
      .collection('settings')
      .doc('company')
      .get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      // Prefer multi-email settings if present
      const emails = Array.isArray(data?.contactEmails) ? data.contactEmails : [];
      return emails[0] || data?.contactEmail || "ticket@cebudirectclub.com"; // Fallback
    }
    return "ticket@cebudirectclub.com"; // Default fallback
  } catch (error) {
    console.error("Error fetching staff email:", error);
    return "ticket@cebudirectclub.com"; // Error fallback
  }
}

/**
 * 새로운 투어 신청이 들어오면 이메일 알림 발송
 */
export const onNewRegistration = onDocumentCreated(
  {
    document: "registrations/{docId}",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const data = snapshot.data();
    const docId = event.params.docId;

    console.log(`New registration received: ${docId}`);

    const apiKey = getResendApiKey();
    if (!apiKey) {
      console.warn("RESEND_API_KEY not configured. Skipping email send.");
      return;
    }
    // Initialize Resend with secret
    const resend = new Resend(apiKey);
    
    // Get staff email from settings
    const staffEmail = await getStaffEmail();

    try {
      await resend.emails.send({
        from: "UNI-K Tour <noreply@unik.ph>",
        to: [staffEmail],
        subject: `🎫 [UNI-K] New Tour Registration: ${data.fullName}`,
        html: generateRegistrationEmail(data, docId),
      });

      console.log(`Email sent successfully for registration: ${docId}`);

      // Firestore에 이메일 발송 상태 업데이트
      await snapshot.ref.update({
        emailNotificationSent: true,
        emailNotificationSentAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending email:", error);

      // 실패 상태 기록
      await snapshot.ref.update({
        emailNotificationSent: false,
        emailNotificationError: String(error),
      });
    }
  }
);

/**
 * 새로운 문의가 들어오면 이메일 알림 발송
 */
export const onNewContact = onDocumentCreated(
  {
    document: "contacts/{docId}",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const data = snapshot.data();
    const docId = event.params.docId;

    console.log(`New contact inquiry received: ${docId}`);

    const apiKey = getResendApiKey();
    if (!apiKey) {
      console.warn("RESEND_API_KEY not configured. Skipping email send.");
      return;
    }
    // Initialize Resend with secret
    const resend = new Resend(apiKey);
    
    // Get staff email from settings
    const staffEmail = await getStaffEmail();

    try {
      await resend.emails.send({
        from: "UNI-K Tour <noreply@unik.ph>",
        to: [staffEmail],
        subject: `💬 [UNI-K] New Inquiry: ${data.subject || "General Inquiry"}`,
        html: generateContactEmail(data, docId),
      });

      console.log(`Email sent successfully for contact: ${docId}`);

      await snapshot.ref.update({
        emailNotificationSent: true,
        emailNotificationSentAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending email:", error);

      await snapshot.ref.update({
        emailNotificationSent: false,
        emailNotificationError: String(error),
      });
    }
  }
);

/**
 * Roulette spin endpoint
 */
export const spinRoulette = onRequest({ cors: true }, async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const rouletteId = (req.body?.rouletteId || "cdc-travel").toString();
  const docRef = admin.firestore().collection("roulette").doc(rouletteId);

  try {
    const result = await admin.firestore().runTransaction(async (tx) => {
      const snapshot = await tx.get(docRef);
      let data: any = snapshot.data() || {};
      const tiers = Array.isArray(data.tiers) ? data.tiers : null;
      const slotCount = Number(data.slotCount || 50);
      const targetSpins = Number(data.targetSpins || 0);
      const visualCounts = data.visualCounts || { high: 5, mid: 10, low: 35 };
      const visualPattern = data.visualPattern || ['low', 'low', 'low', 'mid', 'high', 'mid', 'low', 'low', 'low'];

      if (tiers && tiers.length) {
        const totalProb = tiers.reduce(
          (acc: number, tier: any) => acc + Number(tier?.probability || 0),
          0
        );
        if (!totalProb) {
          throw new Error("Invalid probability settings");
        }

        const winsByTier = { ...(data.winsByTier || {}) } as Record<string, number>;
        const maxWinsByTier = tiers.reduce((acc: Record<string, number>, tier: any) => {
          const prob = Number(tier?.probability || 0);
          const maxWins =
            targetSpins > 0 ? Math.round((targetSpins * prob) / totalProb) : Number.POSITIVE_INFINITY;
          acc[tier.id] = maxWins;
          return acc;
        }, {});

        const availableTiers = tiers.filter((tier: any) => {
          const maxWins = maxWinsByTier[tier.id];
          const currentWins = Number(winsByTier[tier.id] || 0);
          return maxWins > 0 && currentWins < maxWins;
        });

        if (!availableTiers.length) {
          throw new Error("No available stock");
        }

        const availableWeight = availableTiers.reduce(
          (acc: number, tier: any) => acc + Number(tier?.probability || 0),
          0
        );

        let randomPoint = Math.random() * availableWeight;
        let selectedTier = availableTiers[0];

        for (const tier of availableTiers) {
          randomPoint -= Number(tier?.probability || 0);
          if (randomPoint <= 0) {
            selectedTier = tier;
            break;
          }
        }

        const slots = buildVisualSlots(tiers, slotCount, visualCounts, visualPattern);
        const tierIndices = slots
          .map((slot, index) => ({ slot, index }))
          .filter(({ slot }) => slot.grade === selectedTier.id);

        if (!tierIndices.length) {
          throw new Error("No available slot for tier");
        }

        const chosen = tierIndices[Math.floor(Math.random() * tierIndices.length)];
        winsByTier[selectedTier.id] = Number(winsByTier[selectedTier.id] || 0) + 1;

        tx.update(docRef, {
          winsByTier,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          index: chosen.index,
          slot: {
            ...chosen.slot,
            probability: Number(selectedTier?.probability || 0),
            total_stock: maxWinsByTier[selectedTier.id],
            current_stock: Math.max(0, maxWinsByTier[selectedTier.id] - winsByTier[selectedTier.id]),
          },
          remainingStock: Math.max(0, maxWinsByTier[selectedTier.id] - winsByTier[selectedTier.id]),
        };
      }

      let slots = Array.isArray(data.slots) ? data.slots : [];

      if (!snapshot.exists || slots.length === 0) {
        slots = buildDefaultRouletteSlots();
        data = { id: rouletteId, title: "CDC TRAVEL Roulette", slots };
        tx.set(docRef, {
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const normalizedSlots = slots.map((slot: any, index: number) => ({
        ...slot,
        index,
        probability: Number(slot?.probability || 0),
        current_stock: Math.max(0, Number(slot?.current_stock || 0)),
      }));

      const availableSlots = normalizedSlots.filter(
        (slot: any) => slot.current_stock > 0 && slot.probability > 0
      );

      if (availableSlots.length === 0) {
        throw new Error("No available stock");
      }

      const totalWeight = availableSlots.reduce(
        (acc: number, slot: any) => acc + slot.probability,
        0
      );

      let randomPoint = Math.random() * totalWeight;
      let selected = availableSlots[0];

      for (const slot of availableSlots) {
        randomPoint -= slot.probability;
        if (randomPoint <= 0) {
          selected = slot;
          break;
        }
      }

      const updatedSlots = slots.map((slot: any, index: number) => {
        if (index !== selected.index) return slot;
        return {
          ...slot,
          current_stock: Math.max(0, Number(slot?.current_stock || 0) - 1),
        };
      });

      tx.update(docRef, {
        slots: updatedSlots,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        index: selected.index,
        slot: updatedSlots[selected.index],
        remainingStock: updatedSlots[selected.index]?.current_stock ?? 0,
      };
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Roulette spin error:", error);
    const message = error?.message || "Spin failed";
    const status = message === "No available stock" ? 409 : 500;
    res.status(status).send(message);
  }
});

/**
 * Save roulette winner info
 */
export const createRouletteWinner = onRequest({ cors: true }, async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const {
    rouletteId = "cdc-travel",
    winnerName,
    winnerContact,
    slot,
    slotIndex,
  } = req.body || {};

  if (!winnerName || !winnerContact || !slot?.id || !slot?.label || !slot?.grade) {
    res.status(400).send("Invalid payload");
    return;
  }

  try {
    const docRef = await admin.firestore().collection("roulette_winners").add({
      rouletteId: String(rouletteId),
      slotId: String(slot.id),
      slotLabel: String(slot.label),
      slotGrade: String(slot.grade),
      slotIndex: typeof slotIndex === "number" ? slotIndex : null,
      winnerName: String(winnerName),
      winnerContact: String(winnerContact),
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ id: docRef.id });
  } catch (error) {
    console.error("Create winner error:", error);
    res.status(500).send("Failed to save winner");
  }
});

/**
 * 투어 신청 이메일 템플릿
 */
function generateRegistrationEmail(data: any, docId: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section-title { color: #667eea; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
        .field { margin: 10px 0; }
        .label { color: #666; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; font-weight: 500; color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .badge { display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎫 New Tour Registration</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">A new customer has registered for the tour!</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">🎫 Tour Information</div>
            <div class="field">
              <div class="label">Selected Tour</div>
              <div class="value"><strong>${data.tourTitle || "N/A"}</strong></div>
            </div>
            <div class="field">
              <div class="label">Departure Date</div>
              <div class="value">${data.departureDate || "N/A"}</div>
            </div>
            <div class="field">
              <div class="label">Departure City</div>
              <div class="value">${data.pricingOrigin || data.departureOrigin || "N/A"}</div>
            </div>
            <div class="field">
              <div class="label">Total Price</div>
              <div class="value">
                <strong>${data.priceCurrency || "PHP"} ${typeof data.totalPrice === "number" ? Number(data.totalPrice).toLocaleString() : "N/A"}</strong>
              </div>
            </div>
            <div class="field">
              <div class="label">Unit Prices</div>
              <div class="value">
                Adult: ${typeof data.unitPriceAdult === "number" ? `${data.priceCurrency || "PHP"} ${Number(data.unitPriceAdult).toLocaleString()}` : "N/A"}<br/>
                Child: ${typeof data.unitPriceChild === "number" ? `${data.priceCurrency || "PHP"} ${Number(data.unitPriceChild).toLocaleString()}` : "N/A"}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 Applicant Information</div>
            <div class="field">
              <div class="label">Full Name</div>
              <div class="value">${data.fullName || "N/A"}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${data.email}">${data.email || "N/A"}</a></div>
            </div>
            <div class="field">
              <div class="label">Phone Number</div>
              <div class="value">${data.phone || data.phoneNumber || "N/A"}</div>
            </div>
            <div class="field">
              <div class="label">Date of Birth</div>
              <div class="value">${data.dateOfBirth || "N/A"}</div>
            </div>
            <div class="field">
              <div class="label">Name (Passport Name)</div>
              <div class="value">${data.fullName || data.passportName || "N/A"}</div>
            </div>
            <div class="field">
              <div class="label">Nationality</div>
              <div class="value">${data.nationality || "N/A"}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">👥 Companions</div>
            <div class="field">
              <div class="label">Adults (12+)</div>
              <div class="value">${data.adultsCount || 0} person(s)</div>
            </div>
            <div class="field">
              <div class="label">Children (under 12)</div>
              <div class="value">${data.childrenCount || 0} person(s)</div>
            </div>
            <div class="field">
              <div class="label">Total Group Size</div>
              <div class="value"><strong>${(data.adultsCount || 0) + (data.childrenCount || 0)} person(s)</strong></div>
            </div>
          </div>

          ${data.specialRequests ? `
          <div class="section">
            <div class="section-title">📝 Special Requests</div>
            <p style="margin: 0; white-space: pre-wrap;">${data.specialRequests}</p>
          </div>
          ` : ""}

          <div class="section">
            <div class="section-title">ℹ️ Submission Details</div>
            <div class="field">
              <div class="label">Registration ID</div>
              <div class="value" style="font-family: monospace; font-size: 12px;">${docId}</div>
            </div>
            <div class="field">
              <div class="label">Status</div>
              <div class="value"><span class="badge">New</span></div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated notification from UNI-K Tour System.</p>
          <p>Please check the <a href="https://admin.unik.ph/registrations">Admin Dashboard</a> for more details.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 문의 이메일 템플릿
 */
function generateContactEmail(data: any, docId: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section-title { color: #11998e; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; border-bottom: 2px solid #11998e; padding-bottom: 5px; }
        .field { margin: 10px 0; }
        .label { color: #666; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; font-weight: 500; color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .message-box { background: #f0f0f0; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">💬 New Customer Inquiry</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">A customer has sent a message!</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">👤 Contact Information</div>
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${data.name || "N/A"}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${data.email}">${data.email || "N/A"}</a></div>
            </div>
            ${data.phone ? `
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${data.phone}</div>
            </div>
            ` : ""}
          </div>

          <div class="section">
            <div class="section-title">📨 Message</div>
            ${data.subject ? `
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${data.subject}</div>
            </div>
            ` : ""}
            <div class="message-box">${data.message || "No message provided."}</div>
          </div>

          <div class="section">
            <div class="section-title">ℹ️ Details</div>
            <div class="field">
              <div class="label">Inquiry ID</div>
              <div class="value" style="font-family: monospace; font-size: 12px;">${docId}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated notification from UNI-K Tour System.</p>
          <p>Please reply directly to the customer at <a href="mailto:${data.email}">${data.email}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
