import { CloudDownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Descriptions, Space, Typography, message } from "antd";
import { useState } from "react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { AppButton } from "../../components/common/AppButton";
import { AppLoader } from "../../components/common/AppLoader";
import { APP_CONFIG } from "../../constants/app.constants";
import { useAppUpdate } from "../../contexts/AppUpdateContext";

const { Paragraph, Text, Title } = Typography;

export const ApplicationUpdatePage = (): JSX.Element => {
  const {
    status,
    installedVersion,
    updateInfo,
    errorMessage,
    checkForUpdates,
    openDownload
  } = useAppUpdate();
  const [isOpeningDownload, setIsOpeningDownload] = useState(false);

  const handleUpdateNow = async (): Promise<void> => {
    setIsOpeningDownload(true);

    try {
      await openDownload();
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : "Unable to open the update download.";
      message.error(fallbackMessage);
    } finally {
      setIsOpeningDownload(false);
    }
  };

  const renderContent = (): JSX.Element => {
    if (status === "loading" || status === "idle") {
      return (
        <div className="application-update__state">
          <AppLoader label="Checking for updates" />
        </div>
      );
    }

    if (status === "error" || !updateInfo) {
      return (
        <div className="application-update__state">
          <Alert
            type="error"
            showIcon
            message="Unable to Check for Updates"
            description={errorMessage ?? "Please retry the version check before continuing."}
          />
          <AppButton
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => void checkForUpdates()}
          >
            Retry
          </AppButton>
        </div>
      );
    }

    const isUpdateRequired = updateInfo.updateAvailable;

    return (
      <div className="application-update__details">
        <Alert
          type={isUpdateRequired ? "warning" : "info"}
          showIcon
          message={isUpdateRequired ? "Update Required" : "Application Is Up to Date"}
          description={
            isUpdateRequired
              ? "Install the latest version before using SportsLedger."
              : "Your SportsLedger desktop application is ready to use."
          }
        />

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Current Version">
            {installedVersion ?? updateInfo.currentVersion}
          </Descriptions.Item>
          <Descriptions.Item label="Latest Version">{updateInfo.latestVersion}</Descriptions.Item>
          <Descriptions.Item label="Release Notes">
            <Paragraph className="application-update__notes">
              {updateInfo.releaseNotes}
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>

        <Space className="application-update__actions" size={12}>
          <AppButton
            type="primary"
            size="large"
            icon={<CloudDownloadOutlined />}
            loading={isOpeningDownload}
            onClick={() => void handleUpdateNow()}
          >
            Update Now
          </AppButton>
        </Space>
      </div>
    );
  };

  return (
    <AuthLayout
      title="Application Update"
      subtitle="Keep your desktop app aligned with the latest SportsLedger release."
      wide
    >
      <section className="application-update">
        <Text className="application-update__eyebrow">{APP_CONFIG.APP_NAME}</Text>
        <Title level={3}>New Update Available</Title>
        {renderContent()}
      </section>
    </AuthLayout>
  );
};
