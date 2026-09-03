import { Typography } from "antd";

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps): JSX.Element => (
  <div className="page-header">
    <Title level={2}>{title}</Title>
    {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
  </div>
);
