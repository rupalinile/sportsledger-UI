import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined
} from "@ant-design/icons";
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
  Tabs,
  Tag,
  Typography,
  message,
  type TableProps
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { PageHeader } from "../../components/common/PageHeader";
import { playerExpenseService } from "../../services/playerExpenseService";
import { playerService } from "../../services/playerService";
import { teamService } from "../../services/teamService";
import type { Team } from "../../types/dashboard";
import type { Player } from "../../types/player";
import type {
  PlayerDeposit,
  PlayerExpenseSummary,
  PlayerExpenseSummaryRow
} from "../../types/playerExpense";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text, Title } = Typography;

const ALL_TEAMS_VALUE = -1;
const ALL_MONTHS_VALUE = "all";
const ALL_SELECTION_VALUE = 0;
const UNASSIGNED_TEAM_VALUE = -2;

type DepositFormValues = {
  playerId: number;
  depositDate: Dayjs;
  amount: number;
  notes?: string;
};

const formatCurrency = (value: number | null | undefined): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value ?? 0));

const formatShortDate = (date: string): string => dayjs(date).format("DD MMM");
const formatMonthLabel = (monthKey: string): string => dayjs(`${monthKey}-01`).format("MMMM YYYY");
const getMonthKey = (date: string): string => dayjs(date).format("YYYY-MM");

const getPlayerTeamValue = (player: Player): number =>
  player.team_id === ALL_SELECTION_VALUE ? ALL_SELECTION_VALUE : player.team_id || UNASSIGNED_TEAM_VALUE;

const getPlayerTeamLabel = (player: Player): string => {
  if (player.team_id === ALL_SELECTION_VALUE) {
    return "All Selection";
  }

  return player.team_name ?? "Unassigned";
};

