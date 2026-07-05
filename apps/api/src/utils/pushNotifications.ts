interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(
  message: PushMessage,
): Promise<void> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: "default",
        priority: "high",
      }),
    });
    const result = await response.json();
    console.log("[push] sent:", result);
  } catch (err) {
    console.log("[push] failed to send:", err);
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> {
  const { queryOne } = await import("../infrastructure/db/client.js");

  const user = await queryOne<{ expo_push_token: string | null }>(
    `SELECT expo_push_token FROM users WHERE id = $1`,
    [userId],
  );

  if (!user?.expo_push_token) {
    console.log(`[push] no token for user ${userId}`);
    return;
  }

  await sendPushNotification({
    to: user.expo_push_token,
    title,
    body,
    data,
  });
}
