import { Button, type ButtonProps } from "antd";

export const AppButton = ({ children, ...props }: ButtonProps): JSX.Element => (
  <Button {...props}>{children}</Button>
);
