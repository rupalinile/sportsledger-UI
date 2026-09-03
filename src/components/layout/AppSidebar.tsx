import {
  CalendarOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Layout, Menu, Typography } from "antd";
import sportLedgerLogo from "../../assets/sportledger-logo.png";
import { APP_CONFIG } from "../../constants/app.constants";
import { COLORS } from "../../constants/colors";
import { ROUTES } from "../../constants/routes";
import type { AppRoute } from "../../types/navigation";
import { getNavigationItems } from "../../utils/navigation";

const { Sider } = Layout;
const { Text, Title } = Typography;

const routeIcons: Record<AppRoute, JSX.Element> = {
  [ROUTES.HOME]: <DashboardOutlined />,
  [ROUTES.MATCHES]: <CalendarOutlined />,
  [ROUTES.SQUAD]: <TeamOutlined />,
  [ROUTES.PLAYER_EXPENSES]: <UserOutlined />,
  [ROUTES.TEAM_EXPENSES]: <DollarCircleOutlined />,
  [ROUTES.LOGIN]: <WalletOutlined />,
  [ROUTES.REGISTER]: <WalletOutlined />
};

interface AppSidebarProps {
  currentRoute: AppRoute;
  isFreePlan: boolean;
  onNavigate: (route: AppRoute) => void;
}

export const AppSidebar = ({ currentRoute, isFreePlan, onNavigate }: AppSidebarProps): JSX.Element => {
  const navigationItems = getNavigationItems().map((item) => ({
    key: item.key,
    disabled: isFreePlan && item.key !== ROUTES.HOME,
    icon: routeIcons[item.key],
    label: item.label
  }));

  return (
    <Sider width={APP_CONFIG.SIDEBAR_WIDTH} className="app-sidebar">
      <div className="app-sidebar__brand" style={{ height: APP_CONFIG.HEADER_HEIGHT }}>
        <span className="app-sidebar__logo">
          <img src={sportLedgerLogo} alt="" />
        </span>
        <Title level={4} style={{ color: COLORS.WHITE }}>
          {APP_CONFIG.APP_NAME}
        </Title>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentRoute]}
        items={navigationItems}
        onClick={({ key }) => {
          const route = key as AppRoute;

          if (!isFreePlan || route === ROUTES.HOME) {
            onNavigate(route);
          }
        }}
      />
      <Text className="app-sidebar__footer">
        &copy; 2026 {APP_CONFIG.APP_NAME}
      </Text>
    </Sider>
  );
};
