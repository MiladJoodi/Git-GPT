export type OwnedRepoSummary = {
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  htmlUrl: string;
  fork: boolean;
  archived: boolean;
};

export type BranchCompareStatus = "identical" | "ahead" | "behind" | "diverged";

export type BranchInfo = {
  name: string;
  sha: string;
  isDefault: boolean;
  isProtected: boolean;
  status: BranchCompareStatus | null;
  aheadBy: number | null;
  behindBy: number | null;
};
