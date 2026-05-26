import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import {
  Delegate,
  MediapipeCamera,
  RunningMode,
  usePoseDetection,
  type Landmark,
  type PoseDetectionResultBundle,
  type ViewCoordinator,
} from "react-native-mediapipe";
import { useCameraPermission } from "react-native-vision-camera";

const BG = "#0B0F1A";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";
const ACCENT = "#FF4D2D";

type Phase = "idle" | "counting" | "paused" | "finished";
type RepState = "UP" | "DOWN";

const LM = {
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
} as const;

const MIN_CONFIDENCE = 0.4;
const STAND_ANGLE = 165;
const SQUAT_ANGLE = 95;
const MAX_MISSING_MS = 1200;
const INVALID_FRAMES_TO_PAUSE = 12;

function isValidLandmark(lm: Landmark | null | undefined) {
  if (!lm) return false;
  if (typeof lm.x !== "number" || typeof lm.y !== "number" || typeof lm.z !== "number") return false;
  const conf = lm.visibility ?? lm.presence ?? 1;
  return conf >= MIN_CONFIDENCE;
}

function safeLm(arr: Landmark[], idx: number) {
  const p = arr[idx];
  return isValidLandmark(p) ? p : null;
}

function getAngle(a: Landmark, b: Landmark, c: Landmark) {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const mag1 = Math.sqrt(abx * abx + aby * aby);
  const mag2 = Math.sqrt(cbx * cbx + cby * cby);
  if (mag1 === 0 || mag2 === 0) return 180;

  let cos = dot / (mag1 * mag2);
  cos = Math.max(-1, Math.min(1, cos));
  const rad = Math.acos(cos);
  return (rad * 180) / Math.PI;
}

function averageKneeAngle(lms: Landmark[]) {
  const leftHip = safeLm(lms, LM.L_HIP);
  const leftKnee = safeLm(lms, LM.L_KNEE);
  const leftAnkle = safeLm(lms, LM.L_ANKLE);

  const rightHip = safeLm(lms, LM.R_HIP);
  const rightKnee = safeLm(lms, LM.R_KNEE);
  const rightAnkle = safeLm(lms, LM.R_ANKLE);

  const angles: number[] = [];
  if (leftHip && leftKnee && leftAnkle) angles.push(getAngle(leftHip, leftKnee, leftAnkle));
  if (rightHip && rightKnee && rightAnkle) angles.push(getAngle(rightHip, rightKnee, rightAnkle));

  if (!angles.length) return null;
  return angles.reduce((a, b) => a + b, 0) / angles.length;
}

function hasEnoughLowerBody(lms: Landmark[]) {
  const leftOk = !!(safeLm(lms, LM.L_HIP) && safeLm(lms, LM.L_KNEE) && safeLm(lms, LM.L_ANKLE));
  const rightOk = !!(safeLm(lms, LM.R_HIP) && safeLm(lms, LM.R_KNEE) && safeLm(lms, LM.R_ANKLE));
  return leftOk || rightOk;
}

