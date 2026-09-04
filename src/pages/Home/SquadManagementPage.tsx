import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  type TableProps
} from "antd";
import { PageHeader } from "../../components/common/PageHeader";
import { playerService } from "../../services/playerService";
import { teamService } from "../../services/teamService";
import type { Team } from "../../types/dashboard";
import type { Player, PlayerPayload } from "../../types/player";
import { getApiErrorMessage } from "../../utils/apiError";

const { Text } = Typography;

type PlayerAddMode = "single" | "multiple";

type MultiplePlayerFormRow = {
  playerName: string;
  mobileNumber: string;
};

type PlayerFormValues = {
  playerName?: string;
  mobileNumber?: string;
  teamId: number;
  players?: MultiplePlayerFormRow[];
};

const ALL_TEAMS_VALUE = -1;
const ALL_SELECTION_VALUE = 0;

const getTeamLabel = (player: Player): string =>
  player.team_id === ALL_SELECTION_VALUE ? "All Teams" : player.team_name ?? "Unassigned";

const getTeamName = (team: Team): string => team.teamName;

export const SquadManagementPage = (): JSX.Element => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(ALL_TEAMS_VALUE);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerAddMode, setPlayerAddMode] = useState<PlayerAddMode>("single");
  const [form] = Form.useForm<PlayerFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const loadPlayers = useCallback(async (teamId: number): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [playersResponse, teamsResponse] = await Promise.all([
        playerService.getPlayers(teamId === ALL_TEAMS_VALUE ? undefined : { teamId }),
        teamService.getTeams()
      ]);

      setPlayers(playersResponse.data);
      setTeams(teamsResponse.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load squad players."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlayers(selectedTeamId);
  }, [loadPlayers, selectedTeamId]);

  const filteredPlayers = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return players;
    }

    return players.filter((player) => {
      const values = [
        player.player_name,
        player.mobile_number,
        player.team_name ?? "",
        player.team_id === ALL_SELECTION_VALUE ? "all teams" : ""
      ];

      return values.some((value) => value.toLowerCase().includes(query));
    });
  }, [players, searchText]);

  const teamOptions = useMemo(
    () => [
      { label: "All Teams", value: ALL_TEAMS_VALUE },
      ...teams.map((team) => ({ label: getTeamName(team), value: team.id }))
    ],
    [teams]
  );

  const formTeamOptions = useMemo(
    () => [
      { label: "All Selection", value: ALL_SELECTION_VALUE },
      ...teams.map((team) => ({ label: getTeamName(team), value: team.id }))
    ],
    [teams]
  );

  const openAddPlayerModal = (): void => {
    setEditingPlayer(null);
    form.setFieldsValue({
      playerName: "",
      mobileNumber: "",
      teamId: ALL_SELECTION_VALUE,
      players: [{ playerName: "", mobileNumber: "" }]
    });
    setPlayerAddMode("single");
    setIsPlayerModalOpen(true);
  };

  const openEditPlayerModal = async (player: Player): Promise<void> => {
    setEditingPlayer(player);
    setIsPlayerModalOpen(true);
    form.setFieldsValue({
      playerName: player.player_name,
      mobileNumber: player.mobile_number,
      teamId: player.team_id,
      players: [{ playerName: "", mobileNumber: "" }]
    });
    setPlayerAddMode("single");

    try {
      const response = await playerService.getPlayer(player.id);
      const playerDetails = response.data;

      setEditingPlayer(playerDetails);
      form.setFieldsValue({
        playerName: playerDetails.player_name,
        mobileNumber: playerDetails.mobile_number,
        teamId: playerDetails.team_id,
        players: [{ playerName: "", mobileNumber: "" }]
      });
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to load player details."));
    }
  };

  const closePlayerModal = (): void => {
    if (isSaving) {
      return;
    }

    setIsPlayerModalOpen(false);
    setEditingPlayer(null);
    setPlayerAddMode("single");
    form.resetFields();
  };

  const handleTeamFilterChange = (teamId: number): void => {
    setSelectedTeamId(teamId);
  };

  const handlePlayerAddModeChange = (mode: PlayerAddMode): void => {
    if (mode === "multiple") {
      const currentPlayerName = form.getFieldValue("playerName")?.trim() ?? "";
      const currentMobileNumber = form.getFieldValue("mobileNumber")?.trim() ?? "";
      const currentPlayers = form.getFieldValue("players") as MultiplePlayerFormRow[] | undefined;
      const hasMultiplePlayerValues = currentPlayers?.some(
        (player: MultiplePlayerFormRow) =>
          player.playerName?.trim() || player.mobileNumber?.trim()
      );

      form.setFieldsValue({
        players: hasMultiplePlayerValues
          ? currentPlayers
          : [{ playerName: currentPlayerName, mobileNumber: currentMobileNumber }]
      });
    }

    setPlayerAddMode(mode);
  };

  const handleSavePlayer = async (values: PlayerFormValues): Promise<void> => {
    const buildPayload = (playerName: string, mobileNumber: string): PlayerPayload => ({
      player_name: playerName.trim(),
      mobile_number: mobileNumber.trim(),
      team_id: values.teamId
    });

    const singlePayload = buildPayload(values.playerName ?? "", values.mobileNumber ?? "");
    const multiplePayload =
      values.players?.map((player) => buildPayload(player.playerName, player.mobileNumber)) ?? [];

    setIsSaving(true);

    try {
      if (editingPlayer) {
        await playerService.updatePlayer(editingPlayer.id, singlePayload);
        messageApi.success("Player updated successfully");
      } else if (playerAddMode === "multiple") {
        await playerService.addPlayers(multiplePayload);
        messageApi.success("Players created successfully");
      } else {
        await playerService.addPlayer(singlePayload);
        messageApi.success("Player created successfully");
      }

      setIsPlayerModalOpen(false);
      setEditingPlayer(null);
      setPlayerAddMode("single");
      form.resetFields();
      await loadPlayers(selectedTeamId);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Unable to save player."));
    } finally {
      setIsSaving(false);
    }
  };

  const columns: TableProps<Player>["columns"] = [
    {
      title: "Player Name",
      dataIndex: "player_name",
      key: "player_name",
      render: (playerName: string) => <Text strong>{playerName}</Text>
    },
    {
      title: "Contact Number",
      dataIndex: "mobile_number",
      key: "mobile_number"
    },
    {
      title: "Team",
      key: "team",
      render: (_, player) => (
        <Space size={8}>
          <TeamOutlined />
          <Text>{getTeamLabel(player)}</Text>
        </Space>
      )
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: number) => (
        <Tag color={isActive === 1 ? "success" : "default"}>
          {isActive === 1 ? "Active" : "Inactive"}
        </Tag>
      )
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      render: (_, player) => (
        <Button icon={<EditOutlined />} type="link" onClick={() => void openEditPlayerModal(player)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <section className="management-page squad-page">
      {contextHolder}
      <div className="management-page__heading">
        <PageHeader title="Squad Management" subtitle="Manage your team players" />
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={() => void loadPlayers(selectedTeamId)}
          >
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddPlayerModal}>
            Add Player
          </Button>
        </Space>
      </div>

      {errorMessage ? (
        <Alert
          action={
            <Button size="small" onClick={() => void loadPlayers(selectedTeamId)}>
              Try Again
            </Button>
          }
          className="dashboard-alert"
          message={errorMessage}
          showIcon
          type="error"
        />
      ) : null}

      <div className="management-page__panel squad-page__panel">
        <div className="squad-page__toolbar">
          <Input
            allowClear
            className="squad-page__search"
            placeholder="Search player..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Select
            className="squad-page__filter"
            options={teamOptions}
            value={selectedTeamId}
            onChange={handleTeamFilterChange}
          />
        </div>

        <Table<Player>
          columns={columns}
          dataSource={filteredPlayers}
          loading={isLoading}
          locale={{
            emptyText: <Empty description="No players found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          }}
          pagination={false}
          rowKey="id"
        />
      </div>

      <Modal
        confirmLoading={isSaving}
        okText={
          editingPlayer ? "Update Player" : playerAddMode === "multiple" ? "Add Players" : "Add Player"
        }
        open={isPlayerModalOpen}
        title={editingPlayer ? "Edit Player" : "Add New Player"}
        width={playerAddMode === "multiple" && !editingPlayer ? 760 : 650}
        onCancel={closePlayerModal}
        onOk={() => form.submit()}
      >
        <Form<PlayerFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSavePlayer}
        >
          {!editingPlayer ? (
            <Radio.Group
              className="squad-page__add-mode"
              optionType="button"
              options={[
                { label: "Add Single Player", value: "single" },
                { label: "Add Multiple Players", value: "multiple" }
              ]}
              value={playerAddMode}
              onChange={(event) => handlePlayerAddModeChange(event.target.value as PlayerAddMode)}
            />
          ) : null}

          {editingPlayer || playerAddMode === "single" ? (
            <>
              <Form.Item
                label="Player Name"
                name="playerName"
                rules={[
                  { required: true, whitespace: true, message: "Please enter a player name" },
                  { max: 80, message: "Player name must be 80 characters or fewer" }
                ]}
              >
                <Input autoFocus placeholder="Enter player name" />
              </Form.Item>
              <Form.Item
                label="Contact Number"
                name="mobileNumber"
                rules={[
                  { required: true, whitespace: true, message: "Please enter a contact number" },
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Contact number must be 10 digits"
                  }
                ]}
              >
                <Input inputMode="numeric" maxLength={10} placeholder="Enter contact number" />
              </Form.Item>
            </>
          ) : (
            <Form.List name="players">
              {(fields, { add, remove }) => (
                <div className="squad-page__players-list">
                  {fields.map((field, index) => (
                    <div className="squad-page__player-row" key={field.key}>
                      <Form.Item
                        {...field}
                        label={index === 0 ? "Player Name" : " "}
                        name={[field.name, "playerName"]}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: "Please enter a player name"
                          },
                          { max: 80, message: "Player name must be 80 characters or fewer" }
                        ]}
                      >
                        <Input
                          autoFocus={index === 0}
                          placeholder={`Enter player ${index + 1} name`}
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        label={index === 0 ? "Contact Number" : " "}
                        name={[field.name, "mobileNumber"]}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: "Please enter a contact number"
                          },
                          {
                            pattern: /^[0-9]{10}$/,
                            message: "Contact number must be 10 digits"
                          }
                        ]}
                      >
                        <Input
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Enter contact number"
                        />
                      </Form.Item>
                      <Button
                        aria-label="Remove player"
                        className="squad-page__remove-player"
                        danger
                        disabled={fields.length === 1}
                        icon={<DeleteOutlined />}
                        type="text"
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  ))}
                  <Button
                    block
                    icon={<PlusOutlined />}
                    type="dashed"
                    onClick={() => add({ playerName: "", mobileNumber: "" })}
                  >
                    Add Another Player
                  </Button>
                </div>
              )}
            </Form.List>
          )}
          <Form.Item
            label="Team"
            name="teamId"
            rules={[{ required: true, message: "Please select a team" }]}
          >
            <Select options={formTeamOptions} placeholder="Select team" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};
