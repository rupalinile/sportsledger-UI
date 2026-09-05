import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  TimePicker,
  Typography,
  message,
  type MenuProps,
  type TableProps
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { PageHeader } from "../../components/common/PageHeader";
import { matchService } from "../../services/matchService";
import { playerService } from "../../services/playerService";
import { teamService } from "../../services/teamService";
import type { Team } from "../../types/dashboard";
import type {
  CompleteMatchPayload,
  Match,
  MatchPayload,
  MatchPaymentPayloadStatus,
  MatchPaymentStatus,
  MatchSlotPayloadStatus,
  MatchSlotStatus,
  SettledMatch
} from "../../types/match";
import type { Player } from "../../types/player";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text } = Typography;

const ALL_MATCHES_VALUE = -1;
const ALL_SELECTION_TEAM_ID = 0;
const ALL_PAYMENT_STATUSES_VALUE = "ALL";

type PaymentStatusFilter = typeof ALL_PAYMENT_STATUSES_VALUE | MatchPaymentPayloadStatus;

type MatchFormValues = {
  myTeamId: number;
  opponentTeamName: string;
  matchDate: Dayjs;
  matchTime: Dayjs;
  groundName: string;
  opponentCaptainName: string;
  opponentCaptainNumber: string;
  slotStatus: MatchSlotPayloadStatus;
  matchFees: number;
  paymentStatus: MatchPaymentPayloadStatus;
};

type CompleteMatchFormValues = {
  ballFees: number;
  totalPlayerCount?: number;
  playerIds: number[];
  guestSharePlayerId?: number;
  guestShareCount?: number;
};

type ReleaseSlotsFormValues = {
  groundName: string;
  months: Dayjs[];
  days: number[];
  startTime: Dayjs;
  endTime: Dayjs;
  myTeamId: number;
};

type ReleasedSlotsSummary = {
  groundName: string;
  months: Dayjs[];
  days: number[];
  startTime: Dayjs;
  endTime: Dayjs;
  myTeamId: number;
};

type PlannerDateItem = {
  date: Dayjs | null;
  matches: Match[];
};

const plannerWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const releaseDayOptions = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 }
];

const slotStatusOptions = [
  { label: "Ground Booked", value: "GROUND_BOOKED" },
  { label: "Slot Booked", value: "SLOT_BOOKED" }
];

const paymentStatusOptions = [
  { label: "Received", value: "RECEIVED" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
];

const paymentStatusFilterOptions = [
  { label: "All Payment Status", value: ALL_PAYMENT_STATUSES_VALUE },
  ...paymentStatusOptions
];

const mergePlayersById = (playerGroups: Player[][]): Player[] => {
  const playersById = new Map<number, Player>();

  playerGroups.flat().forEach((player) => {
    playersById.set(player.id, player);
  });

  return Array.from(playersById.values());
};

const formatCurrency = (value: number | null | undefined): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(Number(value ?? 0));

const formatDate = (date: string): string => dayjs(date).format("DD MMM YYYY");

const formatTime = (time: string): string => dayjs(time, "HH:mm:ss").format("hh:mm A");

const formatPlannerStatus = (status: Match["match_status"]): string => {
  if (status === "COMPLETED") {
    return "Complete";
  }

  if (status === "CANCELLED") {
    return "Cancel";
  }

  return "Scheduled";
};

const getSlotStatusLabel = (status: MatchSlotStatus): string =>
  slotStatusOptions.find((option) => option.value === status)?.label ?? status;

const getPaymentStatusColor = (status: MatchPaymentStatus): string => {
  if (status === "PAID" || status === "RECEIVED") {
    return "success";
  }

  return "warning";
};

const doesMatchPaymentStatusFilter = (
  matchPaymentStatus: MatchPaymentStatus,
  selectedPaymentStatus: PaymentStatusFilter
): boolean => {
  if (selectedPaymentStatus === ALL_PAYMENT_STATUSES_VALUE) {
    return true;
  }

  return matchPaymentStatus === selectedPaymentStatus;
};

const doesMatchMonthFilter = (matchDate: string, selectedMonth: Dayjs | null): boolean => {
  if (!selectedMonth) {
    return true;
  }

  return dayjs(matchDate).isSame(selectedMonth, "month");
};

const normalizeFilterText = (value: string): string => value.trim().toLowerCase();

const doesTextFilterMatch = (value: string, selectedValue: string | null): boolean => {
  if (!selectedValue) {
    return true;
  }

  return normalizeFilterText(value) === normalizeFilterText(selectedValue);
};

const getUniqueTextOptions = (values: string[]): { label: string; value: string }[] => {
  const optionsByKey = new Map<string, string>();

  values.forEach((value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return;
    }

    optionsByKey.set(normalizeFilterText(trimmedValue), trimmedValue);
  });

  return Array.from(optionsByKey.values())
    .sort((firstValue, secondValue) => firstValue.localeCompare(secondValue))
    .map((value) => ({ label: value, value }));
};

