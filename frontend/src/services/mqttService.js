import mqtt from "mqtt";

const BASE_TOPIC = "pulse/dev/sugardaddy"; 
const TEXT_CHANNELS = ["general", "random"]; 
const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt"; 
const RECONNECT_PERIOD = 3000; // ms

let client = null;
let _onMessage = null;
let _queue = []; 
let _clientId = null;

function genClientId() {
  return `pulse_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse(buf) {
  try {
    return JSON.parse(buf.toString());
  } catch (e) {
    console.warn("mqtt: failed to parse payload as JSON", e);
    return null;
  }
}

function ensureClient() {
  if (!client) throw new Error("MQTT client not initialized. Call connectMQTT() first.");
}

export function connectMQTT(onMessage, opts = {}) {
  if (client) {
    
    _onMessage = onMessage;
    return client;
  }

  _onMessage = onMessage;
  _clientId = genClientId();

  const connectOptions = {
    clientId: _clientId,
    reconnectPeriod: opts.reconnectPeriod ?? RECONNECT_PERIOD,
    clean: opts.clean ?? true,
    ...opts
  };

  client = mqtt.connect(MQTT_URL, connectOptions);

  client.on("connect", () => {
    console.info("✅ MQTT connected as", _clientId);

    subscribeToAllTextChannels();

    client.subscribe(`${BASE_TOPIC}/voice/presence/#`, (err) => {
      if (err) console.warn("mqtt: failed to subscribe voice presence", err);
      else console.info("📡 Subscribed to voice presence (wildcard)");
    });

    client.subscribe(`${BASE_TOPIC}/voice/signaling/#`, (err) => {
      if (err) console.warn("mqtt: failed to subscribe voice signaling", err);
      else console.info("📡 Subscribed to voice signaling (wildcard)");
    });

    if (_queue.length > 0) {
      console.info(`mqtt: publishing ${_queue.length} queued messages`);
      _queue.forEach(({ topic, payload }) => {
        client.publish(topic, payload, (err) => {
          if (err) console.warn("mqtt: queued publish failed", err);
        });
      });
      _queue = [];
    }
  });

  client.on("reconnect", () => {
    console.info("🔄 MQTT reconnecting...");
  });

  client.on("close", () => {
    console.info("✖ MQTT connection closed");
  });

  client.on("offline", () => {
    console.info("⚠ MQTT offline");
  });

  client.on("error", (err) => {
    console.error("mqtt error:", err);
  });

  client.on("message", (topic, payload) => {
    const msg = safeParse(payload);
    if (msg === null) return; 
    try {
      if (_onMessage) _onMessage(topic, msg);
    } catch (e) {
      console.error("mqtt: onMessage callback threw", e);
    }
  });

  return client;
}

export function publish(topic, obj, opts = {}) {
  const payload = JSON.stringify(obj ?? {});
  if (!client || !client.connected) {
    _queue.push({ topic, payload, opts });
    console.debug("mqtt: queued publish", topic);
    return;
  }
  client.publish(topic, payload, opts, (err) => {
    if (err) console.warn("mqtt: publish error", err, topic);
  });
}

export function publishTextMessage(channelId, message) {
  const topic = `${BASE_TOPIC}/text/${channelId}`;
  publish(topic, message);
}

export function subscribeToAllTextChannels() {
  if (!client) {
    console.warn("mqtt: subscribe attempted before client ready");
    return;
  }

  TEXT_CHANNELS.forEach((channelId) => {
    const topic = `${BASE_TOPIC}/text/${channelId}`;
    client.subscribe(topic, (err) => {
      if (err) console.warn("mqtt: subscribe failed", topic, err);
      else console.info("📡 Subscribed to", topic);
    });
  });
}

export function subscribeToTopic(topic) {
  if (!client) {
    console.warn("mqtt: subscribe attempted before client ready");
    return;
  }
  client.subscribe(topic, (err) => {
    if (err) console.warn("mqtt: subscribe failed", topic, err);
    else console.info("📡 Subscribed to", topic);
  });
}

export function unsubscribeTopic(topic) {
  if (!client) {
    console.warn("mqtt: unsubscribe attempted before client ready");
    return;
  }
  client.unsubscribe(topic, (err) => {
    if (err) console.warn("mqtt: unsubscribe failed", topic, err);
    else console.info("➖ Unsubscribed from", topic);
  });
}

export function getClientId() {
  return _clientId;
}

export function disconnect() {
  if (!client) return;
  try {
    client.end(true, () => {
      console.info("mqtt: client disconnected");
      client = null;
      _clientId = null;
      _queue = [];
    });
  } catch (e) {
    console.warn("mqtt: disconnect error", e);
  }
}

export default {
  connectMQTT,
  publish,
  publishTextMessage,
  subscribeToAllTextChannels,
  subscribeToTopic,
  unsubscribeTopic,
  getClientId,
  disconnect
};
