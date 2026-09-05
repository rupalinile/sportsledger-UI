import { useCallback, useEffect, useMemo, useState, type Key } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Table,
  Tag,
  Typography,
  type TableProps
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { PageHeader } from "../../components/common/PageHeader";
import { playerExpenseService } from "../../services/playerExpenseService";
import type { PlayerDeposit, PlayerExpenseSummary } from "../../types/playerExpense";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text } = Typography;

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

const formatCurrency = (value: number | null | undefined): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value ?? 0));

const formatShortDate = (date: string): string => dayjs(date).format("DD MMM");
const getMonthKey = (date: string): string => dayjs(date).format("YYYY-MM");

export const PlayerReportsPage = (): JSX.Element => {
  const [summary, setSummary] = useState<PlayerExpenseSummary | null>(null);
  const [deposits, setDeposits] = useState<PlayerDeposit[]>([]);
  const [reportMonth, setReportMonth] = useState<Dayjs>(dayjs());
  const [expandedReportPlayerIds, setExpandedReportPlayerIds] = useState<Key[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [summaryResponse, depositsResponse] = await Promise.all([
        playerExpenseService.getSummary(),
        playerExpenseService.getDeposits()
      ]);

      setSummary(summaryResponse.data);
      setDeposits(depositsResponse.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load player expense reports."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const reportMonthKey = reportMonth.format("YYYY-MM");

  const playerExpenseReportRows = useMemo<PlayerExpenseReportRow[]>(() => {
    const reportMatches = (summary?.matches ?? []).filter(
      (match) => getMonthKey(match.match_date) === reportMonthKey
    );
    const reportMatchById = new Map(reportMatches.map((match) => [match.match_id, match]));
    const reportMatchIds = new Set(reportMatches.map((match) => match.match_id));

    const depositsByPlayer = deposits.reduce((playerDeposits, deposit) => {
      if (getMonthKey(deposit.deposit_date) !== reportMonthKey) {
        return playerDeposits;
      }

      const existingDeposits = playerDeposits.get(deposit.player_id) ?? [];
      existingDeposits.push(deposit);
      playerDeposits.set(deposit.player_id, existingDeposits);

      return playerDeposits;
    }, new Map<number, PlayerDeposit[]>());

    return (summary?.players ?? [])
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
  }, [deposits, reportMonthKey, summary?.matches, summary?.players]);

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
    <section className="management-page player-reports-page player-expense-page">
      <div className="management-page__heading">
        <PageHeader
          title="Player Expense Reports"
          subtitle="Review monthly player deposits, match fees and remaining balances"
        />
        <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => void loadReports()}>
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <Alert
          action={
            <Button size="small" onClick={() => void loadReports()}>
              Try Again
            </Button>
          }
          className="dashboard-alert"
          message={errorMessage}
          showIcon
          type="error"
        />
      ) : null}

      <div className="management-page__panel player-reports-page__panel player-expense-page__report-modal">
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
        />
      </div>
    </section>
  );
};