export const PlayerExpenseManagementPage = (): JSX.Element => {
  const [summary, setSummary] = useState<PlayerExpenseSummary | null>(null);
  const [deposits, setDeposits] = useState<PlayerDeposit[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(ALL_TEAMS_VALUE);
  const [selectedDepositTeamId, setSelectedDepositTeamId] = useState<number>(ALL_TEAMS_VALUE);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDeposit, setIsSavingDeposit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<PlayerDeposit | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositForm] = Form.useForm<DepositFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const loadPageData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [summaryResponse, depositsResponse, playersResponse, teamsResponse] = await Promise.all([
        playerExpenseService.getSummary(),
        playerExpenseService.getDeposits(),
        playerService.getPlayers(),
        teamService.getTeams()
      ]);

      setSummary(summaryResponse.data);
      setDeposits(depositsResponse.data);
      setPlayers(playersResponse.data);
      setTeams(teamsResponse.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load player expense details."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const teamOptions = useMemo(
    () => [
      { label: "All Teams", value: ALL_TEAMS_VALUE },
      ...teams.map((team) => ({ label: team.teamName, value: team.id }))
    ],
    [teams]
  );

  const depositTeamOptions = useMemo(
    () => [
      { label: "All Teams", value: ALL_TEAMS_VALUE },
      { label: "All Selection", value: ALL_SELECTION_VALUE },
      ...teams.map((team) => ({ label: team.teamName, value: team.id }))
    ],
    [teams]
  );

  const playerTeamValueById = useMemo(
    () => new Map(players.map((player) => [player.id, getPlayerTeamValue(player)])),
    [players]
  );

  const selectedMonthKey = selectedMonth?.format("YYYY-MM") ?? null;

  const monthOptions = useMemo(() => {
    const availableMonths = new Set<string>();

    summary?.matches.forEach((match) => availableMonths.add(getMonthKey(match.match_date)));
    deposits.forEach((deposit) => availableMonths.add(getMonthKey(deposit.deposit_date)));

    return Array.from(availableMonths)
      .sort((first, second) => second.localeCompare(first))
      .map((monthKey) => ({
        label: formatMonthLabel(monthKey),
        value: monthKey
      }));
  }, [deposits, summary?.matches]);

  const filteredMatches = useMemo(() => {
    if (!selectedMonthKey) {
      return summary?.matches ?? [];
    }

    return (summary?.matches ?? []).filter((match) => getMonthKey(match.match_date) === selectedMonthKey);
  }, [selectedMonthKey, summary?.matches]);

  const filteredSummaryPlayers = useMemo(() => {
    const teamFilteredPlayers =
      selectedTeamId === ALL_TEAMS_VALUE
        ? summary?.players ?? []
        : (summary?.players ?? []).filter(
            (player) => playerTeamValueById.get(player.player_id) === selectedTeamId
          );

    const sortByPlayerName = (playersToSort: PlayerExpenseSummaryRow[]): PlayerExpenseSummaryRow[] =>
      [...playersToSort].sort((firstPlayer, secondPlayer) =>
        firstPlayer.player_name.trim().localeCompare(secondPlayer.player_name.trim(), undefined, {
          sensitivity: "base"
        })
      );

    if (!selectedMonthKey) {
      return sortByPlayerName(teamFilteredPlayers);
    }

    const matchIdsForMonth = new Set(filteredMatches.map((match) => match.match_id));
    const monthlyDepositsByPlayer = deposits.reduce((depositTotals, deposit) => {
      if (getMonthKey(deposit.deposit_date) !== selectedMonthKey) {
        return depositTotals;
      }

      depositTotals.set(
        deposit.player_id,
        (depositTotals.get(deposit.player_id) ?? 0) + Number(deposit.amount)
      );

      return depositTotals;
    }, new Map<number, number>());

    return teamFilteredPlayers
      .map((player) => {
        const matchExpenses = player.match_expenses.filter((matchExpense) =>
          matchIdsForMonth.has(matchExpense.match_id)
        );
        const totalDeposit = monthlyDepositsByPlayer.get(player.player_id) ?? 0;
        const totalMatchExpense = matchExpenses.reduce(
          (total, matchExpense) => total + Number(matchExpense.amount ?? 0),
          0
        );

        return {
          ...player,
          total_deposit: totalDeposit,
          total_match_expense: totalMatchExpense,
          remaining_balance: totalDeposit - totalMatchExpense,
          match_expenses: matchExpenses
        };
      })
      .filter((player) => player.total_deposit !== 0 || player.total_match_expense !== 0)
      .sort((firstPlayer, secondPlayer) =>
        firstPlayer.player_name.trim().localeCompare(secondPlayer.player_name.trim(), undefined, {
          sensitivity: "base"
        })
      );
  }, [
    deposits,
    filteredMatches,
    playerTeamValueById,
    selectedMonthKey,
    selectedTeamId,
    summary?.players
  ]);

  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      const matchesTeam =
        selectedTeamId === ALL_TEAMS_VALUE ||
        playerTeamValueById.get(deposit.player_id) === selectedTeamId;
      const matchesMonth = !selectedMonthKey || getMonthKey(deposit.deposit_date) === selectedMonthKey;

      return matchesTeam && matchesMonth;
    });
  }, [deposits, playerTeamValueById, selectedMonthKey, selectedTeamId]);

  const playerOptions = useMemo(() => {
    const playerDetailsById = new Map<number, Player>();

    players.forEach((player) => {
      playerDetailsById.set(player.id, player);
    });

    deposits.forEach((deposit) => {
      if (!playerDetailsById.has(deposit.player_id)) {
        playerDetailsById.set(deposit.player_id, {
          id: deposit.player_id,
          player_name: deposit.player_name,
          mobile_number: "",
          team_id: UNASSIGNED_TEAM_VALUE,
          team_name: "Unassigned",
          is_active: 1
        });
      }
    });

    const filteredPlayers = Array.from(playerDetailsById.values()).filter(
      (player) =>
        selectedDepositTeamId === ALL_TEAMS_VALUE ||
        getPlayerTeamValue(player) === selectedDepositTeamId
    );

    const playersByTeam = new Map<string, { value: number; label: string; searchLabel: string }[]>();

    filteredPlayers
      .sort((first, second) => {
        const teamComparison = getPlayerTeamLabel(first).localeCompare(getPlayerTeamLabel(second));

        return teamComparison || first.player_name.localeCompare(second.player_name);
      })
      .forEach((player) => {
        const teamLabel = getPlayerTeamLabel(player);
        const teamPlayers = playersByTeam.get(teamLabel) ?? [];

        teamPlayers.push({
          value: player.id,
          label: player.player_name,
          searchLabel: `${player.player_name} ${teamLabel}`
        });
        playersByTeam.set(teamLabel, teamPlayers);
      });

    return Array.from(playersByTeam.entries()).map(([label, options]) => ({
      label,
      options
    }));
  }, [deposits, players, selectedDepositTeamId]);

  const totalDeposited =
    selectedTeamId === ALL_TEAMS_VALUE && !selectedMonthKey
      ? summary?.summary.total_deposited ?? 0
      : filteredSummaryPlayers.reduce((total, player) => total + player.total_deposit, 0);
  const totalMatchExpense =
    selectedTeamId === ALL_TEAMS_VALUE && !selectedMonthKey
      ? summary?.summary.total_match_expense ?? 0
      : filteredSummaryPlayers.reduce((total, player) => total + player.total_match_expense, 0);
  const remainingBalance =
    selectedTeamId === ALL_TEAMS_VALUE && !selectedMonthKey
      ? summary?.summary.remaining_balance ?? totalDeposited - totalMatchExpense
      : filteredSummaryPlayers.reduce((total, player) => total + player.remaining_balance, 0);

  const openAddDepositModal = (): void => {
    setEditingDeposit(null);
    setSelectedDepositTeamId(selectedTeamId);
    depositForm.setFieldsValue({
      playerId: undefined,
      depositDate: dayjs(),
      amount: undefined,
      notes: ""
    });
    setIsDepositModalOpen(true);
  };

  const openEditDepositModal = (deposit: PlayerDeposit): void => {
    setEditingDeposit(deposit);
    const player = players.find((currentPlayer) => currentPlayer.id === deposit.player_id);

    setSelectedDepositTeamId(player ? getPlayerTeamValue(player) : ALL_TEAMS_VALUE);
    depositForm.setFieldsValue({
      playerId: deposit.player_id,
      depositDate: dayjs(deposit.deposit_date),
      amount: Number(deposit.amount),
      notes: deposit.notes ?? ""
    });
    setIsDepositModalOpen(true);
  };

  const closeDepositModal = (): void => {
    if (isSavingDeposit) {
      return;
    }

    setIsDepositModalOpen(false);
    setEditingDeposit(null);
    depositForm.resetFields();
  };

  const handleSaveDeposit = async (values: DepositFormValues): Promise<void> => {
    setIsSavingDeposit(true);

    try {
      const payload = {
        player_id: values.playerId,
        deposit_date: values.depositDate.format("YYYY-MM-DD"),
        amount: values.amount,
        notes: values.notes?.trim() ?? ""
      };

      if (editingDeposit) {
        await playerExpenseService.updateDeposit(editingDeposit.id, payload);
        messageApi.success("Deposit updated successfully");
      } else {
        await playerExpenseService.addDeposit(payload);
        messageApi.success("Deposit added successfully");
      }

      closeDepositModal();
      await loadPageData();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to save deposit."));
    } finally {
      setIsSavingDeposit(false);
    }
  };

  const handleDeleteDeposit = async (depositId: number): Promise<void> => {
    try {
      await playerExpenseService.deleteDeposit(depositId);
      messageApi.success("Deposit deleted successfully");
      await loadPageData();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to delete deposit."));
    }
  };

  const handleDepositTeamChange = (teamId: number): void => {
    const selectedPlayerId = depositForm.getFieldValue("playerId");
    const selectedPlayer = players.find((player) => player.id === selectedPlayerId);

    setSelectedDepositTeamId(teamId);

    if (
      selectedPlayer &&
      teamId !== ALL_TEAMS_VALUE &&
      getPlayerTeamValue(selectedPlayer) !== teamId
    ) {
      depositForm.setFieldValue("playerId", undefined);
    }
  };

  const expenseColumns: TableProps<PlayerExpenseSummaryRow>["columns"] = [
    {
      title: "Player Name",
      dataIndex: "player_name",
      key: "player_name",
      fixed: "left",
      width: 260,
      render: (playerName: string) => <Text strong>{playerName}</Text>
    },
    ...filteredMatches.map((match) => ({
      title: (
        <div className="player-expense-page__match-heading">
          <Text strong>{formatShortDate(match.match_date)}</Text>
          <Text type="secondary">vs {match.opponent_team_name}</Text>
        </div>
      ),
      key: String(match.match_id),
      align: "right" as const,
      width: 180,
      render: (_: unknown, player: PlayerExpenseSummaryRow) => {
        const expense = player.match_expenses.find(
          (matchExpense) => matchExpense.match_id === match.match_id
        );

        return expense?.amount ? (
          <Text className="player-expense-page__negative">-{formatCurrency(expense.amount)}</Text>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    })),
    {
      title: "Remaining Deposit",
      dataIndex: "remaining_balance",
      key: "remaining_balance",
      align: "right",
      fixed: "right",
      width: 190,
      render: (playerRemainingBalance: number) => (
        <Tag
          className={
            playerRemainingBalance < 0
              ? "player-expense-page__balance-tag player-expense-page__balance-tag--negative"
              : "player-expense-page__balance-tag"
          }
        >
          {formatCurrency(playerRemainingBalance)}
        </Tag>
      )
    }
  ];

  const depositColumns: TableProps<PlayerDeposit>["columns"] = [
    {
      title: "Player",
      dataIndex: "player_name",
      key: "player_name",
      render: (playerName: string) => <Text strong>{playerName}</Text>
    },
    {
      title: "Deposit Date",
      dataIndex: "deposit_date",
      key: "deposit_date",
      render: (depositDate: string) => formatShortDate(depositDate)
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number) => (
        <Text className="player-expense-page__positive">{formatCurrency(amount)}</Text>
      )
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string | null) => notes || "-"
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, deposit) => (
        <Space>
          <Button
            aria-label="Edit deposit"
            icon={<EditOutlined />}
            type="text"
            onClick={() => openEditDepositModal(deposit)}
          />
          <Popconfirm
            okText="Delete"
            title="Delete this deposit?"
            onConfirm={() => void handleDeleteDeposit(deposit.id)}
          >
            <Button aria-label="Delete deposit" danger icon={<DeleteOutlined />} type="text" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <section className="management-page player-expense-page">
      {contextHolder}
      <div className="management-page__heading">
        <PageHeader
          title="Player Expense Management"
          subtitle="Track player deposits, match expenses and remaining balances"
        />
        <Space>
          <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => void loadPageData()}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDepositModal}>
            Add Deposit
          </Button>
        </Space>
      </div>

      {errorMessage ? (
        <Alert
          action={
            <Button size="small" onClick={() => void loadPageData()}>
              Try Again
            </Button>
          }
          className="dashboard-alert"
          message={errorMessage}
          showIcon
          type="error"
        />
      ) : null}

      <div className="player-expense-page__stats">
        <div className="player-expense-page__stat">
          <Text type="secondary">Total Deposited</Text>
          <strong>{formatCurrency(totalDeposited)}</strong>
        </div>
        <div className="player-expense-page__stat">
          <Text type="secondary">Total Match Expense</Text>
          <strong className="player-expense-page__negative">
            {formatCurrency(totalMatchExpense)}
          </strong>
        </div>
        <div className="player-expense-page__stat">
          <Text type="secondary">Remaining Balance</Text>
          <strong
            className={
              remainingBalance < 0
                ? "player-expense-page__negative"
                : "player-expense-page__positive"
            }
          >
            {formatCurrency(remainingBalance)}
          </strong>
        </div>
      </div>

      <div className="management-page__panel player-expense-page__panel">
        <div className="player-expense-page__toolbar">
          <Title level={4} className="player-expense-page__section-title">
            Player Expenses
          </Title>
          <div className="player-expense-page__filters">
            <Select
              className="player-expense-page__filter"
              options={[{ label: "All Months", value: ALL_MONTHS_VALUE }, ...monthOptions]}
              value={selectedMonthKey ?? ALL_MONTHS_VALUE}
              onChange={(monthKey) =>
                setSelectedMonth(monthKey === ALL_MONTHS_VALUE ? null : dayjs(`${monthKey}-01`))
              }
            />
            <Select
              className="player-expense-page__filter"
              options={teamOptions}
              value={selectedTeamId}
              onChange={setSelectedTeamId}
            />
          </div>
        </div>
        <Tabs
          items={[
            {
              key: "summary",
              label: "Expense Summary",
              children: (
                <Table<PlayerExpenseSummaryRow>
                  columns={expenseColumns}
                  dataSource={filteredSummaryPlayers}
                  loading={isLoading}
                  locale={{
                    emptyText: (
                      <Empty
                        description="No expense summary found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                  pagination={false}
                  rowKey="player_id"
                  scroll={{ x: "max-content" }}
                />
              )
            },
            {
              key: "deposits",
              label: "Deposit History",
              children: (
                <Table<PlayerDeposit>
                  columns={depositColumns}
                  dataSource={filteredDeposits}
                  loading={isLoading}
                  locale={{
                    emptyText: (
                      <Empty description="No deposits found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )
                  }}
                  pagination={false}
                  rowKey="id"
                />
              )
            }
          ]}
        />
      </div>

      <Modal
        confirmLoading={isSavingDeposit}
        okText={editingDeposit ? "Update Deposit" : "Save Deposit"}
        open={isDepositModalOpen}
        title={editingDeposit ? "Edit Player Deposit" : "Add Player Deposit"}
        onCancel={closeDepositModal}
        onOk={() => depositForm.submit()}
      >
        <Form<DepositFormValues>
          form={depositForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSaveDeposit}
        >
          <Form.Item label="Team">
            <Select
              className="player-expense-page__full-control"
              options={depositTeamOptions}
              value={selectedDepositTeamId}
              onChange={handleDepositTeamChange}
            />
          </Form.Item>
          <Form.Item
            label="Player"
            name="playerId"
            rules={[{ required: true, message: "Please select a player" }]}
          >
            <Select
              showSearch
              optionFilterProp="searchLabel"
              options={playerOptions}
              placeholder="Select player"
            />
          </Form.Item>
          <Form.Item
            label="Deposit Date"
            name="depositDate"
            rules={[{ required: true, message: "Please select a deposit date" }]}
          >
            <DatePicker className="player-expense-page__full-control" format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item
            label="Deposit Amount"
            name="amount"
            rules={[{ required: true, message: "Please enter deposit amount" }]}
          >
            <InputNumber
              className="player-expense-page__full-control"
              min={1}
              prefix="₹"
              placeholder="Enter amount"
            />
          </Form.Item>
          <Form.Item
            label="Notes"
            name="notes"
            rules={[{ max: 250, message: "Notes must be 250 characters or fewer" }]}
          >
            <Input.TextArea maxLength={250} placeholder="Optional notes" rows={4} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};
