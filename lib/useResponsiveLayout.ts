import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

type Options = {
  maxWidth?: number;
  paddingHorizontal?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingVertical?: number;
};

export function useResponsiveLayout(options: Options = {}) {
  const { width } = useWindowDimensions();

  const contentContainerStyle = useMemo(() => {
    const isTablet = width >= 768;
    const isLarge = width >= 1024;

    const baseHorizontal = isLarge ? 28 : isTablet ? 22 : 16;
    const baseVertical = isLarge ? 24 : isTablet ? 20 : 16;
    const baseTop = isLarge ? 28 : isTablet ? 24 : 16;
    const baseBottom = isLarge ? 28 : isTablet ? 24 : 20;

    const paddingHorizontal = options.paddingHorizontal ?? baseHorizontal;
    const paddingVertical = options.paddingVertical ?? baseVertical;
    const paddingTop = options.paddingTop ?? baseTop ?? paddingVertical;
    const paddingBottom = options.paddingBottom ?? baseBottom;

    const maxWidth = options.maxWidth ?? (isLarge ? 960 : isTablet ? 720 : undefined);

    return {
      width: "100%" as const,
      alignSelf: "center" as const,
      paddingHorizontal,
      paddingTop,
      paddingBottom,
      ...(maxWidth ? { maxWidth } : null),
    };
  }, [
    options.maxWidth,
    options.paddingBottom,
    options.paddingHorizontal,
    options.paddingTop,
    options.paddingVertical,
    width,
  ]);

  return { contentContainerStyle };
}
