import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Typography,
  message
} from "antd";
import { PageHeader } from "../../components/common/PageHeader";
import { APP_CONFIG } from "../../constants/app.constants";
import { ROUTES } from "../../constants/routes";
import { dashboardService } from "../../services/dashboardService";
import { matchService } from "../../services/matchService";
import { playerExpenseService } from "../../services/playerExpenseService";
import { playerService } from "../../services/playerService";
import { teamService } from "../../services/teamService";
import type { DashboardSummary, Team } from "../../types/dashboard";
import type { Match } from "../../types/match";
import type { Player } from "../../types/player";
import type { PlayerExpenseSummary } from "../../types/playerExpense";
import type { AppRouteProps } from "../../types/navigation";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text, Title } = Typography;
const ALL_SELECTION_TEAM_ID = 0;

type TeamFormValues = {
  teamName: string;
};

const emptySummary: DashboardSummary = {
  team_wise_summary: [],
  overall_summary: {
    total_team_balance: 0,
    total_squad_count: 0,
    total_matches_scheduled: 0
  }
};

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

export const HomePage = ({ onNavigate }: AppRouteProps): JSX.Element => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [allSelectionPlayers, setAllSelectionPlayers] = useState<Player[]>([]);
  const [playerExpenseSummary, setPlayerExpenseSummary] = useState<PlayerExpenseSummary | null>(null);
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [form] = Form.useForm<TeamFormValues>();
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
        scheduledMatchesResponse
      ] = await Promise.all([
        teamService.getTeams(),
        dashboardService.getSummary(),
        playerService.getPlayers({ teamId: ALL_SELECTION_TEAM_ID }),
        playerExpenseService.getSummary(),
        matchService.getScheduledMatches()
      ]);

      setTeams(teamsResponse.data);
      setSummary(summaryResponse.data);
      setAllSelectionPlayers(allSelectionPlayersResponse.data);
      setPlayerExpenseSummary(playerExpenseSummaryResponse.data);
      setScheduledMatches(scheduledMatchesResponse.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load dashboard details."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

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
      }
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
            isOverall: false
          }))
      ];
    },
    [allSelectionPlayers, playerExpenseSummary?.players, scheduledMatches, summary.team_wise_summary]
  );

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

  return (
    <section className="dashboard-page">
      {contextHolder}
      <div className="dashboard-page__heading">
        <PageHeader title="Dashboard" subtitle={`Welcome to ${APP_CONFIG.APP_NAME}`} />
        <Button icon={<ReloadOutlined />} loading={isLoading} size="large" onClick={loadDashboard}>
          Refresh
        </Button>
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
