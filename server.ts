import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  sendOrderConfirmationEmail,
  readSentEmails,
  generateOrderEmailHtml,
  generateOrderEmailText,
  verifySmtpConnection,
} from './server/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const REPO_DATA_DIR = path.join(__dirname, 'data_store');
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data_store') : REPO_DATA_DIR;
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed /tmp data store from repo files if running on Vercel serverless
if (process.env.VERCEL && fs.existsSync(REPO_DATA_DIR)) {
  try {
    const files = fs.readdirSync(REPO_DATA_DIR);
    for (const f of files) {
      const src = path.join(REPO_DATA_DIR, f);
      const dest = path.join(DATA_DIR, f);
      if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
      }
    }
  } catch (err) {
    console.warn('Vercel data seed note:', err);
  }
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const OWNER_EMAIL = 'starknilex20050426@gmail.com';

const DEFAULT_CATEGORIES = [
  {
    id: 'tops',
    label: 'Tops & Shirts',
    clothingTypes: ['T-Shirts', 'Hoodies', 'Overshirts'],
  },
  {
    id: 'bottoms',
    label: 'Bottoms & Denim',
    clothingTypes: ['Trousers', 'Denim Jeans'],
  },
  {
    id: 'outerwear',
    label: 'Outerwear & Jackets',
    clothingTypes: ['Bomber Jackets'],
  },
  {
    id: 'knitwear',
    label: 'Knitwear & Sweaters',
    clothingTypes: ['Sweaters'],
  },
];

const DEFAULT_SETTINGS = {
  isBannerVisible: true,
  bannerText: '🇱🇰 Island-Wide Express Courier across Sri Lanka · Free Island-Wide Delivery on orders over LKR 50,000 / $160',
  bankSettings: {
    commercial: {
      bankName: 'Commercial Bank of Ceylon',
      accountName: 'MOON APPAREL (PVT) LTD',
      accountNumber: '1000 4829 1042',
      branch: 'Cinnamon Gardens Branch (Colombo 07)',
      swift: 'CCEYLKLX',
      bankCode: '7056',
    },
    sampath: {
      bankName: 'Sampath Bank PLC',
      accountName: 'MOON APPAREL (PVT) LTD',
      accountNumber: '0192 1004 8831',
      branch: 'Colombo Super Branch',
      swift: 'SAMPKLX',
      bankCode: '7278',
    },
  },
  emailSettings: {
    autoSendOrderEmail: true,
    senderName: 'MOON APPAREL ATELIER',
    senderEmail: 'orders@moon-clothing.com',
    ownerNotificationEmail: OWNER_EMAIL,
    notifyOwnerOnNewOrder: true,
    emailSubjectTemplate: 'Order Confirmed: #{orderId} — MOON APPAREL',
    smtpConfig: {
      enabled: false,
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
    },
  },
};

// Initial seed if files don't exist
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    {
      uid: 'owner-primary-uid',
      email: OWNER_EMAIL,
      displayName: 'Store Owner',
      phoneNumber: '+94 77 123 4567',
      role: 'owner',
      accountStatus: 'active',
      district: 'Colombo',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf8');
}

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf8');
}

if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
}

if (!fs.existsSync(CATEGORIES_FILE)) {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2), 'utf8');
}

function readCategories(): any[] {
  try {
    const raw = fs.readFileSync(CATEGORIES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (err) {
    return DEFAULT_CATEGORIES;
  }
}

function writeCategories(categories: any[]) {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write categories file:', err);
  }
}

function readProducts(): any[] {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) return [];
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeProducts(products: any[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write products file:', err);
  }
}

function readSettings(): any {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      bankSettings: {
        ...DEFAULT_SETTINGS.bankSettings,
        ...(parsed.bankSettings || {}),
      },
      emailSettings: {
        ...DEFAULT_SETTINGS.emailSettings,
        ...(parsed.emailSettings || {}),
        smtpConfig: {
          ...DEFAULT_SETTINGS.emailSettings.smtpConfig,
          ...(parsed.emailSettings?.smtpConfig || {}),
        },
      },
    };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write settings file:', err);
  }
}