export default function SquatChallenge() {
  const { hasPermission, requestPermission } = useCameraPermission();

  const [phase, setPhase] = useState<Phase>("idle");
  const [repState, setRepState] = useState<RepState>("UP");
  const [count, setCount] = useState(0);
  const [statusText, setStatusText] = useState("Ready");
  const [debugText, setDebugText] = useState("");
  const [saving, setSaving] = useState(false);

  const lastLandmarkAt = useRef<number>(0);
  const invalidFrames = useRef<number>(0);

  useEffect(() => {
    (async () => {
      if (!hasPermission) await requestPermission();
    })();
  }, [hasPermission, requestPermission]);

  const onResults = useCallback(
    (results: PoseDetectionResultBundle, _vc: ViewCoordinator) => {
      const now = Date.now();
      lastLandmarkAt.current = now;

      const lms = results.results[0]?.landmarks?.[0] ?? [];
      if (!lms.length) return;

      if (!hasEnoughLowerBody(lms)) {
        invalidFrames.current += 1;
        return;
      }

      invalidFrames.current = 0;

      const kneeAngle = averageKneeAngle(lms);
      if (kneeAngle == null) return;

      setDebugText(`Knee angle: ${Math.round(kneeAngle)} deg`);

      if (phase !== "counting") return;

      if (repState === "UP") {
        if (kneeAngle <= SQUAT_ANGLE) {
          setRepState("DOWN");
        }
      } else {
        if (kneeAngle >= STAND_ANGLE) {
          setRepState("UP");
          setCount((c) => c + 1);
        }
      }
    },
    [phase, repState]
  );

  const onError = useCallback((err: { message?: string }) => {
    setStatusText(err?.message ?? "Pose error");
  }, []);

  const poseDetection = usePoseDetection(
    {
      onResults,
      onError,
    },
    RunningMode.LIVE_STREAM,
    "pose_landmarker_lite.task",
    {
      fpsMode: 20,
      numPoses: 1,
      minPoseDetectionConfidence: 0.3,
      minPosePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
      delegate: Delegate.CPU,
    }
  );

  useEffect(() => {
    const t = setInterval(() => {
      if (phase !== "counting") return;
      const age = Date.now() - lastLandmarkAt.current;
      if (lastLandmarkAt.current > 0 && age > MAX_MISSING_MS) {
        setStatusText("No pose detected - paused");
        setPhase("paused");
      }
      if (invalidFrames.current >= INVALID_FRAMES_TO_PAUSE) {
        setStatusText("Pose lost - paused");
        setPhase("paused");
      }
    }, 300);

    return () => clearInterval(t);
  }, [phase]);

  const canUseCamera = useMemo(() => !!hasPermission, [hasPermission]);

  const start = async () => {
    if (!hasPermission) {
      const ok = await requestPermission();
      if (!ok) {
        Alert.alert("Camera required", "Allow camera access to start the challenge.");
        return;
      }
    }

    setCount(0);
    setRepState("UP");
    invalidFrames.current = 0;
    lastLandmarkAt.current = Date.now();

    setPhase("counting");
    setStatusText("Counting...");
  };

  const pause = () => {
    setPhase("paused");
    setStatusText("Paused");
  };

  const resume = () => {
    setPhase("counting");
    setStatusText("Counting...");
    invalidFrames.current = 0;
    lastLandmarkAt.current = Date.now();
  };

  const retry = () => {
    setCount(0);
    setRepState("UP");
    setPhase("idle");
    setStatusText("Ready");
    setDebugText("");
    invalidFrames.current = 0;
    lastLandmarkAt.current = 0;
  };

  const save = async () => {
    try {
      setSaving(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("You must be logged in.");

      const { error } = await supabase.from("challenge_scores").insert({
        challenge_key: "squat",
        user_id: user.id,
        score: count,
        reps_completed: count,
        difficulty_level: "normal",
      });

      if (error) throw error;

      Alert.alert("Saved", `You saved ${count} squats!`, [{ text: "OK", onPress: () => retry() }]);
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 54, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: "white", fontWeight: "900", fontSize: 22 }}>Squat Challenge</Text>
        <Text style={{ color: MUTED, marginTop: 4 }}>
          Stand tall and squat to count reps automatically.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View
          style={{
            height: 420,
            borderRadius: 22,
            overflow: "hidden",
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          {canUseCamera ? (
            <MediapipeCamera
              style={{ flex: 1 }}
              solution={poseDetection}
              activeCamera="front"
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="camera-outline" size={28} color={MUTED} />
              <Text style={{ color: MUTED, marginTop: 10, fontWeight: "800" }}>
                {hasPermission ? "Loading camera..." : "Camera permission needed"}
              </Text>
              {!hasPermission && (
                <Pressable
                  onPress={requestPermission}
                  style={{
                    marginTop: 12,
                    height: 44,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255,77,45,0.35)",
                    backgroundColor: "rgba(255,77,45,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFD3CA", fontWeight: "900" }}>Allow camera</Text>
                </Pressable>
              )}
            </View>
          )}

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              top: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                height: 34,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Ionicons name="flash-outline" size={16} color="white" />
              <Text style={{ color: "white", fontWeight: "900" }}>{phase.toUpperCase()}</Text>
            </View>

            <View
              style={{
                paddingHorizontal: 12,
                height: 34,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>Reps: {count}</Text>
            </View>
          </View>

          <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
            <View
              style={{
                borderRadius: 16,
                backgroundColor: "rgba(0,0,0,0.45)",
                padding: 12,
              }}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>{statusText}</Text>
              {!!debugText && <Text style={{ color: "#DDE6F6", marginTop: 4 }}>{debugText}</Text>}
            </View>
          </View>
        </View>
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        {phase === "idle" && (
          <Pressable
            onPress={start}
            style={{
              height: 56,
              borderRadius: 999,
              backgroundColor: ACCENT,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Ionicons name="play" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Start</Text>
          </Pressable>
        )}

        {phase === "counting" && (
          <Pressable
            onPress={pause}
            style={{
              height: 56,
              borderRadius: 999,
              backgroundColor: "rgba(255,77,45,0.12)",
              borderWidth: 1,
              borderColor: "rgba(255,77,45,0.35)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Ionicons name="pause" size={18} color="#FFD3CA" />
            <Text style={{ color: "#FFD3CA", fontWeight: "900", fontSize: 16 }}>Pause</Text>
          </Pressable>
        )}

        {phase === "paused" && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={resume}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 999,
                backgroundColor: ACCENT,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
              }}
            >
              <Ionicons name="play" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Resume</Text>
            </Pressable>

            <Pressable
              onPress={retry}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 999,
                backgroundColor: CARD,
                borderWidth: 1,
                borderColor: BORDER,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
              }}
            >
              <Ionicons name="refresh" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Retry</Text>
            </Pressable>
          </View>
        )}

        {phase === "counting" && (
          <Pressable
            onPress={retry}
            style={{
              height: 56,
              borderRadius: 999,
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Reset</Text>
          </Pressable>
        )}

        {(phase === "paused" || phase === "counting") && (
          <Pressable
            onPress={save}
            disabled={saving}
            style={{
              height: 56,
              borderRadius: 999,
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Ionicons name="save-outline" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
              {saving ? "Saving..." : "Save result"}
            </Text>
          </Pressable>
        )}

        <Text style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>
          Tip: keep your full body in view. Squat below parallel for clean counts.
        </Text>
      </View>
    </View>
  );
}
