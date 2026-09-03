import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css";
import { AppUpdateProvider } from "./contexts/AppUpdateContext";
import { antdTheme } from "./theme/antdTheme";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ConfigProvider theme={antdTheme}>
    <AppUpdateProvider>
      <App />
    </AppUpdateProvider>
  </ConfigProvider>
);
