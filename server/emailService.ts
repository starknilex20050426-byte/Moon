import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data_store');
const SENT_EMAILS_FILE = path.join(DATA_DIR, 'sent_emails.json');

export interface EmailRecord {
  id: string;
  orderId: string;
  recipient: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  html: string;
  text: string;
  isOwnerCopy?: boolean;
  messageId?: string;
  error?: string;
}

export function readSentEmails(): EmailRecord[] {
  try {
    if (!fs.existsSync(SENT_EMAILS_FILE)) return [];
    const raw = fs.readFileSync(SENT_EMAILS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writeSentEmails(emails: EmailRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SENT_EMAILS_FILE, JSON.stringify(emails.slice(0, 500), null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save sent emails store:', err);
  }
}

function formatCurrency(amount: number, currency: string = 'LKR'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `LKR ${Math.round(amount).toLocaleString()}`;
}

export function generateOrderEmailHtml(order: any, settings?: any): string {
  const storeName = settings?.emailSettings?.senderName || 'MOON APPAREL ATELIER';
  const currency = order.currency || 'LKR';
  const items = Array.isArray(order.items) ? order.items : [];
  const customer = order.customer || {};
  const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString();

  const isBank = order.paymentMethod === 'bank_transfer';

  const itemsHtml = items.map((item: any) => {
    const p = item.product || {};
    const imgUrl = p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80';
    const unitPrice = currency === 'USD' ? (p.priceUSD || 0) : (p.priceLKR || 0);
    const lineTotal = unitPrice * (item.quantity || 1);
    const colorHex = item.color?.hex || '#1a1a1a';
    const colorName = item.color?.name || 'Standard';

    return `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0ede6; vertical-align: top; width: 68px;">
          <img src="${imgUrl}" alt="${p.name || 'Garment'}" width="60" height="75" style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #e7e2d9;" />
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0ede6; vertical-align: top;">
          <div style="font-size: 13px; font-weight: 700; color: #111111; letter-spacing: 0.3px; text-transform: uppercase;">${p.name || 'Artisanal Piece'}</div>
          <div style="font-size: 11px; color: #767066; margin-top: 3px; font-family: monospace;">${p.clothingType || p.category || 'Atelier Collection'}</div>
          <div style="margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #4a453e;">
            <span style="background-color: #f4efe6; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Size: ${item.size || 'M'}</span>
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${colorHex}; border: 1px solid #d4cebe; vertical-align: middle; margin-left: 4px;"></span>
            <span>${colorName}</span>
          </div>
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0ede6; vertical-align: top; text-align: center; font-size: 12px; color: #555047; font-weight: 600;">
          × ${item.quantity || 1}
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0ede6; vertical-align: top; text-align: right; font-size: 13px; font-weight: 700; color: #111111; font-family: monospace;">
          ${formatCurrency(lineTotal, currency)}
        </td>
      </tr>
    `;
  }).join('');

  const supportContact = settings?.emailSettings?.smtpConfig?.user || settings?.emailSettings?.ownerNotificationEmail || settings?.emailSettings?.senderEmail || 'concierge@moon-clothing.com';
  const phoneContact = settings?.storePhone || '+94 77 123 4567';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${order.orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f1d1a; -webkit-font-smoothing: antialiased;">

  <!-- Preheader text for email clients to avoid spam previewing code -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-width: 0px; opacity: 0;">
    Your order ${order.orderId} has been confirmed with ${storeName}. View full garment breakdown, courier tracking, and payment receipt.
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f5f0; width: 100%; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.06); border: 1px solid #eae5db;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #111111 0%, #a39274 50%, #111111 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 24px; text-align: center; background-color: #0d0d0d; color: #ffffff;">
              <div style="letter-spacing: 5px; font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; font-family: 'Times New Roman', Times, serif;">
                M O O N
              </div>
              <div style="font-size: 10px; letter-spacing: 3px; color: #c4b59d; text-transform: uppercase; margin-top: 6px; font-weight: 500;">
                Atelier · Colombo · Sri Lanka
              </div>
              
              <div style="margin-top: 24px; display: inline-block; padding: 6px 16px; background-color: rgba(196, 181, 157, 0.15); border: 1px solid rgba(196, 181, 157, 0.4); border-radius: 30px; font-size: 11px; letter-spacing: 1.5px; color: #dfd7c8; text-transform: uppercase; font-weight: 600;">
                ✓ Order Confirmed &amp; Logged
              </div>
            </td>
          </tr>

          <!-- Greeting & Summary Card -->
          <tr>
            <td style="padding: 32px 36px 16px;">
              <div style="font-size: 15px; color: #555047; margin-bottom: 8px;">
                Dear <strong style="color: #111111;">${customer.fullName || 'Valued Client'}</strong>,
              </div>
              <div style="font-size: 14px; line-height: 1.6; color: #3d3933;">
                Thank you for acquiring from <strong>${storeName}</strong>. Your bespoke order has been verified and registered for island-wide priority courier dispatch.
              </div>

              <!-- Quick Order Stats -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px; background-color: #fbf9f5; border-radius: 12px; border: 1px solid #eee8dc; padding: 14px 18px;">
                <tr>
                  <td style="padding: 8px; width: 50%;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8a8275;">Order Reference</div>
                    <div style="font-size: 15px; font-weight: 800; color: #111111; font-family: monospace; margin-top: 2px;">${order.orderId}</div>
                  </td>
                  <td style="padding: 8px; width: 50%; text-align: right;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8a8275;">Order Date</div>
                    <div style="font-size: 13px; font-weight: 600; color: #333333; margin-top: 2px;">${orderDate}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-top: 1px solid #f0ebe0;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8a8275;">Payment Mode</div>
                    <div style="font-size: 12px; font-weight: 700; color: #111111; margin-top: 2px;">
                      ${isBank ? '🏦 Bank Deposit / Slip Upload' : '🚚 Cash on Delivery (COD)'}
                    </div>
                  </td>
                  <td style="padding: 8px; border-top: 1px solid #f0ebe0; text-align: right;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8a8275;">Courier Tracking</div>
                    <div style="font-size: 12px; font-weight: 700; color: #0d5d36; font-family: monospace; margin-top: 2px;">${order.trackingNumber || 'DOMEX-EXPRESS'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Garments Ordered Section -->
          <tr>
            <td style="padding: 12px 36px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: #8a8275; margin-bottom: 12px; border-bottom: 2px solid #111111; padding-bottom: 6px;">
                Selected Garments (${items.length} ${items.length === 1 ? 'Piece' : 'Pieces'})
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9c9486; text-align: left;">
                    <th style="padding-bottom: 8px;" colspan="2">Piece</th>
                    <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                    <th style="padding-bottom: 8px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Settlement -->
          <tr>
            <td style="padding: 12px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf8f4; border-radius: 12px; border: 1px solid #eee8dc; padding: 18px;">
                <tr>
                  <td style="font-size: 12px; color: #666055; padding: 4px 0;">Subtotal</td>
                  <td style="font-size: 12px; font-weight: 600; color: #111111; text-align: right; font-family: monospace; padding: 4px 0;">
                    ${formatCurrency(order.subtotal || 0, currency)}
                  </td>
                </tr>
                ${order.discount && order.discount > 0 ? `
                <tr>
                  <td style="font-size: 12px; color: #0f766e; padding: 4px 0;">Promo Privilege Discount</td>
                  <td style="font-size: 12px; font-weight: 600; color: #0f766e; text-align: right; font-family: monospace; padding: 4px 0;">
                    -${formatCurrency(order.discount, currency)}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-size: 12px; color: #666055; padding: 4px 0;">Island-Wide Express Courier</td>
                  <td style="font-size: 12px; font-weight: 600; color: #111111; text-align: right; font-family: monospace; padding: 4px 0;">
                    ${order.shippingFee === 0 ? '<span style="color: #0d5d36; font-weight: bold;">Free Delivery</span>' : formatCurrency(order.shippingFee || 0, currency)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 10px; border-top: 1px dashed #ded7c8;"></td>
                </tr>
                <tr>
                  <td style="font-size: 15px; font-weight: 900; color: #111111; text-transform: uppercase; letter-spacing: 0.5px;">Grand Total Due</td>
                  <td style="font-size: 18px; font-weight: 900; color: #111111; text-align: right; font-family: monospace;">
                    ${formatCurrency(order.total || 0, currency)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address & Logistics Card -->
          <tr>
            <td style="padding: 16px 36px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #eee8dc; border-radius: 12px; overflow: hidden;">
                <tr style="background-color: #f4efe6;">
                  <td style="padding: 10px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4a453e;">
                    📍 Destination Address &amp; Courier Details
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; font-size: 12px; line-height: 1.6; color: #3d3933; background-color: #ffffff;">
                    <div style="font-weight: 700; color: #111111; font-size: 13px;">${customer.fullName || ''}</div>
                    <div>${customer.addressLine || ''}${customer.apartment ? `, ${customer.apartment}` : ''}</div>
                    <div>${customer.city || ''}, ${customer.district || ''} District</div>
                    <div>${customer.country || 'Sri Lanka'} ${customer.postalCode ? `· ${customer.postalCode}` : ''}</div>
                    <div style="margin-top: 6px; color: #767066; font-size: 11px;">
                      📞 Phone: <strong style="color: #222222;">${customer.phone || 'N/A'}</strong> · ✉️ Email: <strong style="color: #222222;">${customer.email || 'N/A'}</strong>
                    </div>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f4efe6; color: #767066; font-size: 11px;">
                      ⏱️ <strong>Estimated Dispatch:</strong> ${order.estimatedDelivery || '2-3 Business Days (Island-Wide Express Courier)'}
                    </div>
                  </td>
                </tr>
              </table>

              ${isBank && order.bankReceipt ? `
              <!-- Bank Receipt Reference -->
              <div style="margin-top: 14px; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 11px; color: #334155;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">✓ Bank Transfer Verification Logged</div>
                <div>Bank: <strong>${order.bankReceipt.bankName || 'Commercial Bank of Ceylon'}</strong></div>
                ${order.bankReceipt.transactionRef ? `<div>Reference / Deposit ID: <strong style="font-family: monospace;">${order.bankReceipt.transactionRef}</strong></div>` : ''}
                <div style="color: #64748b; margin-top: 4px;">Payment slip file <em>"${order.bankReceipt.fileName || 'slip.jpg'}"</em> received and routed to accounts reconciliation.</div>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Help / Concierge Notice -->
          <tr>
            <td style="padding: 24px 36px; background-color: #faf8f5; border-top: 1px solid #eee8dc; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #111111;">
                Concierge Assistance &amp; Inquiries
              </div>
              <div style="font-size: 11px; color: #767066; margin-top: 6px; line-height: 1.5;">
                Have questions regarding your tailoring or tracking? Reach our dispatch specialists at:<br>
                <a href="mailto:${supportContact}" style="color: #111111; font-weight: 700; text-decoration: underline;">${supportContact}</a> &nbsp;·&nbsp;
                <span style="color: #111111; font-weight: 700;">${phoneContact}</span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0d0d0d; color: #888888; text-align: center; font-size: 10px; line-height: 1.6;">
              <div style="letter-spacing: 3px; font-size: 12px; color: #ffffff; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
                MOON APPAREL
              </div>
              <div>Cinnamon Gardens, Colombo 07, Western Province, Sri Lanka</div>
              <div style="margin-top: 8px; color: #666666;">
                This is an automated confirmation of purchase. Please retain this email for your records and courier receipt.
              </div>
              <div style="margin-top: 12px; color: #555555;">
                © ${new Date().getFullYear()} MOON APPAREL (PVT) LTD. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

export function generateOrderEmailText(order: any): string {
  const currency = order.currency || 'LKR';
  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];

  let text = `=======================================================\n`;
  text += `           MOON APPAREL ATELIER - ORDER CONFIRMATION\n`;
  text += `=======================================================\n\n`;
  text += `Dear ${customer.fullName || 'Valued Customer'},\n\n`;
  text += `Thank you for your purchase from MOON APPAREL. Your order has been successfully placed and logged.\n\n`;
  text += `Order Reference:  ${order.orderId}\n`;
  text += `Date:             ${order.orderDate || new Date().toISOString()}\n`;
  text += `Payment Method:   ${order.paymentMethod === 'bank_transfer' ? 'Bank Transfer (Slip Attached)' : 'Cash on Delivery (COD)'}\n`;
  text += `Courier Tracking: ${order.trackingNumber || 'DOMEX-EXPRESS'}\n`;
  text += `Estimated Time:   ${order.estimatedDelivery || '2-3 Business Days'}\n\n`;
  text += `-------------------------------------------------------\n`;
  text += `ORDERED ITEMS:\n`;
  text += `-------------------------------------------------------\n`;

  items.forEach((item: any, i: number) => {
    const p = item.product || {};
    const price = currency === 'USD' ? (p.priceUSD || 0) : (p.priceLKR || 0);
    const lineTotal = price * (item.quantity || 1);
    text += `${i + 1}. ${p.name || 'Garment'} (Size: ${item.size || 'M'}, Color: ${item.color?.name || 'Standard'}) x ${item.quantity || 1} = ${formatCurrency(lineTotal, currency)}\n`;
  });

  text += `\n-------------------------------------------------------\n`;
  text += `Subtotal:      ${formatCurrency(order.subtotal || 0, currency)}\n`;
  if (order.discount > 0) {
    text += `Discount:     -${formatCurrency(order.discount, currency)}\n`;
  }
  text += `Shipping:      ${order.shippingFee === 0 ? 'Complimentary' : formatCurrency(order.shippingFee || 0, currency)}\n`;
  text += `Total Amount:  ${formatCurrency(order.total || 0, currency)}\n`;
  text += `-------------------------------------------------------\n\n`;
  text += `SHIPPING ADDRESS:\n`;
  text += `${customer.fullName || ''}\n`;
  text += `${customer.addressLine || ''}\n`;
  text += `${customer.city || ''}, ${customer.district || ''} District\n`;
  text += `${customer.country || 'Sri Lanka'} ${customer.postalCode || ''}\n`;
  text += `Phone: ${customer.phone || 'N/A'}\n\n`;
  text += `Concierge support: support@moon-clothing.com | +94 11 234 5678\n`;
  text += `Colombo 07, Sri Lanka\n`;

  return text;
}

export function formatSmtpError(err: any): string {
  const msg = err?.message || String(err);
  if (
    msg.includes('535') ||
    msg.toLowerCase().includes('badcredentials') ||
    msg.toLowerCase().includes('username and password not accepted') ||
    msg.toLowerCase().includes('invalid credentials')
  ) {
    return 'Gmail Authentication Failed (535): Invalid username or password. For personal @gmail.com accounts, you MUST use a 16-character Google App Password (not your regular Gmail password). Enable 2-Step Verification on your Google Account, then generate an App Password at https://myaccount.google.com/apppasswords.';
  }
  if (msg.includes('ECONNREFUSED')) {
    return 'Connection refused by SMTP host. Please verify the host address and port number.';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
    return 'Connection timed out trying to reach the SMTP server. Please verify your port (try 465 or 587) and internet connection.';
  }
  if (msg.includes('EENVELOPE') || msg.includes('550') || msg.toLowerCase().includes('from address')) {
    return 'Sender address rejected by email server. For Gmail SMTP, the From address must match your authenticated Gmail address.';
  }
  return msg;
}

export function createSmtpTransporter(smtp: any, overridePort?: number, overrideSecure?: boolean) {
  const cleanUser = (smtp.user || '').trim();
  const cleanPass = (smtp.pass || '').trim().replace(/\s+/g, '');
  const rawHost = (smtp.host || '').trim();
  const isGmail =
    rawHost.toLowerCase().includes('gmail') ||
    cleanUser.toLowerCase().endsWith('@gmail.com');
  const host = isGmail ? 'smtp.gmail.com' : (rawHost || 'smtp.gmail.com');

  const port = overridePort !== undefined
    ? overridePort
    : (Number(smtp.port) || (isGmail ? 465 : 587));

  const secure = overrideSecure !== undefined
    ? overrideSecure
    : (typeof smtp.secure === 'boolean' ? smtp.secure : (port === 465));

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function verifySmtpConnection(smtp: any): Promise<{ success: boolean; message: string; suggestedPort?: number; suggestedSecure?: boolean }> {
  if (!smtp || !smtp.user || !smtp.pass) {
    return {
      success: false,
      message: 'SMTP Username/Email and 16-character App Password are required to test connection.',
    };
  }

  const cleanUser = (smtp.user || '').trim();
  const cleanPass = (smtp.pass || '').trim().replace(/\s+/g, '');
  const rawHost = (smtp.host || '').trim();
  const isGmail =
    rawHost.toLowerCase().includes('gmail') ||
    cleanUser.toLowerCase().endsWith('@gmail.com');

  const configuredPort = Number(smtp.port) || (isGmail ? 465 : 587);
  const configuredSecure = typeof smtp.secure === 'boolean' ? smtp.secure : (configuredPort === 465);

  try {
    const transporter = createSmtpTransporter(smtp, configuredPort, configuredSecure);
    await transporter.verify();
    return {
      success: true,
      message: `Successfully connected and authenticated with ${isGmail ? 'Gmail SMTP' : (smtp.host || 'SMTP')} on port ${configuredPort}!`,
    };
  } catch (err: any) {
    console.error('Primary SMTP verify attempt failed:', err);

    // If timeout or connection refused and using Gmail, try the alternate port (465 vs 587)
    if (isGmail) {
      const altPort = configuredPort === 465 ? 587 : 465;
      const altSecure = altPort === 465;
      try {
        const altTransporter = createSmtpTransporter(smtp, altPort, altSecure);
        await altTransporter.verify();
        return {
          success: true,
          suggestedPort: altPort,
          suggestedSecure: altSecure,
          message: `Connected successfully using alternate port ${altPort} (${altSecure ? 'SSL' : 'TLS'})! Auto-adjusting configuration.`,
        };
      } catch (altErr: any) {
        console.error('Alternate SMTP verify attempt failed:', altErr);
      }
    }

    return {
      success: false,
      message: formatSmtpError(err),
    };
  }
}

export async function sendOrderConfirmationEmail(order: any, settings?: any): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  record?: EmailRecord;
  smtpUsed?: boolean;
}> {
  const recipient = order.customer?.email;
  if (!recipient) {
    return { success: false, error: 'Customer email address is missing' };
  }

  const senderName = settings?.emailSettings?.senderName || 'MOON APPAREL ATELIER';
  const senderEmail = settings?.emailSettings?.senderEmail || 'orders@moon-clothing.com';
  const ownerEmail = settings?.emailSettings?.ownerNotificationEmail || 'starknilex20050426@gmail.com';
  const notifyOwner = settings?.emailSettings?.notifyOwnerOnNewOrder !== false;

  const subject = settings?.emailSettings?.emailSubjectTemplate
    ? settings.emailSettings.emailSubjectTemplate.replace('{orderId}', order.orderId)
    : `Order Confirmation: ${order.orderId} - ${senderName}`;
  const htmlContent = generateOrderEmailHtml(order, settings);
  const textContent = generateOrderEmailText(order);

  const emailId = `eml-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let messageId = `<${emailId}@moon-apparel.com>`;
  let sendError: string | undefined;
  let smtpUsed = false;

  // Check if SMTP is configured
  const smtp = settings?.emailSettings?.smtpConfig;
  const hasSmtp = Boolean(smtp?.enabled && smtp?.user && smtp?.pass);

  if (hasSmtp) {
    const cleanUser = (smtp.user || '').trim();
    const isGmail =
      (smtp.host && smtp.host.toLowerCase().includes('gmail')) ||
      cleanUser.toLowerCase().endsWith('@gmail.com');

    try {
      const transporter = createSmtpTransporter(smtp);
      // For Gmail, From header and Reply-To MUST align with the authenticated address to avoid spam rejection & DMARC mismatch
      const fromAddress = isGmail ? cleanUser : senderEmail;
      const cleanReplyTo = isGmail
        ? (senderEmail && senderEmail.toLowerCase().endsWith('@gmail.com') ? senderEmail : cleanUser)
        : (senderEmail || cleanUser);

      const mailOptions: any = {
        from: `"${senderName}" <${fromAddress}>`,
        to: recipient,
        replyTo: cleanReplyTo,
        subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Entity-Ref-ID': order.orderId,
          'Importance': 'high',
        },
      };

      if (notifyOwner && ownerEmail && ownerEmail.toLowerCase() !== recipient.toLowerCase()) {
        mailOptions.bcc = ownerEmail;
      }

      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId || messageId;
      smtpUsed = true;
    } catch (err: any) {
      console.error('Primary SMTP dispatch error:', err);

      // Attempt fallback to alternate port for Gmail if timeout or connection problem
      if (isGmail) {
        try {
          const currentPort = Number(smtp.port) || 465;
          const altPort = currentPort === 465 ? 587 : 465;
          const altSecure = altPort === 465;
          const altTransporter = createSmtpTransporter(smtp, altPort, altSecure);
          const fromAddress = cleanUser;
          const cleanReplyTo = senderEmail && senderEmail.toLowerCase().endsWith('@gmail.com') ? senderEmail : cleanUser;

          const mailOptions: any = {
            from: `"${senderName}" <${fromAddress}>`,
            to: recipient,
            replyTo: cleanReplyTo,
            subject,
            html: htmlContent,
            text: textContent,
            headers: {
              'X-Entity-Ref-ID': order.orderId,
              'Importance': 'high',
            },
          };
          if (notifyOwner && ownerEmail && ownerEmail.toLowerCase() !== recipient.toLowerCase()) {
            mailOptions.bcc = ownerEmail;
          }
          const info = await altTransporter.sendMail(mailOptions);
          messageId = info.messageId || messageId;
          smtpUsed = true;
        } catch (altErr: any) {
          sendError = formatSmtpError(altErr || err);
        }
      } else {
        sendError = formatSmtpError(err);
      }
    }
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const cleanUser = (process.env.SMTP_USER || '').trim();
      const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');
      const envTransporter = createSmtpTransporter({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      });

      const fromAddress = isGmail ? cleanUser : senderEmail;
      const cleanReplyTo = isGmail
        ? (senderEmail && senderEmail.toLowerCase().endsWith('@gmail.com') ? senderEmail : cleanUser)
        : (senderEmail || cleanUser);

      const info = await envTransporter.sendMail({
        from: `"${senderName}" <${fromAddress}>`,
        to: recipient,
        replyTo: cleanReplyTo,
        bcc: notifyOwner && ownerEmail ? ownerEmail : undefined,
        subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Entity-Ref-ID': order.orderId,
          'Importance': 'high',
        },
      });
      messageId = info.messageId || messageId;
      smtpUsed = true;
    } catch (err: any) {
      console.warn('Env SMTP dispatch error:', err?.message || err);
      sendError = formatSmtpError(err);
    }
  }

  // Create record for sent_emails.json
  const record: EmailRecord = {
    id: emailId,
    orderId: order.orderId,
    recipient,
    subject,
    sentAt: new Date().toISOString(),
    status: sendError ? 'failed' : 'delivered',
    html: htmlContent,
    text: textContent,
    isOwnerCopy: false,
    messageId,
    error: sendError,
  };

  const currentRecords = readSentEmails();
  currentRecords.unshift(record);

  // If owner notification is enabled and owner email is separate, log owner notification record as well
  if (!sendError && notifyOwner && ownerEmail && ownerEmail.toLowerCase() !== recipient.toLowerCase()) {
    currentRecords.unshift({
      id: `eml-owner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: order.orderId,
      recipient: ownerEmail,
      subject: `[Store Owner Alert] New Order Received: #${order.orderId} (${formatCurrency(order.total || 0, order.currency)})`,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      html: htmlContent,
      text: textContent,
      isOwnerCopy: true,
      messageId: `<owner-${emailId}@moon-apparel.com>`,
    });
  }

  writeSentEmails(currentRecords);

  if (sendError && hasSmtp) {
    return {
      success: false,
      messageId,
      error: sendError,
      record,
      smtpUsed,
    };
  }

  return {
    success: true,
    messageId,
    record,
    smtpUsed,
  };
}
