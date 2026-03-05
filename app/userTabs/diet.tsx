// app/(tabs)/diet.tsx
// Diet page — built to match your screenshot (layout + styling)
// Requires SVG ring:
//   npx expo install react-native-svg

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";


export default function Diet() {
  // Demo numbers (replace with real data later)
  const eaten = 1290;
  const remaining = 1000;
  const burned = 350;

  const carbsPct = 0.35;
  const proteinPct = 0.55;
  const fatPct = 0.25;

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
                <View style={styles.headerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hello}>Trainers</Text>
                    <Text style={styles.welcome}>Find a coach, get verified guidance.</Text>
                  </View>
        
                  <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn}>
                    <Ionicons name="notifications-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>Today</Text>
  

        {/* Big stats card */}
        <View style={styles.bigCard}>
          <View style={styles.bigCardInner}>
            {/* Left: Eaten */}
            <View style={styles.sideStat}>
              <Text style={styles.sideNumber}>{eaten}</Text>
              <Text style={styles.sideLabel}>Eaten</Text>
            </View>

            {/* Center: Arc + remaining text */}
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <SemiRing size={118} stroke={10} progress={0.58} />
              <View style={styles.ringCenterText}>
                <Text style={styles.ringNumber}>{remaining}cal</Text>
                <Text style={styles.ringSub}>Remaining</Text>
              </View>
            </View>

            {/* Right: Burned */}
            <View style={styles.sideStat}>
              <Text style={styles.sideNumber}>{burned}</Text>
              <Text style={styles.sideLabel}>Burned</Text>
            </View>
          </View>

          {/* Macros row */}
          <View style={styles.macrosRow}>
            <Macro label="Carbs" pct={carbsPct} />
            <Macro label="Protein" pct={proteinPct} />
            <Macro label="Fat" pct={fatPct} />
          </View>
        </View>

        {/* Meals list */}
        <View style={{ marginTop: 14, gap: 12 }}>
          <MealCard
            title="Breakfast"
            // Replace with your local image later:
            // image={require("../../assets/food/breakfast.jpg")}
            image={undefined}
            onAdd={() => {}}
          />
          <MealCard
            title="Lunch"
            image={undefined}
            onAdd={() => {}}
          />
          <MealCard
            title="Dinner"
            image={undefined}
            onAdd={() => {}}
          />
          <MealCard
            title="Snacks"
            image={undefined}
            onAdd={() => {}}
          />
          <MealCard
            title="Others"
            image={undefined}
            onAdd={() => {}}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* -------------------- Components -------------------- */

function MealCard({
  title,
  image,
  onAdd,
}: {
  title: string;
  image?: any;
  onAdd: () => void;
}) {
  return (
    <View style={styles.mealCard}>
      {/* Left image */}
      <View style={styles.mealImgWrap}>
        {image ? (
          <Image source={image} style={styles.mealImg} />
        ) : (
          <View style={styles.mealImgPlaceholder} />
        )}
      </View>

      {/* Middle text */}
      <View style={{ flex: 1 }}>
        <Text style={styles.mealTitle}>{title}</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={onAdd} style={{ marginTop: 4 }}>
          <Text style={styles.addFood}>ADD FOOD</Text>
        </TouchableOpacity>
      </View>

      {/* Right: ... */}
      <TouchableOpacity activeOpacity={0.9} style={styles.mealMoreBtn}>
        <Ionicons name="ellipsis-horizontal" size={18} color="#C7CFDD" />
      </TouchableOpacity>
    </View>
  );
}

function Macro({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

/**
 * Semi ring like screenshot (top arc only).
 * We draw a circle but only show part of it using strokeDasharray + dashoffset.
 */
function SemiRing({
  size,
  stroke,
  progress,
}: {
  size: number;
  stroke: number;
  progress: number; // 0..1 for the visible arc portion
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  // Show only ~65% of the circle (semi-ish arc like screenshot)
  const visiblePortion = 0.65;
  const arcLen = c * visiblePortion;

  // Progress applied within that arc
  const filled = arcLen * clamp(progress, 0, 1);
  const empty = arcLen - filled;

  // We hide the rest of the circle by leaving a big gap
  const gap = c - arcLen;

  // Start angle (rotate) so the gap sits at the bottom area
  const rotation = -210; // tweak to match screenshot arc position

  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${gap}`}
        rotation={rotation}
        originX={size / 2}
        originY={size / 2}
        opacity={0.8}
      />
      {/* Progress */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#FF4D2D"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${empty + gap}`}
        rotation={rotation}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* -------------------- Styles -------------------- */

const styles = {
  headerCard: {
    marginTop: 40,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },
  hello: { color: ACCENT, fontWeight: "900" as const, fontSize: 18 },
  welcome: { color: MUTED, marginTop: 2, fontSize: 12 },
  topRow: {
    marginTop: 26,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  today: {
    color: "white",
    fontSize: 28,
    fontWeight: "900" as const,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "transparent",
  },

  bigCard: {
    borderRadius: 22,
    backgroundColor: CARD, 
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  bigCardInner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  sideStat: {
    width: 86,
    alignItems: "center" as const,
  },
  sideNumber: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 16,
  },
  sideLabel: {
    color: "#C7CFDD",
    fontSize: 12,
    marginTop: 6,
    opacity: 0.85,
  },

  ringCenterText: {
    position: "absolute" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  ringNumber: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 16,
  },
  ringSub: {
    color: "#C7CFDD",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.85,
  },

  macrosRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  macroTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden" as const,
  },
  macroFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FF4D2D",
  },
  macroLabel: {
    color: "#C7CFDD",
    fontSize: 12,
    marginTop: 8,
    opacity: 0.9,
  },

  mealCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  mealImgWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  },
  mealImg: {
    width: "100%" as const,
    height: "100%" as const,
  },
  mealImgPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  mealTitle: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 16,
  },
  addFood: {
    color: "#FF4D2D",
    fontWeight: "900" as const,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  mealMoreBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "transparent",
  },
    sectionTitle: {
    fontSize: 18,
    color: "#FF4D2D",
    fontWeight: "900" as const,
    marginTop: 14,
    marginBottom: 8,
  },
};
