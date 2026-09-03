import { CalendarOutlined, TeamOutlined, WalletOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import type { PropsWithChildren, ReactNode } from "react";
import sportLedgerLogo from "../assets/sportledger-logo.png";
import { APP_CONFIG } from "../constants/app.constants";

const { Title, Text } = Typography;

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  wide?: boolean;
}

export const AuthLayout = ({
  children,
  title,
  subtitle,
  footer,
  wide = false
}: AuthLayoutProps): JSX.Element => (
  <main className="auth-layout">
    <section className="auth-layout__brand">
      <div className="auth-layout__logo">
        <img src={sportLedgerLogo} alt={`${APP_CONFIG.APP_NAME} logo`} />
      </div>
      <Title className="auth-layout__app-name">{APP_CONFIG.APP_NAME}</Title>
      <Text className="auth-layout__tagline">{APP_CONFIG.APP_TAGLINE}</Text>
      <div className="auth-layout__details" aria-label={`${APP_CONFIG.APP_NAME} details`}>
        <span>
          <TeamOutlined />
          Team wallets
        </span>
        <span>
          <CalendarOutlined />
          Match costs
        </span>
        <span>
          <WalletOutlined />
          Player balances
        </span>
      </div>
    </section>

    <section className={wide ? "auth-panel auth-panel--wide" : "auth-panel"}>
      <div className="auth-panel__header">
        <Title level={2}>{title}</Title>
        <Text>{subtitle}</Text>
      </div>
      {children}
      {footer ? <div className="auth-panel__footer">{footer}</div> : null}
    </section>
  </main>
);