const filterSelectOption = (input: string, option?: { label?: string }): boolean =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.toLowerCase());

const getStatusColor = (status: string): string => {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "CANCELLED") {
    return "error";
  }

  return "processing";
};

const getPlannerStatusClass = (status: Match["match_status"] | "AVAILABLE"): string => {
  if (status === "AVAILABLE") {
    return "matches-page__planner-status--available";
  }

  if (status === "COMPLETED") {
    return "matches-page__planner-status--complete";
  }

  if (status === "CANCELLED") {
    return "matches-page__planner-status--cancel";
  }

  return "matches-page__planner-status--scheduled";
};

const getPlannerCardStatusClass = (
  status: Match["match_status"] | "AVAILABLE" | "MULTIPLE"
): string => {
  if (status === "AVAILABLE") {
    return "matches-page__planner-card--available";
  }

  if (status === "COMPLETED") {
    return "matches-page__planner-card--complete";
  }

  if (status === "CANCELLED") {
    return "matches-page__planner-card--cancel";
  }

  if (status === "MULTIPLE") {
    return "matches-page__planner-card--multiple";
  }

  return "matches-page__planner-card--scheduled";
};

export const MatchesManagementPage = (): JSX.Element => {
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
  const [settledMatches, setSettledMatches] = useState<SettledMatch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(ALL_MATCHES_VALUE);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatusFilter>(
    ALL_PAYMENT_STATUSES_VALUE
  );
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
  const [selectedGroundName, setSelectedGroundName] = useState<string | null>(null);
  const [selectedOpponentName, setSelectedOpponentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [isCompletingMatch, setIsCompletingMatch] = useState(false);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [completingMatch, setCompletingMatch] = useState<Match | null>(null);
  const [plannerModalDate, setPlannerModalDate] = useState<Dayjs | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isReleaseSlotsModalOpen, setIsReleaseSlotsModalOpen] = useState(false);
  const [releasedSlotsSummary, setReleasedSlotsSummary] = useState<ReleasedSlotsSummary | null>(
    null
  );
  const [matchForm] = Form.useForm<MatchFormValues>();
  const [completeForm] = Form.useForm<CompleteMatchFormValues>();
  const [releaseSlotsForm] = Form.useForm<ReleaseSlotsFormValues>();
  const releaseSummaryTitleRef = useRef<HTMLElement | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const loadPageData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [scheduledResponse, settledResponse, teamsResponse] = await Promise.all([
        matchService.getScheduledMatches(),
        matchService.getSettledMatches(),
        teamService.getTeams()
      ]);

      setScheduledMatches(scheduledResponse.data);
      setSettledMatches(settledResponse.data);
      setTeams(teamsResponse.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load matches."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (releasedSlotsSummary) {
      releaseSummaryTitleRef.current?.focus();
    }
  }, [releasedSlotsSummary]);

  const teamOptions = useMemo(
    () => teams.map((team) => ({ label: team.teamName, value: team.id })),
    [teams]
  );

  const teamFilterOptions = useMemo(
    () => [
      { label: "All Matches", value: ALL_MATCHES_VALUE },
      ...teams.map((team) => ({ label: team.teamName, value: team.id }))
    ],
    [teams]
  );

  const allMatches = useMemo(() => [...scheduledMatches, ...settledMatches], [
    scheduledMatches,
    settledMatches
  ]);

  const groundFilterOptions = useMemo(
    () => getUniqueTextOptions(allMatches.map((match) => match.ground_name)),
    [allMatches]
  );

  const opponentFilterOptions = useMemo(
    () => getUniqueTextOptions(allMatches.map((match) => match.opponent_team_name)),
    [allMatches]
  );

  const filteredScheduledMatches = useMemo(() => {
    return scheduledMatches.filter((match) => {
      const matchesTeam =
        selectedTeamId === ALL_MATCHES_VALUE || match.my_team_id === selectedTeamId;
      const matchesPaymentStatus = doesMatchPaymentStatusFilter(
        match.payment_status,
        selectedPaymentStatus
      );
      const matchesMonth = doesMatchMonthFilter(match.match_date, selectedMonth);
      const matchesGround = doesTextFilterMatch(match.ground_name, selectedGroundName);
      const matchesOpponent = doesTextFilterMatch(match.opponent_team_name, selectedOpponentName);

      return matchesTeam && matchesPaymentStatus && matchesMonth && matchesGround && matchesOpponent;
    });
  }, [
    scheduledMatches,
    selectedGroundName,
    selectedMonth,
    selectedOpponentName,
    selectedPaymentStatus,
    selectedTeamId
  ]);

  const filteredSettledMatches = useMemo(() => {
    return settledMatches.filter((match) => {
      const matchesTeam =
        selectedTeamId === ALL_MATCHES_VALUE || match.my_team_id === selectedTeamId;
      const matchesPaymentStatus = doesMatchPaymentStatusFilter(
        match.payment_status,
        selectedPaymentStatus
      );
      const matchesMonth = doesMatchMonthFilter(match.match_date, selectedMonth);
      const matchesGround = doesTextFilterMatch(match.ground_name, selectedGroundName);
      const matchesOpponent = doesTextFilterMatch(match.opponent_team_name, selectedOpponentName);

      return matchesTeam && matchesPaymentStatus && matchesMonth && matchesGround && matchesOpponent;
    });
  }, [
    selectedGroundName,
    selectedMonth,
    selectedOpponentName,
    selectedPaymentStatus,
    selectedTeamId,
    settledMatches
  ]);

  const plannerMonth = selectedMonth ?? dayjs();

  const plannerMatches = useMemo(() => {
    return allMatches.filter((match) => {
      const matchesTeam =
        selectedTeamId === ALL_MATCHES_VALUE || match.my_team_id === selectedTeamId;
      const matchesPaymentStatus = doesMatchPaymentStatusFilter(
        match.payment_status,
        selectedPaymentStatus
      );
      const matchesMonth = dayjs(match.match_date).isSame(plannerMonth, "month");
      const matchesGround = doesTextFilterMatch(match.ground_name, selectedGroundName);
      const matchesOpponent = doesTextFilterMatch(match.opponent_team_name, selectedOpponentName);

      return matchesTeam && matchesPaymentStatus && matchesMonth && matchesGround && matchesOpponent;
    });
  }, [
    allMatches,
    plannerMonth,
    selectedGroundName,
    selectedOpponentName,
    selectedPaymentStatus,
    selectedTeamId
  ]);

  const plannerDateItems = useMemo<PlannerDateItem[]>(() => {
    const daysInMonth = plannerMonth.daysInMonth();
    const firstDayOffset = (plannerMonth.date(1).day() + 6) % 7;
    const leadingEmptyDays = Array.from({ length: firstDayOffset }, () => ({
      date: null,
      matches: []
    }));
    const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
      const date = plannerMonth.date(index + 1);
      const matches = plannerMatches.filter((match) => dayjs(match.match_date).isSame(date, "day"));

      return { date, matches };
    });

    return [...leadingEmptyDays, ...monthDays];
  }, [plannerMatches, plannerMonth]);

  const plannerModalMatches = useMemo(() => {
    if (!plannerModalDate) {
      return [];
    }

    return plannerMatches.filter((match) => dayjs(match.match_date).isSame(plannerModalDate, "day"));
  }, [plannerMatches, plannerModalDate]);

  const releasedSlotGroups = useMemo(() => {
    if (!releasedSlotsSummary) {
      return [];
    }

    return releasedSlotsSummary.months.map((month) => {
      const daysInMonth = month.daysInMonth();
      const slots = Array.from({ length: daysInMonth }, (_, index) => month.date(index + 1))
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

      return { month, slots };
    });
  }, [allMatches, releasedSlotsSummary]);

  const playerOptions = useMemo(() => {
    const teamPlayers = players.filter((player) => player.team_id !== ALL_SELECTION_TEAM_ID);
    const commonPlayers = players.filter((player) => player.team_id === ALL_SELECTION_TEAM_ID);
    const options = [];

    if (teamPlayers.length > 0) {
      options.push({
        label: `${completingMatch?.my_team_name ?? "Team"} Players`,
        options: teamPlayers.map((player) => ({
          label: player.player_name,
          value: player.id
        }))
      });
    }

    if (commonPlayers.length > 0) {
      options.push({
        label: "Common Players",
        options: commonPlayers.map((player) => ({
          label: player.player_name,
          value: player.id
        }))
      });
    }

    return options;
  }, [completingMatch?.my_team_name, players]);

  const renderPlannerCard = (item: PlannerDateItem, index: number): JSX.Element => {
    if (!item.date) {
      return (
        <div
          aria-hidden="true"
          className="matches-page__planner-card matches-page__planner-card--empty"
          key={`empty-${index}`}
        />
      );
    }

    const plannerDate = item.date;
    const firstMatch = item.matches[0];
    const hasMultipleMatches = item.matches.length > 1;
    const status = firstMatch?.match_status ?? "AVAILABLE";
    const hasMixedStatuses =
      hasMultipleMatches && item.matches.some((match) => match.match_status !== status);
    const cardStatus = hasMixedStatuses ? "MULTIPLE" : status;

    return (
      <button
        className={`matches-page__planner-card ${getPlannerCardStatusClass(cardStatus)}`}
        key={item.date.format("YYYY-MM-DD")}
        type="button"
        onClick={() => {
          if (item.matches.length > 0) {
            setPlannerModalDate(plannerDate);
          } else {
            openScheduleMatchModal(plannerDate);
          }
        }}
      >
        <span className="matches-page__planner-weekday">{plannerDate.format("ddd")}</span>
        <strong className="matches-page__planner-day">{plannerDate.format("D")}</strong>
        <span
          className={`matches-page__planner-status ${getPlannerStatusClass(
            firstMatch?.match_status ?? "AVAILABLE"
          )}`}
        >
          {hasMultipleMatches
            ? `${item.matches.length} Matches`
            : firstMatch
              ? formatPlannerStatus(status)
              : "Available"}
        </span>
        <span className="matches-page__planner-meta">
          <strong>{hasMultipleMatches ? "Multiple matches" : firstMatch?.opponent_team_name ?? "-"}</strong>
        </span>
        <span className="matches-page__planner-meta">
          <strong>{hasMultipleMatches ? "Tap to view all" : firstMatch?.ground_name ?? "-"}</strong>
        </span>
      </button>
    );
  };

  const buildMatchPayload = (values: MatchFormValues): MatchPayload => ({
    my_team_id: values.myTeamId,
    opponent_team_name: values.opponentTeamName.trim(),
    match_date: values.matchDate.format("YYYY-MM-DD"),
    match_time: values.matchTime.format("HH:mm:ss"),
    ground_name: values.groundName.trim(),
    opponent_captain_name: values.opponentCaptainName.trim(),
    opponent_captain_number: values.opponentCaptainNumber.trim(),
    slot_status: values.slotStatus,
    match_fees: values.matchFees,
    payment_status: values.paymentStatus
  });

  const openScheduleMatchModal = (matchDate: Dayjs = dayjs()): void => {
    setEditingMatch(null);
    matchForm.setFieldsValue({
      myTeamId: teamOptions[0]?.value,
      opponentTeamName: "",
      matchDate,
      matchTime: dayjs("07:00:00", "HH:mm:ss"),
      groundName: "",
      opponentCaptainName: "",
      opponentCaptainNumber: "",
      slotStatus: "GROUND_BOOKED",
      matchFees: undefined,
      paymentStatus: "PENDING"
    });
    setIsMatchModalOpen(true);
  };

  const openEditMatchModal = async (match: Match): Promise<void> => {
    setEditingMatch(match);
    setIsMatchModalOpen(true);
    matchForm.setFieldsValue({
      myTeamId: match.my_team_id,
      opponentTeamName: match.opponent_team_name,
      matchDate: dayjs(match.match_date),
      matchTime: dayjs(match.match_time, "HH:mm:ss"),
      groundName: match.ground_name,
      opponentCaptainName: match.opponent_captain_name,
      opponentCaptainNumber: match.opponent_captain_number,
      slotStatus: match.slot_status,
      matchFees: Number(match.match_fees),
      paymentStatus: match.payment_status
    });

    try {
      const response = await matchService.getMatch(match.id);
      const matchDetails = response.data;

      setEditingMatch(matchDetails);
      matchForm.setFieldsValue({
        myTeamId: matchDetails.my_team_id,
        opponentTeamName: matchDetails.opponent_team_name,
        matchDate: dayjs(matchDetails.match_date),
        matchTime: dayjs(matchDetails.match_time, "HH:mm:ss"),
        groundName: matchDetails.ground_name,
        opponentCaptainName: matchDetails.opponent_captain_name,
        opponentCaptainNumber: matchDetails.opponent_captain_number,
        slotStatus: matchDetails.slot_status,
        matchFees: Number(matchDetails.match_fees),
        paymentStatus: matchDetails.payment_status
      });
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to load match details."));
    }
  };

  const closeMatchModal = (): void => {
    if (isSavingMatch) {
      return;
    }

    setIsMatchModalOpen(false);
    setEditingMatch(null);
    matchForm.resetFields();
  };

  const handleSaveMatch = async (values: MatchFormValues): Promise<void> => {
    setIsSavingMatch(true);

    try {
      const payload = buildMatchPayload(values);

      if (editingMatch) {
        await matchService.updateMatch(editingMatch.id, payload);
        messageApi.success("Match updated successfully");
      } else {
        await matchService.addMatch(payload);
        messageApi.success("Match scheduled successfully");
      }

      closeMatchModal();
      await loadPageData();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to save match."));
    } finally {
      setIsSavingMatch(false);
    }
  };

  const openCompleteMatchModal = async (match: Match): Promise<void> => {
    setCompletingMatch(match);
    setIsCompleteModalOpen(true);
    setIsLoadingPlayers(true);
    completeForm.setFieldsValue({
      ballFees: undefined,
      totalPlayerCount: undefined,
      playerIds: [],
      guestSharePlayerId: undefined,
      guestShareCount: undefined
    });

    try {
      const playerRequests =
        match.my_team_id === ALL_SELECTION_TEAM_ID
          ? [playerService.getPlayers({ teamId: ALL_SELECTION_TEAM_ID })]
          : [
              playerService.getPlayers({ teamId: match.my_team_id }),
              playerService.getPlayers({ teamId: ALL_SELECTION_TEAM_ID })
            ];
      const playerResponses = await Promise.all(playerRequests);

      setPlayers(mergePlayersById(playerResponses.map((response) => response.data)));
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to load players for this match."));
      setPlayers([]);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const closeCompleteModal = (): void => {
    if (isCompletingMatch) {
      return;
    }

    setIsCompleteModalOpen(false);
    setCompletingMatch(null);
    setPlayers([]);
    completeForm.resetFields();
  };

  const openReleaseSlotsModal = (): void => {
    const defaultTeamId = teams.length === 1 ? teams[0].id : teamOptions[0]?.value;

    releaseSlotsForm.setFieldsValue({
      groundName: "",
      months: [selectedMonth ?? dayjs()],
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
      months: Array.from(
        new Map(
          values.months
            .map((month) => month.startOf("month"))
            .sort((first, second) => first.valueOf() - second.valueOf())
            .map((month) => [month.format("YYYY-MM"), month])
        ).values()
      ),
      days: values.days,
      startTime: values.startTime,
      endTime: values.endTime,
      myTeamId: values.myTeamId
    });
  };

  const handleCompleteMatch = async (values: CompleteMatchFormValues): Promise<void> => {
    if (!completingMatch) {
      return;
    }

    setIsCompletingMatch(true);

    try {
      if (typeof values.totalPlayerCount !== "number") {
        messageApi.error("Please enter player count.");
        return;
      }

      const payload: CompleteMatchPayload = {
        ball_fees: values.ballFees,
        total_player_count: values.totalPlayerCount,
        player_ids: [
          ...values.playerIds,
          ...Array.from({ length: values.guestShareCount ?? 0 }, () => values.guestSharePlayerId)
        ].filter((playerId): playerId is number => typeof playerId === "number")
      };

      await matchService.completeMatch(completingMatch.id, payload);
      messageApi.success("Match completed successfully");
      closeCompleteModal();
      await loadPageData();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to complete match."));
    } finally {
      setIsCompletingMatch(false);
    }
  };

  const handleCancelMatch = (match: Match): void => {
    Modal.confirm({
      centered: true,
      okButtonProps: { danger: true },
      okText: "Cancel Match",
      title: `Cancel match against ${match.opponent_team_name}?`,
      onOk: async () => {
        try {
          await matchService.cancelMatch(match.id);
          messageApi.success("Match cancelled successfully");
          await loadPageData();
        } catch (error) {
          messageApi.error(getApiErrorMessage(error, "Unable to cancel match."));
        }
      }
    });
  };

  const getActionItems = (match: Match, beforeAction?: () => void): MenuProps["items"] => [
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit Match",
      onClick: () => {
        beforeAction?.();
        void openEditMatchModal(match);
      }
    },
    {
      key: "complete",
      icon: <CheckCircleOutlined />,
      label: "Mark Complete",
      onClick: () => {
        beforeAction?.();
        void openCompleteMatchModal(match);
      }
    },
    {
      key: "cancel",
      danger: true,
      icon: <CloseCircleOutlined />,
      label: "Mark Cancel",
      onClick: () => {
        beforeAction?.();
        handleCancelMatch(match);
      }
    }
  ];

  const scheduledColumns: TableProps<Match>["columns"] = [
    {
      title: "My Team",
      dataIndex: "my_team_name",
      key: "my_team_name",
      fixed: "left",
      width: 170,
      render: (teamName: string) => <Text strong>{teamName}</Text>
    },
    {
      title: "Opponent",
      dataIndex: "opponent_team_name",
      key: "opponent_team_name",
      width: 170
    },
    {
      title: "Date",
      dataIndex: "match_date",
      key: "match_date",
      width: 140,
      render: (date: string) => formatDate(date)
    },
    {
      title: "Time",
      dataIndex: "match_time",
      key: "match_time",
      width: 120,
      render: (time: string) => formatTime(time)
    },
    {
      title: "Ground",
      dataIndex: "ground_name",
      key: "ground_name",
      width: 220
    },
    {
      title: "Opponent Captain",
      dataIndex: "opponent_captain_name",
      key: "opponent_captain_name",
      width: 180
    },
    {
      title: "Captain Number",
      dataIndex: "opponent_captain_number",
      key: "opponent_captain_number",
      width: 160
    },
    {
      title: "Slot",
      dataIndex: "slot_status",
      key: "slot_status",
      width: 150,
      render: (status: MatchSlotStatus) => (
        <Tag className="matches-page__tag matches-page__tag--slot">
          {getSlotStatusLabel(status)}
        </Tag>
      )
    },
    {
      title: "Match Fees",
      dataIndex: "match_fees",
      key: "match_fees",
      align: "right",
      width: 140,
      render: (fees: number) => formatCurrency(fees)
    },
    {
      title: "Payment",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 130,
      render: (status: MatchPaymentStatus) => (
        <Tag color={getPaymentStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 110,
      render: (_, match) => (
        <Dropdown menu={{ items: getActionItems(match) }} trigger={["click"]}>
          <Button icon={<MoreOutlined />}>Action</Button>
        </Dropdown>
      )
    }
  ];

  const settledColumns: TableProps<SettledMatch>["columns"] = [
    {
      title: "My Team",
      dataIndex: "my_team_name",
      key: "my_team_name",
      fixed: "left",
      width: 170,
      render: (teamName: string) => <Text strong>{teamName}</Text>
    },
    {
      title: "Opponent",
      dataIndex: "opponent_team_name",
      key: "opponent_team_name",
      width: 170
    },
    {
      title: "Date",
      dataIndex: "match_date",
      key: "match_date",
      width: 140,
      render: (date: string) => formatDate(date)
    },
    {
      title: "Time",
      dataIndex: "match_time",
      key: "match_time",
      width: 120,
      render: (time: string) => formatTime(time)
    },
    {
      title: "Status",
      dataIndex: "match_status",
      key: "match_status",
      width: 140,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: "Match Fees",
      dataIndex: "match_fees",
      key: "match_fees",
      align: "right",
      width: 140,
      render: (fees: number) => formatCurrency(fees)
    },
    {
      title: "Ball Fees",
      dataIndex: "ball_fees",
      key: "ball_fees",
      align: "right",
      width: 130,
      render: (fees: number | null) => (fees === null ? "-" : formatCurrency(fees))
    },
    {
      title: "Total Expense",
      dataIndex: "total_expense",
      key: "total_expense",
      align: "right",
      width: 150,
      render: (expense: number | null) => (expense === null ? "-" : formatCurrency(expense))
    },
    {
      title: "Players",
      dataIndex: "total_player_count",
      key: "total_player_count",
      align: "right",
      width: 110,
      render: (count: number | null) => count ?? "-"
    },
    {
      title: "Per Head",
      dataIndex: "per_head_expense",
      key: "per_head_expense",
      align: "right",
      width: 140,
      render: (expense: number | null) => (expense === null ? "-" : formatCurrency(expense))
    }
  ];

  return (
    <section className="management-page matches-page">
      {contextHolder}
      <div className="management-page__heading">
        <PageHeader title="Matches Management" subtitle="Schedule and manage cricket matches" />
        <Space>
          <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => void loadPageData()}>
            Refresh
          </Button>
          <Button
            className="matches-page__release-button"
            icon={<CalendarOutlined />}
            onClick={openReleaseSlotsModal}
          >
            Release slots for opponent checking
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openScheduleMatchModal()}>
            Schedule New Match
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

      <div className="management-page__panel matches-page__panel">
        <div className="matches-page__toolbar">
          <DatePicker
            allowClear
            className="matches-page__filter"
            format="MMMM YYYY"
            picker="month"
            placeholder="All Months"
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
          <Select
            className="matches-page__filter"
            options={paymentStatusFilterOptions}
            value={selectedPaymentStatus}
            onChange={setSelectedPaymentStatus}
          />
          <Select
            className="matches-page__filter"
            options={teamFilterOptions}
            value={selectedTeamId}
            onChange={setSelectedTeamId}
          />
          <Select
            allowClear
            showSearch
            className="matches-page__filter"
            filterOption={filterSelectOption}
            options={groundFilterOptions}
            placeholder="All Grounds"
            value={selectedGroundName}
            onChange={(value) => setSelectedGroundName(value ?? null)}
          />
          <Select
            allowClear
            showSearch
            className="matches-page__filter"
            filterOption={filterSelectOption}
            options={opponentFilterOptions}
            placeholder="All Opponents"
            value={selectedOpponentName}
            onChange={(value) => setSelectedOpponentName(value ?? null)}
          />
        </div>
        <Tabs
          defaultActiveKey="monthly-planner"
          items={[
            {
              key: "monthly-planner",
              label: (
                <Space size={8}>
                  <CalendarOutlined />
                  Monthly Planner
                </Space>
              ),
              children: (
                <div className="matches-page__planner">
                  <div className="matches-page__planner-heading">
                    <div>
                      <Text type="secondary">Planner Month</Text>
                      <strong>{plannerMonth.format("MMMM YYYY")}</strong>
                    </div>
                    <Text type="secondary">
                      {plannerMatches.length} match{plannerMatches.length === 1 ? "" : "es"} found
                    </Text>
                  </div>
                  <div className="matches-page__planner-grid">
                    {plannerWeekdays.map((weekday) => (
                      <div className="matches-page__planner-column-label" key={weekday}>
                        {weekday}
                      </div>
                    ))}
                    {plannerDateItems.map(renderPlannerCard)}
                  </div>
                </div>
              )
            },
            {
              key: "scheduled",
              label: (
                <Space size={8}>
                  <CalendarOutlined />
                  Scheduled Matches
                </Space>
              ),
              children: (
                <Table<Match>
                  columns={scheduledColumns}
                  dataSource={filteredScheduledMatches}
                  loading={isLoading}
                  locale={{
                    emptyText: (
                      <Empty
                        description="No scheduled matches found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  rowKey="id"
                  scroll={{ x: "max-content" }}
                />
              )
            },
            {
              key: "settled",
              label: (
                <Space size={8}>
                  <CheckCircleOutlined />
                  Settled Matches
                </Space>
              ),
              children: (
                <Table<SettledMatch>
                  columns={settledColumns}
                  dataSource={filteredSettledMatches}
                  loading={isLoading}
                  locale={{
                    emptyText: (
                      <Empty
                        description="No settled matches found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  rowKey="id"
                  scroll={{ x: "max-content" }}
                />
              )
            }
          ]}
        />
      </div>

      <Modal
        footer={null}
        open={Boolean(plannerModalDate)}
        title={
          plannerModalDate
            ? `Matches on ${plannerModalDate.format("DD MMM YYYY")}`
            : "Matches"
        }
        width={820}
        onCancel={() => setPlannerModalDate(null)}
      >
        <div className="matches-page__planner-modal-list">
          {plannerModalMatches.map((match) => (
            <div className="matches-page__planner-modal-item" key={match.id}>
              <div>
                <Text type="secondary">My Team Name</Text>
                <strong>{match.my_team_name}</strong>
              </div>
              <div>
                <Text type="secondary">Date</Text>
                <strong>{formatDate(match.match_date)}</strong>
              </div>
              <div>
                <Text type="secondary">Status</Text>
                <Tag className="matches-page__planner-modal-tag" color={getStatusColor(match.match_status)}>
                  {formatPlannerStatus(match.match_status)}
                </Tag>
              </div>
              <div>
                <Text type="secondary">Opponent Name</Text>
                <strong>{match.opponent_team_name}</strong>
              </div>
              <div>
                <Text type="secondary">Ground Name</Text>
                <strong>{match.ground_name}</strong>
              </div>
              <div>
                <Text type="secondary">Action</Text>
                <Dropdown
                  menu={{ items: getActionItems(match, () => setPlannerModalDate(null)) }}
                  trigger={["click"]}
                >
                  <Button icon={<MoreOutlined />}>Action</Button>
                </Dropdown>
              </div>
            </div>
          ))}
        </div>
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
              label="Select Months"
              name="months"
              rules={[{ required: true, message: "Please select at least one month" }]}
            >
              <DatePicker
                className="matches-page__full-control"
                format="MMMM YYYY"
                multiple
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
            </div>
            <div className="matches-page__release-month-groups">
              {releasedSlotGroups.map((group) => (
                <div className="matches-page__release-month-group" key={group.month.format("YYYY-MM")}>
                  <strong>{group.month.format("MMMM YYYY")}</strong>
                  <div className="matches-page__release-month-meta">
                    <Text strong>
                      Slot Timing {releasedSlotsSummary.startTime.format("hh:mm A")} -{" "}
                      {releasedSlotsSummary.endTime.format("hh:mm A")}
                    </Text>
                    <Text strong>Ground {releasedSlotsSummary.groundName}</Text>
                  </div>
                  <div className="matches-page__release-slots-grid">
                    {group.slots.map((item) => (
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
                </div>
              ))}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        confirmLoading={isSavingMatch}
        okText={editingMatch ? "Update Match" : "Schedule Match"}
        open={isMatchModalOpen}
        title={editingMatch ? "Edit Match" : "Schedule New Match"}
        width={760}
        onCancel={closeMatchModal}
        onOk={() => matchForm.submit()}
      >
        <Form<MatchFormValues>
          className="matches-page__form-grid"
          form={matchForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSaveMatch}
        >
          <Form.Item
            label="My Team Name"
            name="myTeamId"
            rules={[{ required: true, message: "Please select your team" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={teamOptions}
              placeholder="Select team"
            />
          </Form.Item>
          <Form.Item
            label="Opponent Team Name"
            name="opponentTeamName"
            rules={[
              { required: true, whitespace: true, message: "Please enter opponent team name" },
              { max: 100, message: "Opponent team name must be 100 characters or fewer" }
            ]}
          >
            <Input placeholder="Enter opponent team" />
          </Form.Item>
          <Form.Item
            label="Date of Match"
            name="matchDate"
            rules={[{ required: true, message: "Please select match date" }]}
          >
            <DatePicker className="matches-page__full-control" format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item
            label="Timing"
            name="matchTime"
            rules={[{ required: true, message: "Please select match time" }]}
          >
            <TimePicker className="matches-page__full-control" format="HH:mm" minuteStep={5} />
          </Form.Item>
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
            label="Opponent Captain"
            name="opponentCaptainName"
            rules={[
              { required: true, whitespace: true, message: "Please enter captain name" },
              { max: 80, message: "Captain name must be 80 characters or fewer" }
            ]}
          >
            <Input placeholder="Enter captain name" />
          </Form.Item>
          <Form.Item
            label="Captain Number"
            name="opponentCaptainNumber"
            rules={[
              { required: true, whitespace: true, message: "Please enter captain number" },
              { pattern: /^[0-9]{10}$/, message: "Captain number must be 10 digits" }
            ]}
          >
            <Input inputMode="numeric" maxLength={10} placeholder="Enter captain number" />
          </Form.Item>
          <Form.Item
            label="Slot Status"
            name="slotStatus"
            rules={[{ required: true, message: "Please select slot status" }]}
          >
            <Select options={slotStatusOptions} />
          </Form.Item>
          <Form.Item
            label="Match Fees Full Slot"
            name="matchFees"
            rules={[{ required: true, message: "Please enter match fees" }]}
          >
            <InputNumber
              className="matches-page__full-control"
              min={0}
              prefix="₹"
              placeholder="Enter match fees"
            />
          </Form.Item>
          <Form.Item
            label="Payment Status"
            name="paymentStatus"
            rules={[{ required: true, message: "Please select payment status" }]}
          >
            <Select options={paymentStatusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        confirmLoading={isCompletingMatch}
        okText="Mark Complete"
        open={isCompleteModalOpen}
        title={
          completingMatch
            ? `Complete Match vs ${completingMatch.opponent_team_name}`
            : "Complete Match"
        }
        onCancel={closeCompleteModal}
        onOk={() => completeForm.submit()}
      >
        <Form<CompleteMatchFormValues>
          form={completeForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleCompleteMatch}
        >
          <Form.Item
            label="Ball Fees"
            name="ballFees"
            rules={[{ required: true, message: "Please enter ball fees" }]}
          >
            <InputNumber
              className="matches-page__full-control"
              min={0}
              prefix="₹"
              placeholder="Enter ball fees"
            />
          </Form.Item>
          <Form.Item
            label="Player Count"
            name="totalPlayerCount"
            rules={[
              { required: true, message: "Please enter player count" },
              { type: "number", min: 1, message: "Player count must be at least 1" }
            ]}
          >
            <InputNumber
              className="matches-page__full-control"
              min={1}
              precision={0}
              placeholder="Enter playing squad count"
            />
          </Form.Item>
          <Form.Item
            dependencies={["totalPlayerCount", "guestShareCount", "guestSharePlayerId"]}
            label="Playing Players"
            name="playerIds"
            rules={[
              { required: true, message: "Please select playing players" },
              ({ getFieldValue }) => ({
                validator: (_, playerIds: number[] = []) => {
                  const expectedCount = getFieldValue("totalPlayerCount");
                  const guestShareCount = getFieldValue("guestShareCount") ?? 0;
                  const guestSharePlayerId = getFieldValue("guestSharePlayerId");

                  if (typeof expectedCount !== "number") {
                    return Promise.resolve();
                  }

                  if (guestShareCount > 0 && typeof guestSharePlayerId !== "number") {
                    return Promise.reject(
                      new Error("Please select the player responsible for guest shares")
                    );
                  }

                  if (playerIds.length + guestShareCount === expectedCount) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(`Selected players plus guest shares must equal ${expectedCount}`)
                  );
                }
              })
            ]}
          >
            <Select
              mode="multiple"
              loading={isLoadingPlayers}
              optionFilterProp="label"
              options={playerOptions}
              placeholder="Select players"
            />
          </Form.Item>
          <Form.Item label="Guest Share Player" name="guestSharePlayerId">
            <Select
              allowClear
              showSearch
              loading={isLoadingPlayers}
              optionFilterProp="label"
              options={playerOptions}
              placeholder="Assign temporary player expense to"
              onChange={() => completeForm.validateFields(["playerIds"])}
            />
          </Form.Item>
          <Form.Item
            label="Guest Share Count"
            name="guestShareCount"
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, guestShareCount?: number) => {
                  const guestSharePlayerId = getFieldValue("guestSharePlayerId");

                  if (!guestShareCount) {
                    return Promise.resolve();
                  }

                  if (typeof guestSharePlayerId === "number") {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("Please select a player for guest shares")
                  );
                }
              })
            ]}
          >
            <InputNumber
              className="matches-page__full-control"
              min={0}
              precision={0}
              placeholder="Extra temporary players"
              onChange={() => completeForm.validateFields(["playerIds"])}
            />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};
