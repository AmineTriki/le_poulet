export const API_ENDPOINTS = {
  games: {
    create: "/api/v1/games/",
    get: (code: string) => `/api/v1/games/${code}`,
    start: (code: string) => `/api/v1/games/${code}/start`,
  },
  players: {
    join: "/api/v1/players/",
    list: (gameId: string) => `/api/v1/players/${gameId}/all`,
  },
  teams: {
    list: (gameId: string) => `/api/v1/teams/${gameId}/all`,
  },
  challenges: {
    getRandom: (gameId: string, teamId: string) => `/api/v1/challenges/random/${gameId}/${teamId}`,
    submit: "/api/v1/challenges/submit",
    score: (submissionId: string) => `/api/v1/challenges/${submissionId}/score`,
  },
  locations: {
    update: "/api/v1/locations/update",
  },
  bars: {
    search: "/api/v1/bars/search",
  },
  weapons: {
    fire: "/api/v1/weapons/fire",
  },
  costumes: {
    list: "/api/v1/costumes/",
  },
} as const;
