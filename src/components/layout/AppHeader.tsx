import { DownOutlined, LogoutOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Typography, type MenuProps } from "antd";
import { APP_CONFIG, LOCAL_STORAGE_KEYS } from "../../constants/app.constants";
import { COLORS } from "../../constants/colors";
import type { AuthUser } from "../../types/auth";

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  onLogout: () => void;
}

const getStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
};

export const AppHeader = ({ onLogout }: AppHeaderProps): JSX.Element => {
  const user = getStoredUser();
  const username = user?.username || user?.fullName || "admin";
  const initial = username.charAt(0).toUpperCase();

  const menuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: onLogout
    }
  ];

  return (
    <Header
      className="app-header"
      style={{
        height: APP_CONFIG.HEADER_HEIGHT,
        borderBottom: `1px solid ${COLORS.LIGHT}`
      }}
    >
      <span />
      <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
        <button className="app-header__user" type="button" aria-label="Open user menu">
          <Avatar className="app-header__avatar">{initial}</Avatar>
          <Text strong>{username}</Text>
          <DownOutlined className="app-header__chevron" />
        </button>
      </Dropdown>
    </Header>
  );
};
