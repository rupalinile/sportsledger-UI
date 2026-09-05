import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Typography } from "antd";
import { PageHeader } from "../../components/common/PageHeader";
import { APP_CONFIG } from "../../constants/app.constants";

const { Text, Title } = Typography;

const productHighlights = [
  {
    icon: <TeamOutlined />,
    label: "Team-first operations",
    value: "Manage multiple squads, common players and team balances from one place."
  },
  {
    icon: <WalletOutlined />,
    label: "Clear money tracking",
    value: "Connect deposits, match payments and other team expenses to real balances."
  },
  {
    icon: <CalendarOutlined />,
    label: "Match planning",
    value: "Schedule matches, release available slots and settle completed games."
  }
] as const;

const featureFlows = [
  {
    icon: <BarChartOutlined />,
    title: "Dashboard",
    summary: "The dashboard brings teams, balances, players and upcoming match totals into one view.",
    steps: [
      "Create or edit team names from the Teams section.",
      "Review total team balance, squad count, scheduled matches and scheduled match amount.",
      "Open quick-access actions to continue into matches, squad, player deposits or team expenses."
    ]
  },
  {
    icon: <TeamOutlined />,
    title: "Squad Management",
    summary: "Squad Management keeps the player list accurate for every team and common player group.",
    steps: [
      "Select the team you want to manage.",
      "Add one player or multiple players with player names and mobile numbers.",
      "Search, edit or remove players as the squad changes."
    ]
  },
  {
    icon: <CalendarOutlined />,
    title: "Matches Management",
    summary: "Matches Management handles scheduling, status changes and match settlement.",
    steps: [
      "Choose a team, match date, opponent, ground, amount and payment status.",
      "Use the planner to identify available, scheduled, completed, cancelled or multiple-match days.",
      "Complete or cancel matches so reports and balances stay aligned with actual activity."
    ]
  },
  {
    icon: <CloudSyncOutlined />,
    title: "Release Slots",
    summary: "Release Slots helps teams share availability when looking for opponents.",
    steps: [
      "Enter the ground, months, weekday pattern, timing and team.",
      "Generate available dates for the selected month and day combination.",
      "Booked days are marked automatically when they already have matches scheduled."
    ]
  },
  {
    icon: <UserOutlined />,
    title: "Player Deposit Management",
    summary: "Player Deposit Management tracks how much each player has deposited and spent.",
    steps: [
      "Filter by team to review player-wise deposits, deductions and remaining balances.",
      "Add deposits when players pay into the team account.",
      "Review match expense deductions and monthly player expense summaries."
    ]
  },
  {
    icon: <DollarCircleOutlined />,
    title: "Team Expense Management",
    summary: "Team Expense Management records shared income and spending beyond player deposits.",
    steps: [
      "Select a team and add deposited or expense transactions.",
      "Classify the amount, date and remarks for clean accounting history.",
      "Track total balance, deposits and expense totals from the team expense summary."
    ]
  },
  {
    icon: <FileTextOutlined />,
    title: "Player Reports",
    summary: "Player Reports turn match and payment activity into reviewable records.",
    steps: [
      "Pick the reporting period or team context.",
      "Review player balances, deposits and match-related expenses.",
      "Use the report details to settle questions before the next match cycle."
    ]
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Subscription Access",
    summary: "Subscription rules keep premium management tools available to active plans.",
    steps: [
      "Free users can access the dashboard and About Us page.",
      "Paid plans unlock operational pages for matches, squads, expenses and reports.",
      "Restricted navigation sends free users back to the dashboard instead of opening locked pages."
    ]
  },
  {
    icon: <CheckCircleOutlined />,
    title: "Application Updates",
    summary: "The update screen protects users when a newer desktop build is required.",
    steps: [
      "The app checks whether an update is available or required.",
      "Blocking updates open the Application Update page before normal navigation.",
      "After the required update is cleared, users return to dashboard or login based on session state."
    ]
  }
] as const;

export const AboutUsPage = (): JSX.Element => (
  <section className="about-page">
    <div className="about-page__hero">
      <div>
        <PageHeader
          title="About Us"
          subtitle={`${APP_CONFIG.APP_NAME} helps cricket teams manage squads, matches, deposits, expenses and reports with one shared ledger.`}
        />
        <Text className="about-page__intro">
          Built for everyday team operations, SportsLedger keeps match planning and money movement
          connected so organizers can spend less time reconciling details and more time running the
          team confidently.
        </Text>
      </div>
      <div className="about-page__identity">
        <Text type="secondary">Product focus</Text>
        <Title level={3}>Sports team finance and match operations</Title>
        <Text>
          Every feature follows the same pattern: capture clean data, show the current state, then
          update balances and reports as work moves forward.
        </Text>
      </div>
    </div>

    <div className="about-page__highlights">
      {productHighlights.map((item) => (
        <article className="about-page__highlight" key={item.label}>
          <span className="about-page__highlight-icon">{item.icon}</span>
          <div>
            <Text strong>{item.label}</Text>
            <Text type="secondary">{item.value}</Text>
          </div>
        </article>
      ))}
    </div>

    <div className="about-page__section-heading">
      <PageHeader
        title="Functionality Flow"
        subtitle="How each major SportsLedger feature works from input to outcome."
      />
    </div>

    <div className="about-page__flow-grid">
      {featureFlows.map((feature) => (
        <article className="about-flow-card" key={feature.title}>
          <div className="about-flow-card__heading">
            <span className="about-flow-card__icon">{feature.icon}</span>
            <div>
              <Title level={4}>{feature.title}</Title>
              <Text type="secondary">{feature.summary}</Text>
            </div>
          </div>
          <ol className="about-flow-card__steps">
            {feature.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      ))}
    </div>
  </section>
);
