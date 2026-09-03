import type { ThemeConfig } from "antd";
import { COLORS } from "../constants/colors";

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: COLORS.PRIMARY,
    colorInfo: COLORS.SECONDARY,
    colorText: COLORS.DARK,
    colorBgLayout: COLORS.LIGHT,
    borderRadius: 8,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  },
  components: {
    Layout: {
      headerBg: COLORS.WHITE,
      siderBg: COLORS.DARK,
      bodyBg: COLORS.LIGHT
    },
    Menu: {
      darkItemBg: COLORS.DARK,
      darkItemSelectedBg: COLORS.PRIMARY,
      darkItemHoverBg: COLORS.SECONDARY
    }
  }
};
