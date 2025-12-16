import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { Resend } from "resend";

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({
  region: "asia-northeast3", // 서울 리전
  maxInstances: 10,
});

// Define secret
const resendApiKey = defineSecret("RESEND_API_KEY");

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
    secrets: [resendApiKey],
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

    // Initialize Resend with secret
    const resend = new Resend(resendApiKey.value());
    
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
        emailNotificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
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
    secrets: [resendApiKey],
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

    // Initialize Resend with secret
    const resend = new Resend(resendApiKey.value());
    
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
        emailNotificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
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
