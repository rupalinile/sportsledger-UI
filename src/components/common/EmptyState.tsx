import { Empty } from "antd";

interface EmptyStateProps {
  description?: string;
}

export const EmptyState = ({ description = "No data available" }: EmptyStateProps): JSX.Element => (
  <Empty description={description} />
);
