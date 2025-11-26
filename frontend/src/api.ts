import { API_BASE } from "./consts";

export const login = async (code: string) => {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });
  return [await res.json(), res.status];
};

export const refresh = async (token: string, refresh_token: string) => {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token,
    },
    body: JSON.stringify({ refresh_token }),
  });
  return [await res.json(), res.status];
};

export const logout = async (token: string) => {
  const res = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });
  return [await res.json(), res.status];
};

export const getInfo = async (token: string) => {
  const res = await fetch(`${API_BASE}/info`, {
    headers: {
      token,
    },
  });
  return [await res.json(), res.status];
};

export const getRandomAttachment = async (
  token: string,
  videoOnly: boolean,
  year: number
) => {
  const res = await fetch(
    `${API_BASE}/attachment/random?year=${year}&video_only=${videoOnly}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    }
  );
  return [await res.json(), res.status];
};

export const getAttachment = async (
  token: string,
  attachmentId: string,
  year: number
) => {
  const res = await fetch(
    `${API_BASE}/attachment/view/${attachmentId}?year=${year}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    }
  );
  return [await res.json(), res.status];
};

export const getRandomMessage = async (
  token: string,
  linksOnly: boolean,
  minLength: number,
  year: number
) => {
  const res = await fetch(
    `${API_BASE}/message/random?year=${year}&min_length=${minLength}&links_only=${linksOnly}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    }
  );
  return [await res.json(), res.status];
};

export const getMessage = async (
  token: string,
  messageId: string,
  year: number
) => {
  const res = await fetch(
    `${API_BASE}/message/view/${messageId}?year=${year}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    }
  );
  return [await res.json(), res.status];
};

export const getLikes = async (token: string, year: number) => {
  const res = await fetch(`${API_BASE}/likes?year=${year}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });
  return [await res.json(), res.status];
};

export const sendLike = async (
  token: string,
  id: string,
  isAttachment: boolean
) => {
  const res = await fetch(`${API_BASE}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token,
    },
    body: JSON.stringify({ id, is_attachment: isAttachment }),
  });
  return [await res.json(), res.status];
};

export const sendUnlike = async (
  token: string,
  id: string,
  isAttachment: boolean
) => {
  const res = await fetch(`${API_BASE}/unlike`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token,
    },
    body: JSON.stringify({ id, is_attachment: isAttachment }),
  });
  return [await res.json(), res.status];
};

export const getLeaderboard = async (token: string, year: number) => {
  const res = await fetch(`${API_BASE}/leaderboard?year=${year}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });
  return [await res.json(), res.status];
};

export const getStats = async (token: string, year: number) => {
  const res = await fetch(`${API_BASE}/stats?year=${year}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });
  return [await res.json(), res.status];
};

export const getTimeMachineSnapshot = async (
  token: string,
  date: string,
  year: number
) => {
  const res = await fetch(`${API_BASE}/time_machine/${date}?year=${year}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });
  return [await res.json(), res.status];
};

export const getMentionGraphData = async (token: string, year: number) => {
  const res = await fetch(`${API_BASE}/mentions/graph?year=${year}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });
  return [await res.json(), res.status];
};
