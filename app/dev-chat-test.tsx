import { View, Text } from "react-native";
import { healthCheck } from "../lib/chatApi";
import { useEffect, useState } from "react";

export default function DevChatTest() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    healthCheck()
      .then(() => setStatus("✅ Backend connected"))
      .catch(() => setStatus("❌ Backend not reachable"));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{status}</Text>
    </View>
  );
}
