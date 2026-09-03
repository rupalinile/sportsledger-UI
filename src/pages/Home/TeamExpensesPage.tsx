import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  type TableProps
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { PageHeader } from "../../components/common/PageHeader";
import { teamExpenseService } from "../../services/teamExpenseService";
import { teamService } from "../../services/teamService";
import type { Team } from "../../types/dashboard";
import type {
  TeamExpenseApiCategory,
  TeamExpenseSummary,
  TeamExpenseTransaction,
  TeamExpenseTransactionPayload
} from "../../types/teamExpense";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text, Title } = Typography;
const ALL_TEAMS_VALUE = -1;

type TeamTransactionFormValues = {
  teamId: number;
  category: TeamExpenseTransactionPayload["category"];
  date: Dayjs;
  description: string;
  amount: number;
};

const formatCurrency = (value: number | null | undefined): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value ?? 0));

const formatLongDate = (date: string): string => dayjs(date).format("DD MMM YYYY");

const getTransactionDate = (transaction: TeamExpenseTransaction): string =>
  transaction.transactionDate ?? transaction.transaction_date ?? "";

const getTransactionTeamId = (transaction: TeamExpenseTransaction): number =>
  transaction.teamId ?? transaction.team_id ?? ALL_TEAMS_VALUE;

const isExpenseCategory = (category: TeamExpenseApiCategory): boolean => category === "EXPENSE";

const getDisplayCategory = (category: TeamExpenseApiCategory): "Expense" | "Deposited" =>
  isExpenseCategory(category) ? "Expense" : "Deposited";

const getPayloadCategory = (category: TeamExpenseApiCategory): "EXPENSE" | "DEPOSITED" =>
  isExpenseCategory(category) ? "EXPENSE" : "DEPOSITED";

const getSummaryValue = (
  summary: TeamExpenseSummary | null,
  keys: Array<keyof TeamExpenseSummary>
): number | null => {
  if (!summary) {
    return null;
  }

  const summaryTotals = summary.summary ?? summary;

  for (const key of keys) {
    const value = summaryTotals[key as keyof typeof summaryTotals];

    if (typeof value === "number") {
      return value;
    }
  }

  return null;
};

