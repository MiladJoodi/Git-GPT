import { githubGraphQL } from "@/lib/github/graphql";
import type { ContributionDayEntry } from "@/lib/contributions/analyze";

const CONTRIBUTION_CALENDAR_QUERY = `
  query ContributionCalendar($from: DateTime, $to: DateTime) {
    viewer {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

type ContributionCalendarResponse = {
  viewer: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: {
          contributionDays: {
            date: string;
            contributionCount: number;
            weekday: number;
          }[];
        }[];
      };
    };
  };
};

export type ContributionCalendar = {
  totalContributions: number;
  days: ContributionDayEntry[];
};

export async function fetchContributionCalendar(
  accessToken: string,
): Promise<ContributionCalendar> {
  const data = await githubGraphQL<ContributionCalendarResponse>(
    accessToken,
    CONTRIBUTION_CALENDAR_QUERY,
  );
  const calendar = data.viewer.contributionsCollection.contributionCalendar;

  return {
    totalContributions: calendar.totalContributions,
    days: calendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        weekday: day.weekday,
      })),
    ),
  };
}
