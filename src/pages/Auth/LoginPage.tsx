import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Form, Input, Space, Typography, message } from "antd";
import { useState } from "react";
import { AppButton } from "../../components/common/AppButton";
import { APP_CONFIG, LOCAL_STORAGE_KEYS } from "../../constants/app.constants";
import { ROUTES } from "../../constants/routes";
import { AuthLayout } from "../../layouts/AuthLayout";
import { authService } from "../../services/authService";
import type { LoginPayload } from "../../types/auth";
import type { AppRouteProps } from "../../types/navigation";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text } = Typography;

interface LoginPageProps extends AppRouteProps {
  onLoginComplete?: () => void;
}

export const LoginPage = ({ onNavigate, onLoginComplete }: LoginPageProps): JSX.Element => {
  const [form] = Form.useForm<LoginPayload>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: LoginPayload): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(values);

      localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, JSON.stringify(response.user));
      localStorage.setItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(response.subscription));

      message.success(response.message || "Login successful");
      onLoginComplete?.();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to login with these credentials."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle={`Sign in to continue to ${APP_CONFIG.APP_NAME}`}
      footer={
        <Space>
          <Text type="secondary">New to {APP_CONFIG.APP_NAME}?</Text>
          <AppButton type="link" onClick={() => onNavigate(ROUTES.REGISTER)}>
            Create account
          </AppButton>
        </Space>
      }
    >
      {errorMessage ? (
        <Alert className="auth-alert" type="error" showIcon message={errorMessage} />
      ) : null}

      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please enter username" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Enter username" size="large" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter password" }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Enter password" size="large" />
        </Form.Item>

        <AppButton block type="primary" htmlType="submit" size="large" loading={isSubmitting}>
          Login
        </AppButton>
      </Form>
    </AuthLayout>
  );
};
