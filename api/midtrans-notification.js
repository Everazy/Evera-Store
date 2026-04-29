import midtransClient from "midtrans-client";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      return res.status(500).json({
        error: "MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum diisi di Environment Variables"
      });
    }

    const core = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const notification = await core.transaction.notification(req.body);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log("Webhook Midtrans:", {
      orderId,
      transactionStatus,
      fraudStatus,
      raw: notification
    });

    // TODO:
    // Di sini tempat update database order kamu kalau nanti ingin otomatis.
    // Status berhasil biasanya:
    // - transaction_status === "settlement"
    // - atau transaction_status === "capture" && fraud_status === "accept"

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Notification error:", error);
    return res.status(500).json({
      error: "Webhook gagal diproses",
      detail: error.message
    });
  }
}
