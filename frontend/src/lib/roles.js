export const ROLE_TABS = {
  student: ['dashboard', 'upload', 'history', 'missions', 'leaderboard', 'calculator', 'certificate', 'guide', 'account'],
  teacher: ['dashboard', 'upload', 'review', 'registry', 'missions', 'leaderboard', 'benefits', 'school', 'guide', 'calculator', 'account'],
  admin: ['dashboard', 'upload', 'review', 'registry', 'missions', 'leaderboard', 'benefits', 'school', 'guide', 'calculator', 'account'],
};
export const allowedTabs = role => ROLE_TABS[role] || [];
