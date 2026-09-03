import { Card, type CardProps } from "antd";

export const AppCard = ({ children, ...props }: CardProps): JSX.Element => (
  <Card {...props}>{children}</Card>
);
