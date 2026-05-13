import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";

interface Props {
  challengeTitle: string;
  challengeDesc?: string;
  points?: number;
  timeLimitSec: number;
  submitting?: boolean;
  onSubmit: (uri: string) => void;
  onCancel?: () => void;
}

export default function CameraChallenge({
  challengeTitle,
  challengeDesc,
  points,
  timeLimitSec,
  submitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const [perm, requestPerm] = useCameraPermissions();
  const [timeLeft, setTimeLeft] = useState(timeLimitSec);
  const [capturing, setCapturing] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const camRef = useRef<CameraView>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1_000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const snap = async () => {
    if (!camRef.current || capturing || submitting) return;
    setCapturing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await camRef.current.takePictureAsync({ quality: 0.75, skipProcessing: true });
      if (photo) onSubmit(photo.uri);
    } finally {
      setCapturing(false);
    }
  };

  const isUrgent = timeLeft < 30;
  const isExpired = timeLeft <= 0;

  if (!perm) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  if (!perm.granted) {
    return (
      <View style={s.center}>
        <Text style={s.permEmoji}>📸</Text>
        <Text style={s.permTxt}>Camera access is needed to complete challenges</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPerm}>
          <Text style={s.permBtnTxt}>GRANT CAMERA ACCESS</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
            <Text style={s.cancelBtnTxt}>← BACK</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isExpired) {
    return (
      <View style={s.center}>
        <Text style={s.expiredEmoji}>⏰</Text>
        <Text style={s.expiredTxt}>Time's up!</Text>
        <Text style={s.expiredSub}>Challenge failed</Text>
        {onCancel && (
          <TouchableOpacity style={[s.permBtn, { marginTop: 24 }]} onPress={onCancel}>
            <Text style={s.permBtnTxt}>← BACK</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <CameraView ref={camRef} style={StyleSheet.absoluteFillObject} facing={facing}>
      <View style={s.overlay}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={[s.timerBox, isUrgent && s.timerBoxRed]}>
            <Text style={[s.timerTxt, isUrgent && s.timerTxtRed]}>{timeLeft}s</Text>
          </View>
          <TouchableOpacity
            style={s.flipBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          >
            <Text style={s.flipTxt}>↕️</Text>
          </TouchableOpacity>
          {onCancel && (
            <TouchableOpacity style={s.flipBtn} onPress={onCancel}>
              <Text style={s.flipTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Challenge info */}
        <View style={s.chalBox}>
          <View style={s.chalMeta}>
            <Text style={s.chalLabel}>CHALLENGE</Text>
            {points != null && <Text style={s.chalPoints}>+{points} pts</Text>}
          </View>
          <Text style={s.chalTxt} numberOfLines={2}>{challengeTitle}</Text>
          {challengeDesc && (
            <Text style={s.chalDesc} numberOfLines={2}>{challengeDesc}</Text>
          )}
        </View>

        {/* Shutter */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.capture, (capturing || submitting) && s.captureActive]}
            onPress={() => void snap()}
            disabled={capturing || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#0A0805" />
            ) : (
              <View style={[s.captureInner, capturing && s.captureInnerActive]} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </CameraView>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1, backgroundColor: "#0A0805",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  permEmoji: { fontSize: 48, marginBottom: 16 },
  permTxt: { color: "#F0EAD6", textAlign: "center", marginBottom: 24, fontSize: 16, lineHeight: 24 },
  permBtn: { backgroundColor: "#F5C518", padding: 16, minWidth: 220, alignItems: "center" },
  permBtnTxt: { color: "#0A0805", fontWeight: "700", fontSize: 14, letterSpacing: 1 },
  cancelBtn: { marginTop: 16, padding: 12 },
  cancelBtnTxt: { color: "#8B7355", fontFamily: "monospace", fontSize: 13 },
  expiredEmoji: { fontSize: 64, marginBottom: 16 },
  expiredTxt: { fontSize: 36, fontWeight: "700", color: "#C1121F", marginBottom: 8 },
  expiredSub: { color: "#8B7355", fontSize: 16 },

  overlay: { flex: 1, justifyContent: "space-between", padding: 20 },

  topBar: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  timerBox: {
    backgroundColor: "rgba(10,8,5,0.85)", borderWidth: 1, borderColor: "#F5C518",
    paddingHorizontal: 14, paddingVertical: 8,
  },
  timerBoxRed: { borderColor: "#C1121F" },
  timerTxt: { color: "#F5C518", fontSize: 28, fontWeight: "700" },
  timerTxtRed: { color: "#C1121F" },
  flipBtn: {
    backgroundColor: "rgba(10,8,5,0.7)", width: 46, height: 46,
    justifyContent: "center", alignItems: "center",
  },
  flipTxt: { fontSize: 22 },

  chalBox: {
    backgroundColor: "rgba(10,8,5,0.92)", borderWidth: 1, borderColor: "#F5C518", padding: 16,
  },
  chalMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  chalLabel: { color: "#8B7355", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" },
  chalPoints: { color: "#F5C518", fontSize: 11, fontFamily: "monospace" },
  chalTxt: { color: "#F5C518", fontSize: 18, fontWeight: "700" },
  chalDesc: { color: "#8B7355", fontSize: 13, fontStyle: "italic", marginTop: 4 },

  bottomBar: { alignItems: "center" },
  capture: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: "#F5C518",
    justifyContent: "center", alignItems: "center",
  },
  captureActive: { borderColor: "#8B7355" },
  captureInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#F5C518" },
  captureInnerActive: { backgroundColor: "#8B7355" },
});
