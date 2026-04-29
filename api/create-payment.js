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

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const {
      order_id,
      gross_amount,
      product_name,
      customer_note,
      product_code
    } = req.body || {};

    if (!order_id || !gross_amount || Number(gross_amount) <= 0) {
      return res.status(400).json({
        error: "order_id dan gross_amount wajib diisi"
      });
    }

    const parameter = {
      transaction_details: {
        order_id,
        gross_amount: Number(gross_amount)
      },
      item_details: [
        {
          id: product_code || "EVERASTORE",
          price: Number(gross_amount),
          quantity: 1,
          name: String(product_name || "Everastore Order").slice(0, 50)
        }
      ],
      customer_details: {
        first_name: "Customer",
        email: "customer@everastore.local",
        phone: "080000000000"
      },
      custom_field1: String(customer_note || "-").slice(0, 255),
      enabled_payments: [
        "gopay",
        "qris",
        "shopeepay",
        "bank_transfer",
        "echannel",
        "credit_card"
      ]
    };

    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      error: "Gagal membuat pembayaran",
      detail: error.message
    });
  }
}
