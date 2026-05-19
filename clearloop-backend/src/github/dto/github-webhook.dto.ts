export interface GitHubWebhookDto {
  action: string;
  pull_request?: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    user: {
      login: string;
      avatar_url: string;
    };
    head: {
      ref: string; // branch name
      sha: string;
    };
    base: {
      ref: string;
      repo: {
        id: number;
        full_name: string;
      };
    };
    merged: boolean;
    merged_at: string | null;
    created_at: string;
    updated_at: string;
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
  };
  installation?: {
    id: number;
  };
}

export interface LinkPRToFeatureDto {
  featureId: string;
  pullRequestId: string;
}
