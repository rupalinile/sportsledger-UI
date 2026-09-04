import { useCallback, useEffect, useMemo, useRef, useState, type Key } from "react";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  TimePicker,
  Typography,
  message,
  type TableProps
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { PageHeader } from "../../components/common/PageHeader";
import { APP_CONFIG } from "../../constants/app.constants";
import { ROUTES } from "../../constants/routes";
import { dashboardService } from "../../services/dashboardService";
import { matchService } from "../../services/matchService";
import { playerExpenseService } from "../../services/playerExpenseService";
import { playerService } from "../../services/playerService";
import { teamService } from "../../services/teamService";
import type { DashboardSummary, Team } from "../../types/dashboard";
import type { Match, SettledMatch } from "../../types/match";
import type { Player } from "../../types/player";
import type {
  PlayerDeposit,
  PlayerExpenseSummary
} from "../../types/playerExpense";
import type { AppRouteProps } from "../../types/navigation";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text, Title } = Typography;
const ALL_SELECTION_TEAM_ID = 0;

type TeamFormValues = {
  teamName: string;
};

type ReleaseSlotsFormValues = {
  groundName: string;
  month: Dayjs;
  days: number[];
  startTime: Dayjs;
  endTime: Dayjs;
  myTeamId: number;
};

type ReleasedSlotsSummary = {
  groundName: string;
  month: Dayjs;
  days: number[];
  startTime: Dayjs;
  endTime: Dayjs;
  myTeamId: number;
};

type PlayerExpenseReportRow = {
  player_id: number;
  player_name: string;
  last_deposit_amount: number;
  remaining_balance: number;
  matches: PlayerExpenseReportMatch[];
};

type PlayerExpenseReportMatch = {
  match_id: number;
  match_date: string;
  amount: number;
  opponent_team_name: string;
};

const emptySummary: DashboardSummary = {
  team_wise_summary: [],
  overall_summary: {
    total_team_balance: 0,
    total_squad_count: 0,
    total_matches_scheduled: 0,
    total_scheduled_matches_amount: 0,
    scheduled_paid_matches_amount: 0,
    scheduled_pending_matches_amount: 0
  }
};

const releaseDayOptions = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 }
];

const quickAccessItems = [
  {
    icon: <CalendarOutlined />,
    title: "Matches Management",
    description: "Schedule, manage and complete your cricket matches",
    route: ROUTES.MATCHES
  },
  {
    icon: <TeamOutlined />,
    title: "Squad Management",
    description: "Add, edit and manage your team players",
    route: ROUTES.SQUAD
  },
  {
    icon: <UserOutlined />,
    title: "Player Deposit Management",
    description: "Track player deposits, match expenses and remaining balances",
    route: ROUTES.PLAYER_EXPENSES
  },
  {
    icon: <WalletOutlined />,
    title: "Team Expense Management",
    description: "Manage other team income, expenses and total balance",
    route: ROUTES.TEAM_EXPENSES
  }
] as const;

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

const formatShortDate = (date: string): string => dayjs(date).format("DD MMM");
const getMonthKey = (date: string): string => dayjs(date).format("YYYY-MM");

