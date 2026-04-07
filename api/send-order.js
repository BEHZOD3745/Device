export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new Response("Text is required.", { status: 400 });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.", {
        status: 500,
      });
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      return new Response(JSON.stringify(telegramData), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ ok: true, telegram: telegramData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(error.message || "Unexpected error", {
      status: 500,
    });
  }
}