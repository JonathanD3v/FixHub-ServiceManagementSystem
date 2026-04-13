const nodemailer = require("nodemailer");

const APP_NAME = process.env.SHOP_NAME || "FixHub";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;

const isEmailConfigured = () =>
  Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM,
  );

let transporter = null;
let lastTransporterCreation = 0;

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  const useSSL =
    process.env.EMAIL_USE_SSL === "true" ||
    Number(process.env.EMAIL_PORT) === 465;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: useSSL, // true for 465, false for 587
    requireTLS: !useSSL, // for port 587
    family: 4, // Force IPv4 only
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Connection and timeout settings
    connectionTimeout: 15000, // 15 seconds for initial connection
    greetingTimeout: 10000, // 10 seconds for SMTP greeting
    socketTimeout: 15000, // 15 seconds for socket operations
    maxConnections: 1, // Single connection
    maxMessages: 100, // Messages per connection
    rateDelta: 1000, // Rate limiting window
    rateLimit: 10, // Max messages per window
    // Custom DNS lookup to force IPv4
    lookup: (hostname, options, callback) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) {
          console.error(
            `[Email DNS] Failed to resolve ${hostname}:`,
            err.message,
          );
          callback(err);
        } else {
          callback(null, addresses[0], 4);
        }
      });
    },
  });

  lastTransporterCreation = Date.now();

  if (process.env.DEBUG_EMAIL === "true") {
    console.log("[DEBUG] Email transporter created with:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: useSSL,
      family: 4,
    });
  }

  return transporter;
};

