import { PlusOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Typography } from "antd";
import { PageHeader } from "../../components/common/PageHeader";

const { Text } = Typography;

interface ManagementPageProps {
  title: string;
  subtitle: string;
}

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name"
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => <Tag color="processing">{status}</Tag>
  },
  {
    title: "Updated",
    dataIndex: "updated",
    key: "updated"
  }
];

const data = [
  {
    key: "1",
    name: "Sample record",
    status: "Ready",
    updated: "Today"
  }
];

export const ManagementPage = ({ title, subtitle }: ManagementPageProps): JSX.Element => (
  <section className="management-page">
    <div className="management-page__heading">
      <PageHeader title={title} subtitle={subtitle} />
      <Button type="primary" icon={<PlusOutlined />}>
        Add New
      </Button>
    </div>
    <div className="management-page__panel">
      <Text type="secondary">
        This page is ready for the {title.toLowerCase()} workflow.
      </Text>
      <Table columns={columns} dataSource={data} pagination={false} />
    </div>
  </section>
);
