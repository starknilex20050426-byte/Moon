import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_DATA_DIR = fs.existsSync(path.join(process.cwd(), 'data_store'))
  ? path.join(process.cwd(), 'data_store')
  : path.join(__dirname, '..', 'data_store');
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data_store') : REPO_DATA_DIR;
const SENT_EMAILS_FILE = path.join(DATA_DIR, 'sent_emails.json');
const PUBLIC_IMAGES_DIR = fs.existsSync(path.join(process.cwd(), 'public', 'images'))
  ? path.join(process.cwd(), 'public', 'images')
  : path.join(__dirname, '..', 'public', 'images');

export function resolveProductImageUrl(rawImage?: string): string {
  if (!rawImage) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80';
  }
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
    return rawImage;
  }
  const filename = rawImage.split('/').pop()?.split('?')[0];
  if (filename) {
    return `https://moon-apparel.vercel.app/images/${filename}`;
  }
  return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80';
}

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

export function generateOrderEmailHtml(order: any, settings?: any, cidImageMap?: Record<number, string>): string {
  const storeName = settings?.emailSettings?.senderName || 'Moon Apparel';
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

  const itemsHtml = items.map((item: any, idx: number) => {
    const p = item.product || {};
    const imgUrl = (cidImageMap && cidImageMap[idx]) ? cidImageMap[idx] : resolveProductImageUrl(p.image);
    const unitPrice = currency === 'USD' ? (p.priceUSD || 0) : (p.priceLKR || 0);
    const lineTotal = unitPrice * (item.quantity || 1);
    const colorHex = item.color?.hex || '#1a1a1a';
    const colorName = item.color?.name || 'Standard';

    return `
      <tr>
        <td style="padding: 14px 10px; border-bottom: 1px solid #f0ede6; vertical-align: middle; width: 64px;">
          <img src="${imgUrl}" alt="${p.name || 'Garment'}" width="60" height="75" style="display: block; width: 60px; height: 75px; border-radius: 8px; border: 1px solid #e7e2d9; background-color: #f7f5f0;" />
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid #f0ede6; vertical-align: middle;">
          <div style="font-size: 13px; font-weight: 700; color: #111111; letter-spacing: 0.3px; text-transform: uppercase;">${p.name || 'Artisanal Piece'}</div>
          <div style="font-size: 11px; color: #767066; margin-top: 3px; font-family: monospace;">${p.clothingType || p.category || 'Atelier Collection'}</div>
          <div style="margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #4a453e;">
            <span style="background-color: #f4efe6; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Size: ${item.size || 'M'}</span>
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${colorHex}; border: 1px solid #d4cebe; vertical-align: middle; margin-left: 4px;"></span>
            <span>${colorName}</span>
          </div>
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid #f0ede6; vertical-align: middle; text-align: center; font-size: 12px; color: #555047; font-weight: 600;">
          x ${item.quantity || 1}
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid #f0ede6; vertical-align: middle; text-align: right; font-size: 13px; font-weight: 700; color: #111111; font-family: monospace;">
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

  <!-- Preheader text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-width: 0px; opacity: 0;">
    Thank you for your order ${order.orderId}. Your garments have been registered for courier dispatch.
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f5f0; width: 100%; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #eae5db;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background-color: #111111;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; background-color: #0d0d0d; color: #ffffff;">
              <div style="letter-spacing: 4px; font-size: 22px; font-weight: 900; color: #ffffff; text-transform: uppercase;">
                M O O N
              </div>
              <div style="font-size: 10px; letter-spacing: 2px; color: #c4b59d; text-transform: uppercase; margin-top: 4px; font-weight: 500;">
                Atelier Colombo
              </div>
              <div style="margin-top: 18px; display: inline-block; padding: 4px 14px; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; font-size: 11px; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; font-weight: 600;">
                Order Confirmation
              </div>
            </td>
          </tr>

          <!-- Greeting & Summary Card -->
          <tr>
            <td style="padding: 28px 32px 16px;">
              <div style="font-size: 14px; color: #555047; margin-bottom: 6px;">
                Dear <strong style="color: #111111;">${customer.fullName || 'Valued Client'}</strong>,
              </div>
              <div style="font-size: 13px; line-height: 1.6; color: #3d3933;">
                Thank you for your order with <strong>${storeName}</strong>. Your purchase has been confirmed and logged for priority dispatch.
              </div>

              <!-- Quick Order Stats -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px; background-color: #fbf9f5; border-radius: 10px; border: 1px solid #eee8dc; padding: 12px 16px;">
                <tr>
                  <td style="padding: 6px 8px; width: 50%;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8275;">Order Reference</div>
                    <div style="font-size: 14px; font-weight: 700; color: #111111; font-family: monospace; margin-top: 2px;">${order.orderId}</div>
                  </td>
                  <td style="padding: 6px 8px; width: 50%; text-align: right;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8275;">Order Date</div>
                    <div style="font-size: 12px; font-weight: 600; color: #333333; margin-top: 2px;">${orderDate}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 8px; border-top: 1px solid #f0ebe0;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8275;">Payment Mode</div>
                    <div style="font-size: 12px; font-weight: 600; color: #111111; margin-top: 2px;">
                      ${isBank ? 'Bank Transfer / Deposit Slip' : 'Cash on Delivery (COD)'}
                    </div>
                  </td>
                  <td style="padding: 6px 8px; border-top: 1px solid #f0ebe0; text-align: right;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8275;">Tracking ID</div>
                    <div style="font-size: 12px; font-weight: 600; color: #0d5d36; font-family: monospace; margin-top: 2px;">${order.trackingNumber || 'DOMEX-EXPRESS'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Garments Ordered Section -->
          <tr>
            <td style="padding: 10px 32px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #767066; margin-bottom: 10px; border-bottom: 1px solid #e7e2d9; padding-bottom: 6px;">
                Selected Garments (${items.length} ${items.length === 1 ? 'Piece' : 'Pieces'})
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #9c9486; text-align: left;">
                    <th style="padding-bottom: 6px;" colspan="2">Piece</th>
                    <th style="padding-bottom: 6px; text-align: center;">Qty</th>
                    <th style="padding-bottom: 6px; text-align: right;">Price</th>
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
            <td style="padding: 10px 32px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf8f4; border-radius: 10px; border: 1px solid #eee8dc; padding: 14px 16px;">
                <tr>
                  <td style="font-size: 12px; color: #666055; padding: 3px 0;">Subtotal</td>
                  <td style="font-size: 12px; font-weight: 600; color: #111111; text-align: right; font-family: monospace; padding: 3px 0;">
                    ${formatCurrency(order.subtotal || 0, currency)}
                  </td>
                </tr>
                ${order.discount && order.discount > 0 ? `
                <tr>
                  <td style="font-size: 12px; color: #0f766e; padding: 3px 0;">Privilege Discount</td>
                  <td style="font-size: 12px; font-weight: 600; color: #0f766e; text-align: right; font-family: monospace; padding: 3px 0;">
                    -${formatCurrency(order.discount, currency)}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-size: 12px; color: #666055; padding: 3px 0;">Courier Delivery</td>
                  <td style="font-size: 12px; font-weight: 600; color: #111111; text-align: right; font-family: monospace; padding: 3px 0;">
                    ${order.shippingFee === 0 ? '<span style="color: #0d5d36; font-weight: bold;">Free Delivery</span>' : formatCurrency(order.shippingFee || 0, currency)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 8px; border-top: 1px dashed #ded7c8;"></td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 800; color: #111111; text-transform: uppercase;">Total Due</td>
                  <td style="font-size: 16px; font-weight: 800; color: #111111; text-align: right; font-family: monospace;">
                    ${formatCurrency(order.total || 0, currency)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address & Logistics Card -->
          <tr>
            <td style="padding: 10px 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #eee8dc; border-radius: 10px; overflow: hidden;">
                <tr style="background-color: #f4efe6;">
                  <td style="padding: 8px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #4a453e;">
                    Delivery &amp; Courier Details
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px; font-size: 12px; line-height: 1.6; color: #3d3933; background-color: #ffffff;">
                    <div style="font-weight: 700; color: #111111; font-size: 13px;">${customer.fullName || ''}</div>
                    <div>${customer.addressLine || ''}${customer.apartment ? `, ${customer.apartment}` : ''}</div>
                    <div>${customer.city || ''}, ${customer.district || ''} District</div>
                    <div>${customer.country || 'Sri Lanka'} ${customer.postalCode ? `· ${customer.postalCode}` : ''}</div>
                    <div style="margin-top: 6px; color: #767066; font-size: 11px;">
                      Phone: <strong style="color: #222222;">${customer.phone || 'N/A'}</strong> · Email: <strong style="color: #222222;">${customer.email || 'N/A'}</strong>
                    </div>
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #f4efe6; color: #767066; font-size: 11px;">
                      Estimated Delivery: ${order.estimatedDelivery || '2-3 Business Days'}
                    </div>
                  </td>
                </tr>
              </table>

              ${isBank && order.bankReceipt ? `
              <!-- Payment Note -->
              <div style="margin-top: 12px; padding: 10px 14px; background-color: #fbfbfb; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 11px; color: #44403c;">
                <div style="font-weight: 700; color: #1c1917; margin-bottom: 2px;">Payment Method: Direct Bank Transfer</div>
                <div>Bank: <strong>${order.bankReceipt.bankName || 'Commercial Bank of Ceylon'}</strong></div>
                ${order.bankReceipt.transactionRef ? `<div>Reference: <strong style="font-family: monospace;">${order.bankReceipt.transactionRef}</strong></div>` : ''}
                <div style="color: #78716c; margin-top: 2px;">Your payment slip has been uploaded and verified with our order fulfillment desk.</div>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Help / Concierge Notice -->
          <tr>
            <td style="padding: 20px 32px; background-color: #faf8f5; border-top: 1px solid #eee8dc; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #111111;">
                Customer Inquiries &amp; Support
              </div>
              <div style="font-size: 11px; color: #767066; margin-top: 4px; line-height: 1.5;">
                Have questions regarding your order or tracking? Contact us at:<br>
                <a href="mailto:${supportContact}" style="color: #111111; font-weight: 600; text-decoration: underline;">${supportContact}</a> &nbsp;·&nbsp;
                <span style="color: #111111; font-weight: 600;">${phoneContact}</span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0d0d0d; color: #888888; text-align: center; font-size: 10px; line-height: 1.6;">
              <div style="letter-spacing: 2px; font-size: 11px; color: #ffffff; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
                MOON APPAREL
              </div>
              <div>Colombo 07, Sri Lanka</div>
              <div style="margin-top: 6px; color: #666666;">
                This is an automated purchase receipt for your records.
              </div>
              <div style="margin-top: 8px; color: #555555;">
                © ${new Date().getFullYear()} MOON APPAREL (PVT) LTD.
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
  const orderDate = order.orderDate
    ? new Date(order.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString();

  let text = `Moon Apparel - Order Confirmation\n\n`;
  text += `Order Reference: ${order.orderId}\n`;
  text += `Date: ${orderDate}\n`;
  text += `Tracking: ${order.trackingNumber || 'DOMEX-EXPRESS'}\n`;
  text += `Payment Method: ${order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cash on Delivery (COD)'}\n\n`;
  text += `Dear ${customer.fullName || 'Customer'},\n\n`;
  text += `Thank you for your order with Moon Apparel. Your purchase has been confirmed and registered for courier dispatch.\n\n`;
  text += `ITEMS ORDERED:\n`;

  items.forEach((item: any, i: number) => {
    const p = item.product || {};
    const price = currency === 'USD' ? (p.priceUSD || 0) : (p.priceLKR || 0);
    const lineTotal = price * (item.quantity || 1);
    text += `${i + 1}. ${p.name || 'Garment'} (${item.size || 'M'}, ${item.color?.name || 'Standard'}) x ${item.quantity || 1}: ${formatCurrency(lineTotal, currency)}\n`;
  });

  text += `\nSUMMARY:\n`;
  text += `Subtotal: ${formatCurrency(order.subtotal || 0, currency)}\n`;
  if (order.discount > 0) {
    text += `Discount: -${formatCurrency(order.discount, currency)}\n`;
  }
  text += `Shipping: ${order.shippingFee === 0 ? 'Complimentary' : formatCurrency(order.shippingFee || 0, currency)}\n`;
  text += `Total: ${formatCurrency(order.total || 0, currency)}\n\n`;

  text += `DELIVERY ADDRESS:\n`;
  text += `${customer.fullName || ''}\n`;
  text += `${customer.addressLine || ''}${customer.apartment ? `, ${customer.apartment}` : ''}\n`;
  text += `${customer.city || ''}, ${customer.district || ''} District\n`;
  text += `${customer.country || 'Sri Lanka'} ${customer.postalCode || ''}\n`;
  text += `Phone: ${customer.phone || 'N/A'}\n\n`;

  text += `Customer Support: support@moon-clothing.com | +94 77 123 4567\n`;
  text += `Moon Apparel Atelier, Colombo 07, Sri Lanka\n`;

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

  const rawSenderName = settings?.emailSettings?.senderName || 'Moon Apparel';
  const senderName = rawSenderName === rawSenderName.toUpperCase() && rawSenderName.length > 5 ? 'Moon Apparel' : rawSenderName;
  const senderEmail = settings?.emailSettings?.senderEmail || 'lerninganimation@gmail.com';
  const ownerEmail = settings?.emailSettings?.ownerNotificationEmail || 'starknilex20050426@gmail.com';
  const notifyOwner = settings?.emailSettings?.notifyOwnerOnNewOrder !== false;

  let rawSubject = settings?.emailSettings?.emailSubjectTemplate
    ? settings.emailSettings.emailSubjectTemplate.replace('{orderId}', order.orderId)
    : `Moon Apparel Order Confirmation #${order.orderId}`;
  rawSubject = rawSubject.replace('—', '-').trim();
  const subject = rawSubject;

  // Build inline image attachments and CID map so images display directly in all email clients without external blocking
  const attachments: any[] = [];
  const cidImageMap: Record<number, string> = {};

  const searchDirs = [
    PUBLIC_IMAGES_DIR,
    path.join(process.cwd(), 'public', 'images'),
    path.join(process.cwd(), 'public'),
    path.join(__dirname, '..', 'public', 'images'),
    path.join(__dirname, 'public', 'images'),
  ];

  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((item: any, idx: number) => {
    const rawImage = item.product?.image;
    const cidName = `garment_img_${idx}@moon-apparel`;

    if (!rawImage) {
      return;
    }

    // Case 1: Base64 data URL
    if (typeof rawImage === 'string' && rawImage.startsWith('data:image/')) {
      const match = rawImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.split('/')[1] || 'jpg';
        attachments.push({
          filename: `garment-${idx}.${ext}`,
          content: Buffer.from(base64Data, 'base64'),
          contentType: mimeType,
          cid: cidName,
          contentDisposition: 'inline',
        });
        cidImageMap[idx] = `cid:${cidName}`;
        return;
      }
    }

    // Case 2: Local file in public/images
    if (typeof rawImage === 'string') {
      const filename = rawImage.split('/').pop()?.split('?')[0];
      if (filename) {
        let foundPath: string | null = null;
        for (const dir of searchDirs) {
          try {
            const candidate = path.join(dir, filename);
            if (fs.existsSync(candidate)) {
              foundPath = candidate;
              break;
            }
          } catch {
            // ignore
          }
        }

        if (foundPath) {
          try {
            const fileBuffer = fs.readFileSync(foundPath);
            const ext = path.extname(foundPath).replace('.', '').toLowerCase() || 'jpg';
            const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            attachments.push({
              filename: `garment-${idx}-${filename}`,
              content: fileBuffer,
              contentType,
              cid: cidName,
              contentDisposition: 'inline',
            });
            cidImageMap[idx] = `cid:${cidName}`;
            return;
          } catch (readErr) {
            console.warn(`Could not read local image at ${foundPath}:`, readErr);
          }
        }
      }
    }

    // Fallback: If not found locally, use HTTPS live URL
    cidImageMap[idx] = resolveProductImageUrl(rawImage);
  });

  const htmlContent = generateOrderEmailHtml(order, settings, cidImageMap);
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
        attachments: attachments.length > 0 ? attachments : undefined,
        headers: {
          'X-Entity-Ref-ID': order.orderId,
          'Auto-Submitted': 'auto-generated',
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
            attachments: attachments.length > 0 ? attachments : undefined,
            headers: {
              'X-Entity-Ref-ID': order.orderId,
              'Auto-Submitted': 'auto-generated',
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
        attachments: attachments.length > 0 ? attachments : undefined,
        headers: {
          'X-Entity-Ref-ID': order.orderId,
          'Auto-Submitted': 'auto-generated',
        },
      });
      messageId = info.messageId || messageId;
      smtpUsed = true;
    } catch (err: any) {
      console.warn('Env SMTP dispatch error:', err?.message || err);
      sendError = formatSmtpError(err);
    }
  } else {
    sendError = 'SMTP server credentials (host, username, and 16-character Google App Password) are not configured or enabled.';
  }

  // Create record for sent_emails.json
  const record: EmailRecord = {
    id: emailId,
    orderId: order.orderId,
    recipient,
    subject,
    sentAt: new Date().toISOString(),
    status: (sendError || !smtpUsed) ? 'failed' : 'delivered',
    html: htmlContent,
    text: textContent,
    isOwnerCopy: false,
    messageId,
    error: sendError,
  };

  const currentRecords = readSentEmails();
  currentRecords.unshift(record);

  // If owner notification is enabled and owner email is separate, log owner notification record as well
  if (!sendError && smtpUsed && notifyOwner && ownerEmail && ownerEmail.toLowerCase() !== recipient.toLowerCase()) {
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

  if (sendError || !smtpUsed) {
    return {
      success: false,
      messageId,
      error: sendError || 'SMTP server connection could not be established.',
      record,
      smtpUsed: false,
    };
  }

  return {
    success: true,
    messageId,
    record,
    smtpUsed: true,
  };
}
