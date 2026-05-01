import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";

interface Props {
  challengeTitle: string;
  timeLimitSec: number;
  onSubmit: (uri: string) => void;
}

export default function CameraChallenge({ challengeTitle, timeLimitSec, onSubmit }: Props) {
  const [perm, requestPerm] = useCameraPermissions();
  const [timeLeft, setTimeLeft] = useState(timeLimitSec);
  const [capturing, setCapturing] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const camRef = useRef<CameraView>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const snap = async () => {
    if (!camRef.current || capturing) return;
    setCapturing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const p = await camRef.current.takePictureAsync({ quality: 0.7 });
      if (p) onSubmit(p.uri);
    } finally {
      setCapturing(false);
    }
  };

  const flipCamera = () => {
    setFacing((f) => (f === "back" ? "front" : "back"));
  };

  const isUrgent = timeLeft < 30;
  const isExpired = timeLeft <= 0;

  if (!perm?.granted) {
    return (
      <View style={s.perm}>
        <Text style={s.permEmoji}>📸</Text>
        <Text style={s.permTxt}>Camera access is needed to complete this challenge</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPerm}>
          <Text style={s.permBtnTxt}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isExpired) {
    return (
      <View style={s.expired}>
        <Text style={s.expiredEmoji}>⏰</Text>
        <Text style={s.expiredTxt}>Time's up!</Text>
        <Text style={s.expiredSub}>Challenge failed</Text>
      </View>
    );
  }

  return (
    <CameraView ref={camRef} style={StyleSheet.absoluteFillObject} facing={facing}>
      <View style={s.overlay}>
        {/* Timer */}
        <View style={s.topBar}>
          <View style={[s.timerBox, isUrgent && s.timerBoxRed]}>
            <Text style={[s.timer, isUrgent && s.timerRed]}>{timeLeft}s</Text>
          </View>
          <TouchableOpacity style={s.flipBtn} onPress={flipCamera}>
            <Text style={s.flipTxt}>↕️</Text>
          </TouchableOpacity>
        </View>

        {/* Challenge description */}
        <View style={s.chalBox}>
          <Text style={s.chalLabel}>CHALLENGE</Text>
          <Text style={s.chalTxt}>{challengeTitle}</Text>
        </View>

        {/* Capture button */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.capture, capturing && s.captureActive]}
            onPress={snap}
            disabled={capturing}
          >
            <View style={[s.captureInner, capturing && s.captureInnerActive]} />
          </TouchableOpacity>
        </View>
      </View>
    </CameraView>
  );
}

const s = StyleSheet.create({
  perm: { flex: 1, backgroundColor: "#0A0805", justifyContent: "center", alignItems: "center", padding: 24 },
  permEmoji: { fontSize: 48, marginBottom: 16 },
  permTxt: { color: "#F0EAD6", textAlign: "center", marginBottom: 24, fontSize: 16, lineHeight: 24 },
  permBtn: { backgroundColor: "#F5C518", padding: 16, minWidth: 200, alignItems: "center" },
  permBtnTxt: { color: "#0A0805", fontWeight: "700", fontSize: 16 },

  expired: { flex: 1, backgroundColor: "#0A0805", justifyContent: "center", alignItems: "center" },
  expiredEmoji: { fontSize: 64, marginBottom: 16 },
  expiredTxt: { fontSize: 36, fontWeight: "700", color: "#C1121F", marginBottom: 8 },
  expiredSub: { color: "#8B7355", fontSize: 16 },

  overlay: { flex: 1, justifyContent: "space-between", padding: 24 },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  timerBox: { backgroundColor: "rgba(10,8,5,0.85)", borderWidth: 1, borderColor: "#F5C518", paddingHorizontal: 14, paddingVertical: 8 },
  timerBoxRed: { borderColor: "#C1121F" },
  timer: { color: "#F5C518", fontSize: 28, fontWeight: "700", fontVariant: ["tabular-nums"] },
  timerRed: { color: "#C1121F" },
  flipBtn: { backgroundColor: "rgba(10,8,5,0.7)", width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  flipTxt: { fontSize: 24 },

  chalBox: { backgroundColor: "rgba(10,8,5,0.9)", borderWidth: 1, borderColor: "#F5C518", padding: 16 },
  chalLabel: { color: "#8B7355", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  chalTxt: { color: "#F5C518", fontSize: 18, fontWeight: "700", textAlign: "center" },

  bottomBar: { alignItems: "center" },
  capture: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#F5C518", justifyContent: "center", alignItems: "center" },
  captureActive: { borderColor: "#8B7355" },
  captureInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#F5C518" },
  captureInnerActive: { backgroundColor: "#8B7355" },
});