export const HomePage = ({ onNavigate }: AppRouteProps): JSX.Element => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [allSelectionPlayers, setAllSelectionPlayers] = useState<Player[]>([]);
  const [playerExpenseSummary, setPlayerExpenseSummary] = useState<PlayerExpenseSummary | null>(null);
  const [playerDeposits, setPlayerDeposits] = useState<PlayerDeposit[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
  const [settledMatches, setSettledMatches] = useState<SettledMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState<Dayjs>(dayjs());
  const [expandedReportPlayerIds, setExpandedReportPlayerIds] = useState<Key[]>([]);
  const [isReleaseSlotsModalOpen, setIsReleaseSlotsModalOpen] = useState(false);
  const [releasedSlotsSummary, setReleasedSlotsSummary] = useState<ReleasedSlotsSummary | null>(
    null
  );
  const [form] = Form.useForm<TeamFormValues>();
  const [releaseSlotsForm] = Form.useForm<ReleaseSlotsFormValues>();
  const releaseSummaryTitleRef = useRef<HTMLElement | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const loadDashboard = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [
        teamsResponse,
        summaryResponse,
        allSelectionPlayersResponse,
        playerExpenseSummaryResponse,
        playerDepositsResponse,
        scheduledMatchesResponse,
        settledMatchesResponse
      ] = await Promise.all([
        teamService.getTeams(),
        dashboardService.getSummary(),
        playerService.getPlayers({ teamId: ALL_SELECTION_TEAM_ID }),
        playerExpenseService.getSummary(),
        playerExpenseService.getDeposits(),
        matchService.getScheduledMatches(),
        matchService.getSettledMatches()
      ]);

      setTeams(teamsResponse.data);
      setSummary(summaryResponse.data);
      setAllSelectionPlayers(allSelectionPlayersResponse.data);
      setPlayerExpenseSummary(playerExpenseSummaryResponse.data);
      setPlayerDeposits(playerDepositsResponse.data);
      setScheduledMatches(scheduledMatchesResponse.data);
      setSettledMatches(settledMatchesResponse.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load dashboard details."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (releasedSlotsSummary) {
      releaseSummaryTitleRef.current?.focus();
    }
  }, [releasedSlotsSummary]);

  const teamOptions = useMemo(
    () => teams.map((team) => ({ label: team.teamName, value: team.id })),
    [teams]
  );

  const allMatches = useMemo<Match[]>(() => [...scheduledMatches, ...settledMatches], [
    scheduledMatches,
    settledMatches
  ]);

  const summaryCards = useMemo(
    () => [
      {
        icon: <WalletOutlined />,
        label: "Total Team Balance",
        value: formatCurrency(summary.overall_summary.total_team_balance),
        helpText: "Player deposits + other team funds"
      },
      {
        icon: <TeamOutlined />,
        label: "Total Squad Count",
        value: formatNumber(summary.overall_summary.total_squad_count),
        helpText: "Active squad players"
      },
      {
        icon: <CalendarOutlined />,
        label: "Total Matches Scheduled",
        value: formatNumber(summary.overall_summary.total_matches_scheduled),
        helpText: "Upcoming scheduled matches"
      },
      {
        icon: <WalletOutlined />,
        label: "Scheduled Match Amount",
        value: formatCurrency(summary.overall_summary.total_scheduled_matches_amount),
        helpText: "Overall scheduled match value"
      }
    ],
    [summary]
  );

  const paidScheduledAmountCards = useMemo(
    () => [
      {
        key: "overall",
        label: "Overall",
        amount: summary.overall_summary.scheduled_paid_matches_amount,
        matches: summary.overall_summary.total_matches_scheduled,
        isOverall: true
      },
      ...summary.team_wise_summary
        .filter((teamSummary) => teamSummary.team_id !== ALL_SELECTION_TEAM_ID)
        .map((teamSummary) => ({
          key: String(teamSummary.team_id),
          label: teamSummary.team_name,
          amount: teamSummary.scheduled_paid_matches_amount,
          matches: teamSummary.total_matches_scheduled,
          isOverall: false
        }))
    ],
    [summary]
  );

  const detailCards = useMemo(
    () => {
      const allSelectionPlayerIds = new Set(
        allSelectionPlayers.map((player) => player.id)
      );
      const allSelectionBalance =
        playerExpenseSummary?.players
          .filter((player) => allSelectionPlayerIds.has(player.player_id))
          .reduce((total, player) => total + player.remaining_balance, 0) ?? 0;
      const allSelectionMatches = scheduledMatches.filter(
        (match) => match.my_team_id === ALL_SELECTION_TEAM_ID
      ).length;

      return [
        {
          key: "all-players",
          icon: <UserOutlined />,
          label: "Common Team Player",
          title: "All Players",
          balance: allSelectionBalance,
          squad: allSelectionPlayers.length,
          matches: allSelectionMatches,
          isOverall: true
        },
        ...summary.team_wise_summary
          .filter((teamSummary) => teamSummary.team_id !== ALL_SELECTION_TEAM_ID)
          .map((teamSummary) => ({
            key: String(teamSummary.team_id),
            icon: <TeamOutlined />,
            label: "Team",
            title: teamSummary.team_name,
            balance: teamSummary.total_team_balance,
            squad: teamSummary.total_squad_count,
            matches: teamSummary.total_matches_scheduled,
            scheduledAmount: teamSummary.total_scheduled_matches_amount,
            isOverall: false
          }))
      ];
    },
    [allSelectionPlayers, playerExpenseSummary?.players, scheduledMatches, summary.team_wise_summary]
  );

  const reportMonthKey = reportMonth.format("YYYY-MM");

  const playerExpenseReportRows = useMemo<PlayerExpenseReportRow[]>(() => {
    const reportMatches = (playerExpenseSummary?.matches ?? []).filter(
      (match) => getMonthKey(match.match_date) === reportMonthKey
    );
    const reportMatchById = new Map(reportMatches.map((match) => [match.match_id, match]));
    const reportMatchIds = new Set(reportMatches.map((match) => match.match_id));

    const depositsByPlayer = playerDeposits.reduce((playerDepositMap, deposit) => {
      if (getMonthKey(deposit.deposit_date) !== reportMonthKey) {
        return playerDepositMap;
      }

      const deposits = playerDepositMap.get(deposit.player_id) ?? [];
      deposits.push(deposit);
      playerDepositMap.set(deposit.player_id, deposits);

      return playerDepositMap;
    }, new Map<number, PlayerDeposit[]>());

    return (playerExpenseSummary?.players ?? [])
      .map((player) => {
        const monthlyDeposits = depositsByPlayer.get(player.player_id) ?? [];
        const lastDeposit = monthlyDeposits
          .slice()
          .sort((first, second) => {
            const dateComparison =
              dayjs(second.deposit_date).valueOf() - dayjs(first.deposit_date).valueOf();

            return dateComparison || second.id - first.id;
          })[0];
        const totalDeposit = monthlyDeposits.reduce(
          (total, deposit) => total + Number(deposit.amount ?? 0),
          0
        );
        const matches = player.match_expenses
          .filter(
            (matchExpense) =>
              reportMatchIds.has(matchExpense.match_id) && Number(matchExpense.amount ?? 0) !== 0
          )
          .map((matchExpense) => {
            const match = reportMatchById.get(matchExpense.match_id);

            return {
              match_id: matchExpense.match_id,
              match_date: match?.match_date ?? "",
              amount: Number(matchExpense.amount ?? 0),
              opponent_team_name: match?.opponent_team_name ?? "-"
            };
          })
          .sort(
            (first, second) =>
              dayjs(first.match_date).valueOf() - dayjs(second.match_date).valueOf()
          );
        const totalMatchExpense = matches.reduce((total, match) => total + match.amount, 0);

        return {
          player_id: player.player_id,
          player_name: player.player_name,
          last_deposit_amount: Number(lastDeposit?.amount ?? 0),
          remaining_balance: totalDeposit - totalMatchExpense,
          matches
        };
      })
      .sort((first, second) => first.player_name.localeCompare(second.player_name));
  }, [playerDeposits, playerExpenseSummary?.matches, playerExpenseSummary?.players, reportMonthKey]);

  const releasedSlotItems = useMemo(() => {
    if (!releasedSlotsSummary) {
      return [];
    }

    const daysInMonth = releasedSlotsSummary.month.daysInMonth();

    return Array.from({ length: daysInMonth }, (_, index) =>
      releasedSlotsSummary.month.date(index + 1)
    )
      .filter((date) => releasedSlotsSummary.days.includes(date.day()))
      .map((date) => {
        const isBooked = allMatches.some(
          (match) =>
            match.my_team_id === releasedSlotsSummary.myTeamId &&
            dayjs(match.match_date).isSame(date, "day")
        );

        return {
          date,
          status: isBooked ? "Booked" : "Available"
        };
      });
  }, [allMatches, releasedSlotsSummary]);

  const openAddTeamModal = (): void => {
    setEditingTeam(null);
    form.resetFields();
    setIsTeamModalOpen(true);
  };

  const openEditTeamModal = (team: Team): void => {
    setEditingTeam(team);
    form.setFieldsValue({ teamName: team.teamName });
    setIsTeamModalOpen(true);
  };

  const closeTeamModal = (): void => {
    if (isSaving) {
      return;
    }

    setIsTeamModalOpen(false);
    setEditingTeam(null);
    form.resetFields();
  };

  const handleSaveTeam = async (values: TeamFormValues): Promise<void> => {
    const teamName = values.teamName.trim();

    if (!teamName) {
      return;
    }

    setIsSaving(true);

    try {
      if (editingTeam) {
        await teamService.updateTeam(editingTeam.id, { teamName });
        messageApi.success("Team updated successfully");
      } else {
        await teamService.addTeam({ teamName });
        messageApi.success("Team created successfully");
      }

      setIsTeamModalOpen(false);
      setEditingTeam(null);
      form.resetFields();
      await loadDashboard();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to save team."));
    } finally {
      setIsSaving(false);
    }
  };

  const openReleaseSlotsModal = (): void => {
    const defaultTeamId = teams.length === 1 ? teams[0].id : teamOptions[0]?.value;

    releaseSlotsForm.setFieldsValue({
      groundName: "",
      month: dayjs(),
      days: [6, 0],
      startTime: dayjs("07:00:00", "HH:mm:ss"),
      endTime: dayjs("10:00:00", "HH:mm:ss"),
      myTeamId: defaultTeamId
    });
    setReleasedSlotsSummary(null);
    setIsReleaseSlotsModalOpen(true);
  };

  const closeReleaseSlotsModal = (): void => {
    setIsReleaseSlotsModalOpen(false);
    setReleasedSlotsSummary(null);
    releaseSlotsForm.resetFields();
  };

  const handleReleaseSlots = (values: ReleaseSlotsFormValues): void => {
    if (values.endTime.isBefore(values.startTime) || values.endTime.isSame(values.startTime)) {
      messageApi.error("End time must be after start time.");
      return;
    }

    setReleasedSlotsSummary({
      groundName: values.groundName.trim(),
      month: values.month,
      days: values.days,
      startTime: values.startTime,
      endTime: values.endTime,
      myTeamId: values.myTeamId
    });
  };

  const toggleReportPlayer = (playerId: number): void => {
    setExpandedReportPlayerIds((currentPlayerIds) =>
      currentPlayerIds.includes(playerId)
        ? currentPlayerIds.filter((currentPlayerId) => currentPlayerId !== playerId)
        : [...currentPlayerIds, playerId]
    );
  };

  const reportColumns: TableProps<PlayerExpenseReportRow>["columns"] = [
    {
      title: "Player Name",
      dataIndex: "player_name",
      key: "player_name",
      align: "center",
      render: (playerName: string) => <Text strong>{playerName}</Text>
    },
    {
      title: "Last Deposit Amount",
      dataIndex: "last_deposit_amount",
      key: "last_deposit_amount",
      align: "center",
      render: (amount: number) => (
        <Text className="player-expense-page__positive">{formatCurrency(amount)}</Text>
      )
    },
    {
      title: "Remaining Balance",
      dataIndex: "remaining_balance",
      key: "remaining_balance",
      align: "center",
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

  const reportMatchColumns: TableProps<PlayerExpenseReportMatch>["columns"] = [
    {
      title: "Date",
      dataIndex: "match_date",
      key: "match_date",
      align: "center",
      render: (matchDate: string) => (matchDate ? formatShortDate(matchDate) : "-")
    },
    {
      title: "Match Fees",
      dataIndex: "amount",
      key: "amount",
      align: "center",
      render: (amount: number) => (
        <Text className="player-expense-page__negative">-{formatCurrency(amount)}</Text>
      )
    },
    {
      title: "Opponent Name",
      dataIndex: "opponent_team_name",
      key: "opponent_team_name",
      align: "center"
    }
  ];

  return (
    <section className="dashboard-page">
      {contextHolder}
      <div className="dashboard-page__heading">
        <PageHeader title="Dashboard" subtitle={`Welcome to ${APP_CONFIG.APP_NAME}`} />
        <Space>
          <Button icon={<ReloadOutlined />} loading={isLoading} size="large" onClick={loadDashboard}>
            Refresh
          </Button>
          <Button
            className="player-expense-page__report-button"
            icon={<FileTextOutlined />}
            size="large"
            onClick={() => setIsReportModalOpen(true)}
          >
            View Player Reports
          </Button>
          <Button
            className="matches-page__release-button"
            icon={<CalendarOutlined />}
            size="large"
            onClick={openReleaseSlotsModal}
          >
            Release slots
          </Button>
        </Space>
      </div>

      {errorMessage ? (
        <Alert
          action={
            <Button size="small" onClick={loadDashboard}>
              Try Again
            </Button>
          }
          className="dashboard-alert"
          message={errorMessage}
          showIcon
          type="error"
        />
      ) : null}

      <Spin spinning={isLoading}>
        <article className="dashboard-team-list">
          <div className="dashboard-team-list__header">
            <div>
              <Text type="secondary">Teams List Name</Text>
              <Title level={3}>Teams</Title>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddTeamModal}>
              Add New Team
            </Button>
          </div>

          {teams.length > 0 ? (
            <div className="dashboard-team-list__items">
              {teams.map((team) => (
                <div className="dashboard-team-list__item" key={team.id}>
                  <Text strong>{team.teamName}</Text>
                  <Button
                    aria-label={`Edit ${team.teamName}`}
                    icon={<EditOutlined />}
                    type="text"
                    onClick={() => openEditTeamModal(team)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No teams found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </article>

        <div className="dashboard-stats">
          {summaryCards.map((card) => (
            <article className="dashboard-stat" key={card.label}>
              <Space align="start" size={14}>
                <span className="dashboard-stat__icon">{card.icon}</span>
                <div>
                  <Text type="secondary" className="dashboard-stat__label">
                    {card.label}
                  </Text>
                  <Title level={2}>{card.value}</Title>
                  <Text type="secondary">{card.helpText}</Text>
                </div>
              </Space>
            </article>
          ))}
        </div>

        <div className="dashboard-team-summary">
          <PageHeader title="Team Details" subtitle="Balance, squad and match summary by team" />
          {detailCards.length > 0 ? (
            <div className="dashboard-team-summary__grid">
              {detailCards.map((detailCard) => (
                <article
                  className={
                    detailCard.isOverall
                      ? "team-summary-card team-summary-card--overall"
                      : "team-summary-card"
                  }
                  key={detailCard.key}
                >
                  <div className="team-summary-card__heading">
                    <span className="team-summary-card__icon">
                      {detailCard.icon}
                    </span>
                    <div>
                      <Text type="secondary">{detailCard.label}</Text>
                      <Title level={4}>{detailCard.title}</Title>
                    </div>
                  </div>
                  <div className="team-summary-card__metrics">
                    <div>
                      <Text type="secondary">Balance</Text>
                      <Text strong>{formatCurrency(detailCard.balance)}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Squad</Text>
                      <Text strong>{formatNumber(detailCard.squad)}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Matches</Text>
                      <Text strong>{formatNumber(detailCard.matches)}</Text>
                    </div>
                    {"scheduledAmount" in detailCard ? (
                      <div>
                        <Text type="secondary">Scheduled Amount</Text>
                        <Text strong>{formatCurrency(detailCard.scheduledAmount)}</Text>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-panel">
              <Empty description="No team summary available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </div>

        <div className="dashboard-paid-summary">
          <PageHeader
            title="Paid Scheduled Matches"
            subtitle="Only PAID scheduled match amount, overall and team-wise"
          />
          <article className="dashboard-paid-summary__panel">
            <div className="dashboard-paid-summary__hero">
              <span className="dashboard-paid-summary__icon">
                <CheckCircleOutlined />
              </span>
              <div>
                <Text type="secondary">Overall Paid Amount</Text>
                <Title level={2}>
                  {formatCurrency(summary.overall_summary.scheduled_paid_matches_amount)}
                </Title>
                <Text type="secondary">
                  {formatNumber(summary.overall_summary.total_matches_scheduled)} scheduled matches
                </Text>
              </div>
            </div>

            <div className="dashboard-paid-summary__list">
              {paidScheduledAmountCards.map((paidCard) => (
                <div
                  className={
                    paidCard.isOverall
                      ? "dashboard-paid-summary__item dashboard-paid-summary__item--overall"
                      : "dashboard-paid-summary__item"
                  }
                  key={paidCard.key}
                >
                  <div>
                    <Text type="secondary">{paidCard.isOverall ? "All teams" : "Team"}</Text>
                    <Text strong>{paidCard.label}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Scheduled Matches</Text>
                    <Text strong>{formatNumber(paidCard.matches)}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Paid Amount</Text>
                    <Text strong>{formatCurrency(paidCard.amount)}</Text>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="quick-access">
          <PageHeader title="Quick Access" subtitle={`Manage your ${APP_CONFIG.APP_NAME} activities`} />
          <div className="quick-access__grid">
            {quickAccessItems.map((item) => (
              <button
                className="quick-access__item"
                key={item.route}
                type="button"
                onClick={() => onNavigate(item.route)}
              >
                <span className="quick-access__icon">{item.icon}</span>
                <span className="quick-access__copy">
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                </span>
                <ArrowRightOutlined className="quick-access__arrow" />
              </button>
            ))}
          </div>
        </div>
      </Spin>

      <Modal
        className="player-expense-page__report-modal"
        footer={null}
        open={isReportModalOpen}
        title="Player Expense Reports"
        width={920}
        onCancel={() => setIsReportModalOpen(false)}
      >
        <div className="player-expense-page__report-toolbar">
          <DatePicker
            allowClear={false}
            className="player-expense-page__report-month"
            format="MMMM YYYY"
            picker="month"
            value={reportMonth}
            onChange={(month) => setReportMonth(month ?? dayjs())}
          />
        </div>
        <Table<PlayerExpenseReportRow>
          columns={reportColumns}
          dataSource={playerExpenseReportRows}
          expandable={{
            expandRowByClick: true,
            expandedRowClassName: () => "player-expense-page__report-expanded-row",
            expandedRowRender: (player) =>
              player.matches.length > 0 ? (
                <Table<PlayerExpenseReportMatch>
                  className="player-expense-page__report-details-table"
                  columns={reportMatchColumns}
                  dataSource={player.matches}
                  pagination={false}
                  rowKey="match_id"
                  size="small"
                />
              ) : (
                <Empty
                  description="No matches played for this month"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            expandedRowKeys: expandedReportPlayerIds,
            onExpand: (expanded, player) =>
              setExpandedReportPlayerIds((currentPlayerIds) =>
                expanded
                  ? [...currentPlayerIds, player.player_id]
                  : currentPlayerIds.filter((playerId) => playerId !== player.player_id)
              ),
            rowExpandable: () => true
          }}
          loading={isLoading}
          locale={{
            emptyText: (
              <Empty
                description="No player expense reports found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          onRow={(player) => ({
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleReportPlayer(player.player_id);
              }
            },
            tabIndex: 0
          })}
          pagination={false}
          rowClassName="player-expense-page__report-row"
          rowKey="player_id"
          scroll={{ y: 560 }}
        />
      </Modal>

      <Modal
        footer={null}
        open={isReleaseSlotsModalOpen}
        title="Release slots for opponent checking"
        width={1040}
        onCancel={closeReleaseSlotsModal}
      >
        <Form<ReleaseSlotsFormValues>
          className="matches-page__release-form"
          form={releaseSlotsForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleReleaseSlots}
        >
          <div className="matches-page__release-form-grid">
            <Form.Item
              label="Ground Name"
              name="groundName"
              rules={[
                { required: true, whitespace: true, message: "Please enter ground name" },
                { max: 140, message: "Ground name must be 140 characters or fewer" }
              ]}
            >
              <Input placeholder="Enter ground name" />
            </Form.Item>
            <Form.Item
              label="Select Month"
              name="month"
              rules={[{ required: true, message: "Please select month" }]}
            >
              <DatePicker
                className="matches-page__full-control"
                format="MMMM YYYY"
                picker="month"
              />
            </Form.Item>
            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ required: true, message: "Please select start time" }]}
            >
              <TimePicker className="matches-page__full-control" format="HH:mm" minuteStep={5} />
            </Form.Item>
            <Form.Item
              label="End Time"
              name="endTime"
              rules={[{ required: true, message: "Please select end time" }]}
            >
              <TimePicker className="matches-page__full-control" format="HH:mm" minuteStep={5} />
            </Form.Item>
            <Form.Item
              label="Select My Team"
              name="myTeamId"
              rules={[{ required: true, message: "Please select your team" }]}
            >
              <Select
                disabled={teams.length === 1}
                optionFilterProp="label"
                options={teamOptions}
                placeholder="Select team"
                showSearch
              />
            </Form.Item>
            <Form.Item
              className="matches-page__release-days"
              label="Allow Select Days"
              name="days"
              rules={[{ required: true, message: "Please select at least one day" }]}
            >
              <Checkbox.Group options={releaseDayOptions} />
            </Form.Item>
          </div>
          <div className="matches-page__release-actions">
            <Button type="primary" htmlType="submit">
              Release slots
            </Button>
          </div>
        </Form>

        {releasedSlotsSummary ? (
          <>
            <Divider />
            <div className="matches-page__release-summary">
              <strong ref={releaseSummaryTitleRef} tabIndex={0}>
                Looking For opponent on below dates
              </strong>
              <div className="matches-page__release-summary-meta">
                <Text tabIndex={0} strong>
                  {releasedSlotsSummary.month.format("MMMM YYYY")}
                </Text>
                <Text tabIndex={0} strong>
                  Slot Timing {releasedSlotsSummary.startTime.format("hh:mm A")} -{" "}
                  {releasedSlotsSummary.endTime.format("hh:mm A")}
                </Text>
                <Text tabIndex={0} strong>
                  Ground {releasedSlotsSummary.groundName}
                </Text>
              </div>
            </div>
            <div className="matches-page__release-slots-grid">
              {releasedSlotItems.map((item) => (
                <div
                  className={`matches-page__release-slot-card ${
                    item.status === "Booked"
                      ? "matches-page__release-slot-card--booked"
                      : "matches-page__release-slot-card--available"
                  }`}
                  key={item.date.format("YYYY-MM-DD")}
                >
                  <span>{item.date.format("ddd")}</span>
                  <strong>{item.date.format("DD MMM")}</strong>
                  <em>{item.status}</em>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        confirmLoading={isSaving}
        okText={editingTeam ? "Update Team" : "Add Team"}
        open={isTeamModalOpen}
        title={editingTeam ? "Edit Team Name" : "Add New Team"}
        onCancel={closeTeamModal}
        onOk={() => form.submit()}
      >
        <Form<TeamFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSaveTeam}
        >
          <Form.Item
            label="Team Name"
            name="teamName"
            rules={[
              { required: true, whitespace: true, message: "Please enter a team name" },
              { max: 80, message: "Team name must be 80 characters or fewer" }
            ]}
          >
            <Input autoFocus placeholder="Enter team name" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};
