import mqtt from "mqtt";

let client = null;
const BASE_TOPIC = "pulse/dev/inder";

export function connectMQTT(onMessage) {
  if (client) return;

  client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

  client.on("connect", () => {
    console.log("✅ MQTT connected");
  });

  client.on("message", (topic, payload) => {
  console.log("📩 MQTT message", topic, payload.toString());
  const message = JSON.parse(payload.toString());
  onMessage(topic, message);
});
}

export function subscribeTextChannel(channelId) {
  if (!client) return;
  client.subscribe(`${BASE_TOPIC}/text/${channelId}`);
  console.log("📡 Subscribed to", `${BASE_TOPIC}/text/${channelId}`);

}

export function publishTextMessage(channelId, message) {
  if (!client) return;
  client.publish(
    `${BASE_TOPIC}/text/${channelId}`,
    JSON.stringify(message)
  );
}
