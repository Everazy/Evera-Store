import midtransClient from "midtrans-client";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      return res.status(500).json({
        error: "MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum diisi di Environment Variables"
      });
    }

    const orderId = req.query.orderId;

    if (!orderId) {
      return res.status(400).json({ error: "orderId wajib diisi" });
    }

    const core = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const status = await core.transaction.status(orderId);
    return res.status(200).json(status);
  } catch (error) {
    console.error("Payment status error:", error);
    return res.status(500).json({
      error: "Gagal cek status pembayaran",
      detail: error.message
    });
  }
}
