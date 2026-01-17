import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View, Pressable } from "react-native";

export default function Legal() {
  return (
    <View style={{ flex: 1, backgroundColor: "black", padding: 18 }}>
      <Text style={{ color: "#3dff7a", fontSize: 26, fontWeight: "800", marginBottom: 12 }}>
        Legal Notice
      </Text>

      <ScrollView>
        <Text style={{ color: "white", opacity: 0.9, lineHeight: 22 }}>
          This app provides nutrition-related information for educational purposes only and is not
          medical advice. Always consult a qualified healthcare professional before making changes
          to your diet, supplements, or treatment plan.
          {"\n\n"}
          Use of this app is at your own risk. Granted Solutions, LLC makes no guarantees regarding
          accuracy, completeness, or outcomes.
          {"\n\n"}
          (Replace this text with your final legal language.)
        </Text>
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        style={{
          marginTop: 16,
          backgroundColor: "#3dff7a",
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Back</Text>
      </Pressable>
    </View>
  );
}