function readUsers(): any[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write users file:', err);
  }
}

function readOrders(): any[] {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeOrders(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write orders file:', err);
  }
}

export const app = express();

  // CORS middleware to support Firebase Hosting (*.web.app) and custom domains
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/users', (_req, res) => {
    const users = readUsers();
    res.json({ success: true, users });
  });

  app.post('/api/users', (req, res) => {
    const userData = req.body;
    if (!userData || (!userData.email && !userData.uid)) {
      return res.status(400).json({ success: false, message: 'User email or UID is required' });
    }

    const email = (userData.email || '').toLowerCase();
    const isOwner = email === OWNER_EMAIL;
    const resolvedRole = isOwner ? 'owner' : (userData.role || 'customer');

    const users = readUsers();
    const index = users.findIndex(
      (u) =>
        (u.uid && userData.uid && u.uid === userData.uid) ||
        (u.email && email && u.email.toLowerCase() === email)
    );

    const userProfile = {
      uid: userData.uid || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: userData.email || '',
      displayName: userData.displayName || (isOwner ? 'Store Owner' : 'Customer'),
      phoneNumber: userData.phoneNumber || '',
      accountStatus: userData.accountStatus || 'active',
      district: userData.district || userData.defaultDistrict || 'Colombo',
      createdAt: userData.createdAt || new Date().toISOString(),
      ...userData,
      role: resolvedRole, // ensure owner cannot be overridden
    };

    if (index >= 0) {
      users[index] = { ...users[index], ...userProfile };
    } else {
      users.push(userProfile);
    }

    writeUsers(users);
    res.json({ success: true, user: userProfile });
  });

  app.patch('/api/users/:uid/role', (req, res) => {
    const { uid } = req.params;
    const { role, accountStatus, callerRole, callerEmail } = req.body;

    // Strict security check: Only owner can change user roles
    if (role && callerRole === 'management' && (!callerEmail || callerEmail.toLowerCase() !== OWNER_EMAIL)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Manager accounts cannot change Assign Role. Only the Store Owner can change roles.',
      });
    }

    const users = readUsers();
    const index = users.findIndex((u) => u.uid === uid || u.email?.toLowerCase() === uid.toLowerCase());

    if (index >= 0) {
      const user = users[index];
      // Prevent demoting primary owner email
      if (user.email?.toLowerCase() === OWNER_EMAIL) {
        user.role = 'owner';
        user.accountStatus = 'active';
      } else {
        if (role) {
          // If role is different, verify caller isn't unauthorized
          if (role !== user.role && callerRole === 'management') {
            return res.status(403).json({
              success: false,
              message: 'Permission denied: Manager accounts cannot change Assign Role.',
            });
          }
          user.role = role;
        }
        if (accountStatus) user.accountStatus = accountStatus;
      }
      users[index] = user;
      writeUsers(users);
      return res.json({ success: true, user });
    }

    res.status(404).json({ success: false, message: 'User not found' });
  });

  // Orders endpoints
  app.get('/api/orders', (_req, res) => {
    const orders = readOrders();
    res.json({ success: true, orders });
  });

  app.post('/api/orders', async (req, res) => {
    const orderData = req.body;
    if (!orderData || !orderData.orderId) {
      return res.status(400).json({ success: false, message: 'Valid order object is required' });
    }

    const settings = readSettings();

    // Auto send email if customer email is provided and auto-send is enabled
    if (settings?.emailSettings?.autoSendOrderEmail !== false && orderData.customer?.email) {
      try {
        const emailResult = await sendOrderConfirmationEmail(orderData, settings);
        orderData.emailStatus = emailResult.success
          ? (emailResult.smtpUsed ? 'sent' : 'outbox_logged')
          : 'failed';
        orderData.emailSentAt = new Date().toISOString();
        orderData.emailRecipient = orderData.customer.email;
        orderData.emailSmtpUsed = Boolean(emailResult.smtpUsed);
        orderData.emailMessageId = emailResult.messageId;
        if (emailResult.error) {
          orderData.emailError = emailResult.error;
        }
      } catch (err: any) {
        console.warn('Auto email dispatch warning:', err);
        orderData.emailStatus = 'failed';
        orderData.emailError = err?.message || String(err);
      }
    } else {
      orderData.emailStatus = 'pending';
    }

    const orders = readOrders();
    const existingIndex = orders.findIndex((o) => o.orderId === orderData.orderId);
    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...orderData };
    } else {
      orders.unshift(orderData);
    }
    writeOrders(orders);

    // Also auto-record the customer in the users store if email is present
    if (orderData.customer?.email) {
      const email = orderData.customer.email.toLowerCase();
      const users = readUsers();
      const userIdx = users.findIndex((u) => u.email?.toLowerCase() === email);
      if (userIdx < 0) {
        const newCustomer = {
          uid: orderData.userId || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          email: orderData.customer.email,
          displayName: orderData.customer.fullName || 'Customer',
          phoneNumber: orderData.customer.phone || '',
          role: email === OWNER_EMAIL ? 'owner' : 'customer',
          accountStatus: 'active',
          district: orderData.customer.district || 'Colombo',
          addressLine: orderData.customer.addressLine || '',
          city: orderData.customer.city || '',
          createdAt: orderData.orderDate || new Date().toISOString(),
        };
        users.push(newCustomer);
        writeUsers(users);
      }
    }

    res.json({ success: true, order: orderData });
  });

  // Manual or Re-send Order Confirmation Email
  app.post('/api/orders/:orderId/send-email', async (req, res) => {
    const { orderId } = req.params;
    const { customRecipient } = req.body || {};

    const orders = readOrders();
    const orderIndex = orders.findIndex((o) => o.orderId === orderId);
    if (orderIndex < 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const targetOrder = { ...orders[orderIndex] };
    if (customRecipient && customRecipient.trim()) {
      targetOrder.customer = {
        ...targetOrder.customer,
        email: customRecipient.trim(),
      };
    }

    const settings = readSettings();
    const result = await sendOrderConfirmationEmail(targetOrder, settings);

    if (result.success) {
      orders[orderIndex].emailStatus = result.smtpUsed ? 'sent' : 'outbox_logged';
      orders[orderIndex].emailSentAt = new Date().toISOString();
      orders[orderIndex].emailRecipient = targetOrder.customer?.email;
      orders[orderIndex].emailSmtpUsed = Boolean(result.smtpUsed);
      orders[orderIndex].emailMessageId = result.messageId;
      writeOrders(orders);

      return res.json({
        success: true,
        message: result.smtpUsed
          ? `Order confirmation email dispatched directly to ${targetOrder.customer?.email} via SMTP!`
          : `Order confirmation rendered & saved to Outbox Preview for ${targetOrder.customer?.email}`,
        order: orders[orderIndex],
        record: result.record,
        smtpUsed: result.smtpUsed,
      });
    }

    res.status(500).json({
      success: false,
      message: result.error || 'Failed to dispatch email',
    });
  });

  // Preview Order Confirmation Email
  app.get('/api/orders/:orderId/email-preview', (req, res) => {
    const { orderId } = req.params;
    const orders = readOrders();
    const order = orders.find((o) => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const settings = readSettings();
    const html = generateOrderEmailHtml(order, settings);
    const text = generateOrderEmailText(order);
    const subject = `Order Confirmed: #${order.orderId} — MOON APPAREL`;

    res.json({
      success: true,
      orderId,
      recipient: order.customer?.email,
      subject,
      html,
      text,
    });
  });

  // View recent sent emails
  app.get('/api/emails/recent', (_req, res) => {
    const emails = readSentEmails();
    res.json({ success: true, emails });
  });

  // Verify SMTP Connection Credentials
  app.post('/api/settings/verify-smtp', async (req, res) => {
    const { smtpConfig, saveOnSuccess } = req.body || {};
    const result = await verifySmtpConnection(smtpConfig);
    if (result.success) {
      if (saveOnSuccess && smtpConfig) {
        const current = readSettings();
        const updatedConfig = {
          ...smtpConfig,
          enabled: true,
          ...(result.suggestedPort ? { port: result.suggestedPort } : {}),
          ...(result.suggestedSecure !== undefined ? { secure: result.suggestedSecure } : {}),
        };
        const updated = {
          ...current,
          emailSettings: {
            ...(current.emailSettings || {}),
            smtpConfig: updatedConfig,
          },
        };
        writeSettings(updated);
      }
      return res.json({
        success: true,
        message: result.message,
        suggestedPort: result.suggestedPort,
        suggestedSecure: result.suggestedSecure,
      });
    }
    return res.status(400).json({ success: false, message: result.message });
  });

  // Send Test Order Email to Owner or Custom Address
  app.post('/api/settings/test-email', async (req, res) => {
    const { targetEmail, smtpConfig, senderName, senderEmail, saveConfig } = req.body || {};
    let settings = readSettings();

    // If transient or updated SMTP config is passed from UI form, apply it for this test
    if (smtpConfig) {
      settings = {
        ...settings,
        emailSettings: {
          ...settings.emailSettings,
          ...(senderName ? { senderName } : {}),
          ...(senderEmail ? { senderEmail } : {}),
          smtpConfig: {
            ...(settings.emailSettings?.smtpConfig || {}),
            ...smtpConfig,
          },
        },
      };
    }

    const recipient = targetEmail || settings?.emailSettings?.ownerNotificationEmail || OWNER_EMAIL;

    const mockOrder = {
      orderId: `MN-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString(),
      customer: {
        fullName: 'Boutique Client Sample',
        email: recipient,
        phone: '+94 77 123 4567',
        addressLine: '142 Cinnamon Gardens Boulevard',
        city: 'Colombo',
        district: 'Colombo',
        state: 'Western Province',
        postalCode: '00700',
        country: 'Sri Lanka',
      },
      items: [
        {
          id: 'test-item-1',
          productId: 'mn-01',
          size: 'M',
          color: { name: 'Obsidian Black', hex: '#111111' },
          quantity: 1,
          product: {
            id: 'mn-01',
            name: 'Architectural Oversized Hoodie',
            category: 'tops',
            clothingType: 'Hoodies',
            priceLKR: 32000,
            priceUSD: 105,
            image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80',
          },
        },
        {
          id: 'test-item-2',
          productId: 'mn-02',
          size: 'L',
          color: { name: 'Ecru Chalk', hex: '#f4efe6' },
          quantity: 2,
          product: {
            id: 'mn-02',
            name: 'Raw Heavyweight Atelier Tee',
            category: 'tops',
            clothingType: 'T-Shirts',
            priceLKR: 14500,
            priceUSD: 48,
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
          },
        },
      ],
      currency: 'LKR',
      subtotal: 61000,
      discount: 5000,
      shippingFee: 0,
      total: 56000,
      paymentMethod: 'bank_transfer',
      bankReceipt: {
        fileName: 'commercial_bank_deposit_slip.jpg',
        fileSize: '1.4 MB',
        transactionRef: 'CB-94827104',
        depositorName: 'Boutique Client Sample',
        bankName: 'Commercial Bank of Ceylon',
      },
      trackingNumber: `DOMEX-${Math.floor(1000000 + Math.random() * 9000000)}`,
      estimatedDelivery: 'Same-Day / Next-Day Delivery (Colombo)',
      status: 'confirmed',
    };

    const result = await sendOrderConfirmationEmail(mockOrder, settings);
    if (result.success) {
      // If requested or if custom SMTP was successfully verified, persist the validated settings
      if (saveConfig || (smtpConfig && smtpConfig.enabled)) {
        writeSettings(settings);
      }

      return res.json({
        success: true,
        message: result.smtpUsed
          ? `Real luxury order confirmation successfully emailed to ${recipient} via SMTP!`
          : `Test order email logged to system outbox for ${recipient}`,
        record: result.record,
        smtpUsed: result.smtpUsed,
      });
    }

    res.status(400).json({
      success: false,
      message: result.error || 'Failed to dispatch email',
    });
  });

  app.patch('/api/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    const orders = readOrders();
    const index = orders.findIndex((o) => o.orderId === orderId);
    if (index >= 0) {
      orders[index].status = status;
      if (trackingNumber) {
        orders[index].trackingNumber = trackingNumber;
      }
      writeOrders(orders);
      return res.json({ success: true, order: orders[index] });
    }

    res.status(404).json({ success: false, message: 'Order not found' });
  });

  // Store Settings (Banner display/removal, banner text, bank details, auto email settings)
  app.get('/api/settings', (_req, res) => {
    const settings = readSettings();
    res.json({ success: true, settings });
  });

  // Quick check for email subsystem status
  app.get('/api/settings/email-status', (_req, res) => {
    const settings = readSettings();
    const smtp = settings?.emailSettings?.smtpConfig;
    const isConfigured = Boolean(smtp?.enabled && smtp?.user && smtp?.pass);
    const emails = readSentEmails();
    res.json({
      success: true,
      autoSendOrderEmail: settings?.emailSettings?.autoSendOrderEmail !== false,
      isSmtpConfigured: isConfigured,
      smtpHost: smtp?.host || (isConfigured ? 'smtp.gmail.com' : ''),
      smtpPort: smtp?.port || 465,
      smtpUser: smtp?.user ? `${smtp.user.slice(0, 3)}***@${smtp.user.split('@')[1] || ''}` : '',
      senderEmail: settings?.emailSettings?.senderEmail || 'orders@moon-clothing.com',
      ownerNotificationEmail: settings?.emailSettings?.ownerNotificationEmail || OWNER_EMAIL,
      outboxCount: emails.length,
      lastSentAt: emails[0]?.sentAt || null,
    });
  });

  app.patch('/api/settings', (req, res) => {
    const current = readSettings();
    const update = req.body;

    let processedSmtp = current.emailSettings?.smtpConfig;
    if (update.emailSettings?.smtpConfig) {
      const rawSmtp = update.emailSettings.smtpConfig;
      const cleanUser = (rawSmtp.user !== undefined ? rawSmtp.user : (current.emailSettings?.smtpConfig?.user || '')).trim();
      const cleanPass = (rawSmtp.pass !== undefined ? rawSmtp.pass : (current.emailSettings?.smtpConfig?.pass || '')).trim().replace(/\s+/g, '');
      const isGmail = cleanUser.toLowerCase().endsWith('@gmail.com');
      const host = (rawSmtp.host !== undefined ? rawSmtp.host : (current.emailSettings?.smtpConfig?.host || (isGmail ? 'smtp.gmail.com' : ''))).trim();
      const port = Number(rawSmtp.port) || Number(current.emailSettings?.smtpConfig?.port) || (isGmail ? 465 : 587);
      const secure = typeof rawSmtp.secure === 'boolean'
        ? rawSmtp.secure
        : (typeof current.emailSettings?.smtpConfig?.secure === 'boolean' ? current.emailSettings.smtpConfig.secure : (port === 465));
      const enabled = typeof rawSmtp.enabled === 'boolean'
        ? rawSmtp.enabled
        : Boolean(cleanUser && cleanPass);

      processedSmtp = {
        enabled,
        host: host || (isGmail ? 'smtp.gmail.com' : ''),
        port,
        secure,
        user: cleanUser,
        pass: cleanPass,
      };
    }

    const updated = {
      ...current,
      ...update,
      bankSettings: update.bankSettings
        ? {
            commercial: {
              ...(current.bankSettings?.commercial || {}),
              ...(update.bankSettings?.commercial || {}),
            },
            sampath: {
              ...(current.bankSettings?.sampath || {}),
              ...(update.bankSettings?.sampath || {}),
            },
          }
        : current.bankSettings,
      emailSettings: update.emailSettings
        ? {
            ...(current.emailSettings || {}),
            ...(update.emailSettings || {}),
            smtpConfig: processedSmtp,
          }
        : current.emailSettings,
    };
    writeSettings(updated);
    res.json({ success: true, settings: updated });
  });

  // Categories & Subcategories endpoints
  app.get('/api/categories', (_req, res) => {
    const categories = readCategories();
    res.json({ success: true, categories });
  });

  app.post('/api/categories', (req, res) => {
    const { id, label, clothingTypes } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ success: false, message: 'Category label is required' });
    }
    const categories = readCategories();
    const cleanLabel = label.trim();
    const categoryId = (id && id.trim())
      ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Invalid category identifier' });
    }

    if (categories.some((c: any) => c.id === categoryId)) {
      return res.status(400).json({ success: false, message: `Category with ID "${categoryId}" already exists` });
    }

    const subTypes = Array.isArray(clothingTypes)
      ? clothingTypes.map((t: any) => String(t).trim()).filter(Boolean)
      : [];

    const newCategory = {
      id: categoryId,
      label: cleanLabel,
      clothingTypes: subTypes,
    };

    categories.push(newCategory);
    writeCategories(categories);
    res.json({ success: true, category: newCategory, categories });
  });

  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    let categories = readCategories();
    const existing = categories.find((c: any) => c.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    categories = categories.filter((c: any) => c.id !== id);
    writeCategories(categories);
    res.json({ success: true, message: `Category ${id} removed`, categories });
  });

  app.post('/api/categories/:id/subcategories', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subcategory name is required' });
    }
    const categories = readCategories();
    const cat = categories.find((c: any) => c.id === id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const subName = name.trim();
    if (!cat.clothingTypes.includes(subName)) {
      cat.clothingTypes.push(subName);
    }
    writeCategories(categories);
    res.json({ success: true, category: cat, categories });
  });

  app.delete('/api/categories/:id/subcategories/:subName', (req, res) => {
    const { id, subName } = req.params;
    const categories = readCategories();
    const cat = categories.find((c: any) => c.id === id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const decodedSubName = decodeURIComponent(subName);
    cat.clothingTypes = cat.clothingTypes.filter((t: string) => t !== decodedSubName);
    writeCategories(categories);
    res.json({ success: true, category: cat, categories });
  });

  app.put('/api/categories', (req, res) => {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: 'Categories array is required' });
    }
    writeCategories(categories);
    res.json({ success: true, categories });
  });

  // Products endpoints for persistent custom catalog & updates
  app.get('/api/products', (_req, res) => {
    const products = readProducts();
    res.json({ success: true, products });
  });

  app.put('/api/products', (req, res) => {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Products array is required' });
    }
    writeProducts(products);
    res.json({ success: true, products });
  });

  app.post('/api/products', (req, res) => {
    const product = req.body;
    if (!product || !product.name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    const products = readProducts();
    const newProduct = {
      id: product.id || `mn-${Date.now().toString().slice(-4)}`,
      ...product,
    };
    products.unshift(newProduct);
    writeProducts(products);
    res.json({ success: true, product: newProduct, products });
  });

  app.patch('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const products = readProducts();
    const index = products.findIndex((p: any) => p.id === id);
    if (index >= 0) {
      products[index] = { ...products[index], ...updates };
      writeProducts(products);
      return res.json({ success: true, product: products[index], products });
    }
    res.status(404).json({ success: false, message: 'Product not found' });
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    let products = readProducts();
    const existing = products.find((p: any) => p.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    products = products.filter((p: any) => p.id !== id);
    writeProducts(products);
    res.json({ success: true, message: `Product ${id} deleted`, products });
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Moon Server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