// Email templates
const emailTemplates = {
  // Service Request - Assigned to Technician
  serviceAssigned: (data) => ({
    subject: `Your Device Repair - Job #${data.requestNumber}`,
    html: `
      <h2>Your device has been assigned to a technician</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your device (${data.deviceModel}) has been assigned to technician <strong>${data.technicianName}</strong>.</p>
      <p><strong>Estimated Completion:</strong> ${data.estimatedCompletion}</p>
      <p><strong>Job Number:</strong> ${data.requestNumber}</p>
      <p>You can track your repair status using this number.</p>
      <p>We will notify you when your device is ready.</p>
      <br/>
      <p>Thank you for choosing our service!</p>
    `,
  }),

  // Service Request - Completed
  serviceCompleted: (data) => ({
    subject: `Your Device is Ready - Job #${data.requestNumber}`,
    html: `
      <h2>Your device repair is complete!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your device (${data.deviceModel}) has been repaired and is ready for pickup.</p>
      <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
      <p><strong>Job Number:</strong> ${data.requestNumber}</p>
      <p>Please visit our shop to collect your device.</p>
      <p><strong>Shop Hours:</strong> 9:00 AM - 6:00 PM</p>
      <br/>
      <p>Thank you for choosing our service!</p>
    `,
  }),

  // Order - Confirmed
  orderConfirmed: (data) => ({
    subject: `Order Confirmed - #${data.orderNumber}`,
    html: `
      <h2>Your order has been confirmed!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your order #${data.orderNumber} has been confirmed.</p>
      <h3>Order Summary:</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
        ${data.items
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
      <p><strong>Total:</strong> $${data.totalAmount}</p>
      <p>We will notify you when your order is ready for pickup.</p>
      <br/>
      <p>Thank you for shopping with us!</p>
    `,
  }),

  // Order - Ready for Pickup
  orderReady: (data) => ({
    subject: `Your Order is Ready - #${data.orderNumber}`,
    html: `
      <h2>Your order is ready for pickup!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your order #${data.orderNumber} is now ready for pickup.</p>
      <p>Please visit our shop with your order number.</p>
      <p><strong>Shop Hours:</strong> 9:00 AM - 6:00 PM</p>
      <br/>
      <p>Thank you for shopping with us!</p>
    `,
  }),

  // Password Reset
  passwordReset: (data) => ({
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${data.resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  }),
  orderStatusUpdated: (data) => ({
    subject: `Order #${data.orderNumber} is now ${data.status}`,
    html: `
      <h2>Order status updated</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your order <strong>#${data.orderNumber}</strong> is now <strong>${data.status}</strong>.</p>
      <p><strong>Total:</strong> $${Number(data.totalAmount || 0).toFixed(2)}</p>
      <p>You can review your order in your account.</p>
      <p><a href="${APP_BASE_URL}">Open website</a></p>
      <br/>
      <p>Thank you for choosing ${APP_NAME}.</p>
    `,
  }),
  orderRefunded: (data) => ({
    subject: `Refund processed for Order #${data.orderNumber}`,
    html: `
      <h2>Your refund has been processed</h2>
      <p>Hi ${data.customerName},</p>
      <p>Order <strong>#${data.orderNumber}</strong> has been refunded.</p>
      <p><strong>Refund Amount:</strong> $${Number(data.refundAmount || 0).toFixed(2)}</p>
      <p><strong>Reason:</strong> ${data.reason || "N/A"}</p>
      <br/>
      <p>If you have questions, reply to this email.</p>
    `,
  }),
  adminNewOrderAlert: (data) => ({
    subject: `New order placed: #${data.orderNumber}`,
    html: `
      <h2>New order received</h2>
      <p><strong>Order:</strong> #${data.orderNumber}</p>
      <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
      <p><strong>Total:</strong> $${Number(data.totalAmount || 0).toFixed(2)}</p>
      <p><strong>Items:</strong> ${data.itemCount}</p>
      <p><a href="${APP_BASE_URL}/admin/orders">Open admin orders</a></p>
    `,
  }),
  welcomeUser: (data) => ({
    subject: `Welcome to ${APP_NAME}`,
    html: `
      <h2>Welcome, ${data.name || "there"}!</h2>
      <p>Your account has been created successfully.</p>
      <p>You can now place orders and track your repairs online.</p>
      <p><a href="${APP_BASE_URL}">Start shopping</a></p>
      <br/>
      <p>Thanks for joining ${APP_NAME}.</p>
    `,
  }),
  serviceRequestReceived: (data) => ({
    subject: `Service request received - #${data.requestNumber}`,
    html: `
      <h2>We received your service request</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your request <strong>#${data.requestNumber}</strong> is now in queue.</p>
      <p><strong>Device:</strong> ${data.deviceModel || data.deviceType || "-"}</p>
      <p><strong>Issue:</strong> ${data.issueDescription || "-"}</p>
      <p>We'll notify you when a technician is assigned.</p>
      <br/>
      <p>Thank you for choosing ${APP_NAME}.</p>
    `,
  }),
};

// Retry logic with exponential backoff
const sendEmailWithRetry = async (
  to,
  type,
  data,
  retries = 2,
  delay = 2500,
) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Reset transporter for retries to get fresh connection
      if (attempt > 0) {
        console.log(
          `[Email Retry] Attempt ${attempt + 1}/${retries + 1} for ${type} to ${to}`,
        );
        transporter = null;
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, attempt - 1)),
        );
      }

      const transport = getTransporter();
      if (!transport) {
        return {
          success: false,
          skipped: true,
          reason: "EMAIL_NOT_CONFIGURED",
          attempt: attempt + 1,
        };
      }

      const template = emailTemplates[type](data);
      const mailOptions = {
        from: `"${APP_NAME}" <${process.env.EMAIL_FROM}>`,
        to: to,
        subject: template.subject,
        html: template.html,
      };

      const info = await transport.sendMail(mailOptions);
      console.log(`[Email Success] ${type} sent to ${to} (${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        attempt: attempt + 1,
      };
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isRetryableError = [
        "ETIMEDOUT",
        "ECONNRESET",
        "ENOTFOUND",
        "ECONNREFUSED",
        "EHOSTUNREACH",
        "ESOCKET", // IPv6/socket connection errors
      ].includes(error.code);

      if (isLastAttempt || !isRetryableError) {
        console.error(
          `[Email Failed] ${type} to ${to} after ${attempt + 1} attempt(s):`,
          {
            message: error.message,
            code: error.code,
            command: error.command,
          },
        );
        transporter = null; // Reset for next operation
        return {
          success: false,
          error: error.message,
          code: error.code,
          type: type,
          recipient: to,
          attempts: attempt + 1,
        };
      }
    }
  }
};

// Send email function (main entry point)
const sendEmail = async (to, type, data) => {
  try {
    if (!to) {
      return { success: false, skipped: true, reason: "MISSING_RECIPIENT" };
    }

    if (!emailTemplates[type]) {
      return { success: false, skipped: true, reason: "UNKNOWN_TEMPLATE" };
    }

    return await sendEmailWithRetry(to, type, data);
  } catch (error) {
    console.error(
      `[Email Exception] Unexpected error for ${type} to ${to}:`,
      error.message,
    );
    return {
      success: false,
      error: error.message,
      type: type,
      recipient: to,
    };
  }
};

// Notification triggers
const sendServiceAssignedNotification = async (serviceRequest, technician) => {
  if (!serviceRequest.customerEmail) return;

  await sendEmail(serviceRequest.customerEmail, "serviceAssigned", {
    customerName: serviceRequest.customerName,
    deviceModel: serviceRequest.deviceModel,
    technicianName: technician.name,
    estimatedCompletion: serviceRequest.estimatedCompletionDate,
    requestNumber: serviceRequest.requestNumber,
  });

  // Update notification flag
  await serviceRequest.updateOne({ "notificationSent.assigned": true });
};

const sendServiceCompletedNotification = async (serviceRequest) => {
  if (!serviceRequest.customerEmail) return;

  await sendEmail(serviceRequest.customerEmail, "serviceCompleted", {
    customerName: serviceRequest.customerName,
    deviceModel: serviceRequest.deviceModel,
    totalAmount: serviceRequest.totalAmount,
    requestNumber: serviceRequest.requestNumber,
  });

  await serviceRequest.updateOne({ "notificationSent.completed": true });
};

const sendOrderConfirmedNotification = async (order) => {
  await sendEmail(order.customerEmail, "orderConfirmed", {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    totalAmount: order.totalAmount,
  });

  await order.updateOne({ "notificationSent.confirmed": true });
};

const sendOrderReadyNotification = async (order) => {
  await sendEmail(order.customerEmail, "orderReady", {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
  });

  await order.updateOne({ "notificationSent.ready": true });
};

const sendOrderStatusUpdatedNotification = async (order) => {
  if (!order?.customerEmail || !order?.orderStatus) return;

  await sendEmail(order.customerEmail, "orderStatusUpdated", {
    customerName: order.customerName || "Customer",
    orderNumber: order.orderNumber || order._id,
    status: order.orderStatus,
    totalAmount: order.totalAmount || 0,
  });
};

const sendOrderRefundNotification = async (order, reason = "") => {
  if (!order?.customerEmail) return;

  await sendEmail(order.customerEmail, "orderRefunded", {
    customerName: order.customerName || "Customer",
    orderNumber: order.orderNumber || order._id,
    refundAmount: order.refund?.amount || order.totalAmount || 0,
    reason,
  });
};

const sendAdminNewOrderAlert = async (order) => {
  if (!ADMIN_EMAIL) return;

  await sendEmail(ADMIN_EMAIL, "adminNewOrderAlert", {
    orderNumber: order.orderNumber || order._id,
    customerName: order.customerName || "Unknown",
    customerEmail: order.customerEmail || "-",
    totalAmount: order.totalAmount || 0,
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
  });
};

const sendWelcomeUserEmail = async (user) => {
  if (!user?.email) return;
  await sendEmail(user.email, "welcomeUser", {
    name: user.name || "Customer",
  });
};

const sendServiceRequestReceivedNotification = async (serviceRequest) => {
  if (!serviceRequest?.customerEmail) return;
  await sendEmail(serviceRequest.customerEmail, "serviceRequestReceived", {
    customerName: serviceRequest.customerName || "Customer",
    requestNumber: serviceRequest.requestNumber || serviceRequest._id,
    deviceModel: serviceRequest.deviceModel,
    deviceType: serviceRequest.deviceType,
    issueDescription: serviceRequest.issueDescription,
  });
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    if (!isEmailConfigured()) {
      return {
        success: false,
        message: "Email not configured - missing environment variables",
      };
    }

    const transport = getTransporter();
    if (!transport) {
      return { success: false, message: "Failed to create email transporter" };
    }

    // Send a test email to the admin
    const result = await sendEmail(process.env.ADMIN_EMAIL, "welcomeUser", {
      name: "Test User",
    });

    if (result.success) {
      return {
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId,
      };
    } else {
      return {
        success: false,
        message: `Test email failed: ${result.error}`,
        error: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Test failed with error: ${error.message}`,
      error: error.message,
    };
  }
};

module.exports = {
  sendEmail,
  sendServiceAssignedNotification,
  sendServiceCompletedNotification,
  sendOrderConfirmedNotification,
  sendOrderReadyNotification,
  sendOrderStatusUpdatedNotification,
  sendOrderRefundNotification,
  sendAdminNewOrderAlert,
  sendWelcomeUserEmail,
  sendServiceRequestReceivedNotification,
  isEmailConfigured,
  testEmailConfiguration,
};
