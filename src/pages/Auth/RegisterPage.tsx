import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Alert, Form, Input, Space, Typography, message } from "antd";
import { useState } from "react";
import { AppButton } from "../../components/common/AppButton";
import { APP_CONFIG } from "../../constants/app.constants";
import { ROUTES } from "../../constants/routes";
import { AuthLayout } from "../../layouts/AuthLayout";
import { authService } from "../../services/authService";
import type { RegisterPayload } from "../../types/auth";
import type { AppRouteProps } from "../../types/navigation";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text } = Typography;

export const RegisterPage = ({ onNavigate }: AppRouteProps): JSX.Element => {
  const [form] = Form.useForm<RegisterPayload>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: RegisterPayload): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await authService.register(values);

      message.success(response.message || "Registration successful");
      form.resetFields();
      onNavigate(ROUTES.LOGIN);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to register this user."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle={`Register to start using ${APP_CONFIG.APP_NAME}`}
      wide
      footer={
        <Space>
          <Text type="secondary">Already have an account?</Text>
          <AppButton type="link" onClick={() => onNavigate(ROUTES.LOGIN)}>
            Login
          </AppButton>
        </Space>
      }
    >
      {errorMessage ? (
        <Alert className="auth-alert" type="error" showIcon message={errorMessage} />
      ) : null}

      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <div className="auth-form-grid">
          <Form.Item
            label="Full name"
            name="fullName"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter full name" size="large" />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter username" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter username" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter email" size="large" />
          </Form.Item>

          <Form.Item
            label="Phone number"
            name="phoneNumber"
            rules={[
              { required: true, message: "Please enter phone number" },
              {
                pattern: /^[0-9]{10}$/,
                message: "Phone number must be 10 digits"
              }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" size="large" />
          </Form.Item>
        </div>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter password" }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Enter password" size="large" />
        </Form.Item>

        <AppButton block type="primary" htmlType="submit" size="large" loading={isSubmitting}>
          Register
        </AppButton>
      </Form>
    </AuthLayout>
  );
};