export const TeamExpensesPage = (): JSX.Element => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [summaries, setSummaries] = useState<TeamExpenseSummary[]>([]);
  const [transactions, setTransactions] = useState<TeamExpenseTransaction[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(ALL_TEAMS_VALUE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TeamExpenseTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<TeamTransactionFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const loadPageData = useCallback(async (teamId: number): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const teamsResponse = await teamService.getTeams();
      const loadedTeams = teamsResponse.data;

      setTeams(loadedTeams);

      const teamIds =
        teamId === ALL_TEAMS_VALUE ? loadedTeams.map((team) => team.id) : [teamId];

      const [summaryResponses, transactionResponses] = await Promise.all([
        Promise.all(teamIds.map((currentTeamId) => teamExpenseService.getSummary(currentTeamId))),
        Promise.all(
          teamIds.map((currentTeamId) => teamExpenseService.getTransactions(currentTeamId))
        )
      ]);

      setSummaries(summaryResponses.map((response) => response.data));
      setTransactions(transactionResponses.flatMap((response) => response.data));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load team expense details."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData(selectedTeamId);
  }, [loadPageData, selectedTeamId]);

  const teamNameById = useMemo(
    () => new Map(teams.map((team) => [team.id, team.teamName])),
    [teams]
  );

  const teamOptions = useMemo(
    () => [
      { label: "All Teams", value: ALL_TEAMS_VALUE },
      ...teams.map((team) => ({ label: team.teamName, value: team.id }))
    ],
    [teams]
  );

  const transactionTeamOptions = useMemo(
    () => teams.map((team) => ({ label: team.teamName, value: team.id })),
    [teams]
  );

  const calculatedOtherAmount = useMemo(
    () =>
      transactions.reduce((total, transaction) => {
        const signedAmount = isExpenseCategory(transaction.category)
          ? -transaction.amount
          : transaction.amount;

        return total + signedAmount;
      }, 0),
    [transactions]
  );

  const totalDeposited = summaries.reduce(
    (total, currentSummary) =>
      total +
      (getSummaryValue(currentSummary, [
        "totalDepositedAmount",
        "totalDeposited",
        "total_deposited_amount",
        "total_deposited"
      ]) ?? 0),
    0
  );
  const summaryOtherValues = summaries
    .map((currentSummary) => getSummaryValue(currentSummary, ["otherAmount", "other_amount"]))
    .filter((value): value is number => value !== null);
  const summaryOtherAmount = summaryOtherValues.reduce((total, value) => total + value, 0);
  const otherAmount = summaryOtherValues.length > 0 ? summaryOtherAmount : calculatedOtherAmount;
  const summaryBalanceValues = summaries
    .map((currentSummary) =>
      getSummaryValue(currentSummary, ["totalTeamBalance", "total_team_balance"])
    )
    .filter((value): value is number => value !== null);
  const summaryTeamBalance = summaryBalanceValues.reduce((total, value) => total + value, 0);
  const totalTeamBalance =
    summaryBalanceValues.length > 0 ? summaryTeamBalance : totalDeposited + otherAmount;

  const selectedTeamLabel =
    selectedTeamId === ALL_TEAMS_VALUE
      ? "All teams"
      : teamNameById.get(selectedTeamId) ?? "Selected team";

  const openAddModal = (): void => {
    setEditingTransaction(null);
    form.setFieldsValue({
      teamId: selectedTeamId === ALL_TEAMS_VALUE ? undefined : selectedTeamId,
      category: "DEPOSITED",
      date: dayjs(),
      description: "",
      amount: undefined
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (transaction: TeamExpenseTransaction): Promise<void> => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
    form.setFieldsValue({
      teamId: getTransactionTeamId(transaction),
      category: getPayloadCategory(transaction.category),
      date: dayjs(getTransactionDate(transaction)),
      description: transaction.description,
      amount: Number(transaction.amount)
    });

    setIsDetailLoading(true);
    try {
      const response = await teamExpenseService.getTransaction(transaction.id);
      const transactionDetails = response.data;

      setEditingTransaction(transactionDetails);
      form.setFieldsValue({
        teamId: getTransactionTeamId(transactionDetails),
        category: getPayloadCategory(transactionDetails.category),
        date: dayjs(getTransactionDate(transactionDetails)),
        description: transactionDetails.description,
        amount: Number(transactionDetails.amount)
      });
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to load transaction details."));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = (): void => {
    if (isSaving || isDetailLoading) {
      return;
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
    form.resetFields();
  };

  const handleSaveTransaction = async (values: TeamTransactionFormValues): Promise<void> => {
    setIsSaving(true);

    try {
      const payload: TeamExpenseTransactionPayload = {
        teamId: values.teamId,
        category: values.category,
        transactionDate: values.date.format("YYYY-MM-DD"),
        amount: values.amount,
        description: values.description.trim()
      };

      if (editingTransaction) {
        await teamExpenseService.updateTransaction(editingTransaction.id, payload);
        messageApi.success("Transaction updated successfully");
      } else {
        await teamExpenseService.addTransaction(payload);
        messageApi.success("Transaction added successfully");
      }

      closeModal();
      await loadPageData(selectedTeamId);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to save transaction."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number): Promise<void> => {
    try {
      await teamExpenseService.deleteTransaction(transactionId);
      messageApi.success("Transaction deleted successfully");
      await loadPageData(selectedTeamId);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to delete transaction."));
    }
  };

  const columns: TableProps<TeamExpenseTransaction>["columns"] = [
    {
      title: "Team",
      key: "team",
      render: (_, transaction) =>
        transaction.teamName ??
        transaction.team_name ??
        teamNameById.get(getTransactionTeamId(transaction)) ??
        "-"
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: TeamExpenseApiCategory) => {
        const displayCategory = getDisplayCategory(category);

        return (
          <Tag
            className={`team-expenses-page__tag team-expenses-page__tag--${displayCategory.toLowerCase()}`}
          >
            {displayCategory}
          </Tag>
        );
      }
    },
    {
      title: "Date",
      key: "transactionDate",
      render: (_, transaction) => formatLongDate(getTransactionDate(transaction))
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number, transaction) => (
        <Text
          className={
            isExpenseCategory(transaction.category)
              ? "team-expenses-page__negative"
              : "team-expenses-page__positive"
          }
          strong
        >
          {isExpenseCategory(transaction.category) ? "-" : "+"}
          {formatCurrency(amount)}
        </Text>
      )
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description"
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, transaction) => (
        <Space>
          <Button
            aria-label="Edit transaction"
            icon={<EditOutlined />}
            type="text"
            onClick={() => void openEditModal(transaction)}
          />
          <Popconfirm
            okText="Delete"
            title="Delete this transaction?"
            onConfirm={() => void handleDeleteTransaction(transaction.id)}
          >
            <Button aria-label="Delete transaction" danger icon={<DeleteOutlined />} type="text" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <section className="management-page team-expenses-page">
      {contextHolder}
      <div className="management-page__heading">
        <PageHeader
          title="Team Expenses Management"
          subtitle="Manage team income, expenses and overall balance"
        />
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={() => void loadPageData(selectedTeamId)}
          >
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Add Transaction
          </Button>
        </Space>
      </div>

      {errorMessage ? (
        <Alert
          action={
            <Button size="small" onClick={() => void loadPageData(selectedTeamId)}>
              Try Again
            </Button>
          }
          className="dashboard-alert"
          message={errorMessage}
          showIcon
          type="error"
        />
      ) : null}

      <div className="team-expenses-page__stats">
        <div className="team-expenses-page__stat">
          <Text type="secondary">Total Deposited Amount</Text>
          <strong>{formatCurrency(totalDeposited)}</strong>
          <Text type="secondary">{selectedTeamLabel} player deposits</Text>
        </div>
        <div className="team-expenses-page__stat">
          <Text type="secondary">Other Amount</Text>
          <strong
            className={
              otherAmount < 0 ? "team-expenses-page__negative" : "team-expenses-page__positive"
            }
          >
            {formatCurrency(otherAmount)}
          </strong>
          <Text type="secondary">{selectedTeamLabel} income - expenses</Text>
        </div>
        <div className="team-expenses-page__stat team-expenses-page__stat--balance">
          <Text type="secondary">Total Team Balance</Text>
          <strong className={totalTeamBalance < 0 ? "team-expenses-page__negative" : undefined}>
            {formatCurrency(totalTeamBalance)}
          </strong>
          <Text type="secondary">Deposits + Other Amount</Text>
        </div>
      </div>

      <div className="management-page__panel team-expenses-page__panel">
        <div className="team-expenses-page__toolbar">
          <Title level={4} className="team-expenses-page__section-title">
            Other Transactions
          </Title>
          <Select
            className="team-expenses-page__filter"
            options={teamOptions}
            value={selectedTeamId}
            onChange={setSelectedTeamId}
          />
        </div>
        <Table<TeamExpenseTransaction>
          columns={columns}
          dataSource={transactions}
          loading={isLoading}
          locale={{
            emptyText: (
              <Empty description="No transactions found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )
          }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey="id"
        />
      </div>

      <Modal
        confirmLoading={isSaving || isDetailLoading}
        okText={editingTransaction ? "Update Transaction" : "Save Transaction"}
        open={isModalOpen}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form<TeamTransactionFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSaveTransaction}
        >
          <Form.Item
            label="Team"
            name="teamId"
            rules={[{ required: true, message: "Please select a team" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={transactionTeamOptions}
              placeholder="Select team"
            />
          </Form.Item>
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              options={[
                { label: "Deposited", value: "DEPOSITED" },
                { label: "Expense", value: "EXPENSE" }
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker className="team-expenses-page__full-control" format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber
              className="team-expenses-page__full-control"
              min={1}
              prefix="₹"
              placeholder="Enter amount"
            />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, whitespace: true, message: "Please enter a description" },
              { max: 120, message: "Description must be 120 characters or fewer" }
            ]}
          >
            <Input placeholder="Tournament winnings, fees, equipment..." />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};
