import { Layout } from "antd";
import type { PropsWithChildren } from "react";

const { Content } = Layout;

export const AppContent = ({ children }: PropsWithChildren): JSX.Element => (
  <Content className="app-content">{children}</Content>
);
