export type SaraTeamMember = {
  name: string;
  credential: string;
  credentialLabel: string;
  focus: string;
  bio: string;
};

export const SARA_TEAM: SaraTeamMember[] = [
  {
    name: "Sudhan Regmi",
    credential: "FCA",
    credentialLabel: "Fellow Chartered Accountant",
    focus: "Leadership and strategic vision",
    bio: "As a Fellow Chartered Accountant, Sudhan Regmi brings extensive leadership and strategic vision to SARA Advisors. With deep expertise in corporate consulting and financial governance, he guides the firm's overarching strategy, ensuring that clients receive top-tier advisory services tailored to their complex financial, investment, and operational needs.",
  },
  {
    name: "Bhojan Aryal",
    credential: "FCA",
    credentialLabel: "Fellow Chartered Accountant",
    focus: "Restructuring and regulatory compliance",
    bio: "Bhojan Aryal, also a Fellow Chartered Accountant, anchors the firm’s core competencies in corporate restructuring and regulatory compliance. His rigorous approach to asset management, strategic turnarounds, and domestic financial frameworks ensures that our clients' investments are secure, strictly compliant, and perfectly positioned for sustainable growth.",
  },
  {
    name: "Nikesh Adhikari",
    credential: "CA",
    credentialLabel: "Chartered Accountant",
    focus: "Due diligence and M&A advisory",
    bio: "A qualified Chartered Accountant, Nikesh Adhikari drives the firm’s deep financial scrutiny and due diligence processes. His sharp analytical skills and innovative problem-solving play a critical role in our M&A advisory, ensuring accurate business valuations, risk mitigation, and the execution of seamless corporate transactions.",
  },
  {
    name: "Gobin Shrestha",
    credential: "CA Scholar",
    credentialLabel: "CA Scholar",
    focus: "Financial modeling and Project Bank",
    bio: "As a CA Scholar, Gobin Shrestha provides essential support in financial modeling, comprehensive research, and project feasibility assessments. His dynamic energy and up-to-date analytical perspectives ensure that our strategic blueprints and newly curated Project Bank concepts are backed by robust data and contemporary financial insights.",
  },
];

export function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
