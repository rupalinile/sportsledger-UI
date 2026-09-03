import { Spin } from "antd";

interface AppLoaderProps {
  label?: string;
}

export const AppLoader = ({ label = "Loading" }: AppLoaderProps): JSX.Element => (
  <Spin tip={label} size="large" />
);
