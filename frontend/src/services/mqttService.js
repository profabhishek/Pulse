import mqtt from "mqtt";

let client = null;

// 🔥 Shared channels (rooms)
const TEXT_CHANNELS = ["general", "random"];
const BASE_TOPIC = "pulse/dev/sugardaddy";

export function connectMQTT(onMessage) {
  if (client) return;

  client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

  client.on("connect", () => {
    console.log("✅ MQTT connected");
  });

  client.on("message", (topic, payload) => {
    const message = JSON.parse(payload.toString());
    onMessage(topic, message);
  });
}

// -----------------------------
// Subscribe to ALL text channels
// -----------------------------
export function subscribeToAllTextChannels() {
  if (!client) return;

  TEXT_CHANNELS.forEach(channelId => {
    const topic = `${BASE_TOPIC}/text/${channelId}`;
    client.subscribe(topic);
    console.log("📡 Subscribed to", topic);
  });
}

// -----------------------------
// Publish message (shared room)
// -----------------------------
export function publishTextMessage(channelId, message) {
  if (!client) return;

  client.publish(
    `${BASE_TOPIC}/text/${channelId}`,
    JSON.stringify(message)
  );
}
